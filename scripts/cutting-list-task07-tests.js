const assert = require('node:assert/strict');
const fs = require('node:fs');
const { generateInformationPanel } = require('../src/services/cutting-list-information-panel-service');

const cuttingList = { contract: 'cutting-list-result', cuttingListId: 'cut:p1:o1', project: { projectId: 'p1', name: 'Project One' }, furnitureObject: { objectId: 'o1', name: 'Cabinet', objectType: 'Base Cabinet', productionStatus: 'Production Ready', dimensions: { width: 600, height: 720, depth: 560, unit: 'mm' } }, parts: [{ partId: 'part-1' }, { partId: 'part-2' }], validation: { status: 'validated-confirmed-components' }, status: 'Generated', readOnly: true };
const layout = { contract: 'board-layout-result', boardLayoutId: 'layout:p1:o1', project: { projectId: 'p1' }, furnitureObject: { objectId: 'o1' }, cuttingListId: 'cut:p1:o1', board: { width: 2800, height: 2070, thickness: 18 }, parts: [{ partId: 'part-1' }, { partId: 'part-2' }], layout: { boards: [{ boardId: 'board-1', board: { width: 2800, height: 2070, thickness: 18 } }], unplacedParts: [] }, status: 'Generated', readOnly: true };
const statistics = { contract: 'material-statistics-result', statisticsId: 'stats:p1:o1', project: { projectId: 'p1' }, furnitureObject: { objectId: 'o1' }, cuttingListId: 'cut:p1:o1', materials: [{ materialId: 'MAT-1', materialName: 'Board', productCode: 'B18', thickness: 18, boardCount: 1, totalPartArea: 1000, unit: 'mm²' }], totals: { totalMaterialTypes: 1, totalParts: 2, totalQuantity: 2 }, status: 'Generated', readOnly: true };
const waste = { contract: 'waste-analysis-result', wasteAnalysisId: 'waste:p1:o1', project: { projectId: 'p1' }, furnitureObject: { objectId: 'o1' }, cuttingListId: 'cut:p1:o1', totals: { totalBoardArea: 10000, totalUsedPartArea: 1000, totalWasteArea: 9000, totalWastePercentage: 90 }, materials: [{ materialId: 'MAT-1', wasteArea: 9000 }], status: 'Generated', readOnly: true };

const result = generateInformationPanel(cuttingList, layout, statistics, waste, 'p1', 'o1', 'cut:p1:o1', 'layout:p1:o1', 'stats:p1:o1', 'waste:p1:o1');
assert.equal(result.contract, 'information-panel-result');
assert.equal(result.readOnly, true);
assert.equal(result.project.projectId, 'p1');
assert.equal(result.furnitureObject.objectId, 'o1');
assert.equal(result.cuttingList.partCount, 2);
assert.equal(result.materials[0].materialId, 'MAT-1');
assert.equal(result.boardLayout.boardCount, 1);
assert.equal(result.boardLayout.placedPartCount, 2);
assert.equal(result.wasteAnalysis.wasteArea, 9000);
assert.equal(result.productionDataStatus.readOnly, true);
assert.equal(result.productionDataStatus.status, 'AVAILABLE');

const limited = generateInformationPanel(cuttingList);
assert.equal(limited.productionDataStatus.status, 'AVAILABLE_WITH_UNAVAILABLE_SECTIONS');
assert.equal(limited.boardLayout.code, 'BOARD_LAYOUT_NOT_AVAILABLE');
assert.equal(limited.materials.code, 'MATERIAL_STATISTICS_NOT_AVAILABLE');
assert.equal(limited.wasteAnalysis.code, 'WASTE_ANALYSIS_NOT_AVAILABLE');
assert.equal(limited.wasteAnalysis.value, null);

assert.throws(() => generateInformationPanel(cuttingList, { ...layout, project: { projectId: 'p2' } }, null, null, 'p1', 'o1'), (error) => error.code === 'PROJECT_ISOLATION_VIOLATION');
assert.throws(() => generateInformationPanel(cuttingList, { ...layout, furnitureObject: { objectId: 'o2' } }, null, null, 'p1', 'o1'), (error) => error.code === 'OBJECT_ISOLATION_VIOLATION');
assert.throws(() => generateInformationPanel(cuttingList, { ...layout, cuttingListId: 'other' }), (error) => error.code === 'SOURCE_MISMATCH');
assert.throws(() => generateInformationPanel(cuttingList, { ...layout, contract: 'wrong-contract' }), (error) => error.code === 'CONTRACT_MISMATCH');
assert.throws(() => generateInformationPanel(cuttingList, layout, { ...statistics, statisticsId: 'other' }, waste, 'p1', 'o1', 'cut:p1:o1', 'layout:p1:o1', 'stats:p1:o1'), (error) => error.code === 'SOURCE_MISMATCH');
assert.throws(() => generateInformationPanel(cuttingList, layout, statistics, { ...waste, wasteAnalysisId: 'other' }, 'p1', 'o1', 'cut:p1:o1', 'layout:p1:o1', 'stats:p1:o1', 'waste:p1:o1'), (error) => error.code === 'SOURCE_MISMATCH');

const snapshot = JSON.stringify({ cuttingList, layout, statistics, waste });
generateInformationPanel(cuttingList, layout, statistics, waste);
assert.equal(JSON.stringify({ cuttingList, layout, statistics, waste }), snapshot);

const serviceSource = fs.readFileSync(require.resolve('../src/services/cutting-list-information-panel-service'), 'utf8');
assert.doesNotMatch(serviceSource, /recalculate|optimization|purchase|inventory|erp|cnc|printing|pdf|excel|nesting|binPacking|kerf|saw/i);
assert.match(serviceSource, /information-panel-result/);
assert.match(serviceSource, /readOnly: true/);
const workspaceSource = fs.readFileSync(require.resolve('../src/components/CuttingListWorkspace.js'), 'utf8');
assert.match(workspaceSource, /data-cutting-list-information-panel/);
assert.match(workspaceSource, /generateInformationPanel/);
assert.match(fs.readFileSync(require.resolve('../server.js'), 'utf8'), /generateInformationPanel/);
assert.match(fs.readFileSync(require.resolve('../src/services/project-client.js'), 'utf8'), /information-panel/);

console.log('Sprint 08 Task 07 tests passed');
