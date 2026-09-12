const { clone } = require('./production-drawing-data-contract');

const CONTRACT = 'purchase-list-print-model';

function fail(message, statusCode, code, details = {}) {
  throw Object.assign(new Error(message), { statusCode, code, details });
}

function validateSource(purchaseList, projectId) {
  if (!projectId) fail('Project context is missing', 422, 'PROJECT_MISSING');
  if (!purchaseList) fail('Purchase List has not been generated', 422, 'PURCHASE_LIST_MISSING');
  if (purchaseList.contract !== 'purchase-list-result') fail('Purchase List Result contract is invalid', 422, 'INVALID_PURCHASE_LIST_CONTRACT');
  if (purchaseList.readOnly !== true) fail('Purchase List Result must be read-only', 422, 'READ_ONLY_REQUIRED');
  if (!purchaseList.project?.projectId) fail('Purchase List Result Project is missing', 422, 'PROJECT_MISSING');
  if (purchaseList.project.projectId !== projectId) fail('Purchase List Result Project does not match', 422, 'PROJECT_MISMATCH');
  if (!purchaseList.source || purchaseList.source.projectId !== projectId) fail('Purchase List Result source does not match', 422, 'SOURCE_MISMATCH');
  if (purchaseList.status === 'BLOCKED' || purchaseList.validation?.valid === false) fail('Purchase List Result is blocked', 422, 'PURCHASE_LIST_BLOCKED', { issues: clone(purchaseList.validation?.issues || []) });
  if (purchaseList.status !== 'Generated') fail('Purchase List Result status is unavailable', 422, 'PURCHASE_LIST_STATUS_INVALID');
  if (!Array.isArray(purchaseList.furnitureObjects) || !Array.isArray(purchaseList.materialItems) || !Array.isArray(purchaseList.hardwareItems) || !Array.isArray(purchaseList.accessoryItems)) fail('Purchase List Result collections are invalid', 422, 'INVALID_PURCHASE_LIST_CONTRACT');
  return purchaseList;
}

function validateViewModel(model, contract, projectId, purchaseListId, objects, label) {
  if (!model) fail(`${label} View Model is missing`, 422, 'VIEW_MODEL_MISSING');
  if (model.contract !== contract) fail(`${label} View Model contract is invalid`, 422, 'INVALID_VIEW_MODEL_CONTRACT');
  if (model.readOnly !== true) fail(`${label} View Model must be read-only`, 422, 'READ_ONLY_REQUIRED');
  if (model.project?.projectId !== projectId || model.source?.projectId !== projectId || model.source?.purchaseListId !== purchaseListId) fail(`${label} View Model source does not match`, 422, 'SOURCE_MISMATCH');
  if (model.validation?.valid === false || model.status === 'BLOCKED') fail(`${label} View Model is invalid`, 422, 'INVALID_ITEM', { issues: clone(model.validation?.issues || []) });
  if (Array.isArray(model.furnitureObjects) && model.furnitureObjects.some((object) => !objects.some((sourceObject) => sourceObject.objectId === object?.objectId))) fail(`${label} Furniture Object does not match`, 422, 'OBJECT_MISMATCH');
  return model;
}

function validateItems(model, key, objects, label) {
  const items = Array.isArray(model[key]) ? model[key] : Array.isArray(model.items) ? model.items : [];
  items.forEach((item) => {
    if (!item.sourceObjectId || !objects.some((object) => object.objectId === item.sourceObjectId)) fail(`${label} Object does not match`, 422, 'OBJECT_MISMATCH', { itemId: item.itemId });
    if (item.validation?.valid === false) fail(`${label} contains an invalid item`, 422, 'INVALID_ITEM', { itemId: item.itemId });
    if (typeof item.quantity !== 'number' || !Number.isFinite(item.quantity) || item.quantity <= 0) fail(`${label} contains an invalid quantity`, 422, item.quantity === undefined || item.quantity === null ? 'QUANTITY_MISSING' : 'INVALID_QUANTITY', { itemId: item.itemId });
  });
  return items;
}

function preparePurchaseListPrint({ purchaseList, boardMaterialList, hardwareList, accessoriesList, purchaseSummary, categoryManagement }, projectId) {
  const source = validateSource(purchaseList, projectId);
  const board = validateViewModel(boardMaterialList, 'board-material-list-view-model', projectId, source.purchaseListId, source.furnitureObjects, 'Board Material');
  const hardware = validateViewModel(hardwareList, 'hardware-list-view-model', projectId, source.purchaseListId, source.furnitureObjects, 'Hardware');
  const accessories = validateViewModel(accessoriesList, 'accessories-list-view-model', projectId, source.purchaseListId, source.furnitureObjects, 'Accessories');
  const summary = validateViewModel(purchaseSummary, 'purchase-summary-view-model', projectId, source.purchaseListId, source.furnitureObjects, 'Purchase Summary');
  const categories = validateViewModel(categoryManagement, 'category-management-view-model', projectId, source.purchaseListId, source.furnitureObjects, 'Category Management');
  const materialItems = validateItems(board, 'items', source.furnitureObjects, 'Board Material List');
  const hardwareItems = validateItems(hardware, 'items', source.furnitureObjects, 'Hardware List');
  const accessoryItems = validateItems(accessories, 'items', source.furnitureObjects, 'Accessories List');
  return { schemaVersion: 1, contract: CONTRACT, printId: `purchase-list-print:${projectId}:${source.purchaseListId}`, project: clone(source.project), furnitureObjects: clone(source.furnitureObjects), purchaseList: { purchaseListId: source.purchaseListId, status: source.status, validation: clone(source.validation), readOnly: source.readOnly }, materialItems: clone(materialItems), hardwareItems: clone(hardwareItems), accessoryItems: clone(accessoryItems), purchaseSummary: clone(summary), categorySummary: clone(categories), validation: { valid: true, status: 'PRINT_READY', issues: [] }, source: { sourceType: 'purchase-list-result-and-view-models', projectId, purchaseListId: source.purchaseListId, materialItemIds: materialItems.map((item) => item.itemId), hardwareItemIds: hardwareItems.map((item) => item.itemId), accessoryItemIds: accessoryItems.map((item) => item.itemId) }, status: 'Print Ready', readOnly: true };
}

module.exports = { CONTRACT, preparePurchaseListPrint, validateSource };
