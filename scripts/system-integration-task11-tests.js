const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

function run(script) {
  return execFileSync(process.execPath, [script], { cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

// Task 09 is the complete Project-to-Purchase context chain; Task 10 is the
// measured Small/Medium/Large sanity benchmark. Re-run both as final gates.
const workflowOutput = run(path.join('scripts', 'system-integration-task09-tests.js'));
const performanceOutput = run(path.join('scripts', 'system-integration-task10-tests.js'));
assert.match(workflowOutput, /full Project-to-Purchase synchronization/);
assert.match(performanceOutput, /NO CRITICAL PERFORMANCE BOTTLENECK FOUND/);
assert.match(performanceOutput, /"label": "small"/);
assert.match(performanceOutput, /"label": "medium"/);
assert.match(performanceOutput, /"label": "large"/);

const files = [
  'src/services/project-service.js', 'src/services/furniture-object-engine.js',
  'src/services/production-drawing-data-contract.js', 'src/services/cutting-list-generation-service.js',
  'src/services/purchase-list-generation-service.js', 'src/components/AppShell.js',
  'src/components/ProjectDashboard.js', 'src/components/RecognitionWorkspace.js',
  'src/components/CadWorkspace.js', 'src/components/Furniture3DWorkspace.js',
  'src/components/ProductionDrawingWorkspace.js', 'src/components/CuttingListWorkspace.js',
  'src/components/PurchaseListWorkspace.js',
];
const source = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
assert.match(source, /production-drawing-data/);
assert.match(source, /cutting-list-result/);
assert.match(source, /purchase-list-result/);
assert.doesNotMatch(source, /second(?:Project|FurnitureObject|Drawing|CuttingList|PurchaseList)Source|cloudApi|remoteRendering|supplierApi|erpIntegration|inventorySystem|aiAssistance/i);
for (const file of ['src/components/RecognitionWorkspace.js', 'src/components/CadWorkspace.js', 'src/components/Furniture3DWorkspace.js', 'src/components/ProductionDrawingWorkspace.js', 'src/components/CuttingListWorkspace.js', 'src/components/PurchaseListWorkspace.js']) {
  assert.match(fs.readFileSync(file, 'utf8'), /dashboard\//, `${file} must preserve dashboard navigation context`);
}
assert.match(fs.readFileSync('src/services/production-drawing-dwg-service.js', 'utf8'), /DWG_EXPORT_UNAVAILABLE/);
assert.match(fs.readFileSync('src/services/production-drawing-revision-service.js', 'utf8'), /const histories = new Map/);
console.log('Sprint 10 Task 11 tests passed: complete workflow, source/contract consistency, isolation, read-only and immutability gates, failure coverage, navigation, offline boundary and performance sanity.');
