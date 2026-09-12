const assert = require('node:assert/strict');
const fs = require('node:fs');
const { generateBoardLayout } = require('../src/services/cutting-list-board-layout-service');

const materialA = { id: 'MAT-A', officialName: 'Official Board A', boardSize: { width: 100, height: 100, unit: 'mm' }, thickness: 18 };
const materialB = { id: 'MAT-B', officialName: 'Official Board B', boardSize: { width: 120, height: 80, unit: 'mm' }, thickness: 16 };
const catalog = { getMaterialById: (id) => ({ 'MAT-A': materialA, 'MAT-B': materialB }[id] || null), listEngineeringRecords: () => [] };
const base = (parts = []) => ({ schemaVersion: 1, contract: 'cutting-list-result', cuttingListId: 'cutting-list:p1:o1', project: { projectId: 'p1', name: 'Project 1' }, furnitureObject: { objectId: 'o1', name: 'Cabinet' }, parts, validation: { valid: true }, status: 'Generated', readOnly: true });
const part = (id, dimensions, quantity = 1, material = materialA, extra = {}) => ({ partId: id, componentId: `component-${id}`, name: id, material: { id: material.id, name: material.officialName }, dimensions, quantity, grainDirection: null, ...extra });

const result = generateBoardLayout(base([part('p-1', { width: 60, height: 60, thickness: 18 }, 3)]), catalog, 'p1', 'o1', 'cutting-list:p1:o1');
assert.equal(result.contract, 'board-layout-result');
assert.equal(result.readOnly, true);
assert.equal(result.board.width, 100);
assert.equal(result.board.thickness, 18);
assert.equal(result.layout.boards.length, 3);
assert.equal(result.parts.length, 3);
assert.equal(result.layout.algorithm, 'deterministic-sequential-no-optimization');
assert.equal(result.layout.kerf, 'not-defined');
assert.equal(result.validation.valid, true);

for (const board of result.layout.boards) {
  for (let i = 0; i < board.parts.length; i += 1) for (let j = i + 1; j < board.parts.length; j += 1) {
    const left = board.parts[i]; const right = board.parts[j];
    assert.ok(left.x + left.width <= right.x || right.x + right.width <= left.x || left.y + left.height <= right.y || right.y + right.height <= left.y, 'parts must not overlap');
  }
}

const mixed = generateBoardLayout(base([part('a', { width: 20, height: 20 }, 1, materialA), part('b', { width: 20, height: 20 }, 1, materialB)]), catalog);
assert.equal(mixed.layout.boards.length, 2, 'different materials must not share boards');
assert.equal(mixed.material, null);

const grain = generateBoardLayout(base([part('grain', { width: 20, height: 30 }, 1, materialA, { grainDirection: 'vertical' })]), catalog);
assert.equal(grain.parts[0].grainDirection, 'vertical');
assert.equal(grain.parts[0].rotation, 0);

const rotated = generateBoardLayout(base([part('rotatable', { width: 120, height: 50 }, 1, materialA, { allowRotation: true })]), catalog);
assert.equal(rotated.status, 'INCOMPLETE');
assert.equal(rotated.layout.unplacedParts[0].reason, 'PART_TOO_LARGE_FOR_BOARD');

assert.throws(() => generateBoardLayout(base([part('bad', { width: 20, height: 20 }, 1, { id: 'MAT-X', officialName: 'Unknown' })]), catalog), (error) => error.code === 'UNKNOWN_MATERIAL');
assert.throws(() => generateBoardLayout(base([part('bad', { width: 20, height: 20 }, 1, { id: 'MAT-NO-SIZE', officialName: 'No Board Size' })]), { getMaterialById: () => ({ id: 'MAT-NO-SIZE', officialName: 'No Board Size', thickness: 18 }), listEngineeringRecords: () => [] }), (error) => error.code === 'BOARD_SIZE_MISSING');
assert.throws(() => generateBoardLayout(base([part('bad', { width: 20, height: 20 }, 1, materialA)]), catalog, 'p2'), (error) => error.code === 'PROJECT_ISOLATION_VIOLATION');
assert.throws(() => generateBoardLayout(base([part('bad', { width: 20, height: 20 }, 1, materialA)]), catalog, 'p1', 'o2'), (error) => error.code === 'OBJECT_ISOLATION_VIOLATION');
assert.throws(() => generateBoardLayout(base([part('bad', { width: 20, height: 20 }, 1, materialA)]), catalog, 'p1', 'o1', 'other'), (error) => error.code === 'CUTTING_LIST_MISMATCH');

const immutable = base([part('immutable', { width: 20, height: 20 })]);
const snapshot = JSON.stringify(immutable);
generateBoardLayout(immutable, catalog);
assert.equal(JSON.stringify(immutable), snapshot, 'input Cutting List must remain immutable');

const serviceSource = fs.readFileSync(require.resolve('../src/services/cutting-list-board-layout-service'), 'utf8');
assert.doesNotMatch(serviceSource, /purchaseList|cuttingOptimization|cnc|pdf|excel|wasteCalculation|materialStatistics/i);
assert.match(serviceSource, /boardSize/);
assert.match(serviceSource, /getMaterialById/);
assert.match(serviceSource, /readOnly: true/);
assert.match(fs.readFileSync(require.resolve('../src/services/project-client.js'), 'utf8'), /cutting-list\/board-layout/);
assert.match(fs.readFileSync(require.resolve('../server.js'), 'utf8'), /generateBoardLayout/);
assert.match(fs.readFileSync(require.resolve('../src/components/CuttingListWorkspace.js'), 'utf8'), /data-cutting-list-layout/);

console.log('Sprint 08 Task 04 tests passed');
