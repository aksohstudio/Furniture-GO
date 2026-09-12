const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = (file) => fs.readFileSync(file, 'utf8');
const changelog = read('CHANGELOG.md');
const packageJson = JSON.parse(read('package.json'));

assert.ok(fs.existsSync('CHANGELOG.md'), 'CHANGELOG.md is required');
assert.match(changelog, /Furniture GO/);
for (const entry of [
  'Sprint 01', 'Sprint 02', 'Sprint 03', 'Sprint 04', 'Sprint 05', 'Sprint 06',
  'Sprint 07', 'Sprint 08', 'Sprint 09', 'Sprint 10', 'Sprint 11',
  'Project', 'Recognition', 'CAD', 'Furniture Object', '3D', 'Production Drawing',
  'Cutting List', 'Purchase List', 'Official Engineering Knowledge Base',
  'Production Formula Engine', 'Task 01', 'Task 02', 'Task 03', 'Task 04',
  'Task 05', 'Task 06', 'Completed', 'Changed', 'Fixed', 'Verified',
  'Known Limitations', 'Release Candidate preparation',
]) assert.match(changelog, new RegExp(entry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `CHANGELOG missing ${entry}`);

for (const limitation of [
  "Unexpected token 'export'", 'BLOCKED BY EXISTING TEST HARNESS ISSUE',
  'CommonJS package configuration', 'BROWSER TEST NOT AVAILABLE',
  'Sprint 07 Task 14', 'Sprint 08 Task 02', 'DWG_EXPORT_UNAVAILABLE',
  'runtime-only', 'no independent persistence architecture',
  'not a unified global scheduler', 'no independent recovery architecture',
  'No explicit official performance threshold',
]) assert.match(changelog, new RegExp(limitation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `Known limitation missing: ${limitation}`);

for (const outOfScope of ['CNC', 'cloud', 'ERP', 'inventory', 'supplier', 'online collaboration', 'AI', 'CRM', 'purchase orders', 'quotations', 'accounting']) {
  assert.match(changelog, new RegExp(outOfScope.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `Out-of-scope item missing: ${outOfScope}`);
}

assert.match(changelog, /Release Candidate preparation is in progress/i);
assert.match(changelog, /Version 1 has not been officially released/i);
assert.doesNotMatch(changelog, /Version 1 Released|Official V1 Released|Final Acceptance completed|Release approved|Official Release/i);
assert.match(changelog, /Task 07.*Generate Release Build/i);
assert.match(changelog, /Task 08.*Generate Installer Package/i);
assert.match(changelog, /Task 09.*Final Acceptance Testing/i);
assert.match(changelog, /Task 10.*Approve Version 1 Release/i);
assert.equal(packageJson.version, '1.0.0', 'Task 06 must not change package version');
assert.ok(packageJson.scripts['test:release-candidate-task06']);

for (const file of ['src/services/project-service.js', 'src/services/furniture-object-engine.js', 'src/services/production-drawing-data-contract.js']) {
  assert.ok(fs.existsSync(file), `Expected canonical production source missing: ${file}`);
}

console.log(JSON.stringify({
  status: 'PASS',
  changelog: 'PASS: project history and RC status recorded',
  sprintHistory: 'PASS: Sprint 01-11 milestones present',
  sprint12History: 'PASS: Task 01-06 recorded; Task 07-10 explicitly not started',
  limitations: 'PASS',
  outOfScope: 'PASS',
  prematureReleaseClaims: 'PASS: none found',
  packageVersion: 'PASS: unchanged at 1.0.0',
  scopeSafety: 'PASS: documentation/static test only',
}, null, 2));
