const { createObjectId } = require('../database/id');
const { FurnitureObjectStorageService } = require('./furniture-object-storage-service');
const {
  OBJECT_TYPES,
  PRODUCTION_STATUSES: OBJECT_STATUSES,
  normalizeFurnitureObject,
  validateFurnitureObjectShape,
  createFurnitureObjectModel,
} = require('../models/furniture-object-model');

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function now() { return new Date().toISOString(); }

function fail(message, statusCode = 400) {
  throw Object.assign(new Error(message), { statusCode });
}

function requiredString(value, field) {
  if (typeof value !== 'string' || !value.trim()) fail(`${field} is required`);
  return value.trim();
}

class FurnitureObjectEngine {
  constructor(projectService) {
    this.projectService = projectService;
    this.storage = new FurnitureObjectStorageService(projectService);
  }

  project(projectId) {
    return this.projectService.openProject(requiredString(projectId, 'projectId'));
  }

  validateCoreInput(input, partial = false) {
    const value = input || {};
    if (!partial || value.objectType !== undefined || value.furnitureType !== undefined) {
      const objectType = requiredString(value.objectType ?? value.furnitureType, 'objectType');
      if (!OBJECT_TYPES.includes(objectType)) fail('objectType is invalid');
    }
    if (!partial || value.name !== undefined) requiredString(value.name, 'name');
    if (value.status !== undefined && !OBJECT_STATUSES.includes(value.status)) fail('status is invalid');
  }

  createObject(projectId, input = {}) {
    const project = this.project(projectId);
    this.projectService.assertWritable(project);
    this.validateCoreInput(input);
    const confirmed = input.confirmedEngineeringRecord;
    if (!confirmed || confirmed.status !== 'Confirmed' || typeof confirmed.id !== 'string' || !confirmed.id) {
      fail('Furniture Object writes require a confirmed Engineering Record');
    }
    const engineeringRecord = (project.engineeringRecords || []).find((record) => record.id === confirmed.id);
    if (!engineeringRecord || engineeringRecord.status !== 'Confirmed') fail('Confirmed Engineering Record was not found', 404);
    const object = {
      id: input.objectId || input.id || createObjectId(),
      projectId: project.project.id,
      objectType: input.objectType ?? input.furnitureType,
      furnitureType: input.objectType ?? input.furnitureType,
      name: input.name.trim(),
      engineeringRecordId: engineeringRecord.id,
      floorId: input.floorId,
      roomId: input.roomId,
      designerCabinetId: input.designerCabinetId || null,
      factoryReferenceId: input.factoryReferenceId || null,
      materialIds: [],
      hardwareIds: [],
      productionStatus: input.status || 'Object Generated',
      lifecycleStatus: 'Created',
      createdAt: now(),
      updatedAt: now(),
    };
    if (!object.floorId || !object.roomId) fail('floorId and roomId are required');
    const existing = this.storage.listByProjectId(projectId);
    if (existing.some((item) => item.id === object.id)) fail('objectId already exists', 409);
    const saved = this.storage.storeFromConfirmedEngineeringRecord({
      projectId, id: object.id, floorId: object.floorId, roomId: object.roomId,
      designerCabinetId: object.designerCabinetId, factoryReferenceId: object.factoryReferenceId,
      furnitureType: object.furnitureType, materialIds: [], hardwareIds: [],
      productionStatus: object.productionStatus, validation: input.validation || { isValid: false, errors: [] },
      confirmedEngineeringRecord: engineeringRecord,
    });
    const merged = createFurnitureObjectModel({
      ...saved,
      objectType: object.objectType,
      name: object.name,
      dimensions: input.dimensions,
      materialReferences: input.materialReferences,
      hardwareReferences: input.hardwareReferences,
      relationshipReferences: input.relationshipReferences,
      cadReferences: input.cadReferences,
      formulaReferences: input.formulaReferences,
      engineeringRuleReferences: input.engineeringRuleReferences,
      lifecycleStatus: object.lifecycleStatus,
    });
    this.storage.update(projectId, object.id, merged);
    return clone(merged);
  }

