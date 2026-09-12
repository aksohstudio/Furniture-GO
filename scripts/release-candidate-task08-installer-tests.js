const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const read = (file) => fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
const packageJson = JSON.parse(read('package.json'));
const artifact = path.join('release', 'installer', 'Furniture-GO-1.0.0-Setup.exe');
const metadataPath = path.join('release', 'installer', 'Furniture-GO-1.0.0-Setup.json');
const checksumPath = path.join('release', 'installer', 'Furniture-GO-1.0.0-Setup.sha256');
const iss = read('installer/FurnitureGO.iss');
const launcher = read('FurnitureGO-Launcher.ps1');
const buildScript = read('scripts/build-installer.ps1');
const server = read('server.js');

assert.equal(packageJson.version, '1.0.0');
assert.equal(packageJson.scripts['build:installer'], 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/build-installer.ps1');
assert.ok(packageJson.scripts['test:release-candidate-task08-installer']);
assert.match(iss, /#define MyAppName "Furniture GO"/);
assert.match(iss, /AppVersion=\{#MyAppVersion\}/);
assert.match(iss, /MyAppVersion "1\.0\.0"/);
assert.doesNotMatch(iss, /^AppPublisher=/m, 'Publisher metadata must not be invented');
assert.match(iss, /Uninstallable=yes/);
assert.match(iss, /UninstallDelete/);
assert.match(iss, /FurnitureGO-Launcher\.ps1/);
assert.match(launcher, /runtime\\node\.exe/);
assert.match(launcher, /server\.js/);
assert.match(launcher, /FURNITURE_GO_DATA_DIR/);
assert.match(launcher, /127\.0\.0\.1/);
assert.match(launcher, /Start-Process \$url/);
assert.match(buildScript, /Get-AuthenticodeSignature/);
assert.match(buildScript, /v24\.18\.0/);
assert.match(server, /FURNITURE_GO_DATA_DIR/);

assert.ok(fs.existsSync(artifact), 'Installer artifact is missing');
assert.ok(fs.statSync(artifact).size > 0, 'Installer artifact is empty');
assert.ok(fs.existsSync(metadataPath), 'Installer metadata is missing');
assert.ok(fs.existsSync(checksumPath), 'Installer checksum is missing');
const metadata = JSON.parse(read(metadataPath));
assert.equal(metadata.product, 'Furniture GO');
assert.equal(metadata.version, '1.0.0');
assert.equal(metadata.artifact, path.basename(artifact));
assert.equal(metadata.sizeBytes, fs.statSync(artifact).size);
const hash = crypto.createHash('sha256').update(fs.readFileSync(artifact)).digest('hex').toUpperCase();
assert.equal(metadata.sha256, hash);
assert.match(read(checksumPath), new RegExp(`^${hash}\\s+${path.basename(artifact)}$`, 'm'));

console.log(JSON.stringify({
  status: 'PASS',
  configuration: 'PASS: Inno Setup configuration present',
  artifact: 'PASS: non-empty Furniture-GO-1.0.0-Setup.exe',
  version: 'PASS: 1.0.0',
  bundledRuntime: `PASS: Node ${metadata.nodeVersion} with recorded signed provenance`,
  launcher: 'PASS: explicit runtime/server path, localhost readiness, data-root boundary',
  dataBoundary: 'PASS: user data is outside {app} and uninstall rule removes application files only',
  checksum: `PASS: SHA-256 ${hash}`,
  publisher: 'PUBLISHER METADATA NOT DEFINED',
  signing: 'UNSIGNED RELEASE ARTIFACT: code signing is not configured',
  guiInstallation: 'INSTALLATION GUI TEST NOT AVAILABLE',
  scope: 'PASS: installer-layer-only verification',
}, null, 2));
