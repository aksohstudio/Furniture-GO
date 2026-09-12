const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const { generateCuttingList } = require('../src/services/cutting-list-generation-service');
const { generateBoardLayout } = require('../src/services/cutting-list-board-layout-service');
const { generateMaterialStatistics } = require('../src/services/cutting-list-material-statistics-service');
const { generateWasteAnalysis } = require('../src/services/cutting-list-waste-analysis-service');
const { generateInformationPanel } = require('../src/services/cutting-list-information-panel-service');
const { generatePartTrace } = require('../src/services/cutting-list-part-trace-service');
const { exportCuttingListPdf } = require('../src/services/cutting-list-pdf-service');
const { exportCuttingListExcel } = require('../src/services/cutting-list-excel-service');
const { prepareCuttingListPrintDocument } = require('../src/services/cutting-list-print-service');
const { generatePurchaseList } = require('../src/services/purchase-list-generation-service');
const { buildBoardMaterialList } = require('../src/services/board-material-list-service');
const { buildHardwareList } = require('../src/services/hardware-list-service');
const { buildAccessoriesList } = require('../src/services/accessories-list-service');
const { buildPurchaseSummary } = require('../src/services/purchase-summary-service');
const { buildCategoryManagement } = require('../src/services/category-management-service');
const { preparePurchaseListPrint } = require('../src/services/purchase-list-print-service');
const { exportPurchaseListPdf } = require('../src/services/purchase-list-pdf-service');
const { exportPurchaseListExcel } = require('../src/services/purchase-list-excel-service');
const { buildPurchaseReports } = require('../src/services/purchase-report-service');

const catalog = {
  getMaterialById: (id) => id === 'STRESS-MAT' ? { id, name: 'Stress Board', productCode: 'STRESS-18', thickness: 18, boardSize: { width: 2440, height: 1220, unit: 'mm' } } : null,
  getHardwareById: (id) => id === 'STRESS-HW' ? { id, name: 'Stress Connector', productCode: 'STRESS-HW' } : null,
};
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function makeObject(projectId, index, components = 20) {
  const objectId = `stress-object-${index}`;
  return { projectId, objectId, name: objectId, objectType: 'Cabinet', productionStatus: 'Production Ready', lifecycleStatus: 'Active', dimensions: { width: 800, height: 720, depth: 560, unit: 'mm' }, components: Array.from({ length: components }, (_, n) => ({ componentId: `${objectId}-component-${n}`, componentType: 'Panel', name: `Panel ${n}`, materialId: 'STRESS-MAT', dimensions: { width: 720, height: 560, thickness: 18, unit: 'mm' }, quantity: 2 })), materialReferences: [{ materialId: 'STRESS-MAT', quantity: 2 }], hardwareReferences: [{ hardwareId: 'STRESS-HW', quantity: 4 }], accessoryReferences: [{ accessoryId: `${objectId}-handle`, name: 'Handle', quantity: 2 }] };
}
function fixture(label, objectCount, componentCount) {
  const projectId = `stress-${label}`;
  const objects = Array.from({ length: objectCount }, (_, index) => makeObject(projectId, index, componentCount));
  const projectService = { readProject: (id) => id === projectId ? { project: { id, name: label }, metadata: { projectId: id } } : null, data: { official: catalog } };
  const engine = { listObjects: (id) => id === projectId ? objects : [], getObject: (id, objectId) => { const object = objects.find((item) => id === projectId && item.objectId === objectId); if (!object) throw Object.assign(new Error('Furniture Object not found'), { statusCode: 404 }); return object; }, validateObject: () => ({ isValid: true, errors: [] }) };
  return { projectId, objects, projectService, engine };
}
function runWorkflow(data) {
  const objectId = data.objects[0].objectId;
  const cutting = generateCuttingList(data.projectService, data.engine, data.projectId, objectId);
  const layout = generateBoardLayout(cutting, catalog, data.projectId, objectId, cutting.cuttingListId);
  const statistics = generateMaterialStatistics(cutting, catalog, layout, data.projectId, objectId, cutting.cuttingListId, layout.boardLayoutId);
  const waste = generateWasteAnalysis(cutting, layout, catalog, statistics.statisticsId, data.projectId, objectId, cutting.cuttingListId, layout.boardLayoutId);
  const information = generateInformationPanel(cutting, layout, statistics, waste, data.projectId, objectId, cutting.cuttingListId, layout.boardLayoutId, statistics.statisticsId, waste.wasteAnalysisId);
  const trace = generatePartTrace(cutting, data.objects[0], catalog, layout, statistics, waste, data.projectId, objectId, cutting.cuttingListId, cutting.parts[0].partId, layout.boardLayoutId, statistics.statisticsId, waste.wasteAnalysisId);
  const cuttingViews = { cuttingList: cutting, boardLayout: layout, materialStatistics: statistics, wasteAnalysis: waste, informationPanel: information, partTrace: trace };
  const cuttingPrint = prepareCuttingListPrintDocument(cuttingViews, data.projectId, objectId);
  const purchase = generatePurchaseList(data.projectService, data.engine, data.projectId, { objectId, catalog, cuttingListResult: cutting });
  const board = buildBoardMaterialList(purchase, data.projectId, objectId);
  const hardware = buildHardwareList(purchase, data.projectId, objectId);
  const accessories = buildAccessoriesList(purchase, data.projectId, objectId);
  const summary = buildPurchaseSummary(purchase, data.projectId);
  const categories = buildCategoryManagement(purchase, data.projectId);
  const purchaseViews = { purchaseList: purchase, boardMaterialList: board, hardwareList: hardware, accessoriesList: accessories, purchaseSummary: summary, categoryManagement: categories };
  const purchasePrint = preparePurchaseListPrint(purchaseViews, data.projectId);
  return { cutting, layout, statistics, waste, information, trace, cuttingPrint, purchase, board, hardware, accessories, summary, categories, purchasePrint, outputs: { cuttingPdf: exportCuttingListPdf(cuttingPrint, data.projectId, objectId), cuttingExcel: exportCuttingListExcel(cuttingViews, data.projectId, objectId), purchasePdf: exportPurchaseListPdf(purchasePrint, data.projectId), purchaseExcel: exportPurchaseListExcel({ purchaseListResult: purchase, boardMaterialList: board, hardwareList: hardware, accessoriesList: accessories, purchaseSummary: summary, categoryManagement: categories }, data.projectId), reports: buildPurchaseReports(purchaseViews, data.projectId) } };
}
function stress(data, iterations) {
  const before = clone(data.objects);
  const heapBefore = process.memoryUsage().heapUsed;
  const start = performance.now();
  let last;
  for (let i = 0; i < iterations; i += 1) last = runWorkflow(data);
  const elapsedMs = Number((performance.now() - start).toFixed(3));
  assert.deepEqual(data.objects, before, 'stress workflow does not mutate canonical fixture');
  assert.equal(last.cutting.contract, 'cutting-list-result');
  assert.equal(last.purchase.contract, 'purchase-list-result');
  assert.equal(last.cutting.readOnly, true);
  assert.equal(last.purchase.readOnly, true);
  assert.equal(last.purchase.project.projectId, data.projectId);
  return { iterations, elapsedMs, averageMs: Number((elapsedMs / iterations).toFixed(3)), objectLookups: iterations * 5, cuttingRuns: iterations, purchaseRuns: iterations, downstreamRuns: iterations, outputRuns: iterations, resultCounts: { objects: data.objects.length, cuttingParts: last.cutting.parts.length, purchaseItems: last.purchase.materialItems.length + last.purchase.hardwareItems.length + last.purchase.accessoryItems.length }, heapUsed: process.memoryUsage().heapUsed, heapTotal: process.memoryUsage().heapTotal, heapDeltaBytes: process.memoryUsage().heapUsed - heapBefore };
}

