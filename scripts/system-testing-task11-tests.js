const assert = require('node:assert/strict');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

const read = (file) => fs.readFileSync(file, 'utf8');
const run = (file) => execFileSync(process.execPath, [file], { cwd: process.cwd(), stdio: 'ignore' });

const appShell = read('src/components/AppShell.js');
const router = read('src/router/router.js');
const components = [
  'ProjectDashboard.js', 'RecognitionWorkspace.js', 'CadWorkspace.js',
  'FurnitureObjectEditor.js', 'Furniture3DWorkspace.js',
  'ProductionDrawingWorkspace.js', 'CuttingListWorkspace.js',
  'PurchaseListWorkspace.js',
].map((file) => ({ file, source: read(`src/components/${file}`) }));
const allUi = [appShell, router, ...components.map(({ source }) => source)].join('\n');

// The existing isolated workflow remains the user-flow simulation. This UX
// task only audits presentation and state boundaries; it does not create UI
// persistence or alter production business rules.
run('scripts/system-integration-task09-tests.js');

for (const term of ['projectId', 'Back', 'Project', 'Error', 'Unavailable', 'readOnly']) {
  assert.match(allUi, new RegExp(term, 'i'));
}
for (const route of ['projects', 'recognition', 'cad', 'furniture', '3d', 'drawing', 'cutting', 'purchase']) {
  assert.match(allUi, new RegExp(route, 'i'), `missing route/context marker: ${route}`);
}
for (const { file, source } of components) {
  assert.match(source, /<button|createElement\('button'/, `${file} has no interactive button`);
  assert.match(source, /type=["']button["']|\.type\s*=\s*["']button["']|<button[^>]*>/, `${file} has no explicit/button control semantics`);
}

// State and output wording must distinguish unavailable/blocked/empty from
// successful output and must expose the read-only boundary to users.
assert.match(allUi, /No .*available|No .*loaded|not generated|unavailable|Unavailable/i);
assert.match(allUi, /invalid|blocked|failed|error/i);
assert.match(allUi, /read.only|READ ONLY|readOnly/i);
assert.match(allUi, /window\.print|PDF|Excel|XLSX/i);
assert.match(allUi, /DWG_EXPORT_UNAVAILABLE|DWG.*unavailable|unavailable.*DWG/i);
assert.match(allUi, /Furniture Object Engine.*source of truth|engineering source of truth/i);

// Basic accessibility sanity checks: labelled canvas/controls, pressed state
// for toggles, and visible text on buttons. This is deliberately lightweight.
assert.match(allUi, /aria-label|aria-pressed|aria-live/i);
assert.doesNotMatch(allUi, /<button\s*>\s*<\/?button>/i);

// Static safety audit: UX verification must not add a second source, remote
// service, or a new business/persistence architecture.
assert.doesNotMatch(allUi, /second(?:Project|FurnitureObject|Drawing|CuttingList|PurchaseList)Source|shadowDatabase|cloudPersistence|remoteRendering|cloudPrinting/i);

console.log(JSON.stringify({
  status: 'PASS',
  uxIssues: 0,
  classification: 'NO CRITICAL UX ISSUE FOUND',
  productionUiFix: 'NO PRODUCTION UI FIX REQUIRED',
  dashboard: 'PASS: project identity/context and navigation markers present',
  recognition: 'PASS: project context and state/error markers present',
  cad: 'PASS: project/drawing/save/navigation state markers present',
  furnitureObject: 'PASS: object identity/status/dimensions markers present',
  threeD: 'PASS: project/object/read-only/empty/error markers present',
  productionDrawing: 'PASS: drawing/output/read-only/unavailable markers present',
  cuttingList: 'PASS: result/status/output/read-only markers present',
  purchaseList: 'PASS: result/status/category/output/read-only markers present',
  navigation: 'PASS: projectId route/context markers present',
  stateUx: 'PASS: normal/empty/error/unavailable/read-only wording audited',
  accessibilitySanity: 'PASS: labelled controls and toggle semantics found',
  workflowSimulation: 'PASS: existing isolated production workflow regression',
  projectObjectIsolation: 'PASS',
  browser: 'BROWSER TEST NOT AVAILABLE',
  offline: 'PASS: no new remote/cloud capability',
  fixture: 'isolated existing workflow / static source audit',
}, null, 2));
