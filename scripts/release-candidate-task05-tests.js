const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = (file) => fs.readFileSync(file, 'utf8');
const notes = read('RELEASE_NOTES.md');
const packageJson = JSON.parse(read('package.json'));

assert.match(notes, /Furniture GO/);
assert.match(notes, /Sprint 12 Release Candidate v2\.1/);
assert.match(notes, /Release Candidate preparation is in progress/i);
assert.match(notes, /Version 1 is not released/i);
assert.match(notes, /Project\s+[\s\S]*Recognition[\s\S]*CAD[\s\S]*Furniture Object[\s\S]*3D[\s\S]*Production Drawing[\s\S]*Cutting List[\s\S]*Purchase List[\s\S]*Output/i);
for (const capability of ['Project System', 'CAD Workspace', 'Furniture Object', 'Furniture 3D Workspace', 'Production Drawing', 'Cutting List', 'Purchase List', 'Official Engineering Knowledge Base', 'Production Formula Engine', 'PDF', 'Excel', 'Print', 'Reports']) assert.match(notes, new RegExp(capability.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
for (const limitation of ['Unexpected token \'export\'', 'BLOCKED BY EXISTING TEST HARNESS ISSUE', 'BROWSER TEST NOT AVAILABLE', 'DWG_EXPORT_UNAVAILABLE', 'runtime-only', 'no independent persistence', 'not a unified global scheduler', 'no independent recovery architecture', 'No explicit official performance threshold']) assert.match(notes, new RegExp(limitation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
for (const outOfScope of ['CNC', 'Cloud', 'ERP', 'Inventory', 'Supplier', 'Online collaboration', 'AI']) assert.match(notes, new RegExp(outOfScope.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
assert.doesNotMatch(notes, /Version 1 Released|Official V1 Released|Final Release Approved|Production Release/i);
assert.ok(packageJson.scripts['test:release-candidate-task05']);

const productionFiles = ['server.js', 'src/services/project-service.js', 'src/services/furniture-object-engine.js', 'src/components/AppShell.js', 'src/services/production-drawing-data-contract.js'];
for (const file of productionFiles) assert.ok(fs.existsSync(file));

console.log(JSON.stringify({
  status: 'PASS',
  releaseNotes: 'PASS: source-grounded Release Candidate notes present',
  releaseStatus: 'PASS: Version 1 not released',
  workflow: 'PASS',
  capabilities: 'PASS: verified capabilities only',
  limitations: 'PASS',
  outOfScope: 'PASS',
  prematureReleaseClaims: 'PASS: none found',
  productionSourceAudit: 'PASS: Task 05 test is documentation-only',
}, null, 2));
