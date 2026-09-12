function fail(message, statusCode, code, details) {
  throw Object.assign(new Error(message), { statusCode, code, details });
}

function isPositiveDimension(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

const { createProductionDrawingData } = require('./production-drawing-data-contract');

class ProductionDrawingGenerationService {
  constructor(projectService, furnitureObjectEngine) {
    this.projectService = projectService;
    this.furnitureObjectEngine = furnitureObjectEngine;
  }

  generate(projectId, objectId) {
    if (typeof projectId !== 'string' || !projectId.trim()) fail('projectId is required', 400, 'PROJECT_ID_REQUIRED');
    const project = this.projectService.readProject(projectId);
    if (!project) fail('Project not found', 404, 'PROJECT_NOT_FOUND');

    let object;
    try {
      object = this.furnitureObjectEngine.getObject(projectId, objectId);
    } catch (error) {
      if (error.statusCode === 404) fail('Furniture Object not found or archived', 404, 'FURNITURE_OBJECT_NOT_FOUND');
      throw error;
    }
    const validation = this.furnitureObjectEngine.validateObject(projectId, objectId);
    if (!validation.isValid) fail('Furniture Object validation failed', 422, 'FURNITURE_OBJECT_INVALID', { validation });
    if (object.productionStatus !== 'Production Ready') fail('Furniture Object is not Production Ready', 422, 'FURNITURE_OBJECT_NOT_APPROVED');

    const dimensions = object.dimensions || {};
    const invalidFields = ['width', 'height', 'depth'].filter((field) => !isPositiveDimension(dimensions[field]));
    if (invalidFields.length) fail('Furniture Object dimensions are invalid', 422, 'DIMENSIONS_INVALID', { fields: invalidFields });

    return createProductionDrawingData(projectId, project, object);
  }

  generateAssembly(projectId, objectId) {
    if (typeof projectId !== 'string' || !projectId.trim()) fail('projectId is required', 400, 'PROJECT_ID_REQUIRED');
    const project = this.projectService.readProject(projectId);
    if (!project) fail('Project not found', 404, 'PROJECT_NOT_FOUND');

    let root;
    let descendants;
    try {
      root = this.furnitureObjectEngine.getRoot(projectId, objectId);
      descendants = this.furnitureObjectEngine.getDescendants(projectId, root.objectId);
    } catch (error) {
      if (error.statusCode === 404) fail('Furniture Object not found or archived', 404, 'FURNITURE_OBJECT_NOT_FOUND');
      if (/Circular object hierarchy/i.test(error.message)) fail('Circular object hierarchy detected', 422, 'RELATIONSHIP_CYCLE');
      throw error;
    }

    const assemblyObjects = [root, ...descendants];
    const byId = new Map(assemblyObjects.map((object) => [object.objectId, object]));
    const invalidObjects = [];
    const hardwareReferences = [];
    const officialCatalog = this.projectService.data?.official;
    assemblyObjects.forEach((object) => {
      const validation = this.furnitureObjectEngine.validateObject(projectId, object.objectId);
      if (!validation.isValid) {
        const validationCodes = (validation.errors || []).map((item) => item.code);
        const blockedCode = validationCodes.some((code) => code === 'MISSING_OFFICIAL_RULE' || code === 'ENGINEERING_RULE_MISSING')
          ? 'BLOCKED_BY_MISSING_OFFICIAL_RULE'
          : validationCodes.some((code) => code === 'UNVERIFIED_RULE' || code === 'ENGINEERING_RULE_UNVERIFIED')
            ? 'BLOCKED_BY_UNVERIFIED_RULE'
            : null;
        if (blockedCode) fail('Assembly Drawing requires verified engineering rules', 422, blockedCode, { objectId: object.objectId, errors: validation.errors });
        invalidObjects.push({ objectId: object.objectId, errors: validation.errors });
      }
      if (object.productionStatus !== 'Production Ready') invalidObjects.push({ objectId: object.objectId, errors: [{ code: 'FURNITURE_OBJECT_NOT_APPROVED', message: 'Furniture Object is not Production Ready' }] });
      const dimensions = object.dimensions || {};
      ['width', 'height', 'depth'].forEach((field) => {
        if (!isPositiveDimension(dimensions[field])) invalidObjects.push({ objectId: object.objectId, errors: [{ code: 'DIMENSIONS_INVALID', field, message: 'Furniture Object dimension is invalid' }] });
      });
      const parentId = (object.relationshipReferences || []).find((reference) => reference?.parentObjectId)?.parentObjectId || null;
      if (parentId && !byId.has(parentId)) invalidObjects.push({ objectId: object.objectId, errors: [{ code: 'RELATIONSHIP_PARENT_NOT_FOUND', message: 'Parent is outside the assembly Project scope' }] });
      (object.hardwareReferences || []).forEach((reference) => {
        const hardwareId = reference?.hardwareId;
        if (!hardwareId || typeof officialCatalog?.getHardwareById !== 'function' || !officialCatalog.getHardwareById(hardwareId)) {
          invalidObjects.push({ objectId: object.objectId, errors: [{ code: 'HARDWARE_REFERENCE_INVALID', message: 'Hardware reference is not present in the Official Hardware Catalog', hardwareId: hardwareId || null }] });
          return;
        }
        hardwareReferences.push({ objectId: object.objectId, hardwareId });
      });
    });
    if (invalidObjects.length) fail('Assembly Furniture Objects failed validation', 422, 'ASSEMBLY_INVALID', { objects: invalidObjects });

    const childrenByParent = new Map();
    assemblyObjects.forEach((object) => {
      const parentId = (object.relationshipReferences || []).find((reference) => reference?.parentObjectId)?.parentObjectId || null;
      if (parentId) {
        if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
        childrenByParent.get(parentId).push(object);
      }
    });
    const hierarchy = (object, level = 0) => ({
      objectId: object.objectId,
      name: object.name,
      level,
      children: (childrenByParent.get(object.objectId) || []).map((child) => hierarchy(child, level + 1)),
    });
    const representations = [];
    const visit = (object, level, index) => {
      const dimensions = object.dimensions;
      representations.push({
        objectId: object.objectId,
        name: object.name,
        objectType: object.objectType,
        dimensions: { width: dimensions.width, height: dimensions.height, depth: dimensions.depth, unit: dimensions.unit || null },
        parentObjectId: (object.relationshipReferences || []).find((reference) => reference?.parentObjectId)?.parentObjectId || null,
        level,
        position: { layout: 'logical-assembly', row: level, column: index },
      });
      (childrenByParent.get(object.objectId) || []).forEach((child, childIndex) => visit(child, level + 1, childIndex));
    };
    visit(root, 0, 0);
    const hierarchyDepth = representations.reduce((depth, object) => Math.max(depth, object.level + 1), 0);
    const assemblyHierarchy = hierarchy(root);
    const metadata = { objectCount: representations.length, hierarchyDepth, layout: 'logical-assembly' };
    return createProductionDrawingData(projectId, project, root, {
      drawingId: `production-drawing:assembly:${root.objectId}`,
      drawingType: 'Assembly Drawing',
      source: {
        sourceType: 'approved-furniture-object-assembly',
        componentObjectIds: representations.map((item) => item.objectId),
        productionFormulaResultIds: [],
      },
      views: [{
        id: 'assembly',
        type: 'Assembly',
        label: 'General Assembly',
        dimensions: {
          width: root.dimensions.width,
          height: root.dimensions.height,
          depth: root.dimensions.depth,
          unit: root.dimensions.unit || null,
        },
        components: representations.map((item) => item.objectId),
      }],
      components: representations,
      hardware: { references: hardwareReferences },
      annotations: representations.map((item) => ({
        type: 'component-label',
        objectId: item.objectId,
        text: `${item.name || 'Unnamed Furniture Object'} · Level ${item.level}`,
      })),
      assembly: {
        rootObjectId: root.objectId,
        hierarchy: assemblyHierarchy,
        components: representations,
        metadata,
      },
      rootObjectId: root.objectId,
      objects: representations,
      hierarchy: assemblyHierarchy,
      metadata,
      validation: { status: 'approved-furniture-object-assembly', valid: true, issues: [] },
    });
  }

  generatePanel(projectId, objectId, panelId = null) {
    if (typeof projectId !== 'string' || !projectId.trim()) fail('projectId is required', 400, 'PROJECT_ID_REQUIRED');
    const project = this.projectService.readProject(projectId);
    if (!project) fail('Project not found', 404, 'PROJECT_NOT_FOUND');

    let object;
    try {
      object = this.furnitureObjectEngine.getObject(projectId, objectId);
    } catch (error) {
      if (error.statusCode === 404) fail('Furniture Object not found or archived', 404, 'FURNITURE_OBJECT_NOT_FOUND');
      throw error;
    }
    const validation = this.furnitureObjectEngine.validateObject(projectId, objectId);
    if (!validation.isValid) {
      const codes = (validation.errors || []).map((item) => item.code);
      if (codes.includes('MISSING_OFFICIAL_RULE') || codes.includes('ENGINEERING_RULE_MISSING')) fail('Panel Drawing requires an official engineering rule', 422, 'BLOCKED_BY_MISSING_OFFICIAL_RULE', { validation });
      if (codes.includes('UNVERIFIED_RULE') || codes.includes('ENGINEERING_RULE_UNVERIFIED')) fail('Panel Drawing requires a verified engineering rule', 422, 'BLOCKED_BY_UNVERIFIED_RULE', { validation });
      fail('Furniture Object validation failed', 422, 'FURNITURE_OBJECT_INVALID', { validation });
    }
    if (object.productionStatus !== 'Production Ready') fail('Furniture Object is not Production Ready', 422, 'FURNITURE_OBJECT_NOT_APPROVED');

    const panels = (object.components || []).filter((component) => {
      const type = String(component?.componentType || component?.type || component?.kind || '').toLowerCase();
      return type === 'panel' || type.endsWith(' panel');
    });
    if (!panels.length) fail('No confirmed panel components are available', 422, 'BLOCKED_BY_MISSING_OFFICIAL_RULE', { reason: 'PANEL_COMPONENT_DATA_UNAVAILABLE', objectId });
    const selectedPanels = panelId ? panels.filter((panel) => (panel.panelId || panel.componentId || panel.id) === panelId) : panels;
    if (panelId && !selectedPanels.length) fail('Panel was not found in this Furniture Object', 404, 'PANEL_NOT_FOUND', { panelId, objectId });

    const officialCatalog = this.projectService.data?.official;
    const panelData = selectedPanels.map((panel, index) => {
      const panelKey = panel.panelId || panel.componentId || panel.id;
      if (typeof panelKey !== 'string' || !panelKey.trim()) fail('Panel ID is required', 422, 'PANEL_DATA_INVALID', { index });
      const dimensions = panel.dimensions || {};
      const invalidFields = ['width', 'height', 'depth'].filter((field) => !isPositiveDimension(dimensions[field]));
      if (invalidFields.length) fail('Panel dimensions are missing or invalid', 422, 'PANEL_DIMENSIONS_INVALID', { panelId: panelKey, fields: invalidFields });
      const references = panel.materialReferences || (panel.materialId ? [{ materialId: panel.materialId }] : object.materialReferences || []);
      const materialIds = references.map((reference) => reference?.materialId).filter(Boolean);
      if (!materialIds.length) fail('Panel material reference is missing', 422, 'PANEL_MATERIAL_MISSING', { panelId: panelKey });
      const unknownMaterial = materialIds.find((id) => typeof officialCatalog?.getMaterialById !== 'function' || !officialCatalog.getMaterialById(id));
      if (unknownMaterial) fail('Panel material was not found in the Official Material Catalog', 422, 'UNKNOWN_MATERIAL', { panelId: panelKey, materialId: unknownMaterial });
      const result = {
        panelId: panelKey,
        name: panel.name || panel.componentName || panelKey,
        type: panel.componentType || panel.type || 'Panel',
        parentObjectId: object.objectId,
        material: { references: materialIds },
        dimensions: { width: dimensions.width, height: dimensions.height, depth: dimensions.depth, unit: dimensions.unit || object.dimensions?.unit || null },
      };
      if (panel.grainDirection !== undefined && panel.grainDirection !== null) result.grainDirection = panel.grainDirection;
      if (panel.edgeBanding !== undefined) result.edgeBanding = panel.edgeBanding;
      if (panel.processing !== undefined) result.processing = panel.processing;
      return result;
    });
    const first = panelData[0];
    const annotations = panelData.map((panel) => ({ type: 'panel-label', panelId: panel.panelId, text: panel.name }));
    return createProductionDrawingData(projectId, project, object, {
      drawingId: `production-drawing:panel:${object.objectId}`,
      drawingType: 'Panel Drawing',
      source: {
        sourceType: 'approved-furniture-object-panel',
        panelIds: panelData.map((panel) => panel.panelId),
        productionFormulaResultIds: [],
      },
      dimensions: first.dimensions,
      views: panelData.map((panel) => ({ id: `panel-${panel.panelId}`, type: 'Panel', label: `${panel.name} / Panel`, dimensions: panel.dimensions, panelId: panel.panelId })),
      components: panelData,
      panel: { parentObjectId: object.objectId, panels: panelData },
      material: { references: [...new Set(panelData.flatMap((panel) => panel.material.references))] },
      annotations,
      processing: panelData.flatMap((panel) => panel.processing || []),
      validation: { status: 'approved-furniture-object-panel', valid: true, issues: [] },
    });
  }

  generateDoor(projectId, objectId, doorId = null) {
    if (typeof projectId !== 'string' || !projectId.trim()) fail('projectId is required', 400, 'PROJECT_ID_REQUIRED');
    const project = this.projectService.readProject(projectId);
    if (!project) fail('Project not found', 404, 'PROJECT_NOT_FOUND');
    let object;
    try {
      object = this.furnitureObjectEngine.getObject(projectId, objectId);
    } catch (error) {
      if (error.statusCode === 404) fail('Furniture Object not found or archived', 404, 'FURNITURE_OBJECT_NOT_FOUND');
      throw error;
    }
    const validation = this.furnitureObjectEngine.validateObject(projectId, objectId);
    if (!validation.isValid) {
      const codes = (validation.errors || []).map((item) => item.code);
      if (codes.includes('MISSING_OFFICIAL_RULE') || codes.includes('ENGINEERING_RULE_MISSING')) fail('Door Drawing requires an official engineering rule', 422, 'BLOCKED_BY_MISSING_OFFICIAL_RULE', { validation });
      if (codes.includes('UNVERIFIED_RULE') || codes.includes('ENGINEERING_RULE_UNVERIFIED')) fail('Door Drawing requires a verified engineering rule', 422, 'BLOCKED_BY_UNVERIFIED_RULE', { validation });
      fail('Furniture Object validation failed', 422, 'FURNITURE_OBJECT_INVALID', { validation });
    }
    if (object.productionStatus !== 'Production Ready') fail('Furniture Object is not Production Ready', 422, 'FURNITURE_OBJECT_NOT_APPROVED');

    const doors = (object.components || []).filter((component) => {
      const type = String(component?.componentType || component?.type || component?.kind || component?.role || '').toLowerCase();
      return type === 'door' || type.endsWith(' door');
    });
    if (!doors.length) fail('No confirmed door components are available', 422, 'BLOCKED_BY_MISSING_OFFICIAL_RULE', { reason: 'DOOR_COMPONENT_DATA_UNAVAILABLE', objectId });
    const selectedDoors = doorId ? doors.filter((door) => (door.doorId || door.componentId || door.id) === doorId) : doors;
    if (doorId && !selectedDoors.length) fail('Door was not found in this Furniture Object', 404, 'DOOR_NOT_FOUND', { doorId, objectId });

    const officialCatalog = this.projectService.data?.official;
    const doorData = selectedDoors.map((door, index) => {
      const key = door.doorId || door.componentId || door.id;
      if (typeof key !== 'string' || !key.trim()) fail('Door ID is required', 422, 'DOOR_DATA_INVALID', { index });
      const dimensions = door.dimensions || {};
      const invalidFields = ['width', 'height'].filter((field) => !isPositiveDimension(dimensions[field]));
      if (invalidFields.length) fail('Door dimensions are missing or invalid', 422, 'DOOR_DIMENSIONS_INVALID', { doorId: key, fields: invalidFields });
      const references = door.materialReferences || (door.materialId ? [{ materialId: door.materialId }] : object.materialReferences || []);
      const materialIds = references.map((reference) => reference?.materialId).filter(Boolean);
      if (!materialIds.length) fail('Door material reference is missing', 422, 'DOOR_MATERIAL_MISSING', { doorId: key });
      const unknownMaterial = materialIds.find((id) => typeof officialCatalog?.getMaterialById !== 'function' || !officialCatalog.getMaterialById(id));
      if (unknownMaterial) fail('Door material was not found in the Official Material Catalog', 422, 'UNKNOWN_MATERIAL', { doorId: key, materialId: unknownMaterial });
      const hardwareReferences = door.hardwareReferences || (door.hardwareId ? [{ hardwareId: door.hardwareId }] : []);
      const hardwareIds = hardwareReferences.map((reference) => reference?.hardwareId).filter(Boolean);
      const unknownHardware = hardwareIds.find((id) => typeof officialCatalog?.getHardwareById !== 'function' || !officialCatalog.getHardwareById(id));
      if (unknownHardware) fail('Door hardware reference was not found in the Official Hardware Catalog', 422, 'HARDWARE_REFERENCE_INVALID', { doorId: key, hardwareId: unknownHardware });
      const result = {
        doorId: key,
        name: door.name || door.componentName || key,
        type: door.componentType || door.type || 'Door',
        parentObjectId: object.objectId,
        material: { references: materialIds },
        hardware: { references: hardwareIds },
        dimensions: { width: dimensions.width, height: dimensions.height, unit: dimensions.unit || object.dimensions?.unit || null },
      };
      if (dimensions.thickness !== undefined && dimensions.thickness !== null) result.dimensions.thickness = dimensions.thickness;
      if (door.grainDirection !== undefined && door.grainDirection !== null) result.grainDirection = door.grainDirection;
      if (door.edgeBanding !== undefined) result.edgeBanding = door.edgeBanding;
      if (door.processing !== undefined) result.processing = door.processing;
      return result;
    });
    const first = doorData[0];
    return createProductionDrawingData(projectId, project, object, {
      drawingId: `production-drawing:door:${object.objectId}`,
      drawingType: 'Door Drawing',
      source: { sourceType: 'approved-furniture-object-door', doorIds: doorData.map((door) => door.doorId), productionFormulaResultIds: [] },
      dimensions: first.dimensions,
      views: doorData.map((door) => ({ id: `door-${door.doorId}`, type: 'Door', label: `${door.name} / Door`, dimensions: door.dimensions, doorId: door.doorId })),
      components: doorData,
      door: { parentObjectId: object.objectId, doors: doorData },
      material: { references: [...new Set(doorData.flatMap((door) => door.material.references))] },
      hardware: { references: doorData.flatMap((door) => door.hardware.references.map((hardwareId) => ({ doorId: door.doorId, hardwareId }))) },
      annotations: doorData.map((door) => ({ type: 'door-label', doorId: door.doorId, text: door.name })),
      processing: doorData.flatMap((door) => door.processing || []),
      validation: { status: 'approved-furniture-object-door', valid: true, issues: [] },
    });
  }

  generateHardware(projectId, objectId, hardwareId = null) {
    if (typeof projectId !== 'string' || !projectId.trim()) fail('projectId is required', 400, 'PROJECT_ID_REQUIRED');
    const project = this.projectService.readProject(projectId);
    if (!project) fail('Project not found', 404, 'PROJECT_NOT_FOUND');
    let object;
    try {
      object = this.furnitureObjectEngine.getObject(projectId, objectId);
    } catch (error) {
      if (error.statusCode === 404) fail('Furniture Object not found or archived', 404, 'FURNITURE_OBJECT_NOT_FOUND');
      throw error;
    }
    const validation = this.furnitureObjectEngine.validateObject(projectId, objectId);
    if (!validation.isValid) {
      const codes = (validation.errors || []).map((item) => item.code);
      if (codes.includes('MISSING_OFFICIAL_RULE') || codes.includes('ENGINEERING_RULE_MISSING')) fail('Hardware Layout requires an official engineering rule', 422, 'BLOCKED_BY_MISSING_OFFICIAL_RULE', { validation });
      if (codes.includes('UNVERIFIED_RULE') || codes.includes('ENGINEERING_RULE_UNVERIFIED')) fail('Hardware Layout requires a verified engineering rule', 422, 'BLOCKED_BY_UNVERIFIED_RULE', { validation });
      fail('Furniture Object validation failed', 422, 'FURNITURE_OBJECT_INVALID', { validation });
    }
    if (object.productionStatus !== 'Production Ready') fail('Furniture Object is not Production Ready', 422, 'FURNITURE_OBJECT_NOT_APPROVED');

    const officialCatalog = this.projectService.data?.official;
    const engineeringRecords = typeof officialCatalog?.listEngineeringRecords === 'function' ? officialCatalog.listEngineeringRecords() : [];
    const engineeringById = new Map(engineeringRecords.map((record) => [record.id, record]));
    const references = [];
    const addReferences = (owner, ownerId = null) => {
      (owner?.hardwareReferences || []).forEach((reference) => references.push({ reference, parentComponentId: ownerId, processing: owner?.processing }));
    };
    addReferences(object);
    (object.components || []).forEach((component) => addReferences(component, component.componentId || component.id || null));
    if (!references.length) fail('Furniture Object has no confirmed hardware references', 422, 'HARDWARE_REFERENCE_MISSING', { objectId });
    const selected = hardwareId ? references.filter(({ reference }) => reference?.hardwareId === hardwareId) : references;
    if (hardwareId && !selected.length) fail('Hardware reference was not found in this Furniture Object', 404, 'HARDWARE_REFERENCE_MISSING', { hardwareId, objectId });

    const hardwareData = selected.map(({ reference, parentComponentId, processing }, index) => {
      const id = reference?.hardwareId;
      if (typeof id !== 'string' || !id.trim()) fail('Hardware reference is missing a hardwareId', 422, 'HARDWARE_REFERENCE_MISSING', { index, objectId });
      const catalogRecord = typeof officialCatalog?.getHardwareById === 'function' ? officialCatalog.getHardwareById(id) : null;
      const engineeringRecord = engineeringById.get(id);
      const record = catalogRecord || (engineeringRecord?.category === 'Hardware Engineering' ? engineeringRecord : null);
      if (!record) fail('Hardware reference was not found in the Official Hardware Catalog', 422, 'UNKNOWN_HARDWARE', { hardwareId: id, objectId });
      const ruleId = reference.engineeringRuleId || reference.ruleId || reference.processing?.engineeringRuleId;
      let rule = null;
      if (ruleId) {
        rule = engineeringById.get(ruleId);
        if (!rule) fail('Hardware Layout requires an official engineering rule', 422, 'BLOCKED_BY_MISSING_OFFICIAL_RULE', { hardwareId: id, ruleId });
        if (rule.verificationStatus !== 'verified-official') fail('Hardware Layout requires a verified engineering rule', 422, 'BLOCKED_BY_UNVERIFIED_RULE', { hardwareId: id, ruleId });
        if (rule.engineeringRecordId && rule.engineeringRecordId !== id) fail('Hardware engineering rule does not match the referenced hardware', 422, 'UNSUPPORTED_CONFIGURATION', { hardwareId: id, ruleId, engineeringRecordId: rule.engineeringRecordId });
      }
      const result = {
        hardwareId: id,
        name: record.officialName || record.name || id,
        type: record.category || record.type || 'Hardware',
        productCode: record.productCode || null,
        parentObjectId: object.objectId,
        parentComponentId,
        reference: { hardwareId: id },
        specification: record.specification || null,
        source: record.source || null,
        sourceUrl: record.sourceUrl || null,
        verificationStatus: record.verificationStatus || 'verified-official',
      };
      if (record.application !== undefined) result.application = record.application;
      if (record.installationMethod !== undefined) result.installationMethod = record.installationMethod;
      if (record.openingAngle !== undefined) result.openingAngle = record.openingAngle;
      if (reference.quantity !== undefined) result.quantity = reference.quantity;
      if (reference.processing !== undefined) result.processing = reference.processing;
      else if (processing !== undefined) result.processing = processing;
      if (rule) result.engineeringRule = {
        ruleId: rule.id,
        engineeringRecordId: rule.engineeringRecordId || rule.id,
        source: rule.source || null,
        sourceUrl: rule.sourceUrl || null,
        verificationStatus: rule.verificationStatus,
      };
      return result;
    });
    return createProductionDrawingData(projectId, project, object, {
      drawingId: `production-drawing:hardware:${object.objectId}`,
      drawingType: 'Hardware Layout',
      source: { sourceType: 'approved-furniture-object-hardware', hardwareIds: hardwareData.map((item) => item.hardwareId), productionFormulaResultIds: [] },
      views: [{ id: 'hardware-layout', type: 'Hardware Layout', label: 'Hardware Reference Layout', dimensions: { width: object.dimensions.width, height: object.dimensions.height, depth: object.dimensions.depth, unit: object.dimensions.unit || null }, hardwareIds: hardwareData.map((item) => item.hardwareId) }],
      components: hardwareData,
      hardware: { references: hardwareData },
      annotations: hardwareData.map((item) => ({ type: 'hardware-label', hardwareId: item.hardwareId, parentComponentId: item.parentComponentId, text: item.name })),
      processing: hardwareData.flatMap((item) => item.processing || []),
      validation: { status: 'approved-furniture-object-hardware', valid: true, issues: [] },
    });
  }

  generatePackage(projectId, objectId) {
    if (typeof projectId !== 'string' || !projectId.trim()) fail('projectId is required', 400, 'PROJECT_ID_REQUIRED');
    const project = this.projectService.readProject(projectId);
    if (!project) fail('Project not found', 404, 'PROJECT_NOT_FOUND');
    let object;
    try {
      object = this.furnitureObjectEngine.getObject(projectId, objectId);
    } catch (error) {
      if (error.statusCode === 404) fail('Furniture Object not found or archived', 404, 'FURNITURE_OBJECT_NOT_FOUND');
      throw error;
    }
    const validation = this.furnitureObjectEngine.validateObject(projectId, objectId);
    if (!validation.isValid) fail('Furniture Object validation failed', 422, 'FURNITURE_OBJECT_INVALID', { validation });
    if (object.productionStatus !== 'Production Ready') fail('Furniture Object is not Production Ready', 422, 'FURNITURE_OBJECT_NOT_APPROVED');

    const definitions = [
      ['basic', () => this.generate(projectId, objectId)],
      ['assembly', () => this.generateAssembly(projectId, objectId)],
      ['panel', () => this.generatePanel(projectId, objectId)],
      ['door', () => this.generateDoor(projectId, objectId)],
      ['drawer', () => this.generateDrawer(projectId, objectId)],
      ['hardware', () => this.generateHardware(projectId, objectId)],
    ];
    const missingCodes = new Set([
      'BLOCKED_BY_MISSING_OFFICIAL_RULE', 'PANEL_COMPONENT_DATA_UNAVAILABLE', 'DOOR_COMPONENT_DATA_UNAVAILABLE',
      'DRAWER_COMPONENT_DATA_UNAVAILABLE', 'HARDWARE_REFERENCE_MISSING',
    ]);
    const drawings = [];
    const missing = [];
    definitions.forEach(([type, generate]) => {
      try {
        const drawing = generate();
        if (drawing.contract !== 'production-drawing-data') fail('Drawing Contract is invalid', 422, 'DRAWING_CONTRACT_INVALID', { type });
        if (drawing.project?.projectId !== projectId) fail('Drawing Project does not match the current Project', 422, 'DRAWING_PROJECT_MISMATCH', { type });
        if (drawing.objectId !== objectId || drawing.furnitureObject?.objectId !== objectId) fail('Drawing Object does not match the current Furniture Object', 422, 'DRAWING_OBJECT_MISMATCH', { type });
        if (drawing.readOnly !== true) fail('Production Package requires read-only drawings', 422, 'DRAWING_INVALID', { type });
        if (drawing.validation?.valid !== true) fail('Drawing validation failed', 422, 'DRAWING_VALIDATION_FAILED', { type });
        if (drawing.status !== 'Generated') fail('Drawing status is invalid', 422, 'DRAWING_INVALID', { type, status: drawing.status });
        drawings.push({
          drawingId: drawing.drawingId,
          drawingType: drawing.drawingType,
          objectId: drawing.objectId,
          objectName: drawing.furnitureObject?.name || null,
          status: drawing.status,
          validation: { status: drawing.validation.status, valid: drawing.validation.valid },
          readOnly: drawing.readOnly,
          source: drawing.source?.sourceType || null,
          viewCount: Array.isArray(drawing.views) ? drawing.views.length : 0,
        });
      } catch (error) {
        if (missingCodes.has(error.code) || missingCodes.has(error.details?.reason)) {
          missing.push({ drawingType: type, status: 'MISSING', reason: error.code || error.details?.reason });
          return;
        }
        throw error;
      }
    });
    const packageValidation = { status: missing.length ? 'incomplete-missing-drawings' : 'validated', valid: missing.length === 0, issues: missing };
    return {
      schemaVersion: 1,
      contract: 'production-package',
      packageId: `production-package:${projectId}:${objectId}`,
      project: { projectId, name: project?.project?.name || project?.name || null },
      projectId,
      furnitureObjects: [{ objectId: object.objectId, name: object.name || null, productionStatus: object.productionStatus }],
      drawings: [...drawings, ...missing],
      drawingCount: drawings.length,
      drawingTypes: drawings.map((drawing) => drawing.drawingType),
      validation: packageValidation,
      status: missing.length ? 'Incomplete' : 'Generated',
      readOnly: true,
    };
  }

  generateDrawer(projectId, objectId, drawerId = null) {
    if (typeof projectId !== 'string' || !projectId.trim()) fail('projectId is required', 400, 'PROJECT_ID_REQUIRED');
    const project = this.projectService.readProject(projectId);
    if (!project) fail('Project not found', 404, 'PROJECT_NOT_FOUND');
    let object;
    try {
      object = this.furnitureObjectEngine.getObject(projectId, objectId);
    } catch (error) {
      if (error.statusCode === 404) fail('Furniture Object not found or archived', 404, 'FURNITURE_OBJECT_NOT_FOUND');
      throw error;
    }
    const validation = this.furnitureObjectEngine.validateObject(projectId, objectId);
    if (!validation.isValid) {
      const codes = (validation.errors || []).map((item) => item.code);
      if (codes.includes('MISSING_OFFICIAL_RULE') || codes.includes('ENGINEERING_RULE_MISSING')) fail('Drawer Drawing requires an official engineering rule', 422, 'BLOCKED_BY_MISSING_OFFICIAL_RULE', { validation });
      if (codes.includes('UNVERIFIED_RULE') || codes.includes('ENGINEERING_RULE_UNVERIFIED')) fail('Drawer Drawing requires a verified engineering rule', 422, 'BLOCKED_BY_UNVERIFIED_RULE', { validation });
      fail('Furniture Object validation failed', 422, 'FURNITURE_OBJECT_INVALID', { validation });
    }
    if (object.productionStatus !== 'Production Ready') fail('Furniture Object is not Production Ready', 422, 'FURNITURE_OBJECT_NOT_APPROVED');

    const drawers = (object.components || []).filter((component) => {
      const type = String(component?.componentType || component?.type || component?.kind || component?.role || '').toLowerCase();
      return type === 'drawer' || type.endsWith(' drawer');
    });
    if (!drawers.length) fail('No confirmed drawer components are available', 422, 'BLOCKED_BY_MISSING_OFFICIAL_RULE', { reason: 'DRAWER_COMPONENT_DATA_UNAVAILABLE', objectId });
    const selectedDrawers = drawerId ? drawers.filter((drawer) => (drawer.drawerId || drawer.componentId || drawer.id) === drawerId) : drawers;
    if (drawerId && !selectedDrawers.length) fail('Drawer was not found in this Furniture Object', 404, 'DRAWER_NOT_FOUND', { drawerId, objectId });

    const officialCatalog = this.projectService.data?.official;
    const engineeringRecords = typeof officialCatalog?.listEngineeringRecords === 'function' ? officialCatalog.listEngineeringRecords() : [];
    const engineeringById = new Map(engineeringRecords.map((record) => [record.id, record]));
    const getHardware = (id) => {
      const catalogHardware = typeof officialCatalog?.getHardwareById === 'function' ? officialCatalog.getHardwareById(id) : null;
      if (catalogHardware) return { ...catalogHardware, verificationStatus: 'verified-official' };
      return engineeringById.get(id)?.category === 'Hardware Engineering' ? engineeringById.get(id) : null;
    };
    const ruleFor = (hardware, suffix) => engineeringRecords.find((record) => record.engineeringRecordId === hardware.id && record.id.endsWith(suffix));
    const drawerData = selectedDrawers.map((drawer, index) => {
      const key = drawer.drawerId || drawer.componentId || drawer.id;
      if (typeof key !== 'string' || !key.trim()) fail('Drawer ID is required', 422, 'DRAWER_DATA_INVALID', { index });
      const dimensions = drawer.dimensions || {};
      const invalidFields = ['width', 'height', 'depth'].filter((field) => !isPositiveDimension(dimensions[field]));
      if (invalidFields.length) fail('Drawer dimensions are missing or invalid', 422, 'DRAWER_DIMENSIONS_INVALID', { drawerId: key, fields: invalidFields });
      const materialReferences = drawer.materialReferences || (drawer.materialId ? [{ materialId: drawer.materialId }] : object.materialReferences || []);
      const materialIds = materialReferences.map((reference) => reference?.materialId).filter(Boolean);
      if (!materialIds.length) fail('Drawer material reference is missing', 422, 'DRAWER_MATERIAL_MISSING', { drawerId: key });
      const unknownMaterial = materialIds.find((id) => typeof officialCatalog?.getMaterialById !== 'function' || !officialCatalog.getMaterialById(id));
      if (unknownMaterial) fail('Drawer material was not found in the Official Material Catalog', 422, 'UNKNOWN_MATERIAL', { drawerId: key, materialId: unknownMaterial });
      const hardwareReferences = drawer.hardwareReferences || (drawer.hardwareId ? [{ hardwareId: drawer.hardwareId }] : []);
      const hardwareIds = hardwareReferences.map((reference) => reference?.hardwareId).filter(Boolean);
      if (!hardwareIds.length) fail('Drawer hardware reference is missing', 422, 'HARDWARE_REFERENCE_INVALID', { drawerId: key });
      const hardware = hardwareIds.map((id) => ({ id, record: getHardware(id) }));
      const unknownHardware = hardware.find((item) => !item.record);
      if (unknownHardware) fail('Drawer hardware reference was not found in the Official Hardware Catalog', 422, 'HARDWARE_REFERENCE_INVALID', { drawerId: key, hardwareId: unknownHardware.id });
      if (hardware.length !== 1) fail('Drawer Drawing requires one confirmed drawer runner configuration', 422, 'UNSUPPORTED_CONFIGURATION', { drawerId: key, hardwareIds });
      const hardwareRecord = hardware[0].record;
      const model = String(hardwareRecord.model || hardwareRecord.officialName || '').toUpperCase();
      let ruleSuffixes;
      if (model.includes('561F')) ruleSuffixes = ['561F-INTERNAL-WIDTH', '561F-INNER-LENGTH'];
      else if (model.includes('560H') && !model.includes('TIP-ON')) ruleSuffixes = ['560H-INTERNAL-WIDTH', 'DRAWER-LENGTH'];
      else fail('Drawer hardware model is not supported by the verified Drawer rules', 422, 'UNSUPPORTED_CONFIGURATION', { drawerId: key, hardwareId: hardwareRecord.id, model: hardwareRecord.model || null });
      const rules = ruleSuffixes.map((suffix) => ruleFor(hardwareRecord, suffix));
      if (rules.some((rule) => !rule)) fail('Drawer Drawing requires a verified Drawer engineering rule', 422, 'BLOCKED_BY_MISSING_OFFICIAL_RULE', { drawerId: key, hardwareId: hardwareRecord.id });
      const unverifiedRule = rules.find((rule) => rule.verificationStatus !== 'verified-official');
      if (unverifiedRule) fail('Drawer Drawing requires a verified Drawer engineering rule', 422, 'BLOCKED_BY_UNVERIFIED_RULE', { drawerId: key, ruleId: unverifiedRule.id });
      const result = {
        drawerId: key,
        name: drawer.name || drawer.componentName || key,
        type: drawer.componentType || drawer.type || 'Drawer',
        parentObjectId: object.objectId,
        material: { references: materialIds },
        hardware: { references: hardwareIds },
        dimensions: { width: dimensions.width, height: dimensions.height, depth: dimensions.depth, unit: dimensions.unit || object.dimensions?.unit || null },
        formula: { status: 'verified-rule-applicability-confirmed', rules: rules.map((rule) => ({ ruleId: rule.id, engineeringRecordId: rule.engineeringRecordId, verificationStatus: rule.verificationStatus, source: rule.source, sourceUrl: rule.sourceUrl })) },
      };
      if (drawer.grainDirection !== undefined && drawer.grainDirection !== null) result.grainDirection = drawer.grainDirection;
      if (drawer.edgeBanding !== undefined) result.edgeBanding = drawer.edgeBanding;
      if (drawer.processing !== undefined) result.processing = drawer.processing;
      return result;
    });
    const first = drawerData[0];
    return createProductionDrawingData(projectId, project, object, {
      drawingId: `production-drawing:drawer:${object.objectId}`,
      drawingType: 'Drawer Drawing',
      source: { sourceType: 'approved-furniture-object-drawer', drawerIds: drawerData.map((drawer) => drawer.drawerId), productionFormulaResultIds: [] },
      dimensions: first.dimensions,
      views: drawerData.map((drawer) => ({ id: `drawer-${drawer.drawerId}`, type: 'Drawer', label: `${drawer.name} / Drawer`, dimensions: drawer.dimensions, drawerId: drawer.drawerId })),
      components: drawerData,
      drawer: { parentObjectId: object.objectId, drawers: drawerData },
      material: { references: [...new Set(drawerData.flatMap((drawer) => drawer.material.references))] },
      hardware: { references: drawerData.flatMap((drawer) => drawer.hardware.references.map((hardwareId) => ({ drawerId: drawer.drawerId, hardwareId }))) },
      formula: { status: 'verified-rule-applicability-confirmed', rules: drawerData.flatMap((drawer) => drawer.formula.rules) },
      annotations: drawerData.map((drawer) => ({ type: 'drawer-label', drawerId: drawer.drawerId, text: drawer.name })),
      processing: drawerData.flatMap((drawer) => drawer.processing || []),
      validation: { status: 'approved-furniture-object-drawer', valid: true, issues: [] },
    });
  }
}

module.exports = { ProductionDrawingGenerationService };
