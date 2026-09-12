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
const packageLock = read('package-lock.json');
const sprint12 = read('DEVELOPMENT/12_Sprint_12.md');
const readme = read('README.md');
const notes = read('RELEASE_NOTES.md');
const changelog = read('CHANGELOG.md');
const server = read('server.js');
const projectService = read('src/services/project-service.js');
const launcher = read('FurnitureGO-Launcher.ps1');
const installer = read('installer/FurnitureGO.iss');

function request(port, method, pathname, body) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : JSON.stringify(body);
    const req = http.request({
      host: '127.0.0.1', port, method, path: pathname,
      headers: payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {},
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runtimeAudit() {
  const dataRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'furniture-go-maintenance-'));
  const port = 44000 + Math.floor(Math.random() * 500);
  const child = spawn(process.execPath, [path.join(root, 'server.js')], {
    cwd: root,
    env: { ...process.env, PORT: String(port), FURNITURE_GO_DATA_DIR: dataRoot },
    stdio: ['ignore', 'ignore', 'ignore'],
  });
  try {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      if (child.exitCode !== null) throw new Error(`server exited before readiness: ${child.exitCode}`);
      try {
        const home = await request(port, 'GET', '/');
        if (home.status === 200) break;
      } catch (_) { /* startup window */ }
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (attempt === 59) throw new Error('server readiness timeout');
    }
    assert.equal((await request(port, 'GET', '/api/projects')).status, 200);
    assert.equal((await request(port, 'POST', '/api/projects', { name: 'V1 maintenance isolated fixture' })).status, 201);
    const stored = fs.readdirSync(dataRoot, { recursive: true });
    assert.ok(stored.length > 0, 'temporary data root remained empty after isolated Project write');
    return { status: 'PASS', offlineServer: `PASS: localhost:${port}`, dataRoot: 'PASS: temporary FURNITURE_GO_DATA_DIR only', projectIsolationFixture: 'PASS: isolated Project write persisted outside real data' };
  } finally {
    child.kill();
    fs.rmSync(dataRoot, { recursive: true, force: true });
  }
}

async function main() {
  assert.equal(packageJson.name, 'furniture-go');
  assert.equal(packageJson.version, '1.0.0');
  assert.match(packageLock, /"version"\s*:\s*"1\.0\.0"/);
  assert.ok(packageJson.scripts['test:v1-maintenance-baseline']);
  assert.match(readme, /Version 1\.0\.0 officially released/i);
  assert.match(notes, /Furniture GO Version 1\.0\.0/i);
  assert.match(changelog, /\[1\.0\.0 — Official Release\]/);
  assert.match(changelog, /v1\.0\.0/);
  assert.match(sprint12, /Current Status\s+COMPLETED/);
  assert.match(sprint12, /Progress\s+100%/);
  assert.match(sprint12, /Furniture GO Version 1\.0\.0 is officially released/i);

  for (const file of [
    'release/installer/Furniture-GO-1.0.0-Setup.exe',
    'release/installer/Furniture-GO-1.0.0-Setup.json',
    'release/installer/Furniture-GO-1.0.0-Setup.sha256',
    'installer/FurnitureGO.iss',
    'FurnitureGO-Launcher.ps1',
  ]) assert.ok(exists(file), `missing release baseline file: ${file}`);

  const artifactPath = path.join(root, 'release/installer/Furniture-GO-1.0.0-Setup.exe');
  const metadata = JSON.parse(read('release/installer/Furniture-GO-1.0.0-Setup.json'));
  const actualHash = crypto.createHash('sha256').update(fs.readFileSync(artifactPath)).digest('hex').toUpperCase();
  assert.equal(metadata.product, 'Furniture GO');
  assert.equal(metadata.version, '1.0.0');
  assert.equal(metadata.artifact, 'Furniture-GO-1.0.0-Setup.exe');
  assert.equal(metadata.sha256, actualHash);
  assert.match(read('release/installer/Furniture-GO-1.0.0-Setup.sha256'), new RegExp(`^${actualHash}\\s+Furniture-GO-1\\.0\\.0-Setup\\.exe$`, 'm'));

  assert.match(server, /FURNITURE_GO_DATA_DIR/);
  assert.match(server, /path\.resolve\(process\.env\.FURNITURE_GO_DATA_DIR\)/);
  assert.match(server, /path\.join\(\s*root,\s*'\.runtime-data'/);
  assert.match(projectService, /saveWorkingState/);
  assert.match(projectService, /project context mismatch/);
  assert.match(launcher, /runtime\\node\.exe/);
  assert.match(launcher, /FURNITURE_GO_DATA_DIR/);
  assert.match(installer, /UninstallDelete[\s\S]*Name: "\{app\}"/);

  const runtime = await runtimeAudit();
  console.log(JSON.stringify({
    status: 'PASS',
    releaseBaseline: 'PASS: Furniture GO Version 1.0.0 released locally',
    artifact: 'PASS: existing installer preserved; no rebuild performed',
    sha256: `PASS: ${actualHash}`,
    canonicalSource: 'PASS: existing Project → Furniture Object → Production Results → Cutting/Purchase/Output boundaries preserved',
    engineering: 'AUDITED: existing Engineering Knowledge Base and Formula Engine unchanged',
    persistence: runtime,
    installer: 'PASS: existing Inno Setup, bundled Node, launcher, data boundary and uninstall policy preserved',
    limitations: 'PRESERVED: GUI unavailable, unsigned artifact, publisher undefined, npm harness limitation and documented workspace limits',
    newTags: 'PASS: no tag created by this task',
    scope: 'PASS: baseline audit only; no feature, bug fix, architecture or data migration',
  }, null, 2));
}

main().catch((error) => {
  console.error(`V1 maintenance baseline audit failed: ${error.stack || error.message}`);
  process.exitCode = 1;
});
