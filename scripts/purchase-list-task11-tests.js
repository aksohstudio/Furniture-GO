const assert = require('node:assert/strict');
const fs = require('node:fs');
const { buildPurchaseReports } = require('../src/services/purchase-report-service');

const projectId = 'project-report-1';
const objectId = 'object-report-1';
const purchaseListId = 'purchase-list-report-1';
const baseItem = (itemId, extra = {}) => ({ itemId, sourceObjectId: objectId, name: itemId, productCode: `${itemId}-CODE`, specification: 'Declared specification', quantity: 2, unit: 'pcs', source: { sourceType: 'purchase-list-result', projectId, objectId }, validation: { valid: true, status: 'SOURCE_VALIDATED', issues: [] }, ...extra });
const purchaseList = {
  schemaVersion: 1,
  contract: 'purchase-list-result',
  purchaseListId,
  project: { projectId, name: 'Report Project' },
  furnitureObjects: [{ objectId, name: 'Cabinet' }],
  materialItems: [baseItem('MAT-1', { material: { materialId: 'MAT-1' }, category: 'Board Materials' })],
  hardwareItems: [baseItem('HW-1', { hardware: { hardwareId: 'HW-1' }, category: 'Fastener', type: 'Connector' })],
  accessoryItems: [baseItem('ACC-1', { accessoryId: 'ACC-1', category: 'Accessory', type: 'Handle' })],
  source: { sourceType: 'canonical-project-and-approved-furniture-objects', projectId },
  validation: { valid: true, status: 'VALIDATED', issues: [] },
  status: 'Generated',
  readOnly: true,
};
const vm = (contract, items) => ({ contract, project: purchaseList.project, purchaseList: { purchaseListId, status: 'Generated' }, items, source: { sourceType: 'purchase-list-result', projectId, purchaseListId }, validation: { valid: true, status: 'VALIDATED', issues: [] }, status: 'Ready', readOnly: true });
const input = { purchaseListResult: purchaseList, boardMaterialList: vm('board-material-list-view-model', purchaseList.materialItems), hardwareList: vm('hardware-list-view-model', purchaseList.hardwareItems), accessoriesList: vm('accessories-list-view-model', purchaseList.accessoryItems), purchaseSummary: { ...vm('purchase-summary-view-model', []), totalItemCount: 3, materialItemCount: 1, hardwareItemCount: 1, accessoryItemCount: 1, quantitySummary: { materials: [{ unit: 'pcs', quantity: 2, itemCount: 1 }], hardware: [{ unit: 'pcs', quantity: 2, itemCount: 1 }], accessories: [{ unit: 'pcs', quantity: 2, itemCount: 1 }] }, categorySummary: { materials: [], hardware: [], accessories: [] } }, categoryManagement: { ...vm('category-management-view-model', []), categoryCount: 3, typeCount: 1 } };

const report = buildPurchaseReports(input, projectId);
assert.equal(report.contract, 'purchase-report-result');
assert.equal(report.reportId, `purchase-report:${projectId}:${purchaseListId}`);
assert.equal(report.status, 'Report Ready');
assert.equal(report.readOnly, true);
assert.equal(report.project.projectId, projectId);
assert.equal(report.furnitureObjects[0].objectId, objectId);
assert.equal(report.purchaseList.purchaseListId, purchaseListId);
assert.equal(report.materialReport.reportType, 'board-material-report');
assert.equal(report.hardwareReport.reportType, 'hardware-report');
assert.equal(report.accessoryReport.reportType, 'accessories-report');
assert.equal(report.summary.reportType, 'purchase-summary-report');
assert.equal(report.categoryReport.reportType, 'category-report');
assert.equal(report.materialReport.items[0].productCode, 'MAT-1-CODE');
assert.equal(report.hardwareReport.items[0].specification, 'Declared specification');
assert.equal(report.hardwareReport.items[0].type, 'Connector');
assert.equal(report.hardwareReport.items[0].quantity, 2);
assert.equal(report.source.sourceType, 'purchase-list-result-and-view-models');
assert.deepEqual(report.source.hardwareItemIds, ['HW-1']);

function expectCode(mutator, code) {
  const candidate = structuredClone(input);
  mutator(candidate);
  assert.throws(() => buildPurchaseReports(candidate, projectId), (error) => error.code === code, code);
}

expectCode((value) => { value.purchaseListResult = null; }, 'PURCHASE_LIST_MISSING');
expectCode((value) => { value.purchaseListResult.contract = 'other'; }, 'INVALID_PURCHASE_LIST_CONTRACT');
expectCode((value) => { value.purchaseListResult.project.projectId = 'other'; }, 'PROJECT_MISMATCH');
expectCode((value) => { value.purchaseListResult.materialItems[0].sourceObjectId = undefined; }, 'FURNITURE_OBJECT_MISSING');
expectCode((value) => { value.purchaseListResult.materialItems[0].sourceObjectId = 'other'; }, 'OBJECT_MISMATCH');
expectCode((value) => { value.purchaseListResult.source.projectId = 'other'; }, 'SOURCE_MISMATCH');
expectCode((value) => { value.purchaseListResult.status = 'BLOCKED'; }, 'PURCHASE_LIST_BLOCKED');
expectCode((value) => { value.purchaseListResult.readOnly = false; }, 'READ_ONLY_REQUIRED');
expectCode((value) => { value.hardwareList = null; }, 'VIEW_MODEL_MISSING');
expectCode((value) => { value.hardwareList.contract = 'invalid'; }, 'INVALID_VIEW_MODEL_CONTRACT');
expectCode((value) => { value.categoryManagement.readOnly = false; }, 'READ_ONLY_REQUIRED');
expectCode((value) => { value.purchaseListResult.accessoryItems[0].quantity = undefined; }, 'QUANTITY_MISSING');
expectCode((value) => { value.purchaseListResult.hardwareItems[0].quantity = 0; }, 'INVALID_QUANTITY');
expectCode((value) => { value.purchaseSummary.source.projectId = 'other'; }, 'SOURCE_MISMATCH');

const sourceSnapshot = structuredClone(input.purchaseListResult);
const inputSnapshot = structuredClone(input);
const resultSnapshot = structuredClone(report);
assert.deepEqual(input.purchaseListResult, sourceSnapshot, 'Purchase List input is not mutated');
report.materialReport.items[0].quantity = 999;
assert.deepEqual(input, inputSnapshot, 'Report mutation must not mutate input View Models or Purchase Result');
assert.notDeepEqual(report, resultSnapshot, 'Report is an independent snapshot');

const serviceSource = fs.readFileSync(require.resolve('../src/services/purchase-report-service'), 'utf8');
assert.match(serviceSource, /purchase-list-result/);
assert.doesNotMatch(serviceSource, /supplier|inventory|erp|purchase.?order|quotation|accounting/i);
assert.doesNotMatch(serviceSource, /multiplier|waste|MOQ|price|cost|recalculate|inference/i);
const workspaceSource = fs.readFileSync(require.resolve('../src/components/PurchaseListWorkspace.js'), 'utf8');
assert.match(workspaceSource, /buildPurchaseReports/);
assert.match(workspaceSource, /Report unavailable/);
assert.doesNotMatch(workspaceSource, /Task 12.*(enabled|implemented)/i);

console.log('Sprint 09 Task 11 Purchase Reports tests: PASS');
