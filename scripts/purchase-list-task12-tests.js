const assert = require('node:assert/strict');
const fs = require('node:fs');
const { buildBoardMaterialList } = require('../src/services/board-material-list-service');
const { buildHardwareList } = require('../src/services/hardware-list-service');
const { buildAccessoriesList } = require('../src/services/accessories-list-service');
const { buildPurchaseSummary } = require('../src/services/purchase-summary-service');
const { buildCategoryManagement } = require('../src/services/category-management-service');
const { preparePurchaseListPrint } = require('../src/services/purchase-list-print-service');
const { exportPurchaseListPdf } = require('../src/services/purchase-list-pdf-service');
const { exportPurchaseListExcel } = require('../src/services/purchase-list-excel-service');
const { buildPurchaseReports } = require('../src/services/purchase-report-service');

const projectId = 'workflow-project-1';
const objectId = 'workflow-object-1';
const item = (itemId, extra = {}) => ({ itemId, sourceObjectId: objectId, sourceComponentId: `${itemId}-component`, name: itemId, productCode: `${itemId}-CODE`, specification: `${itemId} specification`, quantity: 2, unit: 'pcs', source: { sourceType: 'purchase-list-result', projectId, objectId }, validation: { valid: true, status: 'SOURCE_VALIDATED', issues: [] }, ...extra });
const purchaseList = {
  schemaVersion: 1,
  contract: 'purchase-list-result',
  purchaseListId: 'workflow-purchase-list-1',
  project: { projectId, name: 'Workflow Project' },
  furnitureObjects: [{ objectId, name: 'Approved Cabinet', productionStatus: 'Production Ready', lifecycleStatus: 'Active' }],
  materialItems: [item('MAT-1', { category: 'Board Materials', material: { materialId: 'MAT-1', reference: { thickness: 18 } }, thickness: 18, source: { sourceType: 'purchase-list-result', projectId, objectId, materialId: 'MAT-1' } })],
  hardwareItems: [item('HW-1', { hardware: { hardwareId: 'HW-1' }, type: 'Connector', category: 'Hardware', source: { sourceType: 'purchase-list-result', projectId, objectId, hardwareId: 'HW-1' } })],
  accessoryItems: [item('ACC-1', { accessoryId: 'ACC-1', type: 'Handle', category: 'Accessories', source: { sourceType: 'purchase-list-result', projectId, objectId, accessoryId: 'ACC-1' } })],
  source: { sourceType: 'canonical-project-and-approved-furniture-objects', projectId },
  validation: { valid: true, status: 'VALIDATED', issues: [] },
  status: 'Generated',
  readOnly: true,
};

const before = structuredClone(purchaseList);
const boardMaterialList = buildBoardMaterialList(purchaseList, projectId);
const hardwareList = buildHardwareList(purchaseList, projectId);
const accessoriesList = buildAccessoriesList(purchaseList, projectId);
const purchaseSummary = buildPurchaseSummary(purchaseList, projectId);
const categoryManagement = buildCategoryManagement(purchaseList, projectId);
const printModel = preparePurchaseListPrint({ purchaseList, boardMaterialList, hardwareList, accessoriesList, purchaseSummary, categoryManagement }, projectId);
const pdf = exportPurchaseListPdf(printModel, projectId);
const excel = exportPurchaseListExcel({ purchaseListResult: purchaseList, boardMaterialList, hardwareList, accessoriesList, purchaseSummary, categoryManagement }, projectId);
const reports = buildPurchaseReports({ purchaseListResult: purchaseList, boardMaterialList, hardwareList, accessoriesList, purchaseSummary, categoryManagement }, projectId);

