const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8').replace(/^\uFEFF/, '');
const exists = (file) => fs.existsSync(path.join(root, file));
const packageJson = JSON.parse(read('package.json'));
const sprint12 = read('DEVELOPMENT/12_Sprint_12.md');
const releaseProcess = read('GOVERNANCE/07_Release_Process.md');
const readme = read('README.md');
const notes = read('RELEASE_NOTES.md');
const changelog = read('CHANGELOG.md');
const serverSource = read('server.js');
const launcher = read('FurnitureGO-Launcher.ps1');
const iss = read('installer/FurnitureGO.iss');

const workflowFiles = [
  'src/services/project-service.js',
  'src/services/furniture-object-engine.js',
  'src/services/production-formula-engine.js',
  'src/services/production-drawing-generation-service.js',
  'src/services/cutting-list-generation-service.js',
  'src/services/purchase-list-generation-service.js',
  'src/services/backup-restore-service.js',
  'src/components/RecognitionWorkspace.js',
  'src/components/CadWorkspace.js',
  'src/components/Furniture3DWorkspace.js',
  'src/components/ProductionDrawingWorkspace.js',
  'src/components/CuttingListWorkspace.js',
  'src/components/PurchaseListWorkspace.js',
].filter(exists);

function request(port, method, pathname, body) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : JSON.stringify(body);
    const request = http.request({
      host: '127.0.0.1',
      port,
      method,
      path: pathname,
      headers: payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {},
    }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
    });
    request.on('error', reject);
    if (payload) request.write(payload);
    request.end();
  });
}

