const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = (file) => fs.readFileSync(file, 'utf8');
const packageJson = JSON.parse(read('package.json'));
const packageLock = JSON.parse(read('package-lock.json'));
const sprint12 = read('DEVELOPMENT/12_Sprint_12.md');
const releaseProcess = read('GOVERNANCE/07_Release_Process.md');
const readme = read('README.md');
const notes = read('RELEASE_NOTES.md');
const changelog = read('CHANGELOG.md');

const installerFiles = [
  'Furniture-GO-Setup.exe', 'Furniture-GO.msi', 'Furniture-GO.dmg',
  'Furniture-GO.pkg', 'installer.exe', 'setup.exe', 'Installer.msi',
];
const packagingConfigFiles = [
  'electron-builder.yml', 'electron-builder.yaml', 'electron-builder.json',
  'tauri.conf.json', 'wix.config', 'installer.nsi', 'setup.nsi',
];

assert.ok(packageJson.scripts['test:release-candidate-task08']);
assert.equal(packageJson.version, '1.0.0');
assert.equal(packageLock.version, packageJson.version);
assert.equal(Boolean(packageJson.scripts.package), false, 'No unauthorized packaging script may be introduced');
assert.equal(Boolean(packageJson.scripts.installer), false, 'No unauthorized installer script may be introduced');
for (const dependency of ['electron', 'electron-builder', 'tauri', '@tauri-apps/cli', 'nsis', 'wix', 'squirrel']) {
  assert.equal(Boolean(packageJson.dependencies?.[dependency] || packageJson.devDependencies?.[dependency]), false, `Unauthorized packaging dependency: ${dependency}`);
}
for (const file of packagingConfigFiles) assert.equal(fs.existsSync(file), false, `Unexpected installer config: ${file}`);
for (const file of installerFiles) assert.equal(fs.existsSync(file), false, `Fake/unauthorized installer artifact: ${file}`);

assert.match(releaseProcess, /Every official release shall include:[\s\S]*Installer/i);
assert.match(releaseProcess, /Installer functions correctly/i);
assert.match(readme, /installer/i);
assert.match(notes, /Installer/i);
assert.match(changelog, /installer/i);
assert.match(sprint12, /Generate Installer Package/i);
for (const task of ['Task 09', 'Task 10']) {
  const section = sprint12.split(`## ${task}`)[1]?.split('---')[0] || '';
  assert.match(section, /Status\s+Pending/i, `${task} must remain pending`);
}
assert.match(notes, /Version 1 is not released/i);
assert.doesNotMatch(`${readme}\n${notes}\n${changelog}`, /Version 1 Released|Official V1 Released|Final Acceptance completed|Release approved/i);

console.log(JSON.stringify({
  status: 'PASS',
  installerConfiguration: 'INSTALLER PACKAGING NOT CONFIGURED',
  installerMechanism: 'NONE FOUND: no packaging framework, command, metadata, signing config, or artifact',
  releaseProcessRequirement: 'PASS: Installer is a required release-package item',
  releaseBlocker: 'INSTALLER RELEASE BLOCKER',
  fakeInstallerAudit: 'PASS: no fake installer artifact found',
  unauthorizedDependencyAudit: 'PASS: no packaging dependency introduced',
  packageVersion: 'PASS: unchanged at 1.0.0',
  task09to10: 'PASS: remain pending',
  scopeSafety: 'PASS: deterministic static audit only; no architecture change',
}, null, 2));
