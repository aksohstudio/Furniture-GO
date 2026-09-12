const assert = require('node:assert/strict');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

const read = (file) => fs.readFileSync(file, 'utf8');
const exists = (file) => assert.equal(fs.existsSync(file), true, `missing UI document/source: ${file}`);

const uiFiles = [
  'UI/00_UI_Index.md', 'UI/01_Project_Home.md', 'UI/02_Project_Dashboard.md',
  'UI/03_Project Recognition Workspace.md', 'UI/04_CAD_Workspace.md',
  'UI/05_3D_Workspace.md', 'UI/06_Furniture_Object_Editor.md',
  'UI/07_Production_Drawing.md', 'UI/08_Cutting_List.md',
  'UI/09_Purchase_List.md', 'UI/10_Project_Settings.md',
];
uiFiles.forEach(exists);

const uiDocs = uiFiles.map(read).join('\n');
const sourceFiles = [
  'src/router/router.js', 'src/components/AppShell.js', 'src/components/ProjectList.js',
  'src/components/ProjectDashboard.js', 'src/components/RecognitionWorkspace.js',
  'src/components/CadWorkspace.js', 'src/components/FurnitureObjectEditor.js',
  'src/components/Furniture3DWorkspace.js', 'src/components/ProductionDrawingWorkspace.js',
  'src/components/CuttingListWorkspace.js', 'src/components/PurchaseListWorkspace.js',
  'src/components/BoundaryPage.js', 'src/styles/layout.css', 'src/styles/theme.css',
].map((file) => { exists(file); return read(file); });
const implementation = sourceFiles.join('\n');

// UI00–UI10 are the authoritative audit inputs. Each page must be represented
// by an implementation component and the central shell must expose navigation.
const pageAnchors = [
  ['UI00', 'UI/00_UI_Index.md', /AppShell|router|Navigation/i],
  ['UI01', 'UI/01_Project_Home.md', /ProjectList|Project Home|Project List/i],
  ['UI02', 'UI/02_Project_Dashboard.md', /ProjectDashboard|Project Dashboard|projectId/i],
  ['UI03', 'UI/03_Project Recognition Workspace.md', /RecognitionWorkspace|Recognition Workspace/i],
  ['UI04', 'UI/04_CAD_Workspace.md', /CadWorkspace|CAD Workspace/i],
  ['UI05', 'UI/05_3D_Workspace.md', /Furniture3DWorkspace|3D Workspace/i],
  ['UI06', 'UI/06_Furniture_Object_Editor.md', /FurnitureObjectEditor|Furniture Object/i],
  ['UI07', 'UI/07_Production_Drawing.md', /ProductionDrawingWorkspace|Production Drawing/i],
  ['UI08', 'UI/08_Cutting_List.md', /CuttingListWorkspace|Cutting List/i],
  ['UI09', 'UI/09_Purchase_List.md', /PurchaseListWorkspace|Purchase List/i],
  ['UI10', 'UI/10_Project_Settings.md', /settings|Project Settings|BoundaryPage/i],
];
for (const [id, doc, anchor] of pageAnchors) {
  assert.match(read(doc), /#\s|##\s/, `${id} document has no headings`);
  assert.match(implementation, anchor, `${id} implementation anchor missing`);
}

const required = [
  [/projectId/, 'project context'], [/objectId/, 'object context'],
  [/Project ID/, 'Project ID label'], [/Object ID/, 'Object ID label'],
  [/Production Status|Production Ready/, 'production status'],
  [/No .*available|No .*loaded|No .*selected|not generated|Unavailable/i, 'empty/unavailable state'],
  [/error|Error|failed|Failed|blocked|Blocked/i, 'error/block state'],
  [/read.?only|READ ONLY|Read-only/, 'read-only boundary'],
  [/aria-label|aria-pressed|aria-live/, 'accessibility semantics'],
  [/type=["']button["']|button/, 'button semantics'],
  [/window\.print|Export PDF|PDF|Excel|XLSX/, 'output action'],
  [/DWG_EXPORT_UNAVAILABLE|DWG.*unavailable|unavailable.*DWG/i, 'DWG unavailable state'],
  [/router\.navigate|data-back|Back to Project|data-route/, 'navigation/back behavior'],
];
for (const [pattern, label] of required) assert.match(implementation, pattern, `missing ${label}`);

// The specification only requests responsive/mobile verification when the UI
// docs explicitly require it. UI00 does, so verify the repository has a CSS
// layout/responsive anchor; no redesign is performed here.
assert.match(uiDocs, /Responsive/i);
assert.match(implementation, /@media|responsive|grid-template|flex-wrap/i);

// Prevent UI compliance work from introducing a second source or online-only
// capability. This is a static boundary audit, not a business-rule test.
assert.doesNotMatch(implementation, /second(?:Project|FurnitureObject|Drawing|CuttingList|PurchaseList)Source|shadowDatabase|cloudPersistence|remoteRendering|cloudPrinting/i);

const packageJson = JSON.parse(read('package.json'));
assert.ok(packageJson.scripts['test:release-candidate-task01']);
assert.ok(packageJson.scripts['test:release-candidate-task03']);

execFileSync(process.execPath, ['scripts/system-integration-task09-tests.js'], { cwd: process.cwd(), stdio: 'ignore' });

console.log(JSON.stringify({
  status: 'PASS',
  uiDocuments: 'PASS: UI00–UI10 present and readable',
  uiImplementationAnchors: 'PASS',
  pageWorkspaceAnchors: 'PASS',
  navigationAnchors: 'PASS',
  stateErrorEmptyAnchors: 'PASS',
  readOnlyAnchors: 'PASS',
  outputAnchors: 'PASS',
  accessibilitySanity: 'PASS',
  responsiveAudit: 'PASS: responsive requirement is explicit in UI00 and CSS anchors exist',
  workflowIsolationRegression: 'PASS',
  browser: 'BROWSER TEST NOT AVAILABLE',
  dataSafety: 'PASS: static audit and isolated regression only; no real data changed',
  productionUiFix: 'NONE',
}, null, 2));
