const { createObjectId } = require('../database/id');
const { createProjectSchema } = require('../database/schema');
const { ARCHIVE_STATUS, PROJECT_STATUS, WORKFLOW_STATUS, LOCK_STATUS, REVISION_STATUS } = require('../database/constants');
const { createDataAccess } = require('../database/repositories');

function now() { return new Date().toISOString(); }

class ProjectService {
  constructor(rootDirectory) {
    this.data = createDataAccess(rootDirectory);
    this.index = this.data.projects.get({ projectIds: [] });
  }

  persistIndex() { this.data.projects.save(this.index, this.data.authority); }

  readProject(projectId) { return this.data.projectDatabase.getById(projectId); }

  writeProject(project) { this.data.projectDatabase.saveById(project, this.data.authority); }

  appendHistory(project, type, details = {}) {
    const entry = { id: createObjectId(), type, projectId: project.project.id, createdAt: now(), ...details };
    project.history.push(entry);
    return entry;
  }

  createProject(name, options = {}) {
    const projectId = createObjectId();
    const timestamp = now();
    const project = createProjectSchema({ id: projectId, name, now: timestamp, ownerId: options.ownerId, factoryId: options.factoryId });
    this.appendHistory(project, 'Project Created', { createdAt: timestamp });
    this.writeProject(project);
    this.index.projectIds.push(projectId);
    this.persistIndex();
    return project;
  }

  openProject(projectId) {
    const project = this.readProject(projectId);
    if (!project) throw new Error('Project not found');
    if (project.project.archiveStatus === ARCHIVE_STATUS.TRASH) throw new Error('Trash projects cannot be opened directly');
    return project;
  }

  saveWorkingState(projectId, changes) {
    const project = this.openProject(projectId);
    if (project.project.archiveStatus === ARCHIVE_STATUS.ARCHIVED) throw new Error('Archived projects are read-only');
    if (project.project.lockStatus === LOCK_STATUS.LOCKED) throw new Error('Locked projects cannot be edited');
    project.workingState = { ...project.workingState, ...changes, status: REVISION_STATUS.WORKING, updatedAt: now() };
    project.project.updatedAt = project.workingState.updatedAt;
    project.history.push({ id: createObjectId(), type: 'Working State Saved', projectId, createdAt: project.workingState.updatedAt });
    this.writeProject(project);
    return project;
  }

  archiveProject(projectId) {
    const project = this.openProject(projectId);
    project.project.archiveStatus = ARCHIVE_STATUS.ARCHIVED;
    project.project.status = PROJECT_STATUS.ARCHIVED;
    project.project.workflowStatus = WORKFLOW_STATUS.NOT_STARTED;
    project.project.updatedAt = now();
    project.history.push({ id: createObjectId(), type: 'Project Archived', projectId, createdAt: project.project.updatedAt });
    this.writeProject(project);
    return project;
  }

  restoreProject(projectId) {
    const project = this.readProject(projectId);
    if (!project || ![ARCHIVE_STATUS.ARCHIVED, ARCHIVE_STATUS.TRASH].includes(project.project.archiveStatus)) throw new Error('Project is not restorable');
    project.project.archiveStatus = ARCHIVE_STATUS.ACTIVE;
    project.project.status = PROJECT_STATUS.IMPORTED;
    project.project.workflowStatus = WORKFLOW_STATUS.NOT_STARTED;
    project.project.lockStatus = LOCK_STATUS.UNLOCKED;
    project.project.updatedAt = now();
    project.history.push({ id: createObjectId(), type: 'Project Restored', projectId, createdAt: project.project.updatedAt });
    this.writeProject(project);
    return project;
  }

  moveToTrash(projectId) {
    const project = this.openProject(projectId);
    project.project.archiveStatus = ARCHIVE_STATUS.TRASH;
    project.project.updatedAt = now();
    project.history.push({ id: createObjectId(), type: 'Project Moved to Trash', projectId, createdAt: project.project.updatedAt });
    this.writeProject(project);
    return project;
  }