  getObject(projectId, objectId) {
    requiredString(objectId, 'objectId');
    const object = this.storage.getById(projectId, objectId);
    if (!object || object.lifecycleStatus === 'Archived') fail('Furniture Object not found', 404);
    return normalizeFurnitureObject(object);
  }

  listObjects(projectId) {
    return this.storage.listByProjectId(projectId)
      .map(normalizeFurnitureObject)
      .filter((object) => object.lifecycleStatus !== 'Archived')
      .map(clone);
  }

  updateObject(projectId, objectId, changes = {}) {
    const current = this.getObject(projectId, objectId);
    this.validateCoreInput(changes, true);
    const next = { ...current };
    if (changes.name !== undefined) next.name = requiredString(changes.name, 'name');
    if (changes.objectType !== undefined || changes.furnitureType !== undefined) {
      next.objectType = changes.objectType ?? changes.furnitureType;
      next.furnitureType = next.objectType;
    }
    if (changes.status !== undefined) next.productionStatus = changes.status;
    next.updatedAt = now();
    next.lifecycleStatus = 'Modified';
    const model = createFurnitureObjectModel(next);
    const saved = this.storage.update(projectId, objectId, model);
    if (!saved) fail('Furniture Object not found', 404);
    return clone(saved);
  }

  getMaterials(projectId, objectId) {
    return clone(this.getObject(projectId, objectId).materialReferences);
  }

  assignMaterial(projectId, objectId, input = {}) {
    const current = this.getObject(projectId, objectId);
    const materialId = typeof input === 'string' ? input : input.materialId;
    if (typeof materialId !== 'string' || !materialId.trim()) fail('materialId is required');
    const material = this.projectService.data.official.getMaterialById(materialId.trim());
    if (!material) fail('Material not found', 404);
    if (current.materialReferences.some((reference) => reference.materialId === material.id)) fail('Material is already assigned', 409);
    const next = createFurnitureObjectModel({
      ...current,
      materialIds: [...current.materialIds, material.id],
      materialReferences: [...current.materialReferences, { materialId: material.id }],
      lifecycleStatus: 'Modified',
      updatedAt: now(),
    });
    return clone(this.storage.update(projectId, objectId, next));
  }

  removeMaterial(projectId, objectId, materialId) {
    const current = this.getObject(projectId, objectId);
    if (typeof materialId !== 'string' || !materialId.trim()) fail('materialId is required');
    if (!current.materialReferences.some((reference) => reference.materialId === materialId)) fail('Material assignment not found', 404);
    const next = createFurnitureObjectModel({
      ...current,
      materialIds: current.materialIds.filter((id) => id !== materialId),
      materialReferences: current.materialReferences.filter((reference) => reference.materialId !== materialId),
      lifecycleStatus: 'Modified',
      updatedAt: now(),
    });
    return clone(this.storage.update(projectId, objectId, next));
  }

  replaceMaterial(projectId, objectId, oldMaterialId, input = {}) {
    const current = this.getObject(projectId, objectId);
    if (!current.materialReferences.some((reference) => reference.materialId === oldMaterialId)) fail('Material assignment not found', 404);
    const materialId = typeof input === 'string' ? input : input.materialId;
    const material = this.projectService.data.official.getMaterialById(materialId);
    if (!material) fail('Material not found', 404);
    if (current.materialReferences.some((reference) => reference.materialId === material.id && material.id !== oldMaterialId)) fail('Material is already assigned', 409);
    const references = current.materialReferences.map((reference) => reference.materialId === oldMaterialId ? { materialId: material.id } : reference);
    const next = createFurnitureObjectModel({
      ...current,
      materialIds: current.materialIds.map((id) => id === oldMaterialId ? material.id : id),
      materialReferences: references,
      lifecycleStatus: 'Modified',
      updatedAt: now(),
    });
    return clone(this.storage.update(projectId, objectId, next));
  }

  getHardware(projectId, objectId) {
    return clone(this.getObject(projectId, objectId).hardwareReferences);
  }

