const { SCHEMA_VERSION, MIGRATION_VERSION } = require('./schema');

function validateVersions(project) {
  if (!project || project.schemaVersion !== SCHEMA_VERSION || project.migrationVersion !== MIGRATION_VERSION) throw new Error('Unsupported project schema or migration version');
  return true;
}

function preserveIdentityAcrossMigration(project) {
  validateVersions(project);
  return JSON.parse(JSON.stringify(project));
}

module.exports = { SCHEMA_VERSION, MIGRATION_VERSION, validateVersions, preserveIdentityAcrossMigration };
