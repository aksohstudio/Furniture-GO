const { clone } = require('./production-drawing-data-contract');

const CONTRACT = 'category-management-view-model';
const ITEM_GROUPS = [
  ['materialItems', 'materials'],
  ['hardwareItems', 'hardware'],
  ['accessoryItems', 'accessories'],
];

function fail(message, statusCode, code, details = {}) {
  throw Object.assign(new Error(message), { statusCode, code, details });
}

function validatePurchaseList(purchaseList, projectId) {
  if (!projectId) fail('Project context is missing', 422, 'PROJECT_MISSING');
  if (!purchaseList) fail('Purchase List Result is missing', 422, 'PURCHASE_LIST_MISSING');
  if (purchaseList.contract !== 'purchase-list-result') fail('Purchase List Result contract is invalid', 422, 'INVALID_PURCHASE_LIST_CONTRACT');
  if (purchaseList.readOnly !== true) fail('Purchase List Result must be read-only', 422, 'READ_ONLY_REQUIRED');
  if (!purchaseList.project?.projectId) fail('Purchase List Result Project is missing', 422, 'PROJECT_MISSING');
  if (purchaseList.project.projectId !== projectId) fail('Purchase List Result Project does not match', 422, 'PROJECT_MISMATCH');
  if (!purchaseList.source || purchaseList.source.sourceType !== 'canonical-project-and-approved-furniture-objects' || purchaseList.source.projectId !== projectId) fail('Purchase List Result source does not match', 422, 'SOURCE_MISMATCH');
  if (purchaseList.validation?.valid === false || purchaseList.status === 'BLOCKED') fail('Purchase List Result is blocked', 422, 'PURCHASE_LIST_BLOCKED', { issues: clone(purchaseList.validation?.issues || []) });
  if (purchaseList.status !== 'Generated') fail('Purchase List Result status is unavailable', 422, 'PURCHASE_LIST_STATUS_INVALID');
  if (!Array.isArray(purchaseList.furnitureObjects)) fail('Purchase List Result Furniture Objects are invalid', 422, 'INVALID_PURCHASE_LIST_CONTRACT');
  if (!Array.isArray(purchaseList.materialItems) || !Array.isArray(purchaseList.hardwareItems) || !Array.isArray(purchaseList.accessoryItems)) fail('Purchase List Result item collections are invalid', 422, 'INVALID_PURCHASE_LIST_CONTRACT');
  return purchaseList;
}

function validateItem(item, purchaseList, projectId) {
  if (!item?.sourceObjectId) fail('Purchase item Furniture Object is missing', 422, 'FURNITURE_OBJECT_MISSING', { itemId: item?.itemId || null });
  if (!purchaseList.furnitureObjects.some((object) => object?.objectId === item.sourceObjectId)) fail('Purchase item Object does not match', 422, 'OBJECT_MISMATCH', { itemId: item.itemId, objectId: item.sourceObjectId });
  if (!item.source || item.source.projectId !== projectId || item.source.objectId !== item.sourceObjectId) fail('Purchase item source does not match', 422, 'SOURCE_MISMATCH', { itemId: item.itemId });
  if (item.validation?.valid === false) fail('Purchase item validation is invalid', 422, 'INVALID_ITEM', { itemId: item.itemId });
  if (typeof item.quantity !== 'number' || !Number.isFinite(item.quantity) || item.quantity <= 0) fail('Purchase item quantity is missing or invalid', 422, item.quantity === undefined || item.quantity === null ? 'QUANTITY_MISSING' : 'INVALID_QUANTITY', { itemId: item.itemId });
}

function groupingKey(value, unavailableCode) {
  return value === undefined || value === null || value === '' ? unavailableCode : String(value);
}

function buildGroups(items, dimension) {
  const groups = new Map();
  items.forEach((item) => {
    const category = item.category ?? null;
    const type = item.type ?? null;
    const value = dimension === 'category' ? category : type;
    const unavailable = dimension === 'category' ? 'CATEGORY_UNAVAILABLE' : 'TYPE_UNAVAILABLE';
    const key = groupingKey(value, unavailable);
    const group = groups.get(key) || { categoryId: item.categoryId ?? null, category: category, type, itemCount: 0, totalQuantity: 0, units: [], items: [], source: { sourceType: 'purchase-list-result', itemIds: [] }, validation: { valid: true, status: 'SOURCE_VALIDATED', issues: [] }, status: value === null || value === '' ? unavailable : 'AVAILABLE', readOnly: true };
    group.categoryId = group.categoryId ?? item.categoryId ?? null;
    group.itemCount += 1;
    group.totalQuantity += item.quantity;
    if (!group.units.includes(item.unit ?? null)) group.units.push(item.unit ?? null);
    group.items.push(clone(item));
    group.source.itemIds.push(item.itemId);
    groups.set(key, group);
  });
  return [...groups.values()];
}

function buildCategoryManagement(purchaseList, projectId) {
  const source = validatePurchaseList(purchaseList, projectId);
  const allItems = [];
  const breakdown = {};
  ITEM_GROUPS.forEach(([field, group]) => {
    source[field].forEach((item) => validateItem(item, source, projectId));
    breakdown[group] = { itemCount: source[field].length, totalQuantity: source[field].reduce((total, item) => total + item.quantity, 0), units: [...new Set(source[field].map((item) => item.unit ?? null))], items: clone(source[field]) };
    allItems.push(...source[field]);
  });
  const categories = buildGroups(allItems, 'category');
  const types = buildGroups(allItems, 'type');
  return { schemaVersion: 1, contract: CONTRACT, categoryManagementId: `category-management:${projectId}:${source.purchaseListId}`, project: clone(source.project), purchaseList: { purchaseListId: source.purchaseListId, status: source.status, validation: clone(source.validation), readOnly: source.readOnly }, categoryCount: categories.filter((group) => group.status === 'AVAILABLE').length, typeCount: types.filter((group) => group.status === 'AVAILABLE').length, itemCount: allItems.length, totalQuantity: allItems.reduce((total, item) => total + item.quantity, 0), categories, types, breakdown, source: { sourceType: 'purchase-list-result', projectId, purchaseListId: source.purchaseListId, itemIds: allItems.map((item) => item.itemId) }, validation: { valid: true, status: 'VALIDATED', issues: [] }, status: 'Ready', readOnly: true };
}

function filterCategoryManagement(viewModel, options = {}) {
  if (!viewModel || viewModel.contract !== CONTRACT || viewModel.readOnly !== true) fail('Category Management View Model is invalid', 422, 'INVALID_CONTRACT');
  const search = String(options.search || '').trim().toLowerCase();
  const category = String(options.category || '').trim();
  const type = String(options.type || '').trim();
  const items = viewModel.breakdown[options.group || 'materials']?.items || [];
  const filtered = items.filter((item) => (!search || `${item.name || ''} ${item.productCode || ''} ${item.itemId || ''}`.toLowerCase().includes(search)) && (!category || item.category === category) && (!type || item.type === type));
  const sort = options.sort || 'name';
  const sorted = [...filtered].sort((left, right) => String(left[sort] ?? '').localeCompare(String(right[sort] ?? ''), undefined, { numeric: true, sensitivity: 'base' }));
  return { ...clone(viewModel), filteredItems: sorted, filteredItemCount: sorted.length };
}

module.exports = { CONTRACT, buildCategoryManagement, filterCategoryManagement, validatePurchaseList };
