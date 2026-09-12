const { clone } = require('./production-drawing-data-contract');

const CONTRACT = 'purchase-list-result';

function fail(message, statusCode, code, details = {}) {
  throw Object.assign(new Error(message), { statusCode, code, details });
}

function issue(code, message, details = {}) {
  return { code, message, ...details };
}

function positiveQuantity(value) {
  return (typeof value === 'number' || (typeof value === 'string' && value.trim() !== ''))
    && Number.isFinite(Number(value)) && Number(value) > 0;
}

function quantityFromCuttingList(reference, object, cuttingListResults) {
  const result = (Array.isArray(cuttingListResults) ? cuttingListResults : [cuttingListResults])
    .filter(Boolean)
    .find((candidate) => candidate.furnitureObject?.objectId === object.objectId);
  if (!result) return null;
  if (result.contract !== 'cutting-list-result' || result.readOnly !== true || result.project?.projectId !== object.projectId) return { invalid: true };
  const matches = (result.parts || []).filter((part) => part.material?.id === reference.materialId);
  if (!matches.length) return null;
  const total = matches.reduce((sum, part) => sum + Number(part.quantity), 0);
  return Number.isFinite(total) && total > 0 ? { quantity: total, source: { sourceType: 'canonical-cutting-list-result', cuttingListId: result.cuttingListId, partIds: matches.map((part) => part.partId) } } : { invalid: true };
}

function explicitQuantity(reference) {
  if (reference.quantity === undefined) return null;
  return positiveQuantity(reference.quantity) ? { quantity: Number(reference.quantity), source: { sourceType: 'canonical-reference', referenceQuantity: reference.quantity } } : { invalid: true };
}

function referenceList(object, type) {
  const objectReferences = Array.isArray(object[`${type}References`]) ? object[`${type}References`] : [];
  const componentReferences = (object.components || []).flatMap((component) => {
    const sourceComponentId = component.componentId || component.partId || component.id || null;
    if (Array.isArray(component[`${type}References`])) return component[`${type}References`].map((reference) => ({ ...reference, sourceComponentId }));
    const idField = `${type}Id`;
    return component[idField] ? [{ [idField]: component[idField], sourceComponentId }] : [];
  });
  return componentReferences.length ? componentReferences : objectReferences.map((reference) => ({ ...reference, sourceComponentId: reference.sourceComponentId || null }));
}

function baseItem(object, reference, category, itemId, sourceComponentId) {
  return { itemId, sourceObjectId: object.objectId, sourceComponentId: sourceComponentId || null, category, sourceReference: clone(reference), validation: { valid: true, status: 'REFERENCE_VALIDATED', issues: [] } };
}

function buildMaterialItems(object, catalog, cuttingListResults, issues) {
  const references = referenceList(object, 'material');
  if (!references.length) { issues.push(issue('MATERIAL_MISSING', 'No confirmed Material reference is available', { objectId: object.objectId })); return []; }
  return references.map((reference, index) => {
    const materialId = reference?.materialId;
    if (!materialId) { issues.push(issue('MATERIAL_REFERENCE_INVALID', 'Material reference is missing materialId', { objectId: object.objectId, index })); return null; }
    const material = catalog?.getMaterialById?.(materialId);
    if (!material) { issues.push(issue('UNKNOWN_MATERIAL', 'Material was not found in the Official Material Catalog', { objectId: object.objectId, materialId })); return null; }
    const quantity = explicitQuantity(reference) || quantityFromCuttingList({ materialId }, object, cuttingListResults);
    if (!quantity || quantity.invalid || !positiveQuantity(quantity.quantity)) { issues.push(issue('QUANTITY_MISSING', 'Material quantity has no explicit canonical source', { objectId: object.objectId, materialId })); return null; }
    const item = baseItem(object, reference, 'Board Materials', `purchase-material:${object.objectId}:${materialId}:${index}`, reference.sourceComponentId);
    return { ...item, material: { materialId, reference: clone(reference) }, name: material.name || material.officialName || null, productCode: reference.productCode ?? material.productCode ?? null, specification: reference.specification ?? material.specification ?? null, thickness: reference.thickness ?? material.thickness ?? null, quantity: quantity.quantity, unit: reference.unit ?? material.unit ?? null, source: { sourceType: quantity.source.sourceType, projectId: object.projectId, objectId: object.objectId, materialId, ...(quantity.source.cuttingListId ? { cuttingListId: quantity.source.cuttingListId, partIds: quantity.source.partIds } : {}) } };
  }).filter(Boolean);
}