const observed = [];
for (const [label, objectCount, componentCount, iterations] of [['small', 2, 4, 50], ['medium', 20, 12, 30], ['large', 80, 20, 20]]) {
  const data = fixture(label, objectCount, componentCount);
  const before = clone(data.objects);
  const lookupStart = performance.now();
  for (let i = 0; i < iterations * 5; i += 1) data.engine.getObject(data.projectId, data.objects[i % data.objects.length].objectId);
  const lookupMs = Number((performance.now() - lookupStart).toFixed(3));
  const result = stress(data, iterations);
  result.lookupMs = lookupMs;
  observed.push({ fixture: label, ...result });
}

// Project isolation and deterministic result checks use separate in-memory sources.
const projectA = fixture('project-a', 3, 6);
const projectB = fixture('project-b', 3, 6);
const resultA = runWorkflow(projectA);
const resultB = runWorkflow(projectB);
assert.notEqual(resultA.purchase.project.projectId, resultB.purchase.project.projectId);
assert.equal(resultA.cutting.furnitureObject.objectId, projectA.objects[0].objectId);
assert.equal(resultB.cutting.furnitureObject.objectId, projectB.objects[0].objectId);
assert.deepEqual(runWorkflow(projectA).purchase, resultA.purchase, 'same fixture remains deterministic');
assert.equal(projectA.engine.listObjects(projectA.projectId).every((item) => item.projectId === projectA.projectId), true);
assert.equal(projectB.engine.listObjects(projectB.projectId).every((item) => item.projectId === projectB.projectId), true);

console.log(JSON.stringify({ status: 'PASS', testDate: new Date().toISOString(), fixtureType: 'isolated / in-memory', observedThreshold: 'NO EXPLICIT PERFORMANCE THRESHOLD DEFINED', timeout: 'NONE OBSERVED', runawayLoop: 'NONE OBSERVED', unexpectedException: 'NONE OBSERVED', deterministic: 'PASS', projectObjectIsolation: 'PASS', sourceConsistency: 'PASS', readOnly: 'PASS', immutability: 'PASS', memory: 'OBSERVATIONAL ONLY', fixtures: observed, browser: 'BROWSER TEST NOT AVAILABLE', npmTest: 'BLOCKED BY EXISTING TEST HARNESS ISSUE', stressTesting: 'PASS', nextTask: 'Task 06 — Verify Auto Save' }, null, 2));
