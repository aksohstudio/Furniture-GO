const assert = require('node:assert/strict');
const fs = require('node:fs');
const { generateMaterialStatistics } = require('../src/services/cutting-list-material-statistics-service');

const materials = {
  'MAT-A': { id: 'MAT-A', officialName: 'EGGER 18 mm', productCode: 'A18', thickness: '18mm' },
  'MAT-B': { id: 'MAT-B', officialName: 'Kronospan 18 mm', productCode: 'B18', thickness: '18mm' },
};
const catalog = { getMaterialById: (id) => materials[id] || null };
const part = (id, materialId, dimensions, quantity = 1) => ({ partId: id, material: { id: materialId, name: materials[materialId]?.officialName }, dimensions, quantity });
const cuttingList = (parts) => ({ schemaVersion: 1, contract: 'cutting-list-result', cuttingListId: 'cutting-list:p1:o1', project: { projectId: 'p1', name: 'Project' }, furnitureObject: { objectId: 'o1', name: 'Cabinet' }, parts, readOnly: true });
const boardLayout = { schemaVersion: 1, contract: 'board-layout-result', boardLayoutId: 'board-layout:p1:o1:cutting-list:p1:o1', project: { projectId: 'p1' }, furnitureObject: { objectId: 'o1' }, cuttingListId: 'cutting-list:p1:o1', layout: { boards: [{ boardId: 'board:1', material: { id: 'MAT-A' }, board: { width: 2800, height: 2070, unit: 'mm', thickness: 18 } }] }, readOnly: true };

const result = generateMaterialStatistics(cuttingList([part('a1', 'MAT-A', { width: 100, height: 200, thickness: 18 }, 2), part('a2', 'MAT-A', { width: 50, height: 100, thickness: 18 }, 1), part('b1', 'MAT-B', { width: 20, height: 20, thickness: 18 }, 3)]), catalog, boardLayout, 'p1', 'o1', 'cutting-list:p1:o1', boardLayout.boardLayoutId);
assert.equal(result.contract, 'material-statistics-result');
assert.equal(result.readOnly, true);
assert.equal(result.materials.length, 2);
assert.equal(result.materials[0].partCount, 2);
assert.equal(result.materials[0].totalQuantity, 3);
assert.equal(result.materials[0].totalPartArea, 45000);
assert.equal(result.materials[0].boardCount, 1);
assert.equal(result.totals.totalParts, 3);
assert.equal(result.totals.totalQuantity, 6);
assert.equal(result.totals.totalPartArea, 46200);
assert.equal(result.boardLayoutId, boardLayout.boardLayoutId);

const noLayout = generateMaterialStatistics(cuttingList([part('a', 'MAT-A', { width: 10, height: 10 }, 1)]), catalog);
assert.equal(noLayout.totals.boardStatus, 'BOARD_LAYOUT_NOT_AVAILABLE');
assert.equal(noLayout.materials[0].boardCount, null);
assert.equal(noLayout.materials[0].boardSize, null);

const missingArea = generateMaterialStatistics(cuttingList([part('missing', 'MAT-A', { thickness: 18 }, 2)]), catalog);
assert.equal(missingArea.materials[0].totalPartArea, null);
assert.equal(missingArea.materials[0].validation.status, 'AREA_UNAVAILABLE');
assert.equal(missingArea.totals.totalPartArea, null);

assert.throws(() => generateMaterialStatistics(cuttingList([part('missing-material', null, { width: 10, height: 10 }, 1)]), catalog), (error) => error.code === 'MATERIAL_REFERENCE_MISSING');
assert.throws(() => generateMaterialStatistics(cuttingList([part('unknown-material', 'MAT-X', { width: 10, height: 10 }, 1)]), catalog), (error) => error.code === 'UNKNOWN_MATERIAL');
assert.throws(() => generateMaterialStatistics(cuttingList([{ ...part('missing-quantity', 'MAT-A', { width: 10, height: 10 }), quantity: undefined }]), catalog), (error) => error.code === 'QUANTITY_MISSING');
assert.throws(() => generateMaterialStatistics(cuttingList([part('isolated', 'MAT-A', { width: 10, height: 10 })]), catalog, null, 'p2'), (error) => error.code === 'CUTTING_LIST_PROJECT_MISMATCH');
assert.throws(() => generateMaterialStatistics(cuttingList([part('isolated', 'MAT-A', { width: 10, height: 10 })]), catalog, null, 'p1', 'o2'), (error) => error.code === 'PROJECT_OBJECT_MISMATCH');
assert.throws(() => generateMaterialStatistics(cuttingList([part('isolated', 'MAT-A', { width: 10, height: 10 })]), catalog, boardLayout, 'p1', 'o1', 'other'), (error) => error.code === 'CUTTING_LIST_NOT_FOUND');

const source = cuttingList([part('immutable', 'MAT-A', { width: 10, height: 10 })]);
const snapshot = JSON.stringify(source);
generateMaterialStatistics(source, catalog);
assert.equal(JSON.stringify(source), snapshot);

const serviceSource = fs.readFileSync(require.resolve('../src/services/cutting-list-material-statistics-service'), 'utf8');
assert.doesNotMatch(serviceSource, /waste|optimization|purchase|cnc|printing|pdf|excel|boardArea|efficiency|utilization/i);
assert.match(serviceSource, /getMaterialById/);
assert.match(serviceSource, /material-statistics-result/);
assert.match(serviceSource, /readOnly: true/);
const workspaceSource = fs.readFileSync(require.resolve('../src/components/CuttingListWorkspace.js'), 'utf8');
assert.match(workspaceSource, /data-cutting-list-stats/);
assert.match(workspaceSource, /Coming Next/);
assert.match(fs.readFileSync(require.resolve('../src/services/project-client.js'), 'utf8'), /material-statistics/);
assert.match(fs.readFileSync(require.resolve('../server.js'), 'utf8'), /generateMaterialStatistics/);

console.log('Sprint 08 Task 05 tests passed');
