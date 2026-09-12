const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { ProductionDrawingGenerationService } = require('../src/services/production-drawing-generation-service');
const { exportProductionDrawingPdf } = require('../src/services/production-drawing-pdf-service');
const { exportProductionDrawingDwg } = require('../src/services/production-drawing-dwg-service');
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

const projectA = 'sync-project-a';
const projectB = 'sync-project-b';
const objectA = 'sync-object-a';
const objectB = 'sync-object-b';
const material = { id: 'SYNC-MAT', name: 'Oak', productCode: 'SYNC-OAK', thickness: 18, boardSize: { width: 2440, height: 1220, unit: 'mm' } };
const hardware = { id: 'SYNC-HW', name: 'Connector', productCode: 'SYNC-CONNECTOR', specification: 'Connector' };
const catalog = { getMaterialById: (id) => id === material.id ? material : null, getHardwareById: (id) => id === hardware.id ? hardware : null };
function makeObject(projectId, objectId) { return { projectId, objectId, name: `Object ${objectId}`, objectType: 'Cabinet', productionStatus: 'Production Ready', lifecycleStatus: 'Active', dimensions: { width: 800, height: 720, depth: 560, unit: 'mm' }, components: [{ componentId: `${objectId}-component`, componentType: 'Panel', name: 'Side', materialId: material.id, dimensions: { width: 720, height: 560, thickness: 18, unit: 'mm' }, quantity: 2 }], materialReferences: [{ materialId: material.id }], hardwareReferences: [{ hardwareId: hardware.id, quantity: 4 }], accessoryReferences: [{ accessoryId: `${objectId}-handle`, name: 'Handle', quantity: 2 }] }; }
const objects = { [projectA]: makeObject(projectA, objectA), [projectB]: makeObject(projectB, objectB) };
const projectService = { readProject: (id) => objects[id] ? { project: { id, name: `Project ${id}` }, metadata: { projectId: id } } : null, data: { official: catalog } };
const furnitureObjectEngine = { getObject: (projectId, objectId) => { const object = objects[projectId]; if (!object || object.objectId !== objectId) throw Object.assign(new Error('Furniture Object not found'), { statusCode: 404 }); return object; }, validateObject: () => ({ isValid: true, errors: [] }), listObjects: (projectId) => objects[projectId] ? [objects[projectId]] : [] };
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function expectCode(action, code) { assert.throws(action, (error) => error.code === code, `expected ${code}`); }
function loadEsm(file, name, exportLine) { const source = fs.readFileSync(file, 'utf8'); const context = { module: { exports: {} }, JSON, Set }; vm.runInNewContext(source.replace(`export function ${name}`, `function ${name}`).replace(exportLine, `module.exports = { ${name} };`), context, { filename: file }); return context.module.exports[name]; }

