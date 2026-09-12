const assert = require('node:assert/strict');
const fs = require('node:fs');
const { generatePartTrace } = require('../src/services/cutting-list-part-trace-service');

const object = { projectId: 'p1', objectId: 'o1', name: 'Cabinet', objectType: 'Base Cabinet', productionStatus: 'Production Ready', dimensions: { width: 600, height: 720, depth: 560 }, components: [{ componentId: 'c1', name: 'Left Side', componentType: 'Panel', materialId: 'MAT-1' }] };
const cuttingList = { contract: 'cutting-list-result', cuttingListId: 'cut:p1:o1', project: { projectId: 'p1', name: 'Project' }, furnitureObject: { objectId: 'o1' }, parts: [{ partId: 'part-1', componentId: 'c1', name: 'Left Side', type: 'Panel', material: { id: 'MAT-1', name: 'Board' }, dimensions: { width: 560, height: 720, thickness: 18 }, quantity: 2, grainDirection: 'vertical', edgeBanding: { front: '1mm' }, processing: [{ type: 'drill' }], validation: { status: 'confirmed' } }], readOnly: true };
const catalog = { getMaterialById: (id) => id === 'MAT-1' ? { id, officialName: 'Official Board', productCode: 'B18', thickness: 18 } : null };
const layout = { contract: 'board-layout-result', boardLayoutId: 'layout:p1:o1', project: { projectId: 'p1' }, furnitureObject: { objectId: 'o1' }, cuttingListId: 'cut:p1:o1', layout: { boards: [{ boardId: 'board-1', board: { width: 2800, height: 2070, thickness: 18 }, parts: [{ partId: 'part-1', x: 10, y: 20, width: 560, height: 720, rotation: 0 }] }] }, readOnly: true };
const statistics = { contract: 'material-statistics-result', statisticsId: 'stats:p1:o1', project: { projectId: 'p1' }, furnitureObject: { objectId: 'o1' }, cuttingListId: 'cut:p1:o1', materials: [{ materialId: 'MAT-1' }], readOnly: true };
const waste = { contract: 'waste-analysis-result', wasteAnalysisId: 'waste:p1:o1', project: { projectId: 'p1' }, furnitureObject: { objectId: 'o1' }, cuttingListId: 'cut:p1:o1', materials: [{ materialId: 'MAT-1' }], readOnly: true };

const result = generatePartTrace(cuttingList, object, catalog, layout, statistics, waste, 'p1', 'o1', 'cut:p1:o1', 'part-1', 'layout:p1:o1', 'stats:p1:o1', 'waste:p1:o1');
assert.equal(result.contract, 'part-trace-result');
assert.equal(result.readOnly, true);
assert.equal(result.project.projectId, 'p1');
assert.equal(result.furnitureObject.objectId, 'o1');
assert.equal(result.component.componentId, 'c1');
assert.equal(result.cuttingPart.partId, 'part-1');
assert.equal(result.material.materialId, 'MAT-1');
assert.equal(result.boardPlacement.boardId, 'board-1');
assert.equal(result.boardPlacement.position.x, 10);
assert.equal(result.statistics.statisticsId, 'stats:p1:o1');
assert.equal(result.waste.wasteAnalysisId, 'waste:p1:o1');
assert.deepEqual(result.sourceChain.slice(0, 5), ['Project', 'Furniture Object', 'Component', 'Cutting List Part', 'Material']);

const unavailable = generatePartTrace(cuttingList, object, catalog, null, null, null, 'p1', 'o1', 'cut:p1:o1', 'part-1');
assert.equal(unavailable.boardPlacement.code, 'BOARD_LAYOUT_NOT_AVAILABLE');
assert.equal(unavailable.statistics.material.code, 'MATERIAL_STATISTICS_NOT_AVAILABLE');
assert.equal(unavailable.waste.material.code, 'WASTE_ANALYSIS_NOT_AVAILABLE');
assert.throws(() => generatePartTrace(cuttingList, object, catalog, null, null, null, 'p1', 'o1', 'cut:p1:o1', 'missing'), (error) => error.code === 'PART_NOT_FOUND');
assert.throws(() => generatePartTrace(cuttingList, { ...object, components: [] }, catalog, null, null, null, 'p1', 'o1', 'cut:p1:o1', 'part-1'), (error) => error.code === 'COMPONENT_NOT_FOUND');
assert.throws(() => generatePartTrace(cuttingList, { ...object, projectId: 'p2' }, catalog, null, null, null, 'p1', 'o1', 'cut:p1:o1', 'part-1'), (error) => error.code === 'PROJECT_OBJECT_MISMATCH');
assert.throws(() => generatePartTrace(cuttingList, object, catalog, null, null, null, 'p1', 'o2', 'cut:p1:o1', 'part-1'), (error) => error.code === 'PROJECT_OBJECT_MISMATCH');
assert.throws(() => generatePartTrace(cuttingList, object, catalog, null, null, null, 'p1', 'o1', 'other', 'part-1'), (error) => error.code === 'CUTTING_LIST_MISMATCH');
assert.throws(() => generatePartTrace(cuttingList, object, catalog, { ...layout, cuttingListId: 'other' }, null, null, 'p1', 'o1', 'cut:p1:o1', 'part-1'), (error) => error.code === 'BOARD_LAYOUT_MISMATCH');
assert.throws(() => generatePartTrace(cuttingList, object, { getMaterialById: () => null }, null, null, null, 'p1', 'o1', 'cut:p1:o1', 'part-1'), (error) => error.code === 'UNKNOWN_MATERIAL');
assert.throws(() => generatePartTrace({ ...cuttingList, parts: [{ ...cuttingList.parts[0], dimensions: { width: 0, height: 1 } }] }, object, catalog, null, null, null, 'p1', 'o1', 'cut:p1:o1', 'part-1'), (error) => error.code === 'DIMENSIONS_INVALID');

const snapshot = JSON.stringify({ cuttingList, object, layout, statistics, waste });
generatePartTrace(cuttingList, object, catalog, layout, statistics, waste, 'p1', 'o1', 'cut:p1:o1', 'part-1');
assert.equal(JSON.stringify({ cuttingList, object, layout, statistics, waste }), snapshot);

const source = fs.readFileSync(require.resolve('../src/services/cutting-list-part-trace-service'), 'utf8');
assert.doesNotMatch(source, /recalculate|optimization|purchase|inventory|erp|cnc|printing|pdf|excel|nesting|binPacking|kerf|saw/i);
assert.match(source, /sourceChain/);
assert.match(source, /readOnly: true/);
assert.match(fs.readFileSync(require.resolve('../server.js'), 'utf8'), /generatePartTrace/);
assert.match(fs.readFileSync(require.resolve('../src/services/project-client.js'), 'utf8'), /part-trace/);
assert.match(fs.readFileSync(require.resolve('../src/components/CuttingListWorkspace.js'), 'utf8'), /data-cutting-list-part-trace/);

console.log('Sprint 08 Task 08 tests passed');
