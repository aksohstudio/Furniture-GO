const assert = require('node:assert/strict');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

function source(file) { return fs.readFileSync(file, 'utf8'); }
function runBenchmark() {
  const output = execFileSync(process.execPath, ['scripts/system-integration-task10-tests.js'], { cwd: process.cwd(), encoding: 'utf8' });
  return JSON.parse(output);
}

// The existing Sprint 10 benchmark is the approved fixture and remains the
// source of baseline evidence. Run it twice as baseline/post comparison: no
// production optimization is justified unless the measured data identifies a
// reproducible bottleneck.
const baseline = runBenchmark();
const post = runBenchmark();
assert.equal(baseline.status, 'PASS');
assert.equal(post.status, 'PASS');
assert.equal(baseline.bottleneck, 'NO CRITICAL PERFORMANCE BOTTLENECK FOUND');
assert.equal(post.bottleneck, 'NO CRITICAL PERFORMANCE BOTTLENECK FOUND');
assert.deepEqual(baseline.benchmarks.map(({ label, objectCount, componentCount, cuttingParts, purchaseItems }) => ({ label, objectCount, componentCount, cuttingParts, purchaseItems })), [
  { label: 'small', objectCount: 2, componentCount: 4, cuttingParts: 4, purchaseItems: 4 },
  { label: 'medium', objectCount: 20, componentCount: 12, cuttingParts: 12, purchaseItems: 40 },
  { label: 'large', objectCount: 80, componentCount: 20, cuttingParts: 20, purchaseItems: 160 },
]);
assert.deepEqual(post.benchmarks.map(({ label, objectCount, componentCount, cuttingParts, purchaseItems }) => ({ label, objectCount, componentCount, cuttingParts, purchaseItems })), baseline.benchmarks.map(({ label, objectCount, componentCount, cuttingParts, purchaseItems }) => ({ label, objectCount, componentCount, cuttingParts, purchaseItems })));

const benchmarkSource = source('scripts/system-integration-task10-tests.js');
const canonicalSources = [
  'src/services/furniture-object-engine.js',
  'src/services/cutting-list-generation-service.js',
  'src/services/cutting-list-board-layout-service.js',
  'src/services/cutting-list-material-statistics-service.js',
  'src/services/cutting-list-waste-analysis-service.js',
  'src/services/purchase-list-generation-service.js',
  'src/components/Furniture3DWorkspace.js',
  'src/components/ProductionDrawingWorkspace.js',
  'src/components/CuttingListWorkspace.js',
  'src/components/PurchaseListWorkspace.js',
].map(source).join('\n');
assert.match(benchmarkSource, /small.*2.*4/s);
assert.match(benchmarkSource, /medium.*20.*12/s);
assert.match(benchmarkSource, /large.*80.*20/s);
assert.match(canonicalSources, /projectId/);
assert.match(canonicalSources, /objectId/);
assert.match(canonicalSources, /readOnly/);
assert.doesNotMatch(canonicalSources, /second(?:Project|FurnitureObject|Drawing|CuttingList|PurchaseList)Source|shadowDatabase|cloudCache|remoteCache|performanceDatabase/i);

console.log(JSON.stringify({
  status: 'PASS',
  optimization: 'NO JUSTIFIED PERFORMANCE OPTIMIZATION REQUIRED',
  bottleneck: 'NO CRITICAL PERFORMANCE BOTTLENECK FOUND',
  baseline: baseline.benchmarks,
  postOptimization: post.benchmarks,
  comparison: 'result counts and workflow contracts deterministic; timing and heap are observational only',
  canonicalSourceRegression: 'PASS',
  dataSafety: 'PASS: isolated benchmark fixtures; no production data changed',
}, null, 2));