(async () => {

const before = clone(objects);
const drawingService = new ProductionDrawingGenerationService(projectService, furnitureObjectEngine);
const drawing = drawingService.generate(projectA, objectA);
assert.equal(drawing.contract, 'production-drawing-data');
assert.equal(drawing.project.projectId, projectA);
assert.equal(drawing.objectId, objectA);
assert.equal(drawing.furnitureObject.objectId, objectA);
assert.equal(drawing.source.furnitureObjectId, objectA);
assert.equal(drawing.readOnly, true);
const preparePreview = loadEsm('src/services/production-drawing-preview-service.js', 'prepareDrawingPreview', 'export { VALID_STATUSES };');
const prepareDrawingPrint = loadEsm('src/services/production-drawing-print-service.js', 'preparePrintDocument', 'export { VALID_DRAWING_STATUSES };');
assert.equal(preparePreview(drawing, projectA, objectA).furnitureObject.objectId, objectA);
assert.equal(prepareDrawingPrint(drawing, projectA, objectA).objectId, objectA);
assert.equal(exportProductionDrawingPdf(drawing, projectA, objectA).contentType, 'application/pdf');
await exportProductionDrawingDwg(drawing, projectA, objectA);
assert.equal(createRevision(drawing, projectA, objectA).objectId, objectA);

const cuttingList = generateCuttingList(projectService, furnitureObjectEngine, projectA, objectA);
assert.equal(cuttingList.contract, 'cutting-list-result');
assert.equal(cuttingList.project.projectId, projectA);
assert.equal(cuttingList.furnitureObject.objectId, objectA);
assert.equal(cuttingList.source.furnitureObjectId, objectA);
assert.equal(cuttingList.readOnly, true);
const layout = generateBoardLayout(cuttingList, catalog, projectA, objectA, cuttingList.cuttingListId);
const statistics = generateMaterialStatistics(cuttingList, catalog, layout, projectA, objectA, cuttingList.cuttingListId, layout.boardLayoutId);
const waste = generateWasteAnalysis(cuttingList, layout, catalog, statistics.statisticsId, projectA, objectA, cuttingList.cuttingListId, layout.boardLayoutId);
const information = generateInformationPanel(cuttingList, layout, statistics, waste, projectA, objectA, cuttingList.cuttingListId, layout.boardLayoutId, statistics.statisticsId, waste.wasteAnalysisId);
const trace = generatePartTrace(cuttingList, objects[projectA], catalog, layout, statistics, waste, projectA, objectA, cuttingList.cuttingListId, cuttingList.parts[0].partId, layout.boardLayoutId, statistics.statisticsId, waste.wasteAnalysisId);
const cuttingPrint = prepareCuttingListPrintDocument({ cuttingList, boardLayout: layout, materialStatistics: statistics, wasteAnalysis: waste, informationPanel: information, partTrace: trace }, projectA, objectA);
assert.equal(exportCuttingListPdf(cuttingPrint, projectA, objectA).contentType, 'application/pdf');
assert.ok(Buffer.isBuffer(exportCuttingListExcel({ cuttingList, boardLayout: layout, materialStatistics: statistics, wasteAnalysis: waste, informationPanel: information, partTrace: trace }, projectA, objectA).buffer));

const purchaseList = generatePurchaseList(projectService, furnitureObjectEngine, projectA, { objectId: objectA, catalog, cuttingListResult: cuttingList });
assert.equal(purchaseList.contract, 'purchase-list-result');
assert.equal(purchaseList.project.projectId, projectA);
assert.equal(purchaseList.furnitureObjects[0].objectId, objectA);
assert.equal(purchaseList.source.projectId, projectA);
assert.equal(purchaseList.source.furnitureObjectIds[0], objectA);
assert.equal(purchaseList.readOnly, true);
const board = buildBoardMaterialList(purchaseList, projectA, objectA);
const hardwareView = buildHardwareList(purchaseList, projectA, objectA);
const accessoryView = buildAccessoriesList(purchaseList, projectA, objectA);
const summary = buildPurchaseSummary(purchaseList, projectA);
const categories = buildCategoryManagement(purchaseList, projectA);
const purchasePrint = preparePurchaseListPrint({ purchaseList, boardMaterialList: board, hardwareList: hardwareView, accessoriesList: accessoryView, purchaseSummary: summary, categoryManagement: categories }, projectA);
assert.equal(exportPurchaseListPdf(purchasePrint, projectA).contract, 'purchase-list-pdf-result');
assert.ok(Buffer.isBuffer(exportPurchaseListExcel({ purchaseListResult: purchaseList, boardMaterialList: board, hardwareList: hardwareView, accessoriesList: accessoryView, purchaseSummary: summary, categoryManagement: categories }, projectA).buffer));
assert.equal(buildPurchaseReports({ purchaseListResult: purchaseList, boardMaterialList: board, hardwareList: hardwareView, accessoriesList: accessoryView, purchaseSummary: summary, categoryManagement: categories }, projectA).project.projectId, projectA);

const projectBList = generateCuttingList(projectService, furnitureObjectEngine, projectB, objectB);
const projectBPurchase = generatePurchaseList(projectService, furnitureObjectEngine, projectB, { objectId: objectB, catalog, cuttingListResult: projectBList });
assert.notEqual(cuttingList.cuttingListId, projectBList.cuttingListId);
assert.notEqual(purchaseList.purchaseListId, projectBPurchase.purchaseListId);
expectCode(() => drawingService.generate(projectB, objectA), 'FURNITURE_OBJECT_NOT_FOUND');
expectCode(() => generateCuttingList(projectA === 'missing' ? projectService : projectService, furnitureObjectEngine, 'missing-project', objectA), 'PROJECT_NOT_FOUND');
expectCode(() => generatePurchaseList(projectService, furnitureObjectEngine, projectA, { objectId: objectB, catalog }), 'FURNITURE_OBJECT_NOT_FOUND');
expectCode(() => preparePreview({ ...drawing, project: { projectId: projectB } }, projectA, objectA), 'DRAWING_CONTEXT_MISMATCH');
expectCode(() => generateBoardLayout({ ...cuttingList, contract: 'invalid' }, catalog), 'CUTTING_LIST_INVALID');
expectCode(() => buildBoardMaterialList({ ...purchaseList, contract: 'invalid' }, projectA), 'INVALID_PURCHASE_LIST_CONTRACT');
expectCode(() => exportCuttingListPdf({ ...cuttingPrint, project: { projectId: projectB } }, projectA, objectA), 'PROJECT_MISMATCH');
expectCode(() => buildHardwareList(purchaseList, projectA, objectB), 'OBJECT_MISMATCH');
assert.deepEqual(objects, before, 'complete synchronization workflow does not mutate canonical sources');

const sourceFiles = ['src/services/project-service.js', 'src/services/furniture-object-engine.js', 'src/services/production-drawing-data-contract.js', 'src/services/cutting-list-generation-service.js', 'src/services/purchase-list-generation-service.js', 'src/components/RecognitionWorkspace.js', 'src/components/CadWorkspace.js', 'src/components/Furniture3DWorkspace.js', 'src/components/ProductionDrawingWorkspace.js', 'src/components/CuttingListWorkspace.js', 'src/components/PurchaseListWorkspace.js'];
const source = sourceFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
assert.match(source, /production-drawing-data/);
assert.match(source, /cutting-list-result/);
assert.match(source, /purchase-list-result/);
assert.doesNotMatch(source, /second(?:Project|FurnitureObject|Drawing|CuttingList|PurchaseList)Source|drawingDataV2|cuttingListDataV2|purchaseListDataV2/i);
assert.doesNotMatch(source, /cloudApi|remoteRendering|onlineCad|supplierApi|erpIntegration|inventorySystem|aiAssistance/i);
for (const file of ['src/components/Furniture3DWorkspace.js', 'src/components/ProductionDrawingWorkspace.js', 'src/components/CuttingListWorkspace.js', 'src/components/PurchaseListWorkspace.js']) assert.match(fs.readFileSync(file, 'utf8'), /dashboard\//);
console.log('Sprint 10 Task 09 tests passed: full Project-to-Purchase synchronization, downstream chains, source consistency, isolation, read-only safety, immutability, errors, navigation and offline audits.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
