const assert = require('node:assert/strict');
const XLSX = require('xlsx');
const { exportCuttingListExcel } = require('../src/services/cutting-list-excel-service');

const context = { projectId: 'project-1', objectId: 'object-1' };
const cuttingList = {
  contract: 'cutting-list-result', cuttingListId: 'cutting-list:project-1:object-1',
  project: { projectId: context.projectId, name: 'Kitchen' },
  furnitureObject: { objectId: context.objectId, name: 'Base Cabinet' },
  parts: [
    { partId: 'part-1', componentId: 'component-1', name: 'Left Side', type: 'Panel', material: { id: 'MAT-A', name: 'Oak' }, dimensions: { width: 720, height: 560, thickness: 18, unit: 'mm' }, quantity: 2, grainDirection: 'vertical', edgeBanding: { front: '1mm' }, processing: [], validation: { status: 'confirmed-component-data', valid: true } },
    { partId: 'part-2', componentId: 'component-2', name: 'Back', type: 'Panel', material: { id: 'MAT-B', name: 'White Melamine', productCode: 'WM-18' }, dimensions: { width: 700, height: 500, thickness: 12, unit: 'mm' }, quantity: 1, validation: { status: 'confirmed-component-data', valid: true } },
  ],
  validation: { valid: true, status: 'validated-confirmed-components' }, status: 'Generated', readOnly: true,
};
const boardLayout = {
  contract: 'board-layout-result', boardLayoutId: 'layout-1', project: cuttingList.project, furnitureObject: cuttingList.furnitureObject, cuttingListId: cuttingList.cuttingListId,
  layout: { boards: [{ boardId: 'board-1', material: { id: 'MAT-A', name: 'Oak' }, board: { width: 2440, height: 1220, thickness: 18 }, parts: [{ partId: 'part-1', x: 0, y: 0, width: 720, height: 560, grainDirection: 'vertical' }] }], unplacedParts: [], kerf: 'not-defined' },
  validation: { valid: true }, status: 'Generated', readOnly: true,
};
const statistics = { contract: 'material-statistics-result', statisticsId: 'stats-1', project: cuttingList.project, furnitureObject: cuttingList.furnitureObject, cuttingListId: cuttingList.cuttingListId, materials: [{ materialId: 'MAT-A', materialName: 'Oak', productCode: 'OAK-18', thickness: 18, partCount: 1, totalQuantity: 2, totalPartArea: 806400, boardCount: 1, boardSize: { width: 2440, height: 1220 }, validation: { status: 'VALIDATED' } }, { materialId: 'MAT-B', materialName: 'White Melamine', productCode: 'WM-18', thickness: 12, partCount: 1, totalQuantity: 1, totalPartArea: 350000, boardCount: 1, boardSize: { width: 2440, height: 1220 }, validation: { status: 'VALIDATED' } }], validation: { valid: true }, status: 'Generated', readOnly: true };
const waste = { contract: 'waste-analysis-result', wasteAnalysisId: 'waste-1', project: cuttingList.project, furnitureObject: cuttingList.furnitureObject, cuttingListId: cuttingList.cuttingListId, materials: [{ materialId: 'MAT-A', materialName: 'Oak', thickness: 18, boardCount: 1, boardArea: 2976800, usedPartArea: 806400, wasteArea: 2170400, wastePercentage: 72.9, validation: { status: 'VALIDATED' } }], validation: { valid: true }, status: 'Generated', readOnly: true };
const panel = { contract: 'information-panel-result', informationPanelId: 'panel-1', project: cuttingList.project, furnitureObject: cuttingList.furnitureObject, cuttingListId: cuttingList.cuttingListId, cuttingList: { cuttingListId: cuttingList.cuttingListId }, materials: [], boardLayout: {}, wasteAnalysis: {}, productionDataStatus: { status: 'AVAILABLE', source: 'canonical', readOnly: true }, validation: { valid: true, status: 'VALIDATED' }, status: 'Generated', readOnly: true };
const trace = { contract: 'part-trace-result', partTraceId: 'trace-1', project: cuttingList.project, furnitureObject: cuttingList.furnitureObject, cuttingListId: cuttingList.cuttingListId, cuttingPart: { partId: 'part-1' }, component: {}, material: {}, boardPlacement: {}, statistics: {}, waste: {}, sourceChain: [], validation: { valid: true }, status: 'Generated', readOnly: true };

const sourceSnapshot = JSON.stringify(cuttingList);
const exported = exportCuttingListExcel({ cuttingList, boardLayout, materialStatistics: statistics, wasteAnalysis: waste, informationPanel: panel, partTrace: trace }, context.projectId, context.objectId);
assert.ok(Buffer.isBuffer(exported.buffer), 'exports a real XLSX buffer');
const workbook = XLSX.read(exported.buffer, { type: 'buffer' });
assert.deepEqual(workbook.SheetNames, ['Cutting List', 'Board Layout', 'Material Statistics', 'Waste Analysis', 'Information', 'Part Trace']);
assert.equal(XLSX.utils.sheet_to_json(workbook.Sheets['Cutting List'], { header: 1 })[1][5], 'part-1');
assert.equal(XLSX.utils.sheet_to_json(workbook.Sheets['Board Layout'], { header: 1 })[1][7], 'part-1');
assert.equal(XLSX.utils.sheet_to_json(workbook.Sheets['Material Statistics'], { header: 1 })[2][0], 'MAT-B');
assert.equal(XLSX.utils.sheet_to_json(workbook.Sheets['Waste Analysis'], { header: 1 })[1][6], 2170400);
assert.equal(XLSX.utils.sheet_to_json(workbook.Sheets['Part Trace'], { header: 1 })[1][1], 'Kitchen');
assert.equal(JSON.stringify(cuttingList), sourceSnapshot, 'canonical input remains immutable');

const missing = XLSX.read(exportCuttingListExcel({ cuttingList }, context.projectId, context.objectId).buffer, { type: 'buffer' });
assert.equal(XLSX.utils.sheet_to_json(missing.Sheets['Waste Analysis'], { header: 1 })[1][0], 'WASTE_ANALYSIS_NOT_AVAILABLE');
assert.equal(XLSX.utils.sheet_to_json(missing.Sheets['Part Trace'], { header: 1 })[1][1], 'No Part Selected');
assert.throws(() => exportCuttingListExcel({ cuttingList: { ...cuttingList, project: { projectId: 'other' } } }, context.projectId, context.objectId), (error) => error.code === 'PROJECT_MISMATCH');
assert.throws(() => exportCuttingListExcel({ cuttingList: { ...cuttingList, readOnly: false } }, context.projectId, context.objectId), (error) => error.code === 'READ_ONLY_REQUIRED');
assert.throws(() => exportCuttingListExcel({ cuttingList: { ...cuttingList, validation: { valid: false } } }, context.projectId, context.objectId), (error) => error.code === 'RESULT_VALIDATION_FAILED');
assert.throws(() => exportCuttingListExcel({ cuttingList: { ...cuttingList, contract: 'wrong' } }, context.projectId, context.objectId), (error) => error.code === 'RESULT_CONTRACT_INVALID');
console.log('Sprint 08 Task 11 tests passed');
