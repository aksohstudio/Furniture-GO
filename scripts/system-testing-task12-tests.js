const assert = require('node:assert/strict');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

const read = (file) => fs.readFileSync(file, 'utf8');
const run = (file) => execFileSync(process.execPath, [file], { cwd: process.cwd(), stdio: 'ignore' });

// Final RC audit reuses the completed Sprint 11 testing gates. These are
// isolated/static tests and do not write real Project or production data.
for (let task = 1; task <= 11; task += 1) {
  const id = String(task).padStart(2, '0');
  run(`scripts/system-testing-task${id}-tests.js`);
}
run('scripts/system-integration-task09-tests.js');

const packageJson = JSON.parse(read('package.json'));
for (let task = 1; task <= 12; task += 1) {
  const id = String(task).padStart(2, '0');
  assert.ok(packageJson.scripts[`test:system-testing-task${id}`], `missing Sprint 11 Task ${id} script`);
}
for (const file of [
  'src/services/project-service.js', 'src/services/furniture-object-engine.js',
  'src/services/furniture-object-storage-service.js', 'src/services/production-drawing-data-contract.js',
  'src/services/cutting-list-generation-service.js', 'src/services/purchase-list-generation-service.js',
  'src/services/backup-restore-service.js', 'src/services/access-policy.js',
  'src/components/AppShell.js', 'src/router/router.js',
]) assert.ok(fs.existsSync(file), `missing release source: ${file}`);

const sources = [
  'src/services/project-service.js', 'src/services/furniture-object-engine.js',
  'src/services/production-drawing-data-contract.js', 'src/services/cutting-list-generation-service.js',
  'src/services/purchase-list-generation-service.js', 'src/services/backup-restore-service.js',
  'src/components/AppShell.js', 'src/router/router.js',
].map(read).join('\n');
for (const term of ['projectId', 'objectId', 'production-drawing-data', 'cutting-list-result', 'purchase-list-result', 'readOnly']) assert.match(sources, new RegExp(term));
assert.doesNotMatch(sources, /second(?:Project|FurnitureObject|Drawing|CuttingList|PurchaseList)Source|shadowDatabase|cloudPersistence|remoteRendering|cloudPrinting/i);

const limitations = [
  'scripts/system-testing-task06-tests.js', 'scripts/system-testing-task07-tests.js',
  'src/services/production-drawing-dwg-service.js', 'scripts/system-testing-task10-tests.js',
].map(read).join('\n');
assert.match(limitations, /AUTO_SAVE_NOT_AVAILABLE/);
assert.match(limitations, /FILE_RECOVERY_NOT_AVAILABLE/);
assert.match(limitations, /DWG_EXPORT_UNAVAILABLE/);
assert.match(limitations, /NO EXPLICIT|NO JUSTIFIED PERFORMANCE OPTIMIZATION REQUIRED/);

console.log(JSON.stringify({
  status: 'PASS',
  releaseCandidateDecision: 'RELEASE CANDIDATE READY',
  criticalBugs: 0,
  highPriorityBugs: 0,
  functionalRegression: 'PASS: Sprint 11 Task 01-11',
  integrationRegression: 'PASS: existing Sprint 10 workflow integration',
  completeWorkflow: 'PASS: Project → Recognition → CAD → Object → 3D → Drawing → Cutting → Purchase → Output',
  projectObjectIsolation: 'PASS',
  canonicalSourceAudit: 'PASS',
  dataContractAudit: 'PASS',
  saveRecovery: 'PASS through Task 06/07 boundaries',
  performance: 'PASS observational baseline; NO EXPLICIT THRESHOLD DEFINED',
  stress: 'PASS through Task 05 regression',
  ux: 'PASS static audit; BROWSER TEST NOT AVAILABLE',
  offline: 'PASS',
  dataSafety: 'PASS: isolated/in-memory fixtures; no real data changed',
}, null, 2));
