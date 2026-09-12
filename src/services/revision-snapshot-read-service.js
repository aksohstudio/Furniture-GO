const { canPerform } = require('./access-policy');

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}
function readOnly(value) { return deepFreeze(clone(value)); }

class RevisionSnapshotReadService {
  constructor(projectService) {
    if (!projectService?.openProject) throw new Error('RevisionSnapshotReadService requires ProjectService');
    this.projectService = projectService;
  }

  openReadOnly(projectId, accountRole) {
    const project = this.projectService.openProject(projectId);
    if (!canPerform('open', { accountRole, archiveStatus: project.project.archiveStatus, lockStatus: project.project.lockStatus })) throw new Error('Account role cannot perform open');
    return project;
  }

  listRevisions(projectId, accountRole) {
    const project = this.openReadOnly(projectId, accountRole);
    return readOnly((project.revisions || []).map((revision) => ({
      id: revision.id,
      status: revision.status,
      createdAt: revision.createdAt,
      snapshotId: (project.snapshots || []).find((snapshot) => snapshot.revisionId === revision.id)?.id || null,
      isActive: project.project.activeRevisionId === revision.id,
    })));
  }

  readSnapshotByRevision(projectId, revisionId, accountRole) {
    const project = this.openReadOnly(projectId, accountRole);
    const revision = (project.revisions || []).find((item) => item.id === revisionId);
    if (!revision) throw new Error('Revision not found');
    const snapshot = (project.snapshots || []).find((item) => item.revisionId === revisionId);
    if (!snapshot) throw new Error('Snapshot not found for Revision');
    return readOnly({ revision: { id: revision.id, status: revision.status, createdAt: revision.createdAt }, snapshot });
  }

  getSnapshotSummary(projectId, revisionId, accountRole) {
    const { revision, snapshot } = this.readSnapshotByRevision(projectId, revisionId, accountRole);
    const project = this.openReadOnly(projectId, accountRole);
    return readOnly({ revisionId: revision.id, snapshotId: snapshot.id, createdAt: snapshot.createdAt, keys: Object.keys(snapshot.data || {}), isActive: project.project.activeSnapshotId === snapshot.id });
  }

  getCurrentSnapshot(projectId, accountRole) {
    const project = this.openReadOnly(projectId, accountRole);
    if (!project.project.activeRevisionId || !project.project.activeSnapshotId) return readOnly({ activeRevisionId: null, activeSnapshotId: null, revision: null, snapshot: null });
    const result = this.readSnapshotByRevision(projectId, project.project.activeRevisionId, accountRole);
    return readOnly({ activeRevisionId: project.project.activeRevisionId, activeSnapshotId: project.project.activeSnapshotId, ...result });
  }
}

module.exports = { RevisionSnapshotReadService };
