const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = (file) => fs.readFileSync(file, 'utf8');
const packageJson = JSON.parse(read('package.json'));
const sprint12 = read('DEVELOPMENT/12_Sprint_12.md');
const readme = read('README.md');
const notes = read('RELEASE_NOTES.md');
const changelog = read('CHANGELOG.md');
const buildScript = read('scripts/build-check.js');

assert.ok(packageJson.scripts.build, 'build script is required');
assert.equal(packageJson.scripts.build, 'node scripts/build-check.js');
assert.equal(packageJson.version, '1.0.0', 'Task 07 must not change package version');
assert.ok(packageJson.scripts['test:release-candidate-task07']);
assert.ok(fs.existsSync('package-lock.json'), 'lockfile is required');
assert.equal(JSON.parse(read('package-lock.json')).version, packageJson.version);

// The repository's current build command is a foundation/static build check,
// not a bundler. Verify its real entry boundary without inventing a dist tree.
for (const file of ['index.html', 'server.js', 'src/main.js', 'scripts/build-check.js']) {
  assert.ok(fs.existsSync(file), `build entry missing: ${file}`);
  assert.ok(read(file).trim().length > 0, `build entry is empty: ${file}`);
}
for (const directory of ['src/assets', 'src/components', 'src/services', 'src/styles']) assert.ok(fs.existsSync(directory));
for (const forbiddenOutput of ['dist', 'build', 'release', 'installer']) {
  assert.equal(fs.existsSync(forbiddenOutput), false, `unexpected generated output directory: ${forbiddenOutput}`);
}
for (const installer of ['Furniture-GO-Setup.exe', 'Furniture-GO.msi', 'Furniture-GO.dmg', 'Furniture-GO.pkg']) {
  assert.equal(fs.existsSync(installer), false, `Task 07 must not generate installer: ${installer}`);
}

assert.match(readme, /Release Candidate preparation/i);
assert.match(notes, /Release Candidate preparation is in progress/i);
assert.match(changelog, /Version 1 has not been officially released/i);
assert.doesNotMatch(`${readme}\n${notes}\n${changelog}`, /Version 1 Released|Official V1 Released|Release approved|Final Acceptance completed/i);

for (const task of ['Task 08', 'Task 09', 'Task 10']) {
  const section = sprint12.split(`## ${task}`)[1]?.split('---')[0] || '';
  assert.match(section, /Status\s+Pending/i, `${task} must remain pending`);
}

console.log(JSON.stringify({
  status: 'PASS',
  buildScript: 'PASS: current npm run build configuration verified',
  buildOutputModel: 'PASS: repository-root static/runtime entry boundary verified; no separate dist output configured',
  entryArtifacts: 'PASS: index.html, server.js, src/main.js are present and non-empty',
  lockfile: 'PASS: package-lock version matches package version 1.0.0',
  releaseStatus: 'PASS: RC preparation remains in progress',
  installer: 'PASS: no installer generated',
  task08to10: 'PASS: remain pending',
  scopeSafety: 'PASS: static build artifact audit only',
}, null, 2));
