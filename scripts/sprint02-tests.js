const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { ProjectService } = require('../src/services/project-service');
const { createDataAccess } = require('../src/database/repositories');
const { canPerform } = require('../src/services/access-policy');
const { preserveIdentityAcrossMigration } = require('../src/database/migrations');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'furniture-go-sprint02-'));
const service = new ProjectService(root);
const project = service.createProject('Offline Test Project', { ownerId: 'owner-1' });
assert.equal(project.project.status, 'Project Imported');
assert.equal(project.project.workflowStatus, 'Not Started');
assert.equal(service.openProject(project.project.id).project.id, project.project.id);

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

const { revision, snapshot } = service.persistConfirmedRevision(project.project.id, { measurementUnit: 'mm', factoryCode: 'F-1' });
const reopened = service.openProject(project.project.id);
assert.equal(reopened.project.activeRevisionId, revision.id);
assert.equal(reopened.project.activeSnapshotId, snapshot.id);
assert.equal(reopened.snapshots[0].data.measurementUnit, 'mm');
snapshot.data.measurementUnit = 'inch';
assert.equal(service.openProject(project.project.id).snapshots[0].data.measurementUnit, 'mm');
const backupId = service.createBackup(project.project.id, 'Test');
assert.ok(fs.existsSync(path.join(root, 'backups', `${backupId}.json`)));

service.archiveProject(project.project.id);
assert.throws(() => service.saveWorkingState(project.project.id, { blocked: true }));
service.restoreProject(project.project.id);
service.moveToTrash(project.project.id);
assert.throws(() => service.openProject(project.project.id));
service.restoreProject(project.project.id);
assert.equal(service.openProject(project.project.id).project.archiveStatus, 'Active');

const data = createDataAccess(root);
assert.throws(() => data.official.save({ changed: true }, data.authority));
assert.throws(() => data.projects.save({ projectIds: [] }, Symbol('wrong')));
assert.equal(canPerform('permanent-delete', { accountRole: 'Owner' }), true);
assert.equal(canPerform('permanent-delete', { accountRole: 'Admin' }), false);

const migrated = preserveIdentityAcrossMigration(service.openProject(project.project.id));
assert.equal(migrated.project.id, project.project.id);
assert.equal(migrated.hierarchy.floors[0].id, floor.id);

console.log('Sprint 02 tests passed: lifecycle, hierarchy, IDs, revisions, snapshots, history, backup, archive/trash/restore, access policy, migration identity, repository boundaries, offline storage.');