  addEntity(projectId, type, name, parentId = null) {
    const project = this.openProject(projectId);
    if (project.project.archiveStatus !== ARCHIVE_STATUS.ACTIVE || project.project.lockStatus === LOCK_STATUS.LOCKED) throw new Error('Project is not editable');
    const entity = { id: createObjectId(), type, name, parentId, createdAt: now(), updatedAt: now() };
    const levels = { Floor: 'floors', Room: 'rooms', Furniture: 'furniture', Cabinet: 'cabinets', Module: 'modules', Component: 'components' };
    const collection = levels[type];
    if (!collection) throw new Error(`Unsupported hierarchy type: ${type}`);
    if (type === 'Floor') project.hierarchy.floors.push({ ...entity, children: [] });
    else {
      const parentTypes = { Room: 'Floor', Furniture: 'Room', Cabinet: 'Furniture', Module: 'Furniture', Component: 'CabinetOrModule' };
      const requiredParent = parentTypes[type];
      const parent = this.findEntity(project, parentId);
      if (!parent || (requiredParent !== 'CabinetOrModule' && parent.type !== requiredParent) || (requiredParent === 'CabinetOrModule' && !['Cabinet', 'Module'].includes(parent.type))) throw new Error(`${type} requires a valid ${requiredParent} parent`);
      parent.children = parent.children || [];
      parent.children.push(entity);
    }
    this.appendHistory(project, 'Hierarchy Entity Added', { entityId: entity.id, entityType: type });
    project.project.updatedAt = now(); this.writeProject(project); return entity;
  }

  findEntity(project, id) {
    const visit = (node) => { if (node.id === id) return node; for (const child of (node.children || [])) { const found = visit(child); if (found) return found; } return null; };
    for (const floor of project.hierarchy.floors) { const found = visit(floor); if (found) return found; }
    return null;
  }

  renameEntity(projectId, entityId, name) {
    const project = this.openProject(projectId);
    if (project.project.archiveStatus !== ARCHIVE_STATUS.ACTIVE || project.project.lockStatus === LOCK_STATUS.LOCKED) throw new Error('Project is not editable');
    const entity = this.findEntity(project, entityId);
    if (!entity) throw new Error('Entity not found');
    entity.name = name; entity.updatedAt = now();
    this.appendHistory(project, 'Hierarchy Entity Renamed', { entityId, name });
    project.project.updatedAt = entity.updatedAt; this.writeProject(project); return entity;
  }

  persistConfirmedRevision(projectId, snapshotData = {}) {
    const project = this.openProject(projectId);
    const timestamp = now();
    const revisionId = createObjectId();
    const snapshotId = createObjectId();
    const revision = { id: revisionId, projectId, status: REVISION_STATUS.CONFIRMED, createdAt: timestamp, source: 'Working State' };
    const snapshot = Object.freeze ? { id: snapshotId, revisionId, createdAt: timestamp, data: JSON.parse(JSON.stringify(snapshotData)), immutable: true } : null;
    project.revisions.forEach((item) => { if (item.status === REVISION_STATUS.CONFIRMED) item.status = REVISION_STATUS.SUPERSEDED; });
    project.revisions.push(revision); project.snapshots.push(snapshot);
    project.project.activeRevisionId = revisionId; project.project.activeSnapshotId = snapshotId;
    this.appendHistory(project, 'Confirmed Revision Persisted', { revisionId, snapshotId });
    this.writeProject(project); return { revision, snapshot };
  }

  createBackup(projectId, reason = 'Manual') {
    const project = this.openProject(projectId); const backupId = createObjectId(); const timestamp = now();
    this.data.storage.writeJson(`backups/${backupId}.json`, JSON.parse(JSON.stringify(project)));
    project.backupHistory.push({ id: backupId, projectId, reason, createdAt: timestamp }); project.project.lastBackupId = backupId; this.writeProject(project); return backupId;
  }
}

module.exports = { ProjectService };