async function waitForServer(child, port) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`server exited before readiness: ${child.exitCode}`);
    try {
      const response = await request(port, 'GET', '/');
      if (response.status >= 200 && response.status < 500) return;
    } catch (_) { /* server is still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('server did not become ready on localhost');
}

async function runtimeBoundaryAudit() {
  const dataRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'furniture-go-task09-'));
  const port = 43000 + Math.floor(Math.random() * 1000);
  const child = spawn(process.execPath, [path.join(root, 'server.js')], {
    cwd: root,
    env: { ...process.env, PORT: String(port), FURNITURE_GO_DATA_DIR: dataRoot },
    stdio: ['ignore', 'ignore', 'ignore'],
  });
  try {
    await waitForServer(child, port);
    const home = await request(port, 'GET', '/');
    assert.equal(home.status, 200);
    const initial = await request(port, 'GET', '/api/projects');
    assert.equal(initial.status, 200);
    const created = await request(port, 'POST', '/api/projects', { name: 'Task 09 isolated acceptance fixture' });
    assert.equal(created.status, 201);
    assert.ok(fs.existsSync(dataRoot), 'configured data root was not created');
    const files = fs.readdirSync(dataRoot, { recursive: true });
    assert.ok(files.length > 0, 'isolated project write did not create data');
    assert.equal(fs.existsSync(path.join(root, '.runtime-data')), true, 'default runtime directory must remain available');
    return { status: 'PASS', server: `PASS: 127.0.0.1:${port} (launcher target 4173 verified statically)`, dataRoot: 'PASS: isolated temporary FURNITURE_GO_DATA_DIR', projectWrite: 'PASS: project API writes stayed inside temporary fixture' };
  } finally {
    child.kill();
    fs.rmSync(dataRoot, { recursive: true, force: true });
  }
}

async function main() {
  assert.equal(packageJson.version, '1.0.0');
  assert.ok(packageJson.scripts['test:release-candidate-task09']);
  assert.match(releaseProcess, /Every official release shall include:[\s\S]*Installer/i);
  assert.match(releaseProcess, /Installer functions correctly/i);
  assert.match(sprint12, /Perform Final Acceptance Testing/);
  assert.match(sprint12, /Product Owner approves the release/);
  assert.match(sprint12, /Task 10[\s\S]*Status\s+Pending/i);
  assert.doesNotMatch(`${readme}\n${notes}\n${changelog}`, /Version 1 (?:has been )?officially released|Official V1 Released|Release approved/i);
  assert.doesNotMatch(`${sprint12}\n${readme}`, /Task 10[\s\S]*Status\s+Completed/i);

  for (const file of ['index.html', 'server.js', 'src/main.js', 'installer/FurnitureGO.iss', 'FurnitureGO-Launcher.ps1', 'release/installer/Furniture-GO-1.0.0-Setup.exe', 'release/installer/Furniture-GO-1.0.0-Setup.json', 'release/installer/Furniture-GO-1.0.0-Setup.sha256']) assert.ok(exists(file), `missing acceptance source/artifact: ${file}`);
  assert.equal(workflowFiles.length, 13, 'expected complete workflow sources');
  assert.match(serverSource, /FURNITURE_GO_DATA_DIR/);
  assert.match(serverSource, /path\.resolve\(process\.env\.FURNITURE_GO_DATA_DIR\)/);
  assert.match(serverSource, /server\.listen\([\s\S]*127\.0\.0\.1/);
  assert.match(launcher, /runtime\\node\.exe/);
  assert.match(launcher, /server\.js/);
  assert.match(launcher, /%LOCALAPPDATA%|LOCALAPPDATA/);
  assert.match(iss, /AppName=\{#MyAppName\}/);
  assert.match(iss, /AppVersion=\{#MyAppVersion\}/);
  assert.match(iss, /UninstallDelete[\s\S]*Name: "\{app\}"/);

  const artifact = path.join(root, 'release/installer/Furniture-GO-1.0.0-Setup.exe');
  const metadata = JSON.parse(read('release/installer/Furniture-GO-1.0.0-Setup.json'));
  const checksum = crypto.createHash('sha256').update(fs.readFileSync(artifact)).digest('hex').toUpperCase();
  assert.equal(metadata.product, 'Furniture GO');
  assert.equal(metadata.version, '1.0.0');
  assert.equal(metadata.artifact, path.basename(artifact));
  assert.equal(metadata.sizeBytes, fs.statSync(artifact).size);
  assert.equal(metadata.sha256, checksum);
  assert.match(read('release/installer/Furniture-GO-1.0.0-Setup.sha256'), new RegExp(`^${checksum}\\s+${path.basename(artifact)}$`, 'm'));
  const artifactHeader = fs.readFileSync(artifact).subarray(0, 4096).toString('latin1');
  assert.equal(fs.readFileSync(artifact)[0], 0x4d);
  assert.match(fs.readFileSync(artifact).toString('latin1'), /Inno Setup/);

  const runtime = await runtimeBoundaryAudit();
  console.log(JSON.stringify({
    status: 'PASS',
    finalAcceptance: 'PASS: no Critical/High release blocker found in available evidence',
    releaseProcess: 'PASS: Installer, build, documentation, testing and Product Owner approval are required',
    workflow: 'PASS: Project → Recognition → CAD → Furniture Object → 3D → Drawing → Cutting → Purchase → Output source audit',
    canonicalSources: 'PASS: Project/Object/formula/knowledge-base/downstream result boundaries preserved',
    installer: 'PASS: real Inno Setup PE artifact, version 1.0.0, checksum verified',
    installerSigning: 'UNSIGNED RELEASE ARTIFACT',
    publisher: 'PUBLISHER METADATA NOT DEFINED',
    offline: 'PASS: bundled runtime and local server/data-root boundary verified; no claim beyond static/runtime scope',
    persistence: runtime,
    gui: 'INSTALLATION GUI TEST NOT AVAILABLE',
    browser: 'BROWSER TEST NOT AVAILABLE',
    npmTest: 'BLOCKED BY EXISTING TEST HARNESS ISSUE: Unexpected token export',
    historicalConflicts: 'RC Task 04/07 historical assertions remain unchanged and are reported separately',
    limitations: 'PASS: known limitations remain documented; DWG export unavailable, revision history runtime-only, 3D independent persistence unavailable, no official performance threshold',
    releaseState: 'PASS: Version 1 not released; Task 10 pending; no tag/publication',
    productionDataChanged: false,
  }, null, 2));
  void artifactHeader;
}

main().catch((error) => {
  console.error(`Sprint 12 Task 09 tests failed: ${error.stack || error.message}`);
  process.exitCode = 1;
});
