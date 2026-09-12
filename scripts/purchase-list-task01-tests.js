const assert = require('node:assert/strict');
const fs = require('node:fs');

const workspace = fs.readFileSync(require.resolve('../src/components/PurchaseListWorkspace.js'), 'utf8');
const shell = fs.readFileSync(require.resolve('../src/components/AppShell.js'), 'utf8');
const dashboard = fs.readFileSync(require.resolve('../src/components/ProjectDashboard.js'), 'utf8');
const client = fs.readFileSync(require.resolve('../src/services/project-client.js'), 'utf8');
const styles = fs.readFileSync(require.resolve('../src/styles/layout.css'), 'utf8');

assert.match(workspace, /export async function PurchaseListWorkspace/);
assert.match(workspace, /projectClient\.getProject\(projectId\)/);
assert.match(workspace, /projectClient\.listFurnitureObjects\(projectId\)/);
assert.match(workspace, /object\.lifecycleStatus !== 'Archived'/);
assert.match(workspace, /object\.productionStatus === 'Production Ready'/);
for (const label of ['Project ID', 'Back to Project', 'Workspace Status', 'Approved Furniture Object Summary', 'Material Purchase', 'Hardware Purchase', 'Accessories', 'Purchase Summary', 'Information / Status', 'Data Boundary']) assert.match(workspace, new RegExp(label));
for (const task of ['Task 02', 'Task 04', 'Task 05', 'Task 06', 'Task 07', 'Task 08', 'Task 09', 'Task 10', 'Task 11']) assert.match(workspace, new RegExp(task));
assert.match(workspace, /button type="button" disabled>Refresh/);
assert.match(workspace, /Purchase Result.*Not Generated/);
assert.match(workspace, /router\.navigate\(`\/dashboard\/\$\{encodeURIComponent\(projectId\)\}`\)/);
assert.match(shell, /PurchaseListWorkspace/);
assert.match(shell, /currentPath\.startsWith\('\/purchase-list\/'\)/);
assert.match(shell, /await PurchaseListWorkspace\(\{ projectId, router \}\)/);
assert.match(dashboard, /action === 'purchase-list'/);
assert.match(dashboard, /`\/purchase-list\/\$\{encodeURIComponent\(projectId\)\}`/);
assert.match(client, /getProject|listFurnitureObjects/);
assert.match(styles, /\.purchase-list-workspace-page/);

// Task 01 is a shell-only task: no Purchase Result generator or catalog writer is introduced.
assert.doesNotMatch(workspace, /function generatePurchase|generatePurchaseResult|savePurchase|updatePurchase/);
assert.doesNotMatch(workspace, /projectClient\.(create|update|delete|assign|replace)/);
console.log('Sprint 09 Task 01 tests passed: route, project-scoped shell, approved-object filtering, read-only areas and future-task boundaries.');
