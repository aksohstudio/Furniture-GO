const assert = require('node:assert/strict');
const fs = require('node:fs');
const { generateWasteAnalysis } = require('../src/services/cutting-list-waste-analysis-service');

const materials = {
  'MAT-A': { id: 'MAT-A', officialName: 'Board A', thickness: 18 },
  'MAT-B': { id: 'MAT-B', officialName: 'Board B', thickness: 16 },
};
const catalog = { getMaterialById: (id) => materials[id] || null };
const part = (id, materialId, width, height, quantity = 1, thickness = materials[materialId]?.thickness) => ({ partId: id, material: { id: materialId }, dimensions: { width, height, thickness }, quantity });
const cuttingList = (parts) => ({ contract: 'cutting-list-result', cuttingListId: 'cutting-list:p1:o1', project: { projectId: 'p1' }, furnitureObject: { objectId: 'o1' }, parts, readOnly: true });
const layout = { contract: 'board-layout-result', boardLayoutId: 'layout:p1:o1', project: { projectId: 'p1' }, furnitureObject: { objectId: 'o1' }, cuttingListId: 'cutting-list:p1:o1', status: 'Generated', validation: { valid: true }, readOnly: true, layout: { boards: [
  { boardId: 'board-a1', material: { id: 'MAT-A' }, board: { width: 100, height: 100, thickness: 18, unit: 'mm' } },
  { boardId: 'board-a2', material: { id: 'MAT-A' }, board: { width: 100, height: 100, thickness: 18, unit: 'mm' } },
  { boardId: 'board-b1', material: { id: 'MAT-B' }, board: { width: 50, height: 100, thickness: 16, unit: 'mm' } },
] } };

const result = generateWasteAnalysis(cuttingList([part('a1', 'MAT-A', 10, 20, 2), part('b1', 'MAT-B', 10, 10, 1)]), layout, catalog, 'stats:p1:o1', 'p1', 'o1', 'cutting-list:p1:o1', 'layout:p1:o1');
assert.equal(result.contract, 'waste-analysis-result');
assert.equal(result.readOnly, true);
assert.equal(result.status, 'Generated');
assert.equal(result.materials.length, 2);
assert.equal(result.materials[0].boardCount, 2);
assert.equal(result.materials[0].boardArea, 20000);
assert.equal(result.materials[0].usedPartArea, 400);
assert.equal(result.materials[0].wasteArea, 19600);
assert.equal(result.materials[0].wastePercentage, 98);
assert.equal(result.materials[1].boardArea, 5000);
assert.equal(result.totals.totalBoardArea, 25000);
assert.equal(result.totals.totalUsedPartArea, 500);
assert.equal(result.totals.totalWasteArea, 24500);
assert.equal(result.totals.totalWastePercentage, 98);

const unavailable = generateWasteAnalysis(cuttingList([part('a', 'MAT-A', 10, 10)]), null, catalog);
assert.equal(unavailable.status, 'BLOCKED');
assert.equal(unavailable.validation.issues[0].code, 'BOARD_LAYOUT_NOT_AVAILABLE');
assert.equal(unavailable.totals.totalWasteArea, null);

const incomplete = generateWasteAnalysis(cuttingList([part('a', 'MAT-A', 10, 10)]), { ...layout, status: 'INCOMPLETE' }, catalog);
assert.equal(incomplete.validation.issues[0].code, 'BOARD_LAYOUT_INCOMPLETE');
assert.equal(incomplete.totals.totalWastePercentage, null);

const badBoard = { ...layout, layout: { boards: [{ ...layout.layout.boards[0], board: { width: 0, height: 100 } }] } };
assert.equal(generateWasteAnalysis(cuttingList([part('a', 'MAT-A', 10, 10)]), badBoard, catalog).validation.valid, false);
assert.equal(generateWasteAnalysis(cuttingList([part('a', 'MAT-A', 10, 10)]), badBoard, catalog).validation.issues[0].code, 'BOARD_DIMENSIONS_MISSING');
assert.equal(generateWasteAnalysis(cuttingList([part('a', 'MAT-A', 10, undefined)]), layout, catalog).validation.issues[0].code, 'DIMENSIONS_INVALID');
assert.throws(() => generateWasteAnalysis(cuttingList([part('a', 'MAT-A', 10, 10)]), layout, catalog, null, 'p2', 'o1'), (error) => error.code === 'CUTTING_LIST_PROJECT_MISMATCH');
assert.throws(() => generateWasteAnalysis(cuttingList([part('a', 'MAT-A', 10, 10)]), layout, catalog, null, 'p1', 'o2'), (error) => error.code === 'PROJECT_OBJECT_MISMATCH');
assert.throws(() => generateWasteAnalysis(cuttingList([part('a', 'MAT-A', 10, 10)]), { ...layout, cuttingListId: 'other' }, catalog), (error) => error.code === 'CUTTING_LIST_NOT_FOUND');

const source = cuttingList([part('immutable', 'MAT-A', 10, 10, 2)]);
const snapshot = JSON.stringify(source);
generateWasteAnalysis(source, layout, catalog);
assert.equal(JSON.stringify(source), snapshot);

const sourceText = fs.readFileSync(require.resolve('../src/services/cutting-list-waste-analysis-service'), 'utf8');
assert.doesNotMatch(sourceText, /optimization|purchase|cnc|printing|pdf|excel|kerf|saw|trim|efficiency|utilization/i);
assert.match(sourceText, /boardArea/);
assert.match(sourceText, /usedPartArea/);
assert.match(sourceText, /wastePercentage/);
assert.match(sourceText, /readOnly: true/);
assert.match(fs.readFileSync(require.resolve('../server.js'), 'utf8'), /generateWasteAnalysis/);
assert.match(fs.readFileSync(require.resolve('../src/services/project-client.js'), 'utf8'), /waste-analysis/);
assert.match(fs.readFileSync(require.resolve('../src/components/CuttingListWorkspace.js'), 'utf8'), /data-cutting-list-waste/);

console.log('Sprint 08 Task 06 tests passed');
