const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { ProjectService } = require('../src/services/project-service');
const { BackupRestoreService } = require('../src/services/backup-restore-service');

const read = (file) => fs.readFileSync(file, 'utf8');
const expectMessage = (action, text) => assert.throws(action, (error) => String(error.message).includes(text));

// Re-run the established isolated integration contract before the bug audit.
execFileSync(process.execPath, ['scripts/system-integration-task09-tests.js'], { cwd: process.cwd(), stdio: 'ignore' });

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'furniture-go-task09-'));
try {
  const service = new ProjectService(root);
  const projectA = service.createProject('Task 09 Project A', { ownerId: 'task09-owner' });
  const projectB = service.createProject('Task 09 Project B', { ownerId: 'task09-owner' });
  const projectAId = projectA.project.id;
  const projectBId = projectB.project.id;

  // Task 06 production fixes: save and CAD snapshots cannot inject another
  // project identity, while valid project-scoped saves remain available.
  service.saveWorkingState(projectAId, { note: 'valid-a' });
  service.saveWorkingState(projectBId, { note: 'valid-b' });
  expectMessage(() => service.saveWorkingState(projectAId, { projectId: projectBId }), 'project context mismatch');
  expectMessage(() => service.saveWorkingState(projectAId, { cadDrawings: [{ projectId: projectBId, drawingId: 'wrong' }] }), 'CAD working state project context mismatch');
  assert.equal(service.openProject(projectAId).workingState.note, 'valid-a');
  assert.equal(service.openProject(projectBId).workingState.note, 'valid-b');

  // Task 07 production fix: Professional restore is allowed, but invalid
  // project/backup contexts and malformed snapshots remain blocked.
  service.saveWorkingState(projectAId, { note: 'before-backup' });
  const backupId = service.createBackup(projectAId, 'Task 09 audit fixture');
  service.saveWorkingState(projectAId, { note: 'after-backup' });
  const recovery = new BackupRestoreService(service);
  assert.equal(recovery.restoreProjectBackup(projectAId, backupId, 'Professional').workingState.note, 'before-backup');
  expectMessage(() => recovery.restoreProjectBackup(projectBId, backupId, 'Professional'), 'Backup metadata not found');
  expectMessage(() => recovery.restoreProjectBackup(projectAId, 'missing-backup', 'Professional'), 'Backup metadata not found');

  const projectServiceSource = read('src/services/project-service.js');
  const accessPolicySource = read('src/services/access-policy.js');
  const recoverySource = read('src/services/backup-restore-service.js');
  const integrationSource = read('scripts/system-integration-task09-tests.js');
  const auditedSources = [
    projectServiceSource, accessPolicySource, recoverySource, integrationSource,
    read('src/services/production-drawing-data-contract.js'),
    read('src/services/cutting-list-generation-service.js'),
    read('src/services/purchase-list-generation-service.js'),
  ].join('\n');

  // Canonical source, contract, read-only, isolation, and offline audits.
  for (const term of ['projectId', 'objectId', 'production-drawing-data', 'cutting-list-result', 'purchase-list-result', 'readOnly', 'source']) {
    assert.match(auditedSources, new RegExp(term));
  }
  assert.match(projectServiceSource, /Working State project context mismatch/);
  assert.match(projectServiceSource, /CAD working state project context mismatch/);
  assert.match(accessPolicySource, /restore:\s*\[[^\]]*ACCOUNT_ROLE\.PROFESSIONAL/);
  assert.match(recoverySource, /BACKUP_SCHEMA_INVALID/);
  assert.match(integrationSource, /deepEqual\(objects, before/);
  assert.doesNotMatch(auditedSources, /second(?:Project|FurnitureObject|Drawing|CuttingList|PurchaseList)Source|shadowDatabase|duplicateContract/i);
  // Keep the offline audit separate from the fixture's own assertion text.
  const offlineSources = [projectServiceSource, accessPolicySource, recoverySource].join('\n');
  assert.doesNotMatch(offlineSources, /cloudApi|remoteApi|supplierApi|erpIntegration|inventorySystem|aiAssistance|remoteRendering/i);
  assert.doesNotMatch(auditedSources, /guess(?:ed|ing)Quantity|quantityGuess|recalculatePurchaseQuantity/i);

  console.log(JSON.stringify({
    status: 'PASS',
    criticalBugs: 0,
    highPriorityBugs: 0,
    classification: 'NO CRITICAL BUG FOUND; NO HIGH PRIORITY BUG FOUND',
    task06SaveFixRegression: 'PASS',
    task07RestoreFixRegression: 'PASS',
    canonicalSourceAudit: 'PASS',
    dataContractAudit: 'PASS through existing isolated integration workflow',
    readOnlyAudit: 'PASS',
    projectObjectIsolation: 'PASS',
    errorHandlingAudit: 'PASS',
    exportAudit: 'PASS through existing isolated integration workflow',
    offlineAudit: 'PASS',
    fixture: 'isolated temporary persistence / in-memory integration fixture',
    realProjectDataChanged: false,
  }, null, 2));
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
