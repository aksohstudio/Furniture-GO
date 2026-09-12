const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = (file) => fs.readFileSync(file, 'utf8');
const readme = read('README.md');
const sprint12 = read('DEVELOPMENT/12_Sprint_12.md');
const packageJson = JSON.parse(read('package.json'));

assert.ok(fs.existsSync('README.md'), 'README.md is required');
for (const term of [
  'Furniture GO', 'offline-first', 'Project', 'Recognition', 'CAD',
  'Furniture Object', '3D', 'Production Drawing', 'Cutting List',
  'Purchase List', 'PDF', 'XLSX', 'Excel', 'Print', 'Reports',
  'Official Engineering Knowledge Base', 'Production Formula Engine',
  'DWG_EXPORT_UNAVAILABLE', 'BROWSER TEST NOT AVAILABLE',
  'Unexpected token \'export\'', 'Version 1 has not been officially released',
]) assert.match(readme, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `README missing ${term}`);

for (const forbidden of [
  /Version 1 (is )?(officially )?released/i,
  /Version 1 release(d| available)/i,
  /supports? (Cloud|ERP|Inventory|Supplier|AI|CNC|Online collaboration)/i,
]) assert.doesNotMatch(readme, forbidden, `README contains premature/invented claim: ${forbidden}`);

for (const [task, status] of [['Task 01', 'Completed'], ['Task 02', 'Completed'], ['Task 03', 'Completed'], ['Task 04', 'In Progress']]) {
  const section = sprint12.split(`## ${task}`)[1]?.split('---')[0] || '';
  assert.match(section, new RegExp(`Status\\s+${status}`, 'i'), `${task} status mismatch`);
}
for (const task of ['Task 05', 'Task 06', 'Task 07', 'Task 08', 'Task 09', 'Task 10']) {
  const section = sprint12.split(`## ${task}`)[1]?.split('---')[0] || '';
  assert.match(section, /Status\s+Pending/i, `${task} must remain pending`);
}
assert.match(sprint12, /Version 1 Release/);
assert.ok(packageJson.scripts['test:release-candidate-task04']);

const docs = [
  'DEVELOPMENT/00_Development_Roadmap.md', 'DEVELOPMENT/01_Sprint_01.md',
  'DEVELOPMENT/11_Sprint_11.md', 'DEVELOPMENT/12_Sprint_12.md',
  'PRD/00_PRD_Index.md', 'UI/00_UI_Index.md', 'GOVERNANCE/07_Release_Process.md',
].map(read);
for (const doc of docs) assert.ok(doc.trim().length > 0);
assert.equal(fs.existsSync('CHANGELOG.md'), false, 'Task 06 changelog must not be finalized early');

console.log(JSON.stringify({
  status: 'PASS',
  readme: 'PASS: source-grounded Version 1 documentation present',
  knownLimitations: 'PASS',
  documentationReferences: 'PASS',
  sprint12Statuses: 'PASS: Task 01-03 completed, Task 04 in progress, Task 05-10 pending',
  changelog: 'NOT CREATED: reserved for Sprint 12 Task 06 / release workflow',
  prematureReleaseClaims: 'PASS: none found',
  dataSafety: 'PASS: documentation-only audit',
}, null, 2));
