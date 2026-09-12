const assert = require('node:assert/strict');
const { generateCuttingList } = require('../src/services/cutting-list-generation-service');
const { generateBoardLayout } = require('../src/services/cutting-list-board-layout-service');
const { generateMaterialStatistics } = require('../src/services/cutting-list-material-statistics-service');
const { generateWasteAnalysis } = require('../src/services/cutting-list-waste-analysis-service');
const { generateInformationPanel } = require('../src/services/cutting-list-information-panel-service');
const { generatePartTrace } = require('../src/services/cutting-list-part-trace-service');
const { prepareCuttingListPrintDocument } = require('../src/services/cutting-list-print-service');
const { exportCuttingListPdf } = require('../src/services/cutting-list-pdf-service');
const { exportCuttingListExcel } = require('../src/services/cutting-list-excel-service');

const projectId = 'project-13';
const objectId = 'object-13';
const materialA = { id: 'MAT-A', name: 'Oak', productCode: 'OAK-18', boardSize: { width: 2440, height: 1220, unit: 'mm' }, thickness: 18 };
const materialB = { id: 'MAT-B', name: 'White Melamine', productCode: 'WM-12', boardSize: { width: 2440, height: 1220, unit: 'mm' }, thickness: 12 };
const catalog = { getMaterialById: (id) => ({ 'MAT-A': materialA, 'MAT-B': materialB }[id] || null) };
const object = { projectId, objectId, name: 'Cabinet', objectType: 'Base Cabinet', productionStatus: 'Production Ready', lifecycleStatus: 'Active', dimensions: { width: 800, height: 720, depth: 560, unit: 'mm' }, components: [
  { componentId: 'component-a', componentType: 'Panel', name: 'Side', materialId: 'MAT-A', dimensions: { width: 720, height: 560, thickness: 18, unit: 'mm' }, quantity: 2, grainDirection: 'vertical' },
  { componentId: 'component-b', componentType: 'Panel', name: 'Back', materialId: 'MAT-B', dimensions: { width: 700, height: 500, thickness: 12, unit: 'mm' }, quantity: 1, grainDirection: 'horizontal' },
] };
const projectService = { readProject: (id) => id === projectId ? { project: { name: 'Task 13 Project' } } : null, data: { official: catalog } };
const furnitureObjectEngine = { getObject: (p, id) => { if (p !== projectId || id !== objectId) throw Object.assign(new Error('Furniture Object not found'), { statusCode: 404 }); return object; }, validateObject: () => ({ isValid: true }) };

function expectCode(action, code) { assert.throws(action, (error) => error.code === code, `expected ${code}`); }

const sourceSnapshot = JSON.stringify(object);
const cuttingList = generateCuttingList(projectService, furnitureObjectEngine, projectId, objectId);
assert.equal(cuttingList.contract, 'cutting-list-result');
assert.equal(cuttingList.source.sourceType, 'canonical-furniture-object');
assert.equal(cuttingList.readOnly, true);
assert.equal(cuttingList.parts.length, 2);
assert.equal(JSON.stringify(object), sourceSnapshot, 'real Furniture Object remains immutable');

const layout = generateBoardLayout(cuttingList, catalog, projectId, objectId, cuttingList.cuttingListId);
const statistics = generateMaterialStatistics(cuttingList, catalog, layout, projectId, objectId, cuttingList.cuttingListId, layout.boardLayoutId);
const waste = generateWasteAnalysis(cuttingList, layout, catalog, statistics.statisticsId, projectId, objectId, cuttingList.cuttingListId, layout.boardLayoutId);
const panel = generateInformationPanel(cuttingList, layout, statistics, waste, projectId, objectId, cuttingList.cuttingListId, layout.boardLayoutId, statistics.statisticsId, waste.wasteAnalysisId);
const trace = generatePartTrace(cuttingList, object, catalog, layout, statistics, waste, projectId, objectId, cuttingList.cuttingListId, cuttingList.parts[0].partId, layout.boardLayoutId, statistics.statisticsId, waste.wasteAnalysisId);
const print = prepareCuttingListPrintDocument({ cuttingList, boardLayout: layout, materialStatistics: statistics, wasteAnalysis: waste, informationPanel: panel, partTrace: trace }, projectId, objectId, 'current-view');
const pdf = exportCuttingListPdf(print, projectId, objectId);
const excel = exportCuttingListExcel({ cuttingList, boardLayout: layout, materialStatistics: statistics, wasteAnalysis: waste, informationPanel: panel, partTrace: trace }, projectId, objectId);

for (const result of [cuttingList, layout, statistics, waste, panel, trace, print]) assert.equal(result.readOnly, true);
assert.equal(layout.project.projectId, projectId);
assert.ok(layout.layout.boards.every((board) => board.parts.every((part) => cuttingList.parts.some((item) => item.partId === part.partId))));
assert.deepEqual(statistics.materials.map((item) => item.materialId).sort(), ['MAT-A', 'MAT-B']);
assert.ok(waste.materials.every((item) => ['MAT-A', 'MAT-B'].includes(item.materialId)));
assert.equal(trace.cuttingPart.partId, cuttingList.parts[0].partId);
assert.equal(print.validation.status, 'PRINT_READY');
assert.equal(pdf.contentType, 'application/pdf');
assert.ok(Buffer.isBuffer(excel.buffer));

