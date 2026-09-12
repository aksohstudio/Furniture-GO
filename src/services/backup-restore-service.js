const { createObjectId } = require('../database/id');
const { migrateProject } = require('../database/migrations');
const { canPerform } = require('./access-policy');

function now() { return new Date().toISOString(); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }

function mergeHistory(...collections) {
  const byId = new Map();
  collections.flat().filter(Boolean).forEach((item) => byId.set(item.id, item));
  return [...byId.values()].sort((left, right) => String(left.createdAt).localeCompare(String(right.createdAt)));
}

class BackupRestoreService {
  constructor(projectService) {
    if (!projectService?.data || typeof projectService.readProject !== 'function') throw new Error('BackupRestoreService requires ProjectService');
    this.projectService = projectService;
    this.data = projectService.data;
  }

  assertPermission(action, project, accountRole) {
    if (!canPerform(action, { accountRole, archiveStatus: project.project.archiveStatus, lockStatus: project.project.lockStatus })) throw new Error(`Account role cannot perform ${action}`);
  }

  getBackupMetadata(projectId, backupId, accountRole) {
    const project = this.projectService.readProject(projectId);
    if (!project) throw new Error('Project not found');
    this.assertPermission('open', project, accountRole);
    const metadata = (project.backupHistory || []).find((item) => item.id === backupId);
    if (!metadata) throw new Error('Backup metadata not found');
    return { ...metadata, integrity: this.verifyBackup(projectId, metadata) };
  }

  listProjectBackups(projectId, accountRole) {
    const project = this.projectService.readProject(projectId);
    if (!project) throw new Error('Project not found');
    this.assertPermission('open', project, accountRole);
    return (project.backupHistory || []).map((metadata) => ({ ...metadata, integrity: this.verifyBackup(projectId, metadata) }));
  }

  verifyBackup(projectId, metadata) {
    const errors = [];
    if (!metadata?.id || metadata.projectId !== projectId) errors.push({ code: 'BACKUP_METADATA_INVALID', message: 'Backup metadata does not match the Project' });
    let stored;
    try { stored = this.data.storage.readJson(`backups/${metadata?.id}.json`, null); } catch (error) { errors.push({ code: 'BACKUP_CONTENT_INVALID', message: error.message }); }
    if (!stored) errors.push({ code: 'BACKUP_MISSING', message: 'Backup file is unavailable' });
    if (stored) {
      try {
        const migrated = migrateProject(stored).project;
        if (migrated.project.id !== projectId) errors.push({ code: 'BACKUP_PROJECT_ID_INVALID', message: 'Backup Project ID does not match the selected Project' });
        errors.push(...this.projectService.referenceValidator.validateProject(migrated));
      } catch (error) { errors.push({ code: 'BACKUP_SCHEMA_INVALID', message: error.message }); }
    }
    return { valid: errors.length === 0, errors };
  }

  restoreProjectBackup(projectId, backupId, accountRole) {
    const original = this.projectService.readProject(projectId);
    if (!original) throw new Error('Project not found');
    this.assertPermission('restore', original, accountRole);
    const metadata = (original.backupHistory || []).find((item) => item.id === backupId);
    if (!metadata) throw new Error('Backup metadata not found');
    const integrity = this.verifyBackup(projectId, metadata);
    if (!integrity.valid) throw new Error(`Backup restore rejected: ${integrity.errors.map((item) => item.code).join(', ')}`);

    const backup = this.data.storage.readJson(`backups/${backupId}.json`);
    const restored = migrateProject(backup).project;
    restored.history = mergeHistory(restored.history || [], original.history || [], [{ id: createObjectId(), type: 'Project Restored From Backup', projectId, backupId, createdAt: now() }]);
    restored.backupHistory = mergeHistory(restored.backupHistory || [], original.backupHistory || []);
    restored.project.lastBackupId = original.project.lastBackupId || restored.project.lastBackupId;
    restored.project.updatedAt = now();
    const postRestoreErrors = this.projectService.referenceValidator.validateProject(restored);
    if (postRestoreErrors.length) throw new Error(`Backup restore rejected: ${postRestoreErrors.map((item) => item.code).join(', ')}`);
    this.projectService.writeProject(restored);
    return this.projectService.openProject(projectId);
  }
}

module.exports = { BackupRestoreService };
