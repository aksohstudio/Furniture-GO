const { clone } = require('./production-drawing-data-contract');

const CONTRACT = 'accessories-list-view-model';

function fail(message, statusCode, code, details = {}) {
  throw Object.assign(new Error(message), { statusCode, code, details });
}

function validatePurchaseList(purchaseList, projectId) {
  if (!purchaseList) fail('Purchase List Result is missing', 422, 'PURCHASE_LIST_MISSING');
  if (purchaseList.contract !== 'purchase-list-result') fail('Purchase List Result contract is invalid', 422, 'INVALID_PURCHASE_LIST_CONTRACT');
  if (purchaseList.readOnly !== true) fail('Purchase List Result must be read-only', 422, 'READ_ONLY_REQUIRED');
  if (purchaseList.project?.projectId !== projectId) fail('Purchase List Result Project does not match', 422, 'PROJECT_MISMATCH');
  if (purchaseList.validation?.valid === false || purchaseList.status === 'BLOCKED') fail('Purchase List Result is blocked', 422, 'PURCHASE_LIST_BLOCKED', { issues: clone(purchaseList.validation?.issues || []) });
  if (!Array.isArray(purchaseList.furnitureObjects) || !Array.isArray(purchaseList.accessoryItems)) fail('Purchase List Result collections are invalid', 422, 'INVALID_PURCHASE_LIST_CONTRACT');
  return purchaseList;
}

function issueCodes(item) {
  return Array.isArray(item?.validation?.issues) ? item.validation.issues.map((entry) => entry?.code).filter(Boolean) : [];
}

function accessoryIdOf(item) {
  return item?.accessory?.accessoryId || item?.accessoryId || item?.sourceReference?.accessoryId || item?.accessory?.itemId || item?.sourceReference?.itemId;
}

function validateAccessoryItem(item, purchaseList, projectId, objectId) {
  const accessoryId = accessoryIdOf(item);
  const codes = issueCodes(item);
  if (codes.includes('UNKNOWN_ACCESSORY')) fail('Accessory reference is unknown', 422, 'UNKNOWN_ACCESSORY', { itemId: item?.itemId || null, accessoryId: accessoryId || null });
  if (codes.includes('UNSUPPORTED_ACCESSORY')) fail('Accessory reference is unsupported', 422, 'UNSUPPORTED_ACCESSORY', { itemId: item?.itemId || null, accessoryId: accessoryId || null });
  if (codes.includes('ACCESSORY_REFERENCE_INVALID')) fail('Accessory reference is invalid', 422, 'ACCESSORY_REFERENCE_INVALID', { itemId: item?.itemId || null, accessoryId: accessoryId || null });
  if (!accessoryId) fail('Accessory item is missing its Accessory reference', 422, 'ACCESSORY_REFERENCE_MISSING', { itemId: item?.itemId || null });
  if (item.validation?.valid === false) fail('Accessory item is invalid', 422, 'ACCESSORY_REFERENCE_INVALID', { itemId: item.itemId, accessoryId });
  if (typeof item.quantity !== 'number' || !Number.isFinite(item.quantity) || item.quantity <= 0) fail('Accessory item quantity is missing or invalid', 422, item.quantity === undefined || item.quantity === null ? 'QUANTITY_MISSING' : 'INVALID_QUANTITY', { itemId: item.itemId, accessoryId });
  if (!item.source || item.source.projectId !== projectId || item.source.objectId !== item.sourceObjectId || item.source.accessoryId !== accessoryId) fail('Accessory item source does not match', 422, 'SOURCE_MISMATCH', { itemId: item.itemId, accessoryId });
  if (objectId && item.sourceObjectId !== objectId) fail('Accessory item Object does not match', 422, 'OBJECT_MISMATCH', { itemId: item.itemId, objectId });
  if (!item.sourceObjectId) fail('Accessory item Furniture Object is missing', 422, 'FURNITURE_OBJECT_MISSING', { itemId: item.itemId, accessoryId });
  if (!purchaseList.furnitureObjects.some((object) => object.objectId === item.sourceObjectId)) fail('Accessory item Object is not in the Purchase List Result', 422, 'OBJECT_MISMATCH', { itemId: item.itemId, objectId: item.sourceObjectId });
}

function buildAccessoriesList(purchaseList, projectId, objectId = null) {
  const source = validatePurchaseList(purchaseList, projectId);
  const sourceItems = source.accessoryItems;
  sourceItems.forEach((item) => validateAccessoryItem(item, source, projectId, objectId));
  const items = sourceItems.map((item) => ({
    itemId: item.itemId,
    sourceObjectId: item.sourceObjectId,
    sourceComponentId: item.sourceComponentId || null,
    accessoryId: accessoryIdOf(item),
    name: item.name ?? null,
    productCode: item.productCode ?? null,
    category: item.category ?? item.type ?? null,
    type: item.type ?? item.category ?? null,
    specification: item.specification ?? null,
    quantity: item.quantity,
    unit: item.unit ?? null,
    source: clone(item.source),
    validation: clone(item.validation || { valid: true, status: 'SOURCE_VALIDATED', issues: [] }),
  }));
  return { schemaVersion: 1, contract: CONTRACT, accessoriesListId: `accessories-list:${projectId}${objectId ? `:${objectId}` : ''}:${source.purchaseListId}`, project: clone(source.project), furnitureObjects: clone(source.furnitureObjects), items, itemCount: items.length, source: { sourceType: 'purchase-list-result', projectId, purchaseListId: source.purchaseListId, accessoryItemIds: items.map((item) => item.itemId) }, validation: { valid: true, status: 'VALIDATED', issues: [] }, status: 'Ready', readOnly: true };
}

function filterAccessoriesList(viewModel, options = {}) {
  if (!viewModel || viewModel.contract !== CONTRACT || viewModel.readOnly !== true) fail('Accessories List View Model is invalid', 422, 'INVALID_CONTRACT');
  const search = String(options.search || '').trim().toLowerCase();
  const productCode = String(options.productCode || '').trim().toLowerCase();
  const category = String(options.category || options.type || '').trim();
  const items = viewModel.items.filter((item) => (!search || `${item.name || ''} ${item.accessoryId || ''} ${item.specification || ''}`.toLowerCase().includes(search)) && (!productCode || String(item.productCode || '').toLowerCase().includes(productCode)) && (!category || item.category === category || item.type === category));
  const sort = options.sort || 'name';
  const sorted = [...items].sort((left, right) => String(left[sort] ?? '').localeCompare(String(right[sort] ?? ''), undefined, { numeric: true, sensitivity: 'base' }));
  return { ...clone(viewModel), items: sorted, itemCount: sorted.length };
}

module.exports = { CONTRACT, buildAccessoriesList, filterAccessoriesList, validatePurchaseList };
