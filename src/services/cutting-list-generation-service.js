const { clone } = require('./production-drawing-data-contract');

function fail(message, statusCode, code, details = {}) {
  throw Object.assign(new Error(message), { statusCode, code, details });
}

function positive(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

function getObject(projectService, furnitureObjectEngine, projectId, objectId) {
  const project = projectService.readProject(projectId);
  if (!project) fail('Project not found', 404, 'PROJECT_NOT_FOUND');
  let object;
  try {
    object = furnitureObjectEngine.getObject(projectId, objectId);
  } catch (error) {
    if (error.statusCode === 404) fail('Furniture Object not found', 404, 'FURNITURE_OBJECT_NOT_FOUND');
    throw error;
  }
  if (object.projectId && object.projectId !== projectId) fail('Furniture Object does not belong to this Project', 422, 'PROJECT_OBJECT_MISMATCH');
  if (object.lifecycleStatus === 'Archived') fail('Archived Furniture Object cannot generate a Cutting List', 422, 'FURNITURE_OBJECT_ARCHIVED');
  if (object.productionStatus !== 'Production Ready') fail('Furniture Object is not Production Ready', 422, 'FURNITURE_OBJECT_NOT_APPROVED');
  const dimensions = object.dimensions || {};
  const invalidFields = ['width', 'height', 'depth'].filter((field) => !positive(dimensions[field]));
  if (invalidFields.length) fail('Furniture Object dimensions are invalid', 422, 'DIMENSIONS_INVALID', { fields: invalidFields });
  const validation = furnitureObjectEngine.validateObject(projectId, objectId);
  if (!validation.isValid) {
    const codes = (validation.errors || []).map((item) => item.code);
    if (codes.includes('MISSING_OFFICIAL_RULE') || codes.includes('ENGINEERING_RULE_MISSING')) fail('Cutting List requires an official engineering rule', 422, 'BLOCKED_BY_MISSING_OFFICIAL_RULE', { validation });
    if (codes.includes('UNVERIFIED_RULE') || codes.includes('ENGINEERING_RULE_UNVERIFIED')) fail('Cutting List requires a verified engineering rule', 422, 'BLOCKED_BY_UNVERIFIED_RULE', { validation });
    fail('Furniture Object validation failed', 422, 'FURNITURE_OBJECT_INVALID', { validation });
  }
  return { project, object };
}

function isPanel(component) {
  const type = String(component?.componentType || component?.type || component?.kind || component?.role || '').toLowerCase();
  return type === 'panel' || type === 'board' || type.endsWith(' panel') || type.endsWith(' board');
}

function materialFor(component, object, officialCatalog, index) {
  const references = component.materialReferences || (component.materialId ? [{ materialId: component.materialId }] : object.materialReferences || []);
  const materialId = references.map((reference) => reference?.materialId).find(Boolean);
  if (!materialId) fail('Panel material reference is missing', 422, 'MATERIAL_REFERENCE_MISSING', { componentIndex: index });
  const material = officialCatalog?.getMaterialById?.(materialId);
  if (!material) fail('Material was not found in the Official Material Catalog', 422, 'UNKNOWN_MATERIAL', { componentIndex: index, materialId });
  return { id: material.id, name: material.name || material.officialName || null, reference: { materialId: material.id } };
}

function quantityFor(component, index) {
  if (component.quantity !== undefined) {
    if (!Number.isInteger(Number(component.quantity)) || Number(component.quantity) <= 0) fail('Panel quantity is invalid', 422, 'QUANTITY_MISSING', { componentIndex: index });
    return Number(component.quantity);
  }
  if (component.isPart === true || component.partId) return 1;
  fail('Panel quantity is not confirmed', 422, 'QUANTITY_MISSING', { componentIndex: index });
}

function ruleFor(component, index) {
  const rule = component.engineeringRule || component.engineeringRuleReference || null;
  if (!rule) return null;
  if (rule.verificationStatus !== 'verified-official') fail('Panel engineering rule is not verified', 422, 'BLOCKED_BY_UNVERIFIED_RULE', { componentIndex: index, ruleId: rule.ruleId || null });
  if (!rule.ruleId || !rule.engineeringRecordId || !rule.source || !rule.sourceUrl) fail('Panel engineering rule traceability is incomplete', 422, 'BLOCKED_BY_MISSING_OFFICIAL_RULE', { componentIndex: index });
  return clone(rule);
}

function generateCuttingList(projectService, furnitureObjectEngine, projectId, objectId) {
  const { project, object } = getObject(projectService, furnitureObjectEngine, projectId, objectId);
  const components = (object.components || []).filter(isPanel);
  if (!components.length) fail('No confirmed Panel or Board components are available', 422, 'PANEL_NOT_FOUND', { objectId });
  const officialCatalog = projectService.data?.official;
  const parts = components.map((component, index) => {
    const componentId = component.componentId || component.panelId || component.id;
    if (!componentId) fail('Panel component ID is missing', 422, 'PANEL_NOT_FOUND', { componentIndex: index });
    const dimensions = component.dimensions || {};
    const dimensionFields = ['width', 'height'];
    if (dimensionFields.some((field) => !positive(dimensions[field]))) fail('Panel dimensions are missing or invalid', 422, 'PANEL_DIMENSIONS_INVALID', { componentId, fields: dimensionFields.filter((field) => !positive(dimensions[field])) });
    for (const optionalField of ['depth', 'thickness']) if (dimensions[optionalField] !== undefined && !positive(dimensions[optionalField])) fail('Panel optional dimension is invalid', 422, 'PANEL_DIMENSIONS_INVALID', { componentId, field: optionalField });
    const material = materialFor(component, object, officialCatalog, index);
    const quantity = quantityFor(component, index);
    const engineeringRule = ruleFor(component, index);
    return {
      partId: component.partId || `cutting-part:${objectId}:${componentId}`,
      componentId,
      parentObjectId: object.objectId,
      name: component.name || component.componentName || componentId,
      type: component.componentType || component.type || 'Panel',
      material,
      dimensions: clone(dimensions),
      quantity,
      grainDirection: component.grainDirection ?? null,
      edgeBanding: component.edgeBanding ?? null,
      processing: clone(component.processing || []),
      source: { sourceType: 'canonical-furniture-object-component', projectId, furnitureObjectId: object.objectId, componentId },
      engineeringRule,
      validation: { status: 'confirmed-component-data', valid: true, issues: [] },
    };
  });
  const materialSummary = [...new Map(parts.map((part) => [part.material.id, { materialId: part.material.id, name: part.material.name, partCount: parts.filter((item) => item.material.id === part.material.id).length }])).values()];
  return {
    schemaVersion: 1,
    contract: 'cutting-list-result',
    cuttingListId: `cutting-list:${projectId}:${objectId}`,
    project: { projectId, name: project?.project?.name || project?.name || null },
    furnitureObject: { objectId: object.objectId, name: object.name || null, objectType: object.objectType || object.furnitureType || null, productionStatus: object.productionStatus },
    source: { sourceType: 'canonical-furniture-object', projectId, furnitureObjectId: object.objectId, componentIds: parts.map((part) => part.componentId) },
    parts,
    materialSummary,
    validation: { status: 'validated-confirmed-components', valid: true, issues: [] },
    status: 'Generated',
    readOnly: true,
  };
}

module.exports = { generateCuttingList, isPanel, positive };
