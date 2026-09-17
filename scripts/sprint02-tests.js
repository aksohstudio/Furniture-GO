const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { ProjectService } = require('../src/services/project-service');
const { createDataAccess } = require('../src/database/repositories');
const { canPerform, canPerformFromAccountContext } = require('../src/services/access-policy');
const { AccountService } = require('../src/services/account-service');
const { preserveIdentityAcrossMigration, migrateProject } = require('../src/database/migrations');
const { FurnitureObjectStorageService } = require('../src/services/furniture-object-storage-service');
const { BackupRestoreService } = require('../src/services/backup-restore-service');
const { RevisionSnapshotReadService } = require('../src/services/revision-snapshot-read-service');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'furniture-go-sprint02-'));
function createBrowserRouter(hash) {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'router', 'router.js'), 'utf8')
    .replace('export function createRouter()', 'function createRouter()');
  const sandbox = { window: { location: { hash } }, Object, module: { exports: {} } };
  vm.runInNewContext(`${source}\nmodule.exports = { createRouter };`, sandbox);
  return { router: sandbox.module.exports.createRouter(), window: sandbox.window };
}

const dashboardRoute = createBrowserRouter('#/dashboard/project-123');
assert.equal(dashboardRoute.router.current(), '/dashboard/project-123');
assert.equal(dashboardRoute.router.resolve().name, 'Project Dashboard');
const dashboardRefresh = createBrowserRouter(`#${dashboardRoute.router.current()}`);
assert.equal(dashboardRefresh.router.current(), '/dashboard/project-123');
dashboardRoute.router.navigate('/account');
assert.equal(dashboardRoute.window.location.hash, '/account');
assert.equal(dashboardRoute.router.current(), '/account');
assert.equal(fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'AppShell.js'), 'utf8').includes('data-route="/account"'), true);

const service = new ProjectService(root);
const project = service.createProject('Offline Test Project', { ownerId: 'owner-1' });
assert.equal(project.project.status, 'Project Imported');
assert.equal(project.project.workflowStatus, 'Not Started');
assert.equal(service.openProject(project.project.id).project.id, project.project.id);
assert.throws(() => service.openProject('missing-project-id'), /Project not found/);

const accounts = new AccountService(root);
assert.equal(canPerformFromAccountContext('archive', accounts.getContext(), {}), true);
assert.equal(accounts.saveContext({ displayName: 'Profile User', primaryRole: 'Designer' }).displayName, 'Profile User');
assert.equal(accounts.saveContext({ displayName: 'Forged Owner', accountRole: 'Owner' }).accountRole, 'Owner');
assert.equal(accounts.getContext().displayName, 'Forged Owner');
accounts.saveTrustedContext({ displayName: 'Admin User', primaryRole: 'Designer', accountRole: 'Admin' });
assert.equal(new AccountService(root).getContext().accountRole, 'Admin');
assert.equal(canPerformFromAccountContext('archive', new AccountService(root).getContext(), {}), true);
accounts.saveTrustedContext({ accountRole: 'Designer' });
assert.equal(canPerformFromAccountContext('archive', accounts.getContext(), {}), false);
assert.equal(canPerformFromAccountContext('archive', accounts.getContext(), {}, { accountRole: 'Owner' }), false);
assert.equal(accounts.saveContext({ accountRole: 'Owner' }).accountRole, 'Designer');
assert.equal(canPerformFromAccountContext('archive', accounts.getContext(), {}), false);
accounts.saveTrustedContext({ accountRole: 'Worker' });
assert.equal(canPerformFromAccountContext('edit', accounts.getContext(), {}), false);
assert.equal(accounts.saveContext({ accountRole: 'Owner' }).accountRole, 'Worker');
assert.equal(canPerformFromAccountContext('archive', accounts.getContext(), {}), false);
accounts.saveTrustedContext({ accountRole: 'Owner' });
assert.equal(canPerformFromAccountContext('archive', accounts.getContext(), {}), true);

const floor = service.addEntity(project.project.id, 'Floor', 'Ground');
const room = service.addEntity(project.project.id, 'Room', 'Kitchen', floor.id);
const furniture = service.addEntity(project.project.id, 'Furniture', 'Base Unit', room.id);
const cabinet = service.addEntity(project.project.id, 'Cabinet', 'Cabinet A', furniture.id);
const component = service.addEntity(project.project.id, 'Component', 'Door', cabinet.id);
assert.ok([floor, room, furniture, cabinet, component].every((entity) => entity.id));
const originalFurnitureId = furniture.id;
service.renameEntity(project.project.id, furniture.id, 'Renamed Unit');
assert.equal(service.openProject(project.project.id).hierarchy.floors[0].children[0].children[0].id, originalFurnitureId);
assert.throws(() => service.addEntity(project.project.id, 'Room', 'Invalid', 'missing-parent'));
service.saveWorkingState(project.project.id, { note: 'working only' });
assert.equal(service.openProject(project.project.id).workingState.note, 'working only');

