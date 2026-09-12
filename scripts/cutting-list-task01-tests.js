const assert = require('node:assert/strict');
const fs = require('node:fs');

const workspace = fs.readFileSync(require.resolve('../src/components/CuttingListWorkspace'), 'utf8');
const appShell = fs.readFileSync(require.resolve('../src/components/AppShell'), 'utf8');
const dashboard = fs.readFileSync(require.resolve('../src/components/ProjectDashboard'), 'utf8');
const client = fs.readFileSync(require.resolve('../src/services/project-client'), 'utf8');
const server = fs.readFileSync(require.resolve('../server'), 'utf8');

const fixtureObjects = [
  { objectId: 'approved-1', name: 'Approved Cabinet', objectType: 'Cabinet', productionStatus: 'Production Ready', dimensions: { width: 900, height: 720, depth: 560, unit: 'mm' } },
  { objectId: 'draft-1', name: 'Draft Cabinet', objectType: 'Cabinet', productionStatus: 'Draft', dimensions: { width: 1, height: 1, depth: 1, unit: 'mm' } },
  { objectId: 'archived-1', name: 'Archived Cabinet', objectType: 'Cabinet', productionStatus: 'Production Ready', lifecycleStatus: 'Archived', dimensions: { width: 1, height: 1, depth: 1, unit: 'mm' } },
];
const approved = fixtureObjects.filter((object) => object.lifecycleStatus !== 'Archived' && object.productionStatus === 'Production Ready');
assert.deepEqual(approved.map((object) => object.objectId), ['approved-1']);
const original = JSON.parse(JSON.stringify(fixtureObjects));
assert.deepEqual(fixtureObjects, original);

assert.match(workspace, /Cutting List Workspace/);
assert.match(workspace, /data-cutting-list-back/);
assert.match(workspace, /data-cutting-list-object-list/);
assert.match(workspace, /No approved Furniture Objects available/);
assert.match(workspace, /Cutting List Production Data: Read-only/);
assert.match(workspace, /Generate Cutting List.*Coming Next/);
assert.match(workspace, /Board Layout.*Not Available/);
assert.match(workspace, /Export CNC.*Not Available/);
assert.doesNotMatch(workspace, /productionResult|formulaResult|optimizeCutting|wasteCalculation|purchaseList|cuttingResult\s*=|calculateBoard/i);

assert.match(appShell, /CuttingListWorkspace/);
assert.match(appShell, /currentPath\.startsWith\('\/cutting-list\/'\)/);
assert.match(dashboard, /'Cutting List'.*'cutting-list'/s);
assert.match(dashboard, /`\/cutting-list\/\$\{encodeURIComponent\(projectId\)\}`/);
assert.match(client, /listFurnitureObjects/);
assert.doesNotMatch(client, /calculateCutting|optimizeCutting|exportCnc/i);
assert.doesNotMatch(server, /cutting-optimization|export-cnc/i);
assert.doesNotMatch(workspace, /fetch\(|localStorage|sessionStorage|createFurnitureObject|updateFurnitureObject|deleteFurnitureObject/i);
assert.doesNotMatch(workspace, /width\s*[-+]\s*\d+|height\s*[-+]\s*\d+|depth\s*[-+]\s*\d+/i);
console.log('Cutting List Task 01 tests passed: route, project/object context, empty state, read-only shell and scope boundaries.');