  assignHardware(projectId, objectId, input = {}) {
    const current = this.getObject(projectId, objectId);
    const hardwareId = typeof input === 'string' ? input : input.hardwareId;
    if (typeof hardwareId !== 'string' || !hardwareId.trim()) fail('hardwareId is required');
    const hardware = this.projectService.data.official.getHardwareById(hardwareId.trim());
    if (!hardware) fail('Hardware not found', 404);
    if (current.hardwareReferences.some((reference) => reference.hardwareId === hardware.id)) fail('Hardware is already assigned', 409);
    const next = createFurnitureObjectModel({ ...current, hardwareIds: [...current.hardwareIds, hardware.id], hardwareReferences: [...current.hardwareReferences, { hardwareId: hardware.id }], lifecycleStatus: 'Modified', updatedAt: now() });
    return clone(this.storage.update(projectId, objectId, next));
  }

  removeHardware(projectId, objectId, hardwareId) {
    const current = this.getObject(projectId, objectId);
    if (typeof hardwareId !== 'string' || !hardwareId.trim()) fail('hardwareId is required');
    if (!current.hardwareReferences.some((reference) => reference.hardwareId === hardwareId)) fail('Hardware assignment not found', 404);
    const next = createFurnitureObjectModel({ ...current, hardwareIds: current.hardwareIds.filter((id) => id !== hardwareId), hardwareReferences: current.hardwareReferences.filter((reference) => reference.hardwareId !== hardwareId), lifecycleStatus: 'Modified', updatedAt: now() });
    return clone(this.storage.update(projectId, objectId, next));
  }

  replaceHardware(projectId, objectId, oldHardwareId, input = {}) {
    const current = this.getObject(projectId, objectId);
    if (!current.hardwareReferences.some((reference) => reference.hardwareId === oldHardwareId)) fail('Hardware assignment not found', 404);
    const hardwareId = typeof input === 'string' ? input : input.hardwareId;
    const hardware = this.projectService.data.official.getHardwareById(hardwareId);
    if (!hardware) fail('Hardware not found', 404);
    if (current.hardwareReferences.some((reference) => reference.hardwareId === hardware.id && hardware.id !== oldHardwareId)) fail('Hardware is already assigned', 409);
    const next = createFurnitureObjectModel({ ...current, hardwareIds: current.hardwareIds.map((id) => id === oldHardwareId ? hardware.id : id), hardwareReferences: current.hardwareReferences.map((reference) => reference.hardwareId === oldHardwareId ? { hardwareId: hardware.id } : reference), lifecycleStatus: 'Modified', updatedAt: now() });
    return clone(this.storage.update(projectId, objectId, next));
  }

  getDimensions(projectId, objectId) {
    return clone(this.getObject(projectId, objectId).dimensions);
  }

