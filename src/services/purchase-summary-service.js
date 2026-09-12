const { clone } = require('./production-drawing-data-contract');

const CONTRACT = 'purchase-summary-view-model';
const ITEM_GROUPS = [
  ['materialItems', 'material'],
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
  if (purchaseList.furnitureObjects.some((object) => !object?.objectId)) fail('Purchase List Result Furniture Object is missing', 422, 'FURNITURE_OBJECT_MISSING');
  if (!Array.isArray(purchaseList.materialItems) || !Array.isArray(purchaseList.hardwareItems) || !Array.isArray(purchaseList.accessoryItems)) fail('Purchase List Result item collections are invalid', 422, 'INVALID_PURCHASE_LIST_CONTRACT');
  return purchaseList;
}

function validateItem(item, purchaseList, projectId, group) {
  if (!item?.sourceObjectId) fail(`${group} item Furniture Object is missing`, 422, 'FURNITURE_OBJECT_MISSING', { itemId: item?.itemId || null });
  if (!purchaseList.furnitureObjects.some((object) => object.objectId === item.sourceObjectId)) fail(`${group} item Object does not match`, 422, 'OBJECT_MISMATCH', { itemId: item.itemId, objectId: item.sourceObjectId });
  if (!item.source || item.source.projectId !== projectId || item.source.objectId !== item.sourceObjectId) fail(`${group} item source does not match`, 422, 'SOURCE_MISMATCH', { itemId: item.itemId });
  if (group === 'material' && item.source.materialId !== item.material?.materialId) fail('Material item source does not match', 422, 'SOURCE_MISMATCH', { itemId: item.itemId });
  if (group === 'hardware' && item.source.hardwareId !== item.hardware?.hardwareId) fail('Hardware item source does not match', 422, 'SOURCE_MISMATCH', { itemId: item.itemId });
  if (group === 'accessories' && item.source.accessoryId !== (item.accessory?.accessoryId || item.accessoryId || item.sourceReference?.accessoryId || item.accessory?.itemId || item.sourceReference?.itemId)) fail('Accessory item source does not match', 422, 'SOURCE_MISMATCH', { itemId: item.itemId });
  if (item.validation?.valid === false) fail(`${group} item validation is invalid`, 422, 'INVALID_ITEM', { itemId: item.itemId });
  if (typeof item.quantity !== 'number' || !Number.isFinite(item.quantity) || item.quantity <= 0) fail(`${group} item quantity is missing or invalid`, 422, item.quantity === undefined || item.quantity === null ? 'QUANTITY_MISSING' : 'INVALID_QUANTITY', { itemId: item.itemId });
}

function categoryOf(item) {
  return item?.category ?? item?.type ?? null;
}

function summarizeItems(items) {
  const byUnit = new Map();
  const byCategory = new Map();
  items.forEach((item) => {
    const unitKey = item.unit ?? null;
    const unitSummary = byUnit.get(unitKey) || { unit: unitKey, quantity: 0, itemCount: 0 };
    unitSummary.quantity += item.quantity;
    unitSummary.itemCount += 1;
    byUnit.set(unitKey, unitSummary);
    const categoryKey = categoryOf(item);
    if (categoryKey !== null && categoryKey !== undefined) {
      const categorySummary = byCategory.get(categoryKey) || { category: categoryKey, itemCount: 0, quantity: 0 };
      categorySummary.itemCount += 1;
      categorySummary.quantity += item.quantity;
      byCategory.set(categoryKey, categorySummary);
    }
  });
  return { itemCount: items.length, quantity: [...byUnit.values()], categories: [...byCategory.values()] };
}

function buildPurchaseSummary(purchaseList, projectId) {
  const source = validatePurchaseList(purchaseList, projectId);
  const groups = {};
  ITEM_GROUPS.forEach(([field, group]) => {
    source[field].forEach((item) => validateItem(item, source, projectId, group));
    groups[group] = summarizeItems(source[field]);
  });
  const totalItemCount = groups.material.itemCount + groups.hardware.itemCount + groups.accessories.itemCount;
  return {
    schemaVersion: 1,
    contract: CONTRACT,
    purchaseSummaryId: `purchase-summary:${projectId}:${source.purchaseListId}`,
    project: clone(source.project),
    purchaseList: { purchaseListId: source.purchaseListId, status: source.status, validation: clone(source.validation), readOnly: source.readOnly },
    furnitureObjectCount: source.furnitureObjects.length,
    materialItemCount: groups.material.itemCount,
    hardwareItemCount: groups.hardware.itemCount,
    accessoryItemCount: groups.accessories.itemCount,
    totalItemCount,
    quantitySummary: { materials: groups.material.quantity, hardware: groups.hardware.quantity, accessories: groups.accessories.quantity },
    categorySummary: { materials: groups.material.categories, hardware: groups.hardware.categories, accessories: groups.accessories.categories },
    unitSummary: { materials: groups.material.quantity, hardware: groups.hardware.quantity, accessories: groups.accessories.quantity },
    blocking: { blocked: false, issues: [] },
    source: { sourceType: 'purchase-list-result', projectId, purchaseListId: source.purchaseListId, itemIds: [...source.materialItems, ...source.hardwareItems, ...source.accessoryItems].map((item) => item.itemId) },
    validation: { valid: true, status: 'VALIDATED', issues: [] },
    status: 'Ready',
    readOnly: true,
  };
}

module.exports = { CONTRACT, buildPurchaseSummary, validatePurchaseList };
