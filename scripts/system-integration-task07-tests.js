const assert = require('node:assert/strict');
const fs = require('node:fs');
const { generateCuttingList } = require('../src/services/cutting-list-generation-service');
const { generateBoardLayout } = require('../src/services/cutting-list-board-layout-service');
const { generateMaterialStatistics } = require('../src/services/cutting-list-material-statistics-service');
const { generateWasteAnalysis } = require('../src/services/cutting-list-waste-analysis-service');
const { generateInformationPanel } = require('../src/services/cutting-list-information-panel-service');
const { generatePartTrace } = require('../src/services/cutting-list-part-trace-service');
const { prepareCuttingListPrintDocument } = require('../src/services/cutting-list-print-service');
const { exportCuttingListPdf } = require('../src/services/cutting-list-pdf-service');
const { exportCuttingListExcel } = require('../src/services/cutting-list-excel-service');

const material = { id: 'MAT-A', name: 'Oak', productCode: 'OAK-18', boardSize: { width: 2440, height: 1220, unit: 'mm' }, thickness: 18 };
const catalog = { getMaterialById: (id) => id === 'MAT-A' ? material : null };
function object(projectId, objectId) { return { projectId, objectId, name: objectId, objectType: 'Cabinet', productionStatus: 'Production Ready', lifecycleStatus: 'Active', dimensions: { width: 800, height: 720, depth: 560, unit: 'mm' }, components: [{ componentId: `${objectId}-component`, componentType: 'Panel', name: 'Side', materialId: 'MAT-A', dimensions: { width: 720, height: 560, thickness: 18, unit: 'mm' }, quantity: 2 }] }; }
const objects = { 'project-a': object('project-a', 'object-a'), 'project-b': object('project-b', 'object-b') };
const projectService = { readProject: (id) => objects[id] ? { project: { name: id } } : null, data: { official: catalog } };
const furnitureObjectEngine = { getObject: (projectId, objectId) => { const value = objects[projectId]; if (!value || value.objectId !== objectId) throw Object.assign(new Error('Furniture Object not found'), { statusCode: 404 }); return value; }, validateObject: () => ({ isValid: true, errors: [] }) };
function expectCode(action, code) { assert.throws(action, (error) => error.code === code, `expected ${code}`); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }

const sourceSnapshot = clone(objects['project-a']);
const cuttingList = generateCuttingList(projectService, furnitureObjectEngine, 'project-a', 'object-a');
assert.equal(cuttingList.contract, 'cutting-list-result');
assert.equal(cuttingList.project.projectId, 'project-a');
assert.equal(cuttingList.furnitureObject.objectId, 'object-a');
assert.equal(cuttingList.source.sourceType, 'canonical-furniture-object');
assert.equal(cuttingList.source.projectId, 'project-a');
assert.equal(cuttingList.source.furnitureObjectId, 'object-a');
assert.equal(cuttingList.readOnly, true);
assert.equal(cuttingList.parts[0].source.furnitureObjectId, 'object-a');

const layout = generateBoardLayout(cuttingList, catalog, 'project-a', 'object-a', cuttingList.cuttingListId);
const statistics = generateMaterialStatistics(cuttingList, catalog, layout, 'project-a', 'object-a', cuttingList.cuttingListId, layout.boardLayoutId);
const waste = generateWasteAnalysis(cuttingList, layout, catalog, statistics.statisticsId, 'project-a', 'object-a', cuttingList.cuttingListId, layout.boardLayoutId);
const panel = generateInformationPanel(cuttingList, layout, statistics, waste, 'project-a', 'object-a', cuttingList.cuttingListId, layout.boardLayoutId, statistics.statisticsId, waste.wasteAnalysisId);
const trace = generatePartTrace(cuttingList, objects['project-a'], catalog, layout, statistics, waste, 'project-a', 'object-a', cuttingList.cuttingListId, cuttingList.parts[0].partId, layout.boardLayoutId, statistics.statisticsId, waste.wasteAnalysisId);
const print = prepareCuttingListPrintDocument({ cuttingList, boardLayout: layout, materialStatistics: statistics, wasteAnalysis: waste, informationPanel: panel, partTrace: trace }, 'project-a', 'object-a', 'current-view');
assert.equal(exportCuttingListPdf(print, 'project-a', 'object-a').contentType, 'application/pdf');
assert.ok(Buffer.isBuffer(exportCuttingListExcel({ cuttingList, boardLayout: layout, materialStatistics: statistics, wasteAnalysis: waste, informationPanel: panel, partTrace: trace }, 'project-a', 'object-a').buffer));
for (const result of [cuttingList, layout, statistics, waste, panel, trace, print]) assert.equal(result.readOnly, true);
assert.equal(trace.cuttingPart.source.projectId, 'project-a');
assert.equal(trace.cuttingPart.source.furnitureObjectId, 'object-a');
assert.deepEqual(objects['project-a'], sourceSnapshot);

