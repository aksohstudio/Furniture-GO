const assert = require('node:assert/strict');
const fs = require('node:fs');
const { preparePurchaseListPrint } = require('../src/services/purchase-list-print-service');

const projectId = 'project-purchase-1';
const objectId = 'object-purchase-1';
const purchaseListId = `purchase-list:${projectId}`;
const item = { itemId: 'item-1', sourceObjectId: objectId, name: 'Sample Item', category: 'Sample Category', type: 'Sample Type', quantity: 4, unit: 'pcs', source: { projectId, objectId }, validation: { valid: true, status: 'REFERENCE_VALIDATED', issues: [] } };
const source = { contract: 'purchase-list-result', purchaseListId, project: { projectId, name: 'Print Project' }, furnitureObjects: [{ objectId, name: 'Cabinet', objectType: 'Base Cabinet' }], materialItems: [item], hardwareItems: [{ ...item, itemId: 'item-2', hardware: { hardwareId: 'HW-1' }, source: { projectId, objectId, hardwareId: 'HW-1' } }], accessoryItems: [{ ...item, itemId: 'item-3', accessory: { accessoryId: 'ACC-1' }, source: { projectId, objectId, accessoryId: 'ACC-1' } }], source: { sourceType: 'canonical-project-and-approved-furniture-objects', projectId }, validation: { valid: true, status: 'VALIDATED', issues: [] }, status: 'Generated', readOnly: true };
const model = (contract, items) => ({ contract, project: { projectId }, items, source: { sourceType: 'purchase-list-result', projectId, purchaseListId }, validation: { valid: true, status: 'VALIDATED', issues: [] }, status: 'Ready', readOnly: true });
const board = model('board-material-list-view-model', [{ ...item, materialId: 'MAT-1', material: { materialId: 'MAT-1' } }]);
const hardware = model('hardware-list-view-model', [{ ...item, hardwareId: 'HW-1' }]);
const accessories = model('accessories-list-view-model', [{ ...item, accessoryId: 'ACC-1' }]);
const purchaseSummary = model('purchase-summary-view-model', []);
const categoryManagement = model('category-management-view-model', []);

const snapshot = JSON.stringify(source);
const printModel = preparePurchaseListPrint({ purchaseList: source, boardMaterialList: board, hardwareList: hardware, accessoriesList: accessories, purchaseSummary, categoryManagement }, projectId);
assert.equal(printModel.contract, 'purchase-list-print-model');
assert.equal(printModel.status, 'Print Ready');
assert.equal(printModel.readOnly, true);
assert.equal(printModel.project.projectId, projectId);
assert.equal(printModel.furnitureObjects[0].objectId, objectId);
assert.equal(printModel.materialItems[0].quantity, 4);
assert.equal(printModel.hardwareItems[0].quantity, 4);
assert.equal(printModel.accessoryItems[0].quantity, 4);
assert.equal(printModel.source.purchaseListId, purchaseListId);
assert.equal(printModel.validation.status, 'PRINT_READY');
assert.equal(JSON.stringify(source), snapshot, 'Purchase List Result remains immutable');

for (const [label, input, project, code] of [
  ['missing purchase list', {}, projectId, 'PURCHASE_LIST_MISSING'],
  ['invalid project', { purchaseList: source, boardMaterialList: board, hardwareList: hardware, accessoriesList: accessories, purchaseSummary, categoryManagement }, '', 'PROJECT_MISSING'],
  ['project mismatch', { purchaseList: { ...source, project: { projectId: 'other' } }, boardMaterialList: board, hardwareList: hardware, accessoriesList: accessories, purchaseSummary, categoryManagement }, projectId, 'PROJECT_MISMATCH'],
  ['invalid contract', { purchaseList: { ...source, contract: 'wrong' }, boardMaterialList: board, hardwareList: hardware, accessoriesList: accessories, purchaseSummary, categoryManagement }, projectId, 'INVALID_PURCHASE_LIST_CONTRACT'],
  ['source mismatch', { purchaseList: { ...source, source: { ...source.source, projectId: 'other' } }, boardMaterialList: board, hardwareList: hardware, accessoriesList: accessories, purchaseSummary, categoryManagement }, projectId, 'SOURCE_MISMATCH'],
  ['blocked purchase list', { purchaseList: { ...source, status: 'BLOCKED', validation: { valid: false, issues: [{ code: 'INVALID_QUANTITY' }] } }, boardMaterialList: board, hardwareList: hardware, accessoriesList: accessories, purchaseSummary, categoryManagement }, projectId, 'PURCHASE_LIST_BLOCKED'],
  ['read only false', { purchaseList: { ...source, readOnly: false }, boardMaterialList: board, hardwareList: hardware, accessoriesList: accessories, purchaseSummary, categoryManagement }, projectId, 'READ_ONLY_REQUIRED'],
  ['missing board model', { purchaseList: source, hardwareList: hardware, accessoriesList: accessories, purchaseSummary, categoryManagement }, projectId, 'VIEW_MODEL_MISSING'],
  ['invalid view model', { purchaseList: source, boardMaterialList: { ...board, contract: 'wrong' }, hardwareList: hardware, accessoriesList: accessories, purchaseSummary, categoryManagement }, projectId, 'INVALID_VIEW_MODEL_CONTRACT'],
  ['object mismatch', { purchaseList: source, boardMaterialList: { ...board, items: [{ ...board.items[0], sourceObjectId: 'other' }] }, hardwareList: hardware, accessoriesList: accessories, purchaseSummary, categoryManagement }, projectId, 'OBJECT_MISMATCH'],
  ['missing quantity', { purchaseList: source, boardMaterialList: { ...board, items: [{ ...board.items[0], quantity: undefined }] }, hardwareList: hardware, accessoriesList: accessories, purchaseSummary, categoryManagement }, projectId, 'QUANTITY_MISSING'],
  ['invalid quantity', { purchaseList: source, boardMaterialList: { ...board, items: [{ ...board.items[0], quantity: 0 }] }, hardwareList: hardware, accessoriesList: accessories, purchaseSummary, categoryManagement }, projectId, 'INVALID_QUANTITY'],
]) assert.throws(() => preparePurchaseListPrint(input, project), (error) => error.code === code, label);

const serviceSource = fs.readFileSync(require.resolve('../src/services/purchase-list-print-service'), 'utf8');
assert.match(serviceSource, /purchase-list-result/);
assert.match(serviceSource, /readOnly: true/);
assert.doesNotMatch(serviceSource, /generatePurchaseList|supplier|inventory|erp|purchaseOrder|quotation|accounting|cloud|aiPurchasing|calculate|multiplier|waste|optimization|PDF|Excel|Reports|server.?side|remote/i);
console.log('Sprint 09 Task 08 tests passed: print model, validation, project/object isolation, canonical source, print content fields, read-only, immutability and scope boundaries.');
