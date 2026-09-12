const { clone } = require('./production-drawing-data-contract');

const CONTRACT = 'purchase-report-result';
const VIEW_MODELS = [
  ['boardMaterialList', 'board-material-list-view-model'],
  ['hardwareList', 'hardware-list-view-model'],
  ['accessoriesList', 'accessories-list-view-model'],
  ['purchaseSummary', 'purchase-summary-view-model'],
  ['categoryManagement', 'category-management-view-model'],
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
  if (!Array.isArray(purchaseList.furnitureObjects) || purchaseList.furnitureObjects.some((object) => !object?.objectId)) fail('Purchase List Result Furniture Objects are invalid', 422, 'FURNITURE_OBJECT_MISSING');
  for (const field of ['materialItems', 'hardwareItems', 'accessoryItems']) {
    if (!Array.isArray(purchaseList[field])) fail('Purchase List Result item collections are invalid', 422, 'INVALID_PURCHASE_LIST_CONTRACT');
  }
  return purchaseList;
}

function validateItem(item, purchaseList, projectId, group) {
  if (!item?.sourceObjectId) fail(`${group} item Furniture Object is missing`, 422, 'FURNITURE_OBJECT_MISSING', { itemId: item?.itemId || null });
  if (!purchaseList.furnitureObjects.some((object) => object.objectId === item.sourceObjectId)) fail(`${group} item Object does not match`, 422, 'OBJECT_MISMATCH', { itemId: item.itemId, objectId: item.sourceObjectId });
  if (!item.source || item.source.projectId !== projectId || item.source.objectId !== item.sourceObjectId) fail(`${group} item source does not match`, 422, 'SOURCE_MISMATCH', { itemId: item.itemId });
  if (item.validation?.valid === false) fail(`${group} item validation is invalid`, 422, 'INVALID_ITEM', { itemId: item.itemId });
  if (typeof item.quantity !== 'number' || !Number.isFinite(item.quantity) || item.quantity <= 0) fail(`${group} item quantity is missing or invalid`, 422, item.quantity === undefined || item.quantity === null ? 'QUANTITY_MISSING' : 'INVALID_QUANTITY', { itemId: item.itemId });
}

function validateViewModel(viewModel, contract, projectId, purchaseList) {
  if (!viewModel) fail('Purchase Report View Model is missing', 422, 'VIEW_MODEL_MISSING');
  if (viewModel.contract !== contract) fail('Purchase Report View Model contract is invalid', 422, 'INVALID_VIEW_MODEL_CONTRACT');
  if (viewModel.readOnly !== true) fail('Purchase Report View Model must be read-only', 422, 'READ_ONLY_REQUIRED');
  if (viewModel.project?.projectId !== projectId || (viewModel.purchaseList?.purchaseListId && viewModel.purchaseList.purchaseListId !== purchaseList.purchaseListId)) fail('Purchase Report View Model source does not match', 422, 'SOURCE_MISMATCH');
  if (viewModel.validation?.valid === false || viewModel.status === 'BLOCKED') fail('Purchase Report View Model is invalid', 422, 'INVALID_VIEW_MODEL');
  if (!viewModel.source || viewModel.source.projectId !== projectId || viewModel.source.purchaseListId !== purchaseList.purchaseListId) fail('Purchase Report View Model source does not match', 422, 'SOURCE_MISMATCH');
}

function buildSection(reportType, viewModel, items, projectId, purchaseListId) {
  return { reportType, items: clone(items), itemCount: items.length, source: clone(viewModel.source), validation: clone(viewModel.validation), status: 'Ready', readOnly: true, projectId, purchaseListId };
}

function buildPurchaseReports(input, projectId) {
  const purchaseList = input?.purchaseListResult || input?.purchaseList;
  const source = validatePurchaseList(purchaseList, projectId);
  const viewModels = Object.fromEntries(VIEW_MODELS.map(([key, contract]) => {
    const viewModel = input?.[key];
    validateViewModel(viewModel, contract, projectId, source);
    return [key, viewModel];
  }));
  const groups = [
    ['materialItems', 'material', viewModels.boardMaterialList],
    ['hardwareItems', 'hardware', viewModels.hardwareList],
    ['accessoryItems', 'accessories', viewModels.accessoriesList],
  ];
  groups.forEach(([field, group]) => source[field].forEach((item) => validateItem(item, source, projectId, group)));
  return {
    schemaVersion: 1,
    contract: CONTRACT,
    reportId: `purchase-report:${projectId}:${source.purchaseListId}`,
    project: clone(source.project),
    furnitureObjects: clone(source.furnitureObjects),
    purchaseList: { purchaseListId: source.purchaseListId, status: source.status, validation: clone(source.validation), readOnly: true },
    materialReport: buildSection('board-material-report', viewModels.boardMaterialList, source.materialItems, projectId, source.purchaseListId),
    hardwareReport: buildSection('hardware-report', viewModels.hardwareList, source.hardwareItems, projectId, source.purchaseListId),
    accessoryReport: buildSection('accessories-report', viewModels.accessoriesList, source.accessoryItems, projectId, source.purchaseListId),
    categoryReport: { reportType: 'category-report', ...clone(viewModels.categoryManagement) },
    summary: { reportType: 'purchase-summary-report', ...clone(viewModels.purchaseSummary) },
    source: { sourceType: 'purchase-list-result-and-view-models', projectId, purchaseListId: source.purchaseListId, materialItemIds: source.materialItems.map((item) => item.itemId), hardwareItemIds: source.hardwareItems.map((item) => item.itemId), accessoryItemIds: source.accessoryItems.map((item) => item.itemId) },
    validation: { valid: true, status: 'REPORT_VALIDATED', issues: [] },
    status: 'Report Ready',
    readOnly: true,
  };
}

module.exports = { CONTRACT, buildPurchaseReports, validatePurchaseList, validateViewModel };
