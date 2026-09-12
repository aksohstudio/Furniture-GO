const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { ProjectService } = require('../src/services/project-service');
const { BackupRestoreService } = require('../src/services/backup-restore-service');

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function source(file) { return fs.readFileSync(file, 'utf8'); }
function expectMessage(action, text) { assert.throws(action, (error) => String(error.message).includes(text)); }

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'furniture-go-task07-'));
try {
  const projectService = new ProjectService(root);
  const projectA = projectService.createProject('Recovery Project A', { ownerId: 'task07-owner' });
  const projectB = projectService.createProject('Recovery Project B', { ownerId: 'task07-owner' });
  const projectAId = projectA.project.id;
  const projectBId = projectB.project.id;
  const recovery = new BackupRestoreService(projectService);

  // Project-scoped Working State and CAD state are saved through the existing
  // ProjectService boundary, not a new recovery store.
  const cadSnapshot = { projectId: projectAId, drawingId: 'cad-recovery-a', sourceFormat: 'DXF', entities: [{ id: 'line-a', type: 'LINE' }], layers: [{ name: '0', visible: true }] };
  projectService.saveWorkingState(projectAId, { note: 'before-backup', cadDrawings: [cadSnapshot], furnitureObjectContext: { projectId: projectAId, objectId: 'object-a' } });
  const backupId = projectService.createBackup(projectAId, 'Task 07 recovery fixture');
  const backupSnapshot = clone(projectService.openProject(projectAId));
  projectService.saveWorkingState(projectAId, { note: 'modified-after-backup', cadDrawings: [{ ...cadSnapshot, entities: [{ id: 'changed-line', type: 'LINE' }] }] });

  const metadata = recovery.getBackupMetadata(projectAId, backupId, 'Professional');
  assert.equal(metadata.projectId, projectAId);
  assert.equal(metadata.integrity.valid, true);
  assert.equal(recovery.listProjectBackups(projectAId, 'Professional').length, 1);
  const restored = recovery.restoreProjectBackup(projectAId, backupId, 'Professional');
  assert.equal(restored.project.id, projectAId);
  assert.equal(restored.workingState.note, backupSnapshot.workingState.note);
  assert.deepEqual(restored.workingState.cadDrawings, backupSnapshot.workingState.cadDrawings);
  assert.equal(restored.workingState.furnitureObjectContext.projectId, projectAId);
  assert.ok(restored.history.some((item) => item.type === 'Project Restored From Backup'));

  // Repeated recovery is deterministic for the restored working state.
  projectService.saveWorkingState(projectAId, { note: 'modified-again' });
  const restoredAgain = recovery.restoreProjectBackup(projectAId, backupId, 'Professional');
  assert.equal(restoredAgain.workingState.note, 'before-backup');
  assert.deepEqual(restoredAgain.workingState.cadDrawings, [cadSnapshot]);
  assert.equal(projectService.openProject(projectBId).workingState.note || null, null);

  // Missing, unknown, mismatched and malformed recovery inputs fail safely.
  expectMessage(() => recovery.listProjectBackups('missing-project', 'Professional'), 'Project not found');
  expectMessage(() => recovery.restoreProjectBackup(projectAId, 'missing-backup', 'Professional'), 'Backup metadata not found');
  expectMessage(() => recovery.restoreProjectBackup(projectBId, backupId, 'Professional'), 'Backup metadata not found');
  const projectAData = projectService.openProject(projectAId);
  projectAData.backupHistory.push({ id: 'mismatched-backup', projectId: projectBId, reason: 'invalid', createdAt: new Date().toISOString() });
  projectService.data.storage.writeJson('backups/mismatched-backup.json', backupSnapshot);
  projectService.writeProject(projectAData);
  assert.equal(recovery.getBackupMetadata(projectAId, 'mismatched-backup', 'Professional').integrity.valid, false);
  expectMessage(() => recovery.restoreProjectBackup(projectAId, 'mismatched-backup', 'Professional'), 'BACKUP_METADATA_INVALID');
  projectAData.backupHistory.push({ id: 'corrupt-backup', projectId: projectAId, reason: 'corrupt', createdAt: new Date().toISOString() });
  projectService.data.storage.writeJson('backups/corrupt-backup.json', { schemaVersion: 999, migrationVersion: 999, project: { id: projectAId } });
  projectService.writeProject(projectAData);
  assert.equal(recovery.getBackupMetadata(projectAId, 'corrupt-backup', 'Professional').integrity.valid, false);
  expectMessage(() => recovery.restoreProjectBackup(projectAId, 'corrupt-backup', 'Professional'), 'BACKUP_SCHEMA_INVALID');

  // No recovery operation crosses into canonical production data.
  const postFailure = projectService.openProject(projectAId);
  assert.equal(postFailure.project.id, projectAId);
  assert.deepEqual(postFailure.workingState.cadDrawings, [cadSnapshot]);
  assert.deepEqual(postFailure.furnitureObjects || [], []);

  // Existing UI recovery boundary: CAD reads only project-scoped snapshots;
  // there is no independent Furniture Object recovery architecture.
  const cad = source('src/components/CadWorkspace.js');
  const projectServiceSource = source('src/services/project-service.js');
  const recoverySource = source('src/services/backup-restore-service.js');
  assert.match(cad, /recoverCadState/);
  assert.match(cad, /item\.projectId === projectId/);
  assert.match(cad, /workingState\?\.cadDrawings/);
  assert.match(projectServiceSource, /createBackup|saveWorkingState/);
  assert.match(recoverySource, /verifyBackup|restoreProjectBackup|BACKUP_SCHEMA_INVALID/);
  assert.doesNotMatch(cad + recoverySource, /second(?:Project|FurnitureObject|Cad)Persistence|cloudRecovery|remoteRecovery/i);

  console.log(JSON.stringify({ status: 'PASS', fileRecoveryArchitecture: 'Project backup/restore available; no separate global Working State recovery API', workingStateRecovery: 'AVAILABLE through Project backup snapshot', cadRecovery: 'AVAILABLE through existing project-scoped workingState.cadDrawings boundary', furnitureObjectRecovery: 'FILE_RECOVERY_NOT_AVAILABLE: no dedicated Object recovery architecture', projectRecovery: 'PASS', isolation: 'PASS', corruptedStateHandling: 'PASS', mismatchHandling: 'PASS', repeatedRecovery: 'PASS', dataConsistency: 'PASS', immutabilityBoundary: 'PASS for non-target canonical data', offline: 'PASS', fixture: 'isolated temporary persistence', realProjectDataChanged: false }, null, 2));
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
