const assert = require('node:assert/strict');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

// Task 03 deliberately reuses the existing isolated full-workflow fixture.
// It verifies production sequencing without introducing persistence or new
// business calculations, and without starting the formal performance task.
execFileSync(process.execPath, ['scripts/system-integration-task09-tests.js'], {
  cwd: process.cwd(),
  stdio: 'ignore',
});

function source(file) { return fs.readFileSync(file, 'utf8'); }
const workflow = source('scripts/system-integration-task09-tests.js');
const services = [
  'src/services/production-drawing-generation-service.js',
  'src/services/production-drawing-preview-service.js',
  'src/services/production-drawing-print-service.js',
  'src/services/production-drawing-pdf-service.js',
  'src/services/production-drawing-dwg-service.js',
  'src/services/production-drawing-revision-service.js',
  'src/services/cutting-list-generation-service.js',
  'src/services/cutting-list-board-layout-service.js',
  'src/services/cutting-list-material-statistics-service.js',
  'src/services/cutting-list-waste-analysis-service.js',
  'src/services/cutting-list-information-panel-service.js',
  'src/services/cutting-list-part-trace-service.js',
  'src/services/cutting-list-print-service.js',
  'src/services/cutting-list-pdf-service.js',
  'src/services/cutting-list-excel-service.js',
  'src/services/purchase-list-generation-service.js',
  'src/services/board-material-list-service.js',
  'src/services/hardware-list-service.js',
  'src/services/accessories-list-service.js',
  'src/services/purchase-summary-service.js',
  'src/services/category-management-service.js',
  'src/services/purchase-list-print-service.js',
  'src/services/purchase-list-pdf-service.js',
  'src/services/purchase-list-excel-service.js',
  'src/services/purchase-report-service.js',
].map(source).join('\n');

for (const term of [
  'ProductionDrawingGenerationService', 'prepareDrawingPreview', 'prepareDrawingPrint',
  'exportProductionDrawingPdf', 'exportProductionDrawingDwg', 'createRevision',
  'generateCuttingList', 'generateBoardLayout', 'generateMaterialStatistics',
  'generateWasteAnalysis', 'generateInformationPanel', 'generatePartTrace',
  'prepareCuttingListPrintDocument', 'exportCuttingListPdf', 'exportCuttingListExcel',
  'generatePurchaseList', 'buildBoardMaterialList', 'buildHardwareList',
  'buildAccessoriesList', 'buildPurchaseSummary', 'buildCategoryManagement',
  'preparePurchaseListPrint', 'exportPurchaseListPdf', 'exportPurchaseListExcel',
  'buildPurchaseReports',
]) assert.match(workflow + services, new RegExp(term));

for (const contract of ['production-drawing-data', 'cutting-list-result', 'purchase-list-result']) {
  assert.match(workflow + services, new RegExp(contract));
}
for (const field of ['projectId', 'objectId', 'readOnly', 'source', 'validation']) {
  assert.match(workflow + services, new RegExp(field));
}

// Task 09 executes the full in-memory chain and checks Project A/B isolation,
// source snapshots, mismatches, invalid contracts and downstream outputs.
assert.match(workflow, /Project-to-Purchase synchronization/);
assert.match(workflow, /deepEqual\(objects, before/);
assert.match(workflow, /PROJECT_NOT_FOUND|FURNITURE_OBJECT_NOT_FOUND/);
assert.match(workflow, /CUTTING_LIST_INVALID|INVALID_PURCHASE_LIST_CONTRACT/);
assert.match(workflow, /PROJECT_MISMATCH|OBJECT_MISMATCH/);

// Existing boundaries are preserved: package DWG remains unavailable and
// revisions remain runtime-only. No integration-layer calculation/persistence
// or remote dependency is added by this task.
assert.match(services, /DWG_EXPORT_UNAVAILABLE/);
assert.match(services, /new Map\(\)/);
assert.doesNotMatch(services, /cloudApi|remoteRendering|supplierApi|erpIntegration|inventorySystem|aiAssistance/i);
assert.doesNotMatch(services, /saveFurnitureObject|storeFurnitureObject|persistFurnitureObject|createFurnitureObject/i);
assert.doesNotMatch(services, /purchaseMultiplier|wasteFactor|supplierQuantity|recalculateDimensions/i);

console.log('Sprint 11 Task 03 tests passed: complete isolated production workflow, downstream outputs, canonical contracts, source chain, isolation, read-only/immutability, error boundaries and offline sanity. Formal performance/stress testing was not started.');
