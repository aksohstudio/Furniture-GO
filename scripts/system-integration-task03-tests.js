const assert = require('node:assert/strict');
const fs = require('node:fs');

const cad = fs.readFileSync('src/components/CadWorkspace.js', 'utf8');
const project = fs.readFileSync('src/services/project-service.js', 'utf8');
const client = fs.readFileSync('src/services/project-client.js', 'utf8');
const dashboard = fs.readFileSync('src/components/ProjectDashboard.js', 'utf8');
const shell = fs.readFileSync('src/components/AppShell.js', 'utf8');

assert.match(cad, /projectClient\.getProject/);
assert.match(cad, /projectId/);
assert.match(cad, /projectDocuments/);
assert.match(cad, /#\/dashboard\/.*encodeURIComponent\(projectId\)/);
assert.match(project, /importDwg/);
assert.match(project, /importDxf/);
assert.match(project, /saveWorkingState/);
assert.match(client, /importDwg/);
assert.match(client, /importDxf/);
assert.match(client, /exportDwg/);
assert.match(dashboard, /\/cad\/\$\{encodeURIComponent\(projectId\)/);
assert.match(shell, /CadWorkspace/);
assert.doesNotMatch(cad, /CADProjectStore|CADProjectDatabase|duplicateCad|workspaceCadJson/i);
assert.doesNotMatch(cad, /createFurnitureObject|FurnitureObjectStorageService/i);
assert.doesNotMatch([cad, project].join('\n'), /firebase|supabase|remoteCadService|cloudStorage/i);

console.log('Sprint 10 Task 03 tests passed: CAD Project binding, navigation, persistence boundary, single-source and offline audits.');