assert.equal(boardMaterialList.contract, 'board-material-list-view-model');
assert.equal(hardwareList.contract, 'hardware-list-view-model');
assert.equal(accessoriesList.contract, 'accessories-list-view-model');
assert.equal(purchaseSummary.contract, 'purchase-summary-view-model');
assert.equal(categoryManagement.contract, 'category-management-view-model');
assert.equal(printModel.contract, 'purchase-list-print-model');
assert.equal(pdf.contract, 'purchase-list-pdf-result');
assert.equal(excel.contract, 'purchase-list-excel-result');
assert.equal(reports.contract, 'purchase-report-result');
assert.equal(reports.project.projectId, projectId);
assert.equal(reports.furnitureObjects[0].objectId, objectId);
assert.equal(reports.purchaseList.purchaseListId, purchaseList.purchaseListId);
assert.deepEqual([boardMaterialList.items[0].quantity, hardwareList.items[0].quantity, accessoriesList.items[0].quantity], [2, 2, 2]);
assert.equal(purchaseSummary.totalItemCount, 3);
assert.equal(categoryManagement.breakdown.materials.itemCount, 1);
assert.match(pdf.buffer.toString('latin1', 0, 5), /^%PDF-/);
assert.match(pdf.buffer.toString('latin1'), /%%EOF/);
assert.match(pdf.buffer.toString('latin1'), /xref/);
assert.ok(excel.buffer.length > 100);
assert.equal(boardMaterialList.readOnly && hardwareList.readOnly && accessoriesList.readOnly && purchaseSummary.readOnly && categoryManagement.readOnly && printModel.readOnly && pdf.readOnly && excel.readOnly && reports.readOnly, true);
assert.deepEqual(purchaseList, before, 'Full workflow does not mutate Purchase List Result');

function expectCode(mutator, code, source = purchaseList) {
  const candidate = structuredClone(source);
  mutator(candidate);
  assert.throws(() => buildPurchaseReports({ purchaseListResult: candidate, boardMaterialList: buildBoardMaterialList(candidate, projectId), hardwareList: buildHardwareList(candidate, projectId), accessoriesList: buildAccessoriesList(candidate, projectId), purchaseSummary: buildPurchaseSummary(candidate, projectId), categoryManagement: buildCategoryManagement(candidate, projectId) }, projectId), (error) => error.code === code, code);
}

assert.throws(() => buildPurchaseReports(null, projectId), (error) => error.code === 'PURCHASE_LIST_MISSING');
assert.throws(() => buildPurchaseReports({ purchaseListResult: { ...purchaseList, contract: 'invalid' } }, projectId), (error) => error.code === 'INVALID_PURCHASE_LIST_CONTRACT');
assert.throws(() => buildPurchaseReports({ purchaseListResult: purchaseList }, 'other-project'), (error) => error.code === 'PROJECT_MISMATCH');
expectCode((value) => { value.status = 'BLOCKED'; }, 'PURCHASE_LIST_BLOCKED');
expectCode((value) => { value.readOnly = false; }, 'READ_ONLY_REQUIRED');
expectCode((value) => { value.materialItems[0].quantity = undefined; }, 'QUANTITY_MISSING');
expectCode((value) => { value.hardwareItems[0].quantity = 0; }, 'INVALID_QUANTITY');
expectCode((value) => { value.accessoryItems[0].source.objectId = 'other-object'; }, 'SOURCE_MISMATCH');
expectCode((value) => { value.accessoryItems[0].sourceObjectId = 'other-object'; value.accessoryItems[0].source.objectId = 'other-object'; }, 'OBJECT_MISMATCH');

const workspace = fs.readFileSync(require.resolve('../src/components/PurchaseListWorkspace.js'), 'utf8');
const server = fs.readFileSync(require.resolve('../server.js'), 'utf8');
const reportService = fs.readFileSync(require.resolve('../src/services/purchase-report-service.js'), 'utf8');
assert.match(workspace, /Purchase Reports/);
assert.match(workspace, /buildPurchaseReports/);
assert.match(server, /purchase-list.*reports/);
assert.match(server, /buildPurchaseReports/);
assert.doesNotMatch(reportService, /supplier|inventory|erp|purchase.?order|quotation|accounting/i);
assert.doesNotMatch(reportService, /multiplier|waste|MOQ|price|cost|recalculate|inference/i);
assert.doesNotMatch(server, /purchase-list.*reports.*(?:PUT|PATCH|DELETE)/i);
assert.doesNotMatch(workspace, /Task 12.*(?:enabled|implemented)/i);

console.log('Sprint 09 Task 12 workflow verification: PASS WITH LIMITATIONS (browser instance unavailable; npm test harness remains blocked)');
