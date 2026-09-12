const { clone } = require('./production-drawing-data-contract');

const CONTRACT = 'board-material-list-view-model';

function fail(message, statusCode, code, details = {}) {
  throw Object.assign(new Error(message), { statusCode, code, details });
}

function validatePurchaseList(purchaseList, projectId) {
  if (!purchaseList) fail('Purchase List Result is missing', 422, 'PURCHASE_LIST_MISSING');
  if (purchaseList.contract !== 'purchase-list-result') fail('Purchase List Result contract is invalid', 422, 'INVALID_PURCHASE_LIST_CONTRACT');
  if (purchaseList.readOnly !== true) fail('Purchase List Result must be read-only', 422, 'READ_ONLY_REQUIRED');
  if (purchaseList.project?.projectId !== projectId) fail('Purchase List Result Project does not match', 422, 'PROJECT_MISMATCH');
  if (purchaseList.validation?.valid === false || purchaseList.status === 'BLOCKED') fail('Purchase List Result is blocked', 422, 'PURCHASE_LIST_BLOCKED', { issues: clone(purchaseList.validation?.issues || []) });
  if (!Array.isArray(purchaseList.furnitureObjects) || !Array.isArray(purchaseList.materialItems)) fail('Purchase List Result collections are invalid', 422, 'INVALID_PURCHASE_LIST_CONTRACT');
  return purchaseList;
}

function validateMaterialItem(item, purchaseList, projectId, objectId) {
  const materialId = item?.material?.materialId;
  if (!materialId) fail('Board Material item is missing its Material reference', 422, 'MATERIAL_REFERENCE_MISSING', { itemId: item?.itemId || null });
  const blockingIssue = ['MATERIAL_REFERENCE_MISSING', 'UNKNOWN_MATERIAL', 'QUANTITY_MISSING'].find((code) => item.validation?.issues?.some((issue) => issue.code === code));
  if (item.validation?.valid === false || blockingIssue) fail('Board Material item is invalid', 422, blockingIssue || 'SOURCE_MISMATCH', { itemId: item.itemId, materialId });
  if (typeof item.quantity !== 'number' || !Number.isFinite(item.quantity) || item.quantity <= 0) fail('Board Material item quantity is missing or invalid', 422, 'QUANTITY_MISSING', { itemId: item.itemId, materialId });
  if (!item.source || item.source.projectId !== projectId || item.source.objectId !== item.sourceObjectId || item.source.materialId !== materialId) fail('Board Material item source does not match', 422, 'SOURCE_MISMATCH', { itemId: item.itemId, materialId });
  if (objectId && item.sourceObjectId !== objectId) fail('Board Material item Object does not match', 422, 'OBJECT_MISMATCH', { itemId: item.itemId, objectId });
  if (!purchaseList.furnitureObjects.some((object) => object.objectId === item.sourceObjectId)) fail('Board Material item Object is not in the Purchase List Result', 422, 'OBJECT_MISMATCH', { itemId: item.itemId, objectId: item.sourceObjectId });
}

function buildBoardMaterialList(purchaseList, projectId, objectId = null) {
  const source = validatePurchaseList(purchaseList, projectId);
  const sourceItems = source.materialItems.filter((item) => item?.category === 'Board Materials');
  sourceItems.forEach((item) => validateMaterialItem(item, source, projectId, objectId));
  const items = sourceItems.map((item) => ({
    itemId: item.itemId,
    sourceObjectId: item.sourceObjectId,
    sourceComponentId: item.sourceComponentId || null,
    category: item.category,
    materialId: item.material.materialId,
    materialName: item.name ?? null,
    productCode: item.productCode ?? null,
    specification: item.specification ?? null,
    thickness: item.thickness ?? item.material.reference?.thickness ?? null,
    quantity: item.quantity,
    unit: item.unit ?? null,
    source: clone(item.source),
    validation: clone(item.validation || { valid: true, status: 'SOURCE_VALIDATED', issues: [] }),
  }));
  return {
    schemaVersion: 1,
    contract: CONTRACT,
    boardMaterialListId: `board-material-list:${projectId}${objectId ? `:${objectId}` : ''}:${source.purchaseListId}`,
    project: clone(source.project),
    furnitureObjects: clone(source.furnitureObjects),
    items,
    itemCount: items.length,
    source: { sourceType: 'purchase-list-result', projectId, purchaseListId: source.purchaseListId, materialItemIds: items.map((item) => item.itemId) },
    validation: { valid: true, status: 'VALIDATED', issues: [] },
    status: 'Ready',
    readOnly: true,
  };
}

function filterBoardMaterialList(viewModel, options = {}) {
  if (!viewModel || viewModel.contract !== CONTRACT || viewModel.readOnly !== true) fail('Board Material List View Model is invalid', 422, 'INVALID_CONTRACT');
  const search = String(options.search || '').trim().toLowerCase();
  const productCode = String(options.productCode || '').trim().toLowerCase();
  const materialId = options.materialId ? String(options.materialId) : '';
  const thickness = options.thickness === undefined || options.thickness === '' ? '' : String(options.thickness);
  const items = viewModel.items.filter((item) => {
    const text = `${item.materialName || ''} ${item.materialId || ''} ${item.specification || ''}`.toLowerCase();
    return (!search || text.includes(search)) && (!productCode || String(item.productCode || '').toLowerCase().includes(productCode)) && (!materialId || item.materialId === materialId) && (!thickness || String(item.thickness ?? '') === thickness);
  });
  const sort = options.sort || 'materialName';
  const sorted = [...items].sort((left, right) => String(left[sort] ?? '').localeCompare(String(right[sort] ?? ''), undefined, { numeric: true, sensitivity: 'base' }));
  return { ...clone(viewModel), items: sorted, itemCount: sorted.length };
}

module.exports = { CONTRACT, buildBoardMaterialList, filterBoardMaterialList, validatePurchaseList };