function buildHardwareItems(object, catalog, issues) {
  return referenceList(object, 'hardware').map((reference, index) => {
    const hardwareId = reference?.hardwareId;
    if (!hardwareId) { issues.push(issue('HARDWARE_REFERENCE_INVALID', 'Hardware reference is missing hardwareId', { objectId: object.objectId, index })); return null; }
    const hardware = catalog?.getHardwareById?.(hardwareId);
    if (!hardware) { issues.push(issue('UNKNOWN_HARDWARE', 'Hardware was not found in the Official Hardware Catalog', { objectId: object.objectId, hardwareId })); return null; }
    const quantity = explicitQuantity(reference);
    if (!quantity || quantity.invalid || !positiveQuantity(quantity.quantity)) { issues.push(issue('QUANTITY_MISSING', 'Hardware quantity has no explicit canonical source', { objectId: object.objectId, hardwareId })); return null; }
    const item = baseItem(object, reference, 'Hardware', `purchase-hardware:${object.objectId}:${hardwareId}:${index}`, reference.sourceComponentId);
    return { ...item, hardware: { hardwareId, reference: clone(reference) }, name: hardware.name || hardware.officialName || null, productCode: reference.productCode ?? hardware.productCode ?? null, specification: reference.specification ?? hardware.specification ?? null, quantity: quantity.quantity, unit: reference.unit ?? hardware.unit ?? null, source: { sourceType: 'canonical-reference', projectId: object.projectId, objectId: object.objectId, hardwareId } };
  }).filter(Boolean);
}

function buildAccessoryItems(object, issues) {
  return referenceList(object, 'accessory').map((reference, index) => {
    if (!reference?.accessoryId && !reference?.itemId) { issues.push(issue('ACCESSORY_REFERENCE_INVALID', 'Accessory reference is missing accessoryId or itemId', { objectId: object.objectId, index })); return null; }
    const quantity = explicitQuantity(reference);
    if (!quantity || quantity.invalid) { issues.push(issue('QUANTITY_MISSING', 'Accessory quantity has no explicit canonical source', { objectId: object.objectId, index })); return null; }
    const itemId = reference.accessoryId || reference.itemId;
    return { ...baseItem(object, reference, 'Accessories', `purchase-accessory:${object.objectId}:${itemId}:${index}`, reference.sourceComponentId), accessory: { accessoryId: itemId, reference: clone(reference) }, name: reference.name || null, productCode: reference.productCode ?? null, specification: reference.specification ?? null, quantity: quantity.quantity, unit: reference.unit ?? null, source: { sourceType: 'canonical-reference', projectId: object.projectId, objectId: object.objectId, accessoryId: itemId } };
  }).filter(Boolean);
}

function validatePurchaseListResult(result, projectId, objectId = null) {
  if (!result || result.contract !== CONTRACT) fail('Purchase List Result contract is invalid', 422, 'INVALID_CONTRACT');
  if (result.readOnly !== true) fail('Purchase List Result must be read-only', 422, 'READ_ONLY_REQUIRED');
  if (result.project?.projectId !== projectId) fail('Purchase List Result Project does not match', 422, 'PROJECT_MISMATCH');
  if (objectId && result.furnitureObjects?.some((object) => object.objectId !== objectId)) fail('Purchase List Result Object does not match', 422, 'OBJECT_MISMATCH');
  if (!Array.isArray(result.materialItems) || !Array.isArray(result.hardwareItems) || !Array.isArray(result.accessoryItems)) fail('Purchase List Result item collections are invalid', 422, 'INVALID_CONTRACT');
  return true;
}

