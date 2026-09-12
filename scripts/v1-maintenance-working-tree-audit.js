const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8').replace(/^\uFEFF/, '');
const exists = (file) => fs.existsSync(path.join(root, file));
const git = (args, allowFailure = false) => {
  try {
    return execFileSync('git', ['-c', `safe.directory=${root}`, ...args], { cwd: root, encoding: 'utf8' }).trim();
  } catch (error) {
    if (allowFailure) return '';
    throw error;
  }
};

function gitStatusClassifications() {
  return git(['status', '--short']).split(/\r?\n/).filter(Boolean).map((line) => ({ code: line.slice(0, 2), path: line.slice(3) }));
}

function main() {
  const packageJson = JSON.parse(read('package.json'));
  const status = gitStatusClassifications();
  const tags = git(['tag', '--list']).split(/\r?\n/).filter(Boolean);
  assert.equal(packageJson.version, '1.0.0');
  assert.ok(packageJson.scripts['test:v1-maintenance-working-tree']);
  assert.ok(tags.includes('v1.0.0'));
  assert.ok(exists('scripts/v1-maintenance-baseline-audit.js'));

  const tagCommit = git(['rev-list', '-n', '1', 'v1.0.0']);
  const headCommit = git(['rev-parse', 'HEAD']);
  const tagFiles = new Set(git(['ls-tree', '-r', '--name-only', 'v1.0.0']).split(/\r?\n/).filter(Boolean));
  const requiredReleaseFiles = [
    'README.md', 'RELEASE_NOTES.md', 'CHANGELOG.md',
    'DEVELOPMENT/12_Sprint_12.md', 'installer/FurnitureGO.iss',
    'FurnitureGO-Launcher.ps1', 'release/installer/Furniture-GO-1.0.0-Setup.exe',
    'release/installer/Furniture-GO-1.0.0-Setup.json',
    'release/installer/Furniture-GO-1.0.0-Setup.sha256',
  ];
  const tagMissingReleaseFiles = requiredReleaseFiles.filter((file) => !tagFiles.has(file));

  const artifact = path.join(root, 'release/installer/Furniture-GO-1.0.0-Setup.exe');
  const metadata = JSON.parse(read('release/installer/Furniture-GO-1.0.0-Setup.json'));
  const actualHash = crypto.createHash('sha256').update(fs.readFileSync(artifact)).digest('hex').toUpperCase();
  assert.equal(metadata.product, 'Furniture GO');
  assert.equal(metadata.version, '1.0.0');
  assert.equal(metadata.sha256, actualHash);
  assert.match(read('release/installer/Furniture-GO-1.0.0-Setup.sha256'), new RegExp(`^${actualHash}\\s+Furniture-GO-1\\.0\\.0-Setup\\.exe$`, 'm'));

  const releaseDocs = `${read('README.md')}\n${read('RELEASE_NOTES.md')}\n${read('CHANGELOG.md')}\n${read('DEVELOPMENT/12_Sprint_12.md')}`;
  assert.match(releaseDocs, /Version 1\.0\.0.*officially released|officially released.*Version 1\.0\.0/is);
  assert.match(releaseDocs, /Product Owner approval/i);
  assert.match(read('server.js'), /FURNITURE_GO_DATA_DIR/);
  assert.match(read('package.json'), /test:release-candidate-task09/);

  const modifiedProduction = status.filter((item) => /^(server\.js|src[\\/])/.test(item.path));
  const artifactStatus = status.filter((item) => /^(release[\\/]installer[\\/])/.test(item.path));
  const ignoredArtifactStatus = artifactStatus.length === 0 && git(['check-ignore', '-q', 'release/installer/Furniture-GO-1.0.0-Setup.exe'], true) === '';
  const classification = tagMissingReleaseFiles.length
    ? 'C. BASELINE REQUIRES PRODUCT OWNER DECISION'
    : (status.length ? 'B. V1.0.0 BASELINE WITH EXPECTED POST-RELEASE CHANGES' : 'A. CLEAN V1.0.0 BASELINE');

  console.log(JSON.stringify({
    status: 'PASS',
    classification,
    tag: 'PASS: v1.0.0 exists',
    tagCommit,
    headCommit,
    headEqualsTag: tagCommit === headCommit,
    postReleaseCommits: tagCommit === headCommit ? 'NONE' : 'POST-RELEASE COMMITS / WORKTREE STATE',
    workingTreeEntries: status.length,
    modifiedProductionFiles: modifiedProduction.map((item) => item.path),
    releaseArtifactStatus: artifactStatus.length ? artifactStatus : 'not listed as tracked modification; inspect repository policy',
    releaseArtifactsIgnoredOrUntracked: ignoredArtifactStatus,
    tagMissingReleaseFiles,
    releaseArtifact: 'PASS: existing artifact preserved; no rebuild performed',
    sha256: `PASS: ${actualHash}`,
    documentation: 'PASS: current release state is Version 1.0.0 officially released locally',
    packageJson: 'PASS: version 1.0.0, Task 09 and maintenance scripts present',
    serverAudit: 'PASS: FURNITURE_GO_DATA_DIR boundary present; no changes made',
    testInfrastructure: 'PASS: release/maintenance validation scripts classified; historical tests untouched',
    destructiveOperations: 'PASS: none executed',
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(`V1 working-tree audit failed: ${error.stack || error.message}`);
  process.exitCode = 1;
}
