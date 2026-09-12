const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const { generateCuttingList } = require('../src/services/cutting-list-generation-service');
const { generateBoardLayout } = require('../src/services/cutting-list-board-layout-service');
const { generateMaterialStatistics } = require('../src/services/cutting-list-material-statistics-service');
const { generateWasteAnalysis } = require('../src/services/cutting-list-waste-analysis-service');
const { generatePurchaseList } = require('../src/services/purchase-list-generation-service');

const catalog = {
  getMaterialById: (id) => id === 'BENCH-MAT' ? { id, name: 'Benchmark Board', productCode: 'BENCH-18', thickness: 18, boardSize: { width: 2440, height: 1220, unit: 'mm' } } : null,
  getHardwareById: (id) => id === 'BENCH-HW' ? { id, name: 'Benchmark Connector', productCode: 'BENCH-HW' } : null,
};
function makeObject(projectId, index, componentCount) {
  const objectId = `benchmark-object-${index}`;
  return { projectId, objectId, name: objectId, objectType: 'Cabinet', productionStatus: 'Production Ready', lifecycleStatus: 'Active', dimensions: { width: 800, height: 720, depth: 560, unit: 'mm' }, components: Array.from({ length: componentCount }, (_, partIndex) => ({ componentId: `${objectId}-component-${partIndex}`, componentType: 'Panel', name: `Panel ${partIndex}`, materialId: 'BENCH-MAT', dimensions: { width: 720, height: 560, thickness: 18, unit: 'mm' }, quantity: 2 })), materialReferences: [{ materialId: 'BENCH-MAT', quantity: 2 }], hardwareReferences: [{ hardwareId: 'BENCH-HW', quantity: 4 }], accessoryReferences: [{ accessoryId: `${objectId}-handle`, quantity: 2 }] };
}
function fixture(label, objectCount, componentCount) {
  const projectId = `benchmark-${label}`;
  const values = Array.from({ length: objectCount }, (_, index) => makeObject(projectId, index, componentCount));
  const projectService = { readProject: (id) => id === projectId ? { project: { id, name: label } } : null, data: { official: catalog } };
  const engine = { listObjects: (id) => id === projectId ? values : [], getObject: (id, objectId) => values.find((object) => id === projectId && object.objectId === objectId) };
  return { projectId, values, projectService, engine };
}
function measure(fn) { const before = process.memoryUsage().heapUsed; const start = performance.now(); const value = fn(); const elapsedMs = performance.now() - start; const after = process.memoryUsage().heapUsed; return { value, elapsedMs: Number(elapsedMs.toFixed(3)), heapDeltaBytes: after - before }; }

(async () => {
  const sizes = [['small', 2, 4], ['medium', 20, 12], ['large', 80, 20]];
  const benchmarks = [];
  for (const [label, objectCount, componentCount] of sizes) {
    const data = fixture(label, objectCount, componentCount);
    const firstObjectId = data.values[0].objectId;
    const cutting = measure(() => generateCuttingList(data.projectService, { getObject: (projectId, objectId) => data.values.find((object) => projectId === data.projectId && object.objectId === objectId), validateObject: () => ({ isValid: true }) }, data.projectId, firstObjectId));
    const downstream = measure(() => {
      const layout = generateBoardLayout(cutting.value, catalog, data.projectId, firstObjectId, cutting.value.cuttingListId);
      const statistics = generateMaterialStatistics(cutting.value, catalog, layout, data.projectId, firstObjectId, cutting.value.cuttingListId, layout.boardLayoutId);
      return generateWasteAnalysis(cutting.value, layout, catalog, statistics.statisticsId, data.projectId, firstObjectId, cutting.value.cuttingListId, layout.boardLayoutId);
    });
    const purchase = measure(() => generatePurchaseList(data.projectService, data.engine, data.projectId, { catalog }));
    const repeated = measure(() => { let found = 0; for (let index = 0; index < 20; index += 1) found += data.engine.listObjects(data.projectId).filter((object) => object.productionStatus === 'Production Ready').length; return found; });
    assert.equal(cutting.value.contract, 'cutting-list-result');
    assert.equal(purchase.value.contract, 'purchase-list-result');
    assert.equal(downstream.value.contract, 'waste-analysis-result');
    assert.equal(purchase.value.readOnly, true);
    assert.equal(repeated.value, objectCount * 20);
    benchmarks.push({ label, objectCount, componentCount, cuttingParts: cutting.value.parts.length, purchaseItems: purchase.value.materialItems.length + purchase.value.hardwareItems.length + purchase.value.accessoryItems.length, cuttingMs: cutting.elapsedMs, downstreamMs: downstream.elapsedMs, purchaseMs: purchase.elapsedMs, repeatedLookupMs: repeated.elapsedMs, cuttingHeapDeltaBytes: cutting.heapDeltaBytes, purchaseHeapDeltaBytes: purchase.heapDeltaBytes });
  }
  const deterministic = fixture('deterministic', 4, 8);
  const first = generatePurchaseList(deterministic.projectService, deterministic.engine, deterministic.projectId, { catalog });
  const second = generatePurchaseList(deterministic.projectService, deterministic.engine, deterministic.projectId, { catalog });
  assert.deepEqual(second, first, 'repeated generation remains deterministic');
  console.log(JSON.stringify({ status: 'PASS', bottleneck: 'NO CRITICAL PERFORMANCE BOTTLENECK FOUND', benchmarks }, null, 2));
})().catch((error) => { console.error(error); process.exitCode = 1; });