const projectBList = generateCuttingList(projectService, furnitureObjectEngine, 'project-b', 'object-b');
assert.notEqual(projectBList.cuttingListId, cuttingList.cuttingListId);
assert.equal(projectBList.source.projectId, 'project-b');
assert.equal(projectBList.source.furnitureObjectId, 'object-b');
expectCode(() => generateCuttingList(projectService, furnitureObjectEngine, 'project-a', 'object-b'), 'FURNITURE_OBJECT_NOT_FOUND');
expectCode(() => generateBoardLayout(cuttingList, catalog, 'project-b', 'object-a'), 'PROJECT_ISOLATION_VIOLATION');
expectCode(() => generateBoardLayout({ ...cuttingList, contract: 'invalid' }, catalog), 'CUTTING_LIST_INVALID');
expectCode(() => generateBoardLayout({ ...cuttingList, readOnly: false }, catalog), 'CUTTING_LIST_INVALID');
expectCode(() => generateBoardLayout(cuttingList, catalog, 'project-a', 'object-a', 'other'), 'CUTTING_LIST_MISMATCH');
expectCode(() => generateMaterialStatistics(cuttingList, catalog, { ...layout, cuttingListId: 'other' }, 'project-a', 'object-a', cuttingList.cuttingListId), 'CUTTING_LIST_NOT_FOUND');
expectCode(() => generateInformationPanel(cuttingList, { ...layout, readOnly: false }, statistics, waste), 'CONTRACT_MISMATCH');
expectCode(() => exportCuttingListExcel({ cuttingList: { ...cuttingList, project: { projectId: 'project-b' } } }, 'project-a', 'object-a'), 'PROJECT_MISMATCH');
expectCode(() => exportCuttingListExcel({ cuttingList: { ...cuttingList, readOnly: false } }, 'project-a', 'object-a'), 'READ_ONLY_REQUIRED');
expectCode(() => exportCuttingListExcel({ cuttingList: { ...cuttingList, validation: { valid: false } } }, 'project-a', 'object-a'), 'RESULT_VALIDATION_FAILED');
expectCode(() => exportCuttingListExcel({ cuttingList, boardLayout: { ...layout, cuttingListId: 'other' } }, 'project-a', 'object-a'), 'SOURCE_MISMATCH');
expectCode(() => generateCuttingList(projectService, { ...furnitureObjectEngine, getObject: () => ({ ...objects['project-a'], productionStatus: 'Draft' }) }, 'project-a', 'object-a'), 'FURNITURE_OBJECT_NOT_APPROVED');
expectCode(() => generateCuttingList(projectService, { ...furnitureObjectEngine, getObject: () => ({ ...objects['project-a'], components: [{ ...objects['project-a'].components[0], materialId: 'UNKNOWN' }] }) }, 'project-a', 'object-a'), 'UNKNOWN_MATERIAL');
expectCode(() => generateCuttingList(projectService, { ...furnitureObjectEngine, getObject: () => ({ ...objects['project-a'], components: [{ ...objects['project-a'].components[0], quantity: 0 }] }) }, 'project-a', 'object-a'), 'QUANTITY_MISSING');

const integrationFiles = ['src/services/cutting-list-generation-service.js', 'src/services/cutting-list-board-layout-service.js', 'src/services/cutting-list-material-statistics-service.js', 'src/services/cutting-list-waste-analysis-service.js', 'src/services/cutting-list-information-panel-service.js', 'src/services/cutting-list-part-trace-service.js', 'src/services/cutting-list-print-service.js', 'src/services/cutting-list-pdf-service.js', 'src/services/cutting-list-excel-service.js', 'src/components/CuttingListWorkspace.js', 'src/services/project-client.js'];
const source = integrationFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
assert.match(source, /cutting-list-result/);
assert.match(source, /canonical-furniture-object/);
assert.match(source, /projectId/);
assert.match(source, /objectId/);
assert.doesNotMatch(source, /secondFurnitureObjectSource|cuttingListDataV2|cloudSync|erpIntegration|supplierManagement/i);
assert.match(fs.readFileSync('src/components/CuttingListWorkspace.js', 'utf8'), /generateBoardLayout|generateMaterialStats|generateWasteAnalysis|generatePartTrace/);
console.log('Sprint 10 Task 07 tests passed: canonical Cutting List result, Project/Object isolation, downstream result context, read-only safety, errors, traceability, exports and offline scope.');