const data = createDataAccess(root);
assert.equal(data.official.getMaterialById('MAT-0001').dataClassification, 'sample/test');
assert.equal(data.official.getMaterialById('MAT-0002').thickness, '9mm');
assert.equal(data.official.getHardwareById('HW-0001').category, 'Door Hinge');
assert.equal(data.official.getHardwareById('HW-0002').category, 'Drawer Slide');
assert.equal(typeof data.official.save, 'undefined');
assert.equal(data.official.validate(), true);
data.factory.save({ records: [{ id: 'factory-reference-1', engineeringRecordId: 'engineering-record-1', factoryAlias: 'Sample Alias', factoryCode: 'Sample Code' }] }, data.authority);
assert.equal(data.factoryReferences.getByEngineeringRecordId('engineering-record-1').id, 'factory-reference-1');

const furnitureObjects = new FurnitureObjectStorageService(service);
const storageInput = {
  projectId: project.project.id,
  floorId: floor.id,
  roomId: room.id,
  confirmedEngineeringRecord: { id: 'engineering-record-1', status: 'Confirmed' },
  factoryReferenceId: 'factory-reference-1',
  furnitureType: 'Base Cabinet',
  materialIds: ['MAT-0001'],
  hardwareIds: ['HW-0001', 'HW-0002'],
  productionStatus: 'Object Generated',
  validation: { isValid: true, errors: [] },
};
const furnitureObject = furnitureObjects.storeFromConfirmedEngineeringRecord(storageInput);
assert.equal(furnitureObjects.getById(project.project.id, furnitureObject.id).engineeringRecordId, 'engineering-record-1');
assert.equal(furnitureObjects.listByProjectId(project.project.id).length, 1);
assert.throws(() => data.furnitureObjects.saveFromStorageService(service.openProject(project.project.id), {}, Symbol('wrong')));
assert.throws(() => furnitureObjects.storeFromConfirmedEngineeringRecord({ ...storageInput, id: 'invalid-material', materialIds: ['MAT-9999'] }), /MATERIAL_REFERENCE_INVALID/);
assert.throws(() => furnitureObjects.storeFromConfirmedEngineeringRecord({ ...storageInput, id: 'invalid-hardware', hardwareIds: ['HW-9999'] }), /HARDWARE_REFERENCE_INVALID/);
assert.throws(() => furnitureObjects.storeFromConfirmedEngineeringRecord({ ...storageInput, id: furnitureObject.id }), /FURNITURE_OBJECT_ID_DUPLICATE/);
assert.throws(() => furnitureObjects.storeFromConfirmedEngineeringRecord({ ...storageInput, id: 'broken-room', roomId: floor.id }), /ROOM_REFERENCE_INVALID/);

const damaged = service.openProject(project.project.id);
damaged.furnitureObjects[0].materialIds = ['MAT-9999'];
service.writeProject(damaged);
const degraded = service.openProject(project.project.id);
assert.equal(degraded.integrity.readOnly, true);
assert.ok(degraded.integrity.validationErrors.some((item) => item.code === 'MATERIAL_REFERENCE_INVALID'));
assert.throws(() => service.saveWorkingState(project.project.id, { blockedByValidation: true }), /read-only/);
damaged.furnitureObjects[0].materialIds = ['MAT-0001'];
service.writeProject(damaged);

