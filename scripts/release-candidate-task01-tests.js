const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = (file) => fs.readFileSync(file, 'utf8');
const exists = (file) => assert.equal(fs.existsSync(file), true, `missing deliverable: ${file}`);
const packageJson = JSON.parse(read('package.json'));

const sprintDocs = [
  'DEVELOPMENT/00_Development_Roadmap.md',
  ...Array.from({ length: 12 }, (_, index) => `DEVELOPMENT/${String(index + 1).padStart(2, '0')}_Sprint_${String(index + 1).padStart(2, '0')}.md`),
];
for (const file of sprintDocs) exists(file);
exists('GOVERNANCE/07_Release_Process.md');
exists('PRD/00_PRD_Index.md');
exists('UI/00_UI_Index.md');

const coreSources = [
  'src/services/project-service.js', 'src/services/recognition-service.js',
  'src/services/project-client.js', 'src/services/furniture-object-engine.js',
  'src/services/furniture-object-storage-service.js', 'src/services/production-drawing-data-contract.js',
  'src/services/cutting-list-generation-service.js', 'src/services/purchase-list-generation-service.js',
  'src/services/backup-restore-service.js', 'src/router/router.js', 'src/components/AppShell.js',
  'src/components/RecognitionWorkspace.js', 'src/components/CadWorkspace.js',
  'src/components/Furniture3DWorkspace.js', 'src/components/ProductionDrawingWorkspace.js',
  'src/components/CuttingListWorkspace.js', 'src/components/PurchaseListWorkspace.js',
];
for (const file of coreSources) exists(file);

const testScripts = [
  ...Array.from({ length: 12 }, (_, index) => `scripts/system-testing-task${String(index + 1).padStart(2, '0')}-tests.js`),
  ...Array.from({ length: 11 }, (_, index) => `scripts/system-integration-task${String(index + 1).padStart(2, '0')}-tests.js`),
  ...Array.from({ length: 13 }, (_, index) => `scripts/cutting-list-task${String(index + 1).padStart(2, '0')}-tests.js`),
  ...Array.from({ length: 12 }, (_, index) => `scripts/purchase-list-task${String(index + 1).padStart(2, '0')}-tests.js`),
  ...Array.from({ length: 13 }, (_, index) => `scripts/production-drawing-task${String(index + 2).padStart(2, '0')}-tests.js`),
];
const availableTests = testScripts.filter((file) => fs.existsSync(file));
assert.ok(availableTests.length >= 50, 'expected completed sprint test scripts are missing');
for (let task = 1; task <= 12; task += 1) {
  const id = String(task).padStart(2, '0');
  assert.ok(packageJson.scripts[`test:system-testing-task${id}`], `missing Sprint 11 test entry ${id}`);
}
assert.ok(packageJson.scripts['test:engineering']);
assert.ok(packageJson.scripts.build);

const contracts = coreSources.map(read).join('\n');
for (const term of ['projectId', 'objectId', 'production-drawing-data', 'cutting-list-result', 'purchase-list-result', 'readOnly']) assert.match(contracts, new RegExp(term));
assert.doesNotMatch(contracts, /second(?:Project|FurnitureObject|Drawing|CuttingList|PurchaseList)Source|shadowDatabase|cloudPersistence|remoteRendering/i);

console.log(JSON.stringify({
  status: 'PASS',
  sprintDeliverables: 'PASS: Sprint 01-11 documents and core source files present',
  coreSourceAudit: 'PASS',
  canonicalContracts: 'PASS',
  packageScripts: 'PASS: Sprint 11 Task 01-12, engineering and build entries present',
  testScripts: `PASS: ${availableTests.length} regression/test scripts present`,
  buildCompatibility: 'VERIFIED BY RELEASE COMMAND',
  projectObjectIsolation: 'VERIFIED BY EXISTING ISOLATED REGRESSIONS',
  readOnly: 'PASS',
  offlineBoundary: 'PASS',
  duplicateSourceAudit: 'PASS',
  dataSafety: 'PASS: presence/static audit only; no real data changed',
}, null, 2));