// Missing-result handling: unavailable is explicit and never treated as zero.
const partialExcel = exportCuttingListExcel({ cuttingList }, projectId, objectId);
assert.ok(Buffer.isBuffer(partialExcel.buffer));
expectCode(() => prepareCuttingListPrintDocument({ cuttingList }, projectId, objectId, 'board-layout'), 'PRINT_RESULT_NOT_AVAILABLE');
expectCode(() => exportCuttingListExcel({}, projectId, objectId), 'CUTTING_LIST_MISSING');

// Generation and validation error paths.
expectCode(() => generateCuttingList(projectService, furnitureObjectEngine, 'missing-project', objectId), 'PROJECT_NOT_FOUND');
expectCode(() => generateCuttingList(projectService, furnitureObjectEngine, projectId, 'missing-object'), 'FURNITURE_OBJECT_NOT_FOUND');
expectCode(() => generateCuttingList(projectService, { ...furnitureObjectEngine, getObject: () => ({ ...object, projectId: 'other' }) }, projectId, objectId), 'PROJECT_OBJECT_MISMATCH');
expectCode(() => generateCuttingList(projectService, { ...furnitureObjectEngine, getObject: () => ({ ...object, productionStatus: 'Draft' }) }, projectId, objectId), 'FURNITURE_OBJECT_NOT_APPROVED');
expectCode(() => generateCuttingList(projectService, { ...furnitureObjectEngine, getObject: () => ({ ...object, dimensions: { ...object.dimensions, width: 0 } }) }, projectId, objectId), 'DIMENSIONS_INVALID');
expectCode(() => generateCuttingList(projectService, { ...furnitureObjectEngine, getObject: () => ({ ...object, components: [{ ...object.components[0], materialId: undefined, materialReferences: [] }] }) }, projectId, objectId), 'MATERIAL_REFERENCE_MISSING');
expectCode(() => generateCuttingList(projectService, { ...furnitureObjectEngine, getObject: () => ({ ...object, components: [{ ...object.components[0], materialId: 'UNKNOWN' }] }) }, projectId, objectId), 'UNKNOWN_MATERIAL');
expectCode(() => generateBoardLayout({ ...cuttingList, contract: 'wrong' }, catalog), 'CUTTING_LIST_INVALID');
expectCode(() => generateBoardLayout({ ...cuttingList, readOnly: false }, catalog), 'CUTTING_LIST_INVALID');
expectCode(() => generateBoardLayout(cuttingList, catalog, 'other', objectId), 'PROJECT_ISOLATION_VIOLATION');
expectCode(() => generateBoardLayout(cuttingList, catalog, projectId, objectId, 'other'), 'CUTTING_LIST_MISMATCH');
expectCode(() => generateMaterialStatistics(cuttingList, catalog, { ...layout, cuttingListId: 'other' }, projectId, objectId, cuttingList.cuttingListId), 'CUTTING_LIST_NOT_FOUND');
expectCode(() => generateInformationPanel(cuttingList, { ...layout, readOnly: false }, statistics, waste), 'CONTRACT_MISMATCH');
expectCode(() => generatePartTrace(cuttingList, object, catalog, layout, statistics, waste, 'other', objectId, cuttingList.cuttingListId, cuttingList.parts[0].partId), 'PROJECT_OBJECT_MISMATCH');
expectCode(() => exportCuttingListExcel({ cuttingList: { ...cuttingList, project: { projectId: 'other' } } }, projectId, objectId), 'PROJECT_MISMATCH');
expectCode(() => exportCuttingListExcel({ cuttingList: { ...cuttingList, readOnly: false } }, projectId, objectId), 'READ_ONLY_REQUIRED');
expectCode(() => exportCuttingListExcel({ cuttingList: { ...cuttingList, validation: { valid: false } } }, projectId, objectId), 'RESULT_VALIDATION_FAILED');
expectCode(() => exportCuttingListExcel({ cuttingList, boardLayout: { ...layout, cuttingListId: 'other' } }, projectId, objectId), 'SOURCE_MISMATCH');
expectCode(() => exportCuttingListExcel({ cuttingList, boardLayout: { ...layout, status: 'INCOMPLETE' } }, projectId, objectId), 'RESULT_VALIDATION_FAILED');
expectCode(() => exportCuttingListPdf({ ...print, project: { projectId: 'other' } }, projectId, objectId), 'PROJECT_MISMATCH');
expectCode(() => exportCuttingListPdf({ ...print, readOnly: false }, projectId, objectId), 'READ_ONLY_REQUIRED');
expectCode(() => prepareCuttingListPrintDocument({ cuttingList }, projectId, objectId, 'invalid'), 'PRINT_TYPE_INVALID');
assert.equal(JSON.stringify(object), sourceSnapshot, 'workflow never mutates the source Furniture Object');
console.log('Sprint 08 Task 13 workflow and error-path tests passed');