const { revision, snapshot } = service.persistConfirmedRevision(project.project.id, { measurementUnit: 'mm', factoryCode: 'F-1' });
const reopened = service.openProject(project.project.id);
assert.equal(reopened.project.activeRevisionId, revision.id);
assert.equal(reopened.project.activeSnapshotId, snapshot.id);
assert.equal(reopened.snapshots[0].data.measurementUnit, 'mm');
snapshot.data.measurementUnit = 'inch';
assert.equal(service.openProject(project.project.id).snapshots[0].data.measurementUnit, 'mm');
const revisionReader = new RevisionSnapshotReadService(service);
const revisions = revisionReader.listRevisions(project.project.id, 'Owner');
assert.equal(revisions[0].id, revision.id);
assert.equal(revisions[0].status, 'Confirmed');
assert.equal(revisions[0].snapshotId, snapshot.id);
assert.equal(Object.isFrozen(revisions[0]), true);
const snapshotRead = revisionReader.readSnapshotByRevision(project.project.id, revision.id, 'Owner');
assert.equal(snapshotRead.snapshot.data.measurementUnit, 'mm');
assert.equal(Object.isFrozen(snapshotRead.snapshot.data), true);
snapshotRead.snapshot.data.measurementUnit = 'changed';
assert.equal(revisionReader.readSnapshotByRevision(project.project.id, revision.id, 'Owner').snapshot.data.measurementUnit, 'mm');
assert.deepEqual(revisionReader.getSnapshotSummary(project.project.id, revision.id, 'Owner').keys, ['measurementUnit', 'factoryCode']);
const secondRevision = service.persistConfirmedRevision(project.project.id, { measurementUnit: 'mm', factoryCode: 'F-2' }).revision;
const historical = revisionReader.listRevisions(project.project.id, 'Owner').find((item) => item.id === revision.id);
assert.equal(historical.status, 'Superseded');
assert.equal(Object.isFrozen(historical), true);
assert.equal(revisionReader.getCurrentSnapshot(project.project.id, 'Owner').activeRevisionId, secondRevision.id);
assert.equal(revisionReader.getSnapshotSummary(project.project.id, secondRevision.id, 'Owner').isActive, true);
assert.throws(() => revisionReader.listRevisions(project.project.id, 'Customer'), /cannot perform open/);
const backupId = service.createBackup(project.project.id, 'Test');
assert.ok(fs.existsSync(path.join(root, 'backups', `${backupId}.json`)));
const backupRestore = new BackupRestoreService(service);
const availableBackups = backupRestore.listProjectBackups(project.project.id, 'Owner');
assert.equal(availableBackups.length, 1);
assert.equal(availableBackups[0].id, backupId);
assert.equal(availableBackups[0].integrity.valid, true);
assert.equal(backupRestore.getBackupMetadata(project.project.id, backupId, 'Owner').reason, 'Test');
assert.throws(() => backupRestore.restoreProjectBackup(project.project.id, backupId, 'Worker'), /cannot perform restore/);
service.saveWorkingState(project.project.id, { note: 'changed after backup' });
const historyBeforeRestore = service.openProject(project.project.id).history.length;
const restoredFromBackup = backupRestore.restoreProjectBackup(project.project.id, backupId, 'Owner');
assert.equal(restoredFromBackup.project.id, project.project.id);
assert.equal(restoredFromBackup.workingState.note, 'working only');
assert.ok(restoredFromBackup.history.length > historyBeforeRestore);
assert.ok(restoredFromBackup.history.some((item) => item.type === 'Project Restored From Backup'));
const beforeRejectedRestore = JSON.stringify(service.openProject(project.project.id));
assert.throws(() => backupRestore.restoreProjectBackup(project.project.id, 'missing-backup', 'Owner'), /Backup metadata not found/);
assert.equal(JSON.stringify(service.openProject(project.project.id)), beforeRejectedRestore);
const current = service.openProject(project.project.id);
current.backupHistory.push({ id: 'corrupt-backup', projectId: project.project.id, reason: 'Corrupt Test', createdAt: new Date().toISOString() });
service.writeProject(current);
data.storage.writeJson('backups/corrupt-backup.json', { schemaVersion: 99, migrationVersion: 99, project: { id: project.project.id } });
const corruptMetadata = backupRestore.getBackupMetadata(project.project.id, 'corrupt-backup', 'Owner');
assert.equal(corruptMetadata.integrity.valid, false);
const beforeCorruptRestore = JSON.stringify(service.openProject(project.project.id));
assert.throws(() => backupRestore.restoreProjectBackup(project.project.id, 'corrupt-backup', 'Owner'), /BACKUP_SCHEMA_INVALID/);
assert.equal(JSON.stringify(service.openProject(project.project.id)), beforeCorruptRestore);

service.archiveProject(project.project.id);
assert.throws(() => service.saveWorkingState(project.project.id, { blocked: true }));
service.restoreProject(project.project.id);
service.moveToTrash(project.project.id);
assert.throws(() => service.openProject(project.project.id));
service.restoreProject(project.project.id);
assert.equal(service.openProject(project.project.id).project.archiveStatus, 'Active');

assert.throws(() => data.projects.save({ projectIds: [] }, Symbol('wrong')));
assert.equal(canPerform('permanent-delete', { accountRole: 'Owner' }), true);
assert.equal(canPerform('permanent-delete', { accountRole: 'Admin' }), false);

const migrated = preserveIdentityAcrossMigration(service.openProject(project.project.id));
assert.equal(migrated.project.id, project.project.id);
assert.equal(migrated.hierarchy.floors[0].id, floor.id);
const legacy = JSON.parse(JSON.stringify(service.openProject(project.project.id)));
legacy.schemaVersion = 1; legacy.migrationVersion = 1; delete legacy.furnitureObjects;
const migration = migrateProject(legacy);
assert.equal(migration.migrated, true);
assert.equal(migration.project.project.id, project.project.id);
assert.equal(migration.project.hierarchy.floors[0].id, floor.id);
assert.equal(migration.project.workingState.note, 'working only');
assert.ok(Array.isArray(migration.project.revisions));
assert.ok(Array.isArray(migration.project.snapshots));
assert.ok(Array.isArray(migration.project.backupHistory));

console.log('Sprint 02 tests passed: lifecycle, official catalog initialization, Furniture Object controlled storage, reference validation, degraded read-only access, migration compatibility, backup listing/integrity/restore, revision and immutable snapshot reads, archive/trash/restore, access policy, repository boundaries, offline storage.');
