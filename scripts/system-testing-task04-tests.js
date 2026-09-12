const assert = require('node:assert/strict');
const os = require('node:os');
const { performance } = require('node:perf_hooks');
const { ProductionDrawingGenerationService } = require('../src/services/production-drawing-generation-service');
const { exportProductionDrawingPdf } = require('../src/services/production-drawing-pdf-service');
const { createRevision } = require('../src/services/production-drawing-revision-service');
const { generateCuttingList } = require('../src/services/cutting-list-generation-service');
const { generateBoardLayout } = require('../src/services/cutting-list-board-layout-service');
const { generateMaterialStatistics } = require('../src/services/cutting-list-material-statistics-service');
const { generateWasteAnalysis } = require('../src/services/cutting-list-waste-analysis-service');
const { generateInformationPanel } = require('../src/services/cutting-list-information-panel-service');
const { generatePartTrace } = require('../src/services/cutting-list-part-trace-service');
const { prepareCuttingListPrintDocument } = require('../src/services/cutting-list-print-service');
const { exportCuttingListPdf } = require('../src/services/cutting-list-pdf-service');
const { exportCuttingListExcel } = require('../src/services/cutting-list-excel-service');
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
  getMaterialById: (id) => id === 'PERF-MAT' ? { id, name: 'Performance Board', productCode: 'PERF-18', thickness: 18, boardSize: { width: 2440, height: 1220, unit: 'mm' } } : null,
  getHardwareById: (id) => id === 'PERF-HW' ? { id, name: 'Performance Connector', productCode: 'PERF-HW', specification: 'Connector' } : id === 'ENG-HW-BLUM-TANDEM-560H' ? { id, model: 'TANDEM 560H', officialName: 'Blum TANDEM 560H' } : null,
  listEngineeringRecords: () => [
    { id: 'ENG-RULE-BLUM-TANDEM-560H-INTERNAL-WIDTH', engineeringRecordId: 'ENG-HW-BLUM-TANDEM-560H', verificationStatus: 'verified-official', source: 'Blum TANDEM catalogue', sourceUrl: 'local-fixture' },
    { id: 'ENG-RULE-BLUM-TANDEM-560H-DRAWER-LENGTH', engineeringRecordId: 'ENG-HW-BLUM-TANDEM-560H', verificationStatus: 'verified-official', source: 'Blum TANDEM planning data', sourceUrl: 'local-fixture' },
  ],
};
function makeObject(projectId, index, componentCount) {
  const objectId = `performance-object-${index}`;
  const components = Array.from({ length: componentCount }, (_, partIndex) => ({
    componentId: `${objectId}-component-${partIndex}`, componentType: 'Panel', name: `Panel ${partIndex}`,
    materialId: 'PERF-MAT', dimensions: { width: 720, height: 560, depth: 18, thickness: 18, unit: 'mm' }, quantity: 2,
  }));
  components.push({ componentId: `${objectId}-door`, componentType: 'Door', name: 'Door', materialId: 'PERF-MAT', dimensions: { width: 400, height: 600, thickness: 18, unit: 'mm' }, quantity: 1 });
  components.push({ componentId: `${objectId}-drawer`, componentType: 'Drawer', name: 'Drawer', materialId: 'PERF-MAT', hardwareReferences: [{ hardwareId: 'ENG-HW-BLUM-TANDEM-560H', quantity: 1 }], dimensions: { width: 350, height: 120, depth: 450, thickness: 18, unit: 'mm' }, quantity: 1 });
  return { projectId, objectId, name: objectId, objectType: 'Cabinet', productionStatus: 'Production Ready', lifecycleStatus: 'Active', dimensions: { width: 800, height: 720, depth: 560, unit: 'mm' }, components, materialReferences: [{ materialId: 'PERF-MAT', quantity: 2 }], hardwareReferences: [{ hardwareId: 'PERF-HW', quantity: 4 }], accessoryReferences: [{ accessoryId: `${objectId}-handle`, name: 'Handle', quantity: 2 }] };
}
function fixture(label, objectCount, componentCount) {
  const projectId = `performance-${label}`;
  const values = Array.from({ length: objectCount }, (_, index) => makeObject(projectId, index, componentCount));
  const projectService = { readProject: (id) => id === projectId ? { project: { id, name: label }, metadata: { projectId: id } } : null, data: { official: catalog } };
  const engine = {
    listObjects: (id) => id === projectId ? values : [],
    getObject: (id, objectId) => { const value = values.find((item) => id === projectId && item.objectId === objectId); if (!value) throw Object.assign(new Error('Furniture Object not found'), { statusCode: 404 }); return value; },
    validateObject: () => ({ isValid: true, errors: [] }),
    getRoot: (id, objectId) => engine.getObject(id, objectId),
    getDescendants: () => [],
  };
  return { projectId, values, projectService, engine };
}
function measure(fn) { const before = process.memoryUsage().heapUsed; const start = performance.now(); const value = fn(); return { value, ms: Number((performance.now() - start).toFixed(3)), heapDeltaBytes: process.memoryUsage().heapUsed - before }; }
function repeat(fn, count = 10) { const values = []; for (let i = 0; i < count; i += 1) values.push(measure(fn).ms); return { iterations: count, min: Math.min(...values), max: Math.max(...values), average: Number((values.reduce((a, b) => a + b, 0) / count).toFixed(3)) }; }

