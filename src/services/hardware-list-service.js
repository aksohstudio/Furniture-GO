const { clone } = require('./production-drawing-data-contract');

const CONTRACT = 'hardware-list-view-model';

function fail(message, statusCode, code, details = {}) {
  throw Object.assign(new Error(message), { statusCode, code, details });
}

function validatePurchaseList(purchaseList, projectId) {
  if (!purchaseList) fail('Purchase List Result is missing', 422, 'PURCHASE_LIST_MISSING');
  if (purchaseList.contract !== 'purchase-list-result') fail('Purchase List Result contract is invalid', 422, 'INVALID_PURCHASE_LIST_CONTRACT');
  if (purchaseList.readOnly !== true) fail('Purchase List Result must be read-only', 422, 'READ_ONLY_REQUIRED');
  if (purchaseList.project?.projectId !== projectId) fail('Purchase List Result Project does not match', 422, 'PROJECT_MISMATCH');
  if (purchaseList.validation?.valid === false || purchaseList.status === 'BLOCKED') fail('Purchase List Result is blocked', 422, 'PURCHASE_LIST_BLOCKED', { issues: clone(purchaseList.validation?.issues || []) });
  if (!Array.isArray(purchaseList.furnitureObjects) || !Array.isArray(purchaseList.hardwareItems)) fail('Purchase List Result collections are invalid', 422, 'INVALID_PURCHASE_LIST_CONTRACT');
  return purchaseList;
}

function issueCodes(item) {
  return Array.isArray(item?.validation?.issues) ? item.validation.issues.map((entry) => entry?.code).filter(Boolean) : [];
}

function validateHardwareItem(item, purchaseList, projectId, objectId) {
  const hardwareId = item?.hardware?.hardwareId || item?.hardwareId || item?.sourceReference?.hardwareId;
  const codes = issueCodes(item);
  if (codes.includes('UNKNOWN_HARDWARE')) fail('Hardware reference is unknown', 422, 'UNKNOWN_HARDWARE', { itemId: item?.itemId || null, hardwareId: hardwareId || null });
  if (codes.includes('HARDWARE_REFERENCE_INVALID')) fail('Hardware reference is invalid', 422, 'HARDWARE_REFERENCE_INVALID', { itemId: item?.itemId || null, hardwareId: hardwareId || null });
  if (!hardwareId) fail('Hardware item is missing its Hardware reference', 422, 'HARDWARE_REFERENCE_MISSING', { itemId: item?.itemId || null });
  if (item.validation?.valid === false) fail('Hardware item is invalid', 422, 'HARDWARE_REFERENCE_INVALID', { itemId: item.itemId, hardwareId });
  if (typeof item.quantity !== 'number' || !Number.isFinite(item.quantity) || item.quantity <= 0) fail('Hardware item quantity is missing or invalid', 422, item.quantity === undefined || item.quantity === null ? 'QUANTITY_MISSING' : 'INVALID_QUANTITY', { itemId: item.itemId, hardwareId });
  if (!item.source || item.source.projectId !== projectId || item.source.objectId !== item.sourceObjectId || item.source.hardwareId !== hardwareId) fail('Hardware item source does not match', 422, 'SOURCE_MISMATCH', { itemId: item.itemId, hardwareId });
  if (objectId && item.sourceObjectId !== objectId) fail('Hardware item Object does not match', 422, 'OBJECT_MISMATCH', { itemId: item.itemId, objectId });
  if (!purchaseList.furnitureObjects.some((object) => object.objectId === item.sourceObjectId)) fail('Hardware item Object is not in the Purchase List Result', 422, 'OBJECT_MISMATCH', { itemId: item.itemId, objectId: item.sourceObjectId });
}

function buildHardwareList(purchaseList, projectId, objectId = null) {
  const source = validatePurchaseList(purchaseList, projectId);
  const sourceItems = source.hardwareItems.filter((item) => item?.category === 'Hardware' || item?.type || item?.hardware?.hardwareId || item?.hardwareId);
  sourceItems.forEach((item) => validateHardwareItem(item, source, projectId, objectId));
  const items = sourceItems.map((item) => ({
    itemId: item.itemId,
    sourceObjectId: item.sourceObjectId,
    sourceComponentId: item.sourceComponentId || null,
    hardwareId: item.hardware?.hardwareId || item.hardwareId || item.sourceReference.hardwareId,
    name: item.name ?? null,
    productCode: item.productCode ?? null,
    type: item.type ?? item.hardware?.type ?? null,
    category: item.category ?? item.hardware?.category ?? null,
    specification: item.specification ?? null,
    quantity: item.quantity,
    unit: item.unit ?? null,
    source: clone(item.source),
    validation: clone(item.validation || { valid: true, status: 'SOURCE_VALIDATED', issues: [] }),
  }));
  return { schemaVersion: 1, contract: CONTRACT, hardwareListId: `hardware-list:${projectId}${objectId ? `:${objectId}` : ''}:${source.purchaseListId}`, project: clone(source.project), furnitureObjects: clone(source.furnitureObjects), items, itemCount: items.length, source: { sourceType: 'purchase-list-result', projectId, purchaseListId: source.purchaseListId, hardwareItemIds: items.map((item) => item.itemId) }, validation: { valid: true, status: 'VALIDATED', issues: [] }, status: 'Ready', readOnly: true };
}

function filterHardwareList(viewModel, options = {}) {
  if (!viewModel || viewModel.contract !== CONTRACT || viewModel.readOnly !== true) fail('Hardware List View Model is invalid', 422, 'INVALID_CONTRACT');
  const search = String(options.search || '').trim().toLowerCase();
  const productCode = String(options.productCode || '').trim().toLowerCase();
  const type = String(options.type || '').trim();
  const category = String(options.category || '').trim();
  const items = viewModel.items.filter((item) => (!search || `${item.name || ''} ${item.hardwareId || ''} ${item.specification || ''}`.toLowerCase().includes(search)) && (!productCode || String(item.productCode || '').toLowerCase().includes(productCode)) && (!type || item.type === type) && (!category || item.category === category));
  const sort = options.sort || 'name';
  const sorted = [...items].sort((left, right) => String(left[sort] ?? '').localeCompare(String(right[sort] ?? ''), undefined, { numeric: true, sensitivity: 'base' }));
  return { ...clone(viewModel), items: sorted, itemCount: sorted.length };
}

module.exports = { CONTRACT, buildHardwareList, filterHardwareList, validatePurchaseList };
