const assert = require('node:assert/strict');
const fs = require('node:fs');

const workspace = fs.readFileSync('src/components/Furniture3DWorkspace.js', 'utf8');
const appShell = fs.readFileSync('src/components/AppShell.js', 'utf8');
const client = fs.readFileSync('src/services/project-client.js', 'utf8');

assert.match(workspace, /projectClient\.getProject\(projectId\)/);
assert.match(workspace, /projectClient\.listFurnitureObjects\(projectId\)/);
assert.match(workspace, /Furniture Object Engine remains the engineering source of truth/);
assert.match(workspace, /never persisted/);
assert.match(workspace, /dashboard\//);
assert.match(appShell, /furniture-3d\//);
assert.match(client, /listFurnitureObjects/);
assert.doesNotMatch(workspace, /cloudRevisionSync|erpIntegration|supplierManagement|inventorySystem|crmIntegration/i);
console.log('Sprint 10 Task 05 regression tests passed: Project/Object context, canonical Furniture Object consumption, read-only 3D boundary, navigation and offline scope.');