const benchmarks = [];
for (const [label, objectCount, componentCount] of [['small', 2, 4], ['medium', 20, 12], ['large', 80, 20]]) {
  const data = fixture(label, objectCount, componentCount);
  const objectId = data.values[0].objectId;
  const drawingService = new ProductionDrawingGenerationService(data.projectService, data.engine);
  const project = measure(() => data.projectService.readProject(data.projectId));
  const objects = measure(() => data.engine.listObjects(data.projectId));
  const lookup = repeat(() => data.engine.getObject(data.projectId, objectId));
  const drawing = measure(() => drawingService.generate(data.projectId, objectId));
  const drawingTypes = ['generateAssembly', 'generatePanel', 'generateDoor', 'generateDrawer', 'generateHardware', 'generatePackage'].map((name) => measure(() => drawingService[name](data.projectId, objectId)).ms);
  const cutting = measure(() => generateCuttingList(data.projectService, data.engine, data.projectId, objectId));
  const layout = measure(() => generateBoardLayout(cutting.value, catalog, data.projectId, objectId, cutting.value.cuttingListId));
  const statistics = measure(() => generateMaterialStatistics(cutting.value, catalog, layout.value, data.projectId, objectId, cutting.value.cuttingListId, layout.value.boardLayoutId));
  const waste = measure(() => generateWasteAnalysis(cutting.value, layout.value, catalog, statistics.value.statisticsId, data.projectId, objectId, cutting.value.cuttingListId, layout.value.boardLayoutId));
  const information = measure(() => generateInformationPanel(cutting.value, layout.value, statistics.value, waste.value, data.projectId, objectId, cutting.value.cuttingListId, layout.value.boardLayoutId, statistics.value.statisticsId, waste.value.wasteAnalysisId));
  const trace = measure(() => generatePartTrace(cutting.value, data.values[0], catalog, layout.value, statistics.value, waste.value, data.projectId, objectId, cutting.value.cuttingListId, cutting.value.parts[0].partId, layout.value.boardLayoutId, statistics.value.statisticsId, waste.value.wasteAnalysisId));
  const cuttingPrint = measure(() => prepareCuttingListPrintDocument({ cuttingList: cutting.value, boardLayout: layout.value, materialStatistics: statistics.value, wasteAnalysis: waste.value, informationPanel: information.value, partTrace: trace.value }, data.projectId, objectId));
  const cuttingPdf = measure(() => exportCuttingListPdf(cuttingPrint.value, data.projectId, objectId));
  const cuttingExcel = measure(() => exportCuttingListExcel({ cuttingList: cutting.value, boardLayout: layout.value, materialStatistics: statistics.value, wasteAnalysis: waste.value, informationPanel: information.value, partTrace: trace.value }, data.projectId, objectId));
  const purchase = measure(() => generatePurchaseList(data.projectService, data.engine, data.projectId, { objectId, catalog, cuttingListResult: cutting.value }));
  const board = measure(() => buildBoardMaterialList(purchase.value, data.projectId, objectId));
  const hardware = measure(() => buildHardwareList(purchase.value, data.projectId, objectId));
  const accessories = measure(() => buildAccessoriesList(purchase.value, data.projectId, objectId));
  const summary = measure(() => buildPurchaseSummary(purchase.value, data.projectId));
  const categories = measure(() => buildCategoryManagement(purchase.value, data.projectId));
  const purchasePrint = measure(() => preparePurchaseListPrint({ purchaseList: purchase.value, boardMaterialList: board.value, hardwareList: hardware.value, accessoriesList: accessories.value, purchaseSummary: summary.value, categoryManagement: categories.value }, data.projectId));
  const purchasePdf = measure(() => exportPurchaseListPdf(purchasePrint.value, data.projectId));
  const purchaseExcel = measure(() => exportPurchaseListExcel({ purchaseListResult: purchase.value, boardMaterialList: board.value, hardwareList: hardware.value, accessoriesList: accessories.value, purchaseSummary: summary.value, categoryManagement: categories.value }, data.projectId));
  const reports = measure(() => buildPurchaseReports({ purchaseListResult: purchase.value, boardMaterialList: board.value, hardwareList: hardware.value, accessoriesList: accessories.value, purchaseSummary: summary.value, categoryManagement: categories.value }, data.projectId));
  const workflow = measure(() => { const d = drawingService.generate(data.projectId, objectId); const c = generateCuttingList(data.projectService, data.engine, data.projectId, objectId); const p = generatePurchaseList(data.projectService, data.engine, data.projectId, { objectId, catalog, cuttingListResult: c }); return { d, c, p }; });
  const repeatedWorkflow = repeat(() => generatePurchaseList(data.projectService, data.engine, data.projectId, { objectId, catalog, cuttingListResult: cutting.value }), 10);
  assert.equal(drawing.value.readOnly, true); assert.equal(cutting.value.readOnly, true); assert.equal(purchase.value.readOnly, true);
  assert.equal(cutting.value.contract, 'cutting-list-result'); assert.equal(purchase.value.contract, 'purchase-list-result');
  assert.equal(workflow.value.p.project.projectId, data.projectId);
  benchmarks.push({ label, objectCount, componentCount, projectMs: project.ms, objectLoadMs: objects.ms, objectCountResult: objects.value.length, lookup, drawingMs: drawing.ms, drawingTypeMs: drawingTypes, cuttingMs: cutting.ms, partCount: cutting.value.parts.length, boardLayoutMs: layout.ms, materialStatisticsMs: statistics.ms, wasteAnalysisMs: waste.ms, purchaseMs: purchase.ms, purchaseItemCount: purchase.value.materialItems.length + purchase.value.hardwareItems.length + purchase.value.accessoryItems.length, purchaseDownstreamMs: [board.ms, hardware.ms, accessories.ms, summary.ms, categories.ms], outputMs: { cuttingPrint: cuttingPrint.ms, cuttingPdf: cuttingPdf.ms, cuttingExcel: cuttingExcel.ms, purchasePrint: purchasePrint.ms, purchasePdf: purchasePdf.ms, purchaseExcel: purchaseExcel.ms, reports: reports.ms }, workflowMs: workflow.ms, repeatedWorkflow, heapDeltaBytes: { project: project.heapDeltaBytes, drawing: drawing.heapDeltaBytes, cutting: cutting.heapDeltaBytes, purchase: purchase.heapDeltaBytes, workflow: workflow.heapDeltaBytes } });
}

const deterministic = fixture('deterministic', 4, 8);
const first = generatePurchaseList(deterministic.projectService, deterministic.engine, deterministic.projectId, { objectId: deterministic.values[0].objectId, catalog });
const second = generatePurchaseList(deterministic.projectService, deterministic.engine, deterministic.projectId, { objectId: deterministic.values[0].objectId, catalog });
assert.deepEqual(second, first, 'repeated execution is deterministic');
console.log(JSON.stringify({ status: 'PASS', testDate: new Date().toISOString(), node: process.version, os: `${os.platform()} ${os.release()} ${os.arch()}`, cpu: os.cpus()[0]?.model || 'NOT AVAILABLE', memoryBytes: os.totalmem() || 'NOT AVAILABLE', fixture: 'isolated / in-memory', performanceThreshold: 'NO EXPLICIT PERFORMANCE THRESHOLD DEFINED', recognition: 'NOT AVAILABLE: no large Recognition benchmark fixture', cad: 'BOUNDARY ONLY: no parser benchmark added', benchmarks, determinism: 'PASS', stressTesting: 'NOT STARTED' }, null, 2));
