const { PROJECT_STATUS, WORKFLOW_STATUS, LOCK_STATUS, ARCHIVE_STATUS, REVISION_STATUS } = require('./constants');

const SCHEMA_VERSION = 1;
const MIGRATION_VERSION = 1;

function createProjectSchema({ id, name, now, ownerId = null, factoryId = null }) {
  return {
    schemaVersion: SCHEMA_VERSION,
    migrationVersion: MIGRATION_VERSION,
    project: {
      id,
      name,
      status: PROJECT_STATUS.IMPORTED,
      workflowStatus: WORKFLOW_STATUS.NOT_STARTED,
      lockStatus: LOCK_STATUS.UNLOCKED,
      archiveStatus: ARCHIVE_STATUS.ACTIVE,
      activeRevisionId: null,
      activeSnapshotId: null,
      ownerId,
      factoryId,
      createdAt: now,
      updatedAt: now,
      lastBackupId: null,
    },
    hierarchy: { floors: [] },
    workingState: { status: REVISION_STATUS.WORKING, updatedAt: now },
    revisions: [],
    snapshots: [],
    history: [],
    backupHistory: [],
    exportHistory: [],
  };
}

module.exports = { SCHEMA_VERSION, MIGRATION_VERSION, createProjectSchema };