  updateDimensions(projectId, objectId, changes = {}) {
    const current = this.getObject(projectId, objectId);
    const supported = ['width', 'height', 'depth', 'thickness', 'unit'];
    const unknown = Object.keys(changes).filter((key) => !supported.includes(key));
    if (unknown.length) fail(`Unsupported dimension: ${unknown[0]}`);
    const nextDimensions = { ...current.dimensions };
    for (const field of supported) {
      if (changes[field] === undefined) continue;
      if (field === 'unit') {
        if (changes[field] !== null && (typeof changes[field] !== 'string' || !changes[field].trim())) fail('Dimension unit must be a non-empty string or null');
        nextDimensions[field] = changes[field] === null ? null : changes[field].trim();
        continue;
      }
      const value = changes[field];
      if (value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value <= 0)) fail(`Invalid dimension: ${field}`);
      nextDimensions[field] = value;
    }
    const next = createFurnitureObjectModel({ ...current, dimensions: nextDimensions, lifecycleStatus: 'Modified', updatedAt: now() });
    return clone(this.storage.update(projectId, objectId, next));
  }

  formulaCatalogRecord(formulaId) {
    const catalog = this.projectService.data?.official;
    if (!catalog || typeof catalog.getFormulaById !== 'function') {
      fail('Formula Catalog is not configured; Formula Synchronization is unavailable', 503);
    }
    const formula = catalog.getFormulaById(formulaId);
    if (!formula) fail('Formula not found in the Official Formula Catalog', 404);
    return formula;
  }

  getFormulaReferences(projectId, objectId) {
    return clone(this.getObject(projectId, objectId).formulaReferences || []);
  }

  assignFormula(projectId, objectId, input = {}) {
    const object = this.getObject(projectId, objectId);
    if (object.productionStatus !== 'Production Ready') {
      fail('Only Production Ready Furniture Objects may synchronize with the Formula Engine', 409);
    }
    const formulaId = requiredString(typeof input === 'string' ? input : input.formulaId, 'formulaId');
    const formula = this.formulaCatalogRecord(formulaId);
    const references = object.formulaReferences || [];
    if (references.some((reference) => reference.formulaId === formula.id)) fail('Formula is already assigned', 409);
    const saved = this.storage.update(projectId, objectId, createFurnitureObjectModel({
      ...object,
      formulaReferences: [...references, { formulaId: formula.id }],
      lifecycleStatus: 'Modified',
      updatedAt: now(),
    }));
    if (!saved) fail('Furniture Object not found', 404);
    return clone(saved);
  }

  removeFormula(projectId, objectId, formulaId) {
    const object = this.getObject(projectId, objectId);
    const id = requiredString(formulaId, 'formulaId');
    const references = object.formulaReferences || [];
    if (!references.some((reference) => reference.formulaId === id)) fail('Formula assignment not found', 404);
    const saved = this.storage.update(projectId, objectId, createFurnitureObjectModel({
      ...object,
      formulaReferences: references.filter((reference) => reference.formulaId !== id),
      lifecycleStatus: 'Modified',
      updatedAt: now(),
    }));
    if (!saved) fail('Furniture Object not found', 404);
    return clone(saved);
  }

  replaceFormula(projectId, objectId, oldFormulaId, input = {}) {
    const object = this.getObject(projectId, objectId);
    const oldId = requiredString(oldFormulaId, 'oldFormulaId');
    const newId = requiredString(typeof input === 'string' ? input : input.formulaId, 'formulaId');
    if (!object.formulaReferences.some((reference) => reference.formulaId === oldId)) fail('Formula assignment not found', 404);
    if (object.formulaReferences.some((reference) => reference.formulaId === newId && newId !== oldId)) fail('Formula is already assigned', 409);
    const formula = this.formulaCatalogRecord(newId);
    const saved = this.storage.update(projectId, objectId, createFurnitureObjectModel({
      ...object,
      formulaReferences: object.formulaReferences.map((reference) => reference.formulaId === oldId ? { formulaId: formula.id } : reference),
      lifecycleStatus: 'Modified',
      updatedAt: now(),
    }));
    if (!saved) fail('Furniture Object not found', 404);
    return clone(saved);
  }

  cadDrawing(projectId, drawingId) {
    const project = this.project(projectId);
    const drawing = (project.projectDocuments?.documents || []).find((item) =>
      (item.id === drawingId || item.drawingId === drawingId) &&
      ['DWG', 'DXF'].includes(String(item.sourceFormat || item.documentType || '').toUpperCase())
    );
    if (!drawing) fail('CAD drawing was not found in this Project', 404);
    return drawing;
  }

  cadEntityId(entity, index) {
    return String(entity?.id ?? entity?.handle ?? entity?.entityId ?? `entity-${index}`);
  }

  getCadReferences(projectId, objectId) {
    return clone(this.getObject(projectId, objectId).cadReferences || []);
  }

  syncCadReference(projectId, objectId, input = {}) {
    const object = this.getObject(projectId, objectId);
    const drawingId = requiredString(input.drawingId, 'drawingId');
    const drawing = this.cadDrawing(projectId, drawingId);
    const requested = input.entityIds === undefined ? [] : input.entityIds;
    if (!Array.isArray(requested)) fail('entityIds must be an array');
    const entityIds = [...new Set(requested.map((id) => requiredString(id, 'entityId')))].sort();
    const entities = Array.isArray(drawing.entities) ? drawing.entities : [];
    const available = new Set(entities.map((entity, index) => this.cadEntityId(entity, index)));
    const missing = entityIds.filter((id) => !available.has(id));
    if (missing.length) fail(`CAD entity was not found in drawing: ${missing[0]}`, 404);
    const reference = { projectId, drawingId: drawing.id || drawing.drawingId || drawingId, entityIds };
    const references = (object.cadReferences || []).filter((item) => item?.drawingId !== reference.drawingId);
    references.push(reference);
    const saved = this.storage.update(projectId, objectId, createFurnitureObjectModel({
      ...object,
      cadReferences: references,
      lifecycleStatus: 'Modified',
      updatedAt: now(),
    }));
    if (!saved) fail('Furniture Object not found', 404);
    return clone(saved);
  }

  removeCadReference(projectId, objectId, drawingId) {
    const object = this.getObject(projectId, objectId);
    const id = requiredString(drawingId, 'drawingId');
    const references = object.cadReferences || [];
    if (!references.some((item) => item?.drawingId === id)) fail('CAD reference was not found', 404);
    const saved = this.storage.update(projectId, objectId, createFurnitureObjectModel({
      ...object,
      cadReferences: references.filter((item) => item?.drawingId !== id),
      lifecycleStatus: 'Modified',
      updatedAt: now(),
    }));
    if (!saved) fail('Furniture Object not found', 404);
    return clone(saved);
  }

  validateObject(projectId, objectId) {
    const project = this.project(projectId);
    const stored = this.storage.getById(projectId, objectId);
    if (!stored) fail('Furniture Object not found', 404);
    const object = normalizeFurnitureObject(stored);
    const errors = [];
    const add = (code, message, field = null) => errors.push({ code, field, message, severity: 'error' });
    if (object.lifecycleStatus === 'Archived') add('OBJECT_ARCHIVED', 'Furniture Object is archived', 'lifecycleStatus');
    validateFurnitureObjectShape(object).forEach((message) => add('MODEL_INVALID', message));
    this.projectService.referenceValidator.validateFurnitureObject(project, {
      ...object,
      id: object.objectId,
    }, new Set()).forEach((item) => add(item.code, item.message, item.field || null));
    const objects = this.storage.listByProjectId(projectId).map(normalizeFurnitureObject);
    const byId = new Map(objects.map((item) => [item.objectId, item]));
    const relationships = object.relationshipReferences || [];
    relationships.forEach((reference) => {
      if (!reference.parentObjectId) return;
      if (reference.parentObjectId === object.objectId) add('RELATIONSHIP_SELF_PARENT', 'Furniture Object cannot be its own parent', 'relationshipReferences');
      else if (!byId.has(reference.parentObjectId)) add('RELATIONSHIP_PARENT_NOT_FOUND', 'Parent Furniture Object was not found in this Project', 'relationshipReferences');
      else {
        const visited = new Set([object.objectId]);
        let current = byId.get(reference.parentObjectId);
        while (current) {
          if (visited.has(current.objectId)) { add('RELATIONSHIP_CYCLE', 'Furniture Object relationship contains a cycle', 'relationshipReferences'); break; }
          visited.add(current.objectId);
          const parent = current.relationshipReferences?.find((item) => item.parentObjectId)?.parentObjectId;
          current = parent ? byId.get(parent) : null;
        }
      }
    });
    return clone({ isValid: errors.length === 0, errors });
  }

  deleteObject(projectId, objectId) {
    const current = this.getObject(projectId, objectId);
    const archived = {
      ...current,
      lifecycleStatus: 'Archived',
      deletedAt: now(),
      updatedAt: now(),
    };
    const saved = this.storage.update(projectId, objectId, createFurnitureObjectModel(archived));
    if (!saved) fail('Furniture Object not found', 404);
    return clone(saved);
  }

  relationshipParent(object) {
    const reference = (object.relationshipReferences || []).find((item) => item && item.parentObjectId);
    return reference?.parentObjectId || null;
  }

  hierarchyObjects(projectId) {
    return this.storage.listByProjectId(projectId)
      .map(normalizeFurnitureObject)
      .filter((object) => object.lifecycleStatus !== 'Archived');
  }

  saveHierarchyObject(projectId, object) {
    const model = createFurnitureObjectModel({
      ...object,
      lifecycleStatus: 'Modified',
      updatedAt: now(),
    });
    const saved = this.storage.update(projectId, model.objectId, model);
    if (!saved) fail('Furniture Object not found', 404);
    return clone(model);
  }

  setParent(projectId, childObjectId, parentObjectId) {
    const child = this.getObject(projectId, childObjectId);
    const parent = this.getObject(projectId, parentObjectId);
    if (child.objectId === parent.objectId) fail('An object cannot be its own parent');
    let cursor = parent;
    const visited = new Set();
    while (cursor) {
      if (visited.has(cursor.objectId)) fail('Circular object hierarchy detected');
      visited.add(cursor.objectId);
      if (cursor.objectId === child.objectId) fail('Circular object hierarchy detected');
      const nextId = this.relationshipParent(cursor);
      cursor = nextId ? this.getObject(projectId, nextId) : null;
    }
    const relationships = (child.relationshipReferences || []).filter((item) => !item?.parentObjectId);
    relationships.push({ parentObjectId: parent.objectId });
    return this.saveHierarchyObject(projectId, { ...child, relationshipReferences: relationships });
  }

  removeParent(projectId, childObjectId) {
    const child = this.getObject(projectId, childObjectId);
    return this.saveHierarchyObject(projectId, {
      ...child,
      relationshipReferences: (child.relationshipReferences || []).filter((item) => !item?.parentObjectId),
    });
  }

  getParent(projectId, objectId) {
    const object = this.getObject(projectId, objectId);
    const parentId = this.relationshipParent(object);
    if (!parentId) return null;
    try { return this.getObject(projectId, parentId); } catch (error) {
      if (error.statusCode === 404) return null;
      throw error;
    }
  }

  getChildren(projectId, objectId) {
    const object = this.getObject(projectId, objectId);
    return this.hierarchyObjects(projectId)
      .filter((candidate) => this.relationshipParent(candidate) === object.objectId)
      .map(clone);
  }

  getAncestors(projectId, objectId) {
    const result = [];
    const visited = new Set();
    let parent = this.getParent(projectId, objectId);
    while (parent) {
      if (visited.has(parent.objectId)) fail('Circular object hierarchy detected');
      visited.add(parent.objectId);
      result.push(clone(parent));
      parent = this.getParent(projectId, parent.objectId);
    }
    return result;
  }

  getDescendants(projectId, objectId) {
    const result = [];
    const visit = (id, visited) => {
      if (visited.has(id)) fail('Circular object hierarchy detected');
      visited.add(id);
      this.getChildren(projectId, id).forEach((child) => {
        result.push(clone(child));
        visit(child.objectId, visited);
      });
      visited.delete(id);
    };
    this.getObject(projectId, objectId);
    visit(objectId, new Set());
    return result;
  }

  getRoot(projectId, objectId) {
    const object = this.getObject(projectId, objectId);
    const ancestors = this.getAncestors(projectId, object.objectId);
    return clone(ancestors[ancestors.length - 1] || object);
  }

  buildTree(projectId) {
    const objects = this.hierarchyObjects(projectId).map(clone);
    const nodes = new Map(objects.map((object) => [object.objectId, { ...object, children: [] }]));
    const roots = [];
    nodes.forEach((node) => {
      const parentId = this.relationshipParent(node);
      const parent = parentId ? nodes.get(parentId) : null;
      if (parent) parent.children.push(node);
      else roots.push(node);
    });
    return clone(roots);
  }
}

module.exports = { FurnitureObjectEngine, OBJECT_TYPES, OBJECT_STATUSES };