function generatePurchaseList(projectService, furnitureObjectEngine, projectId, options = {}) {
  if (typeof projectId !== 'string' || !projectId.trim()) fail('projectId is required', 400, 'PROJECT_ID_REQUIRED');
  const project = projectService?.readProject?.(projectId);
  if (!project) fail('Project not found', 404, 'PROJECT_NOT_FOUND');
  const objects = furnitureObjectEngine?.listObjects?.(projectId);
  if (!Array.isArray(objects)) fail('Furniture Object source is unavailable', 422, 'FURNITURE_OBJECT_SOURCE_INVALID');
  if (options.objectId && !objects.some((object) => object.objectId === options.objectId)) fail('Furniture Object not found', 404, 'FURNITURE_OBJECT_NOT_FOUND');
  const scopedObjects = options.objectId ? objects.filter((object) => object.objectId === options.objectId) : objects;
  const approvedObjects = scopedObjects.filter((object) => object.lifecycleStatus !== 'Archived' && object.productionStatus === 'Production Ready');
  const issues = [];
  if (!approvedObjects.length) issues.push(issue('FURNITURE_OBJECT_NOT_APPROVED', 'No Production Ready Furniture Object is available', { projectId }));
  const catalog = options.catalog || projectService?.data?.official;
  const cuttingListInput = options.cuttingListResults || options.cuttingListResult;
  const suppliedCuttingLists = (Array.isArray(cuttingListInput) ? cuttingListInput : [cuttingListInput]).filter(Boolean);
  suppliedCuttingLists.forEach((result) => {
    if (result.contract !== 'cutting-list-result' || result.readOnly !== true || result.project?.projectId !== projectId || !objects.some((object) => object.objectId === result.furnitureObject?.objectId) || result.validation?.valid === false || ['BLOCKED', 'INCOMPLETE'].includes(result.status)) issues.push(issue('SOURCE_MISMATCH', 'Cutting List Result does not belong to the current Project/Object or is not valid', { cuttingListId: result.cuttingListId || null }));
  });
  const materialItems = [];
  const hardwareItems = [];
  const accessoryItems = [];
  for (const object of approvedObjects) {
    if (object.projectId !== projectId) { issues.push(issue('PROJECT_OBJECT_MISMATCH', 'Furniture Object does not belong to the current Project', { objectId: object.objectId })); continue; }
    if (object.validation && object.validation.isValid === false) { issues.push(issue('INVALID_REFERENCE', 'Furniture Object validation is not valid', { objectId: object.objectId })); continue; }
    materialItems.push(...buildMaterialItems(object, catalog, options.cuttingListResults || options.cuttingListResult, issues));
    hardwareItems.push(...buildHardwareItems(object, catalog, issues));
    accessoryItems.push(...buildAccessoryItems(object, issues));
  }
  const status = issues.length ? 'BLOCKED' : 'Generated';
  const result = {
    schemaVersion: 1,
    contract: CONTRACT,
    purchaseListId: `purchase-list:${projectId}`,
    project: { projectId, name: project.project?.name || project.name || null },
    furnitureObjects: clone(approvedObjects.map((object) => ({ objectId: object.objectId, name: object.name || null, objectType: object.objectType || object.furnitureType || null, productionStatus: object.productionStatus }))),
    materialItems,
    hardwareItems,
    accessoryItems,
    summary: { materialItemCount: materialItems.length, hardwareItemCount: hardwareItems.length, accessoryItemCount: accessoryItems.length, totalItemCount: materialItems.length + hardwareItems.length + accessoryItems.length },
    source: { sourceType: 'canonical-project-and-approved-furniture-objects', projectId, furnitureObjectIds: approvedObjects.map((object) => object.objectId), cuttingListIds: (Array.isArray(options.cuttingListResults) ? options.cuttingListResults : [options.cuttingListResults]).filter(Boolean).map((item) => item.cuttingListId).filter(Boolean) },
    validation: { valid: issues.length === 0, status: issues.length ? 'BLOCKED' : 'VALIDATED', issues },
    status,
    readOnly: true,
  };
  validatePurchaseListResult(result, projectId);
  return result;
}

module.exports = { CONTRACT, generatePurchaseList, validatePurchaseListResult, positiveQuantity };
