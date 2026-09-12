const {
  SCHEMA_VERSION,
  MIGRATION_VERSION,
} = require('./schema');

const {
  PROJECT_PDF_STATUS,
} = require('./constants');

/*
 * =====================================================
 * Version Validation
 * =====================================================
 */

function validateVersions(project) {
  if (
    !project ||
    project.schemaVersion !==
      SCHEMA_VERSION ||
    project.migrationVersion !==
      MIGRATION_VERSION
  ) {
    throw new Error(
      'Unsupported project schema or migration version'
    );
  }

  return true;
}

/*
 * =====================================================
 * Generic Project Document Structure
 * =====================================================
 *
 * Schema 3 introduces:
 *
 * project.projectDocuments.documents[]
 *
 * This is the generic document layer for PRD09 and
 * PRD20.
 *
 * Important:
 *
 * This function does NOT create fake documents.
 *
 * Existing Designer PDF revisions remain in:
 *
 * project.projectDocuments.designerRevisions
 *
 * Existing Backup PDF remains in:
 *
 * project.projectDocuments.backupPdf
 *
 * They are intentionally preserved for compatibility.
 *
 * The generic Document system is a new project-source
 * layer and does not automatically reinterpret historical
 * Sprint 03 data.
 */

function ensureProjectDocumentStructure(
  project
) {
  /*
   * ---------------------------------------------------
   * Project Documents
   * ---------------------------------------------------
   */

  if (
    !project.projectDocuments ||
    typeof project.projectDocuments !==
      'object' ||
    Array.isArray(
      project.projectDocuments
    )
  ) {
    project.projectDocuments = {};
  }

  /*
   * ---------------------------------------------------
   * Generic Documents
   * ---------------------------------------------------
   *
   * Do not manufacture document records during
   * migration.
   *
   * Existing imported files are not automatically
   * converted into generic Document records.
   *
   * The Import and Export Management System is
   * responsible for creating new generic Document
   * records.
   */

  if (
    !Array.isArray(
      project.projectDocuments
        .documents
    )
  ) {
    project.projectDocuments
      .documents = [];
  }

  /*
   * ---------------------------------------------------
   * Designer Revisions
   * ---------------------------------------------------
   *
   * Sprint 03 compatibility.
   *
   * Every existing Designer Revision remains exactly
   * where it was.
   */

  if (
    !Array.isArray(
      project.projectDocuments
        .designerRevisions
    )
  ) {
    project.projectDocuments
      .designerRevisions = [];
  }

  /*
   * ---------------------------------------------------
   * Current Designer Revision
   * ---------------------------------------------------
   */

  if (
    !Object.prototype.hasOwnProperty.call(
      project.projectDocuments,
      'currentDesignerRevisionId'
    )
  ) {
    project.projectDocuments
      .currentDesignerRevisionId = null;
  }

  /*
   * ---------------------------------------------------
   * Backup PDF
   * ---------------------------------------------------
   *
   * Sprint 03 compatibility.
   *
   * Backup PDF is intentionally kept separate from
   * Generic Project Documents.
   */

  if (
    !project.projectDocuments
      .backupPdf ||
    typeof project.projectDocuments
      .backupPdf !== 'object' ||
    Array.isArray(
      project.projectDocuments
        .backupPdf
    )
  ) {
    project.projectDocuments
      .backupPdf = {
        id:
          null,

        sourceDesignerRevisionId:
          null,

        fileName:
          null,

        storageKey:
          null,

        status:
          PROJECT_PDF_STATUS.NOT_CREATED,

        createdAt:
          null,

        updatedAt:
          null,
      };
  } else {
    const backupPdf =
      project.projectDocuments
        .backupPdf;

    if (
      !Object.prototype.hasOwnProperty.call(
        backupPdf,
        'id'
      )
    ) {
      backupPdf.id =
        null;
    }

    if (
      !Object.prototype.hasOwnProperty.call(
        backupPdf,
        'sourceDesignerRevisionId'
      )
    ) {
      backupPdf
        .sourceDesignerRevisionId =
        null;
    }

    if (
      !Object.prototype.hasOwnProperty.call(
        backupPdf,
        'fileName'
      )
    ) {
      backupPdf.fileName =
        null;
    }

    if (
      !Object.prototype.hasOwnProperty.call(
        backupPdf,
        'storageKey'
      )
    ) {
      backupPdf.storageKey =
        null;
    }

    if (
      !Object.prototype.hasOwnProperty.call(
        backupPdf,
        'status'
      )
    ) {
      backupPdf.status =
        PROJECT_PDF_STATUS.NOT_CREATED;
    }

    if (
      !Object.prototype.hasOwnProperty.call(
        backupPdf,
        'createdAt'
      )
    ) {
      backupPdf.createdAt =
        null;
    }

    if (
      !Object.prototype.hasOwnProperty.call(
        backupPdf,
        'updatedAt'
      )
    ) {
      backupPdf.updatedAt =
        null;
    }
  }

  return project;
}

/*
 * =====================================================
 * Sprint 03 Recognition Structure
 * =====================================================
 *
 * Ensures that every current-schema project has the
 * complete Project Recognition data structure.
 *
 * This migration does not create fake recognition data.
 *
 * It only creates empty collections when the structure
 * does not exist yet.
 */

function ensureSprint03RecognitionStructure(
  project
) {
  /*
   * ---------------------------------------------------
   * Generic Project Documents
   * ---------------------------------------------------
   */

  ensureProjectDocumentStructure(
    project
  );

  /*
   * ---------------------------------------------------
   * Engineering Records
   * ---------------------------------------------------
   *
   * Recognition output.
   *
   * Never create fake records during migration.
   */

  if (
    !Array.isArray(
      project.engineeringRecords
    )
  ) {
    project.engineeringRecords =
      [];
  }

  /*
   * ---------------------------------------------------
   * Engineering Issues
   * ---------------------------------------------------
   *
   * Recognition Review List.
   *
   * Never create fake issues during migration.
   */

  if (
    !Array.isArray(
      project.engineeringIssues
    )
  ) {
    project.engineeringIssues =
      [];
  }

  /*
   * ---------------------------------------------------
   * Furniture Objects
   * ---------------------------------------------------
   *
   * Older projects may not have the collection.
   */

  if (
    !Array.isArray(
      project.furnitureObjects
    )
  ) {
    project.furnitureObjects =
      [];
  }

  /*
   * ---------------------------------------------------
   * Working State
   * ---------------------------------------------------
   */

  if (
    !project.workingState ||
    typeof project.workingState !==
      'object' ||
    Array.isArray(
      project.workingState
    )
  ) {
    project.workingState = {
      status:
        'Working',

      updatedAt:
        new Date().toISOString(),
    };
  }

  /*
   * ---------------------------------------------------
   * Confirmed Revisions
   * ---------------------------------------------------
   */

  if (
    !Array.isArray(
      project.revisions
    )
  ) {
    project.revisions =
      [];
  }

  /*
   * ---------------------------------------------------
   * Snapshots
   * ---------------------------------------------------
   */

  if (
    !Array.isArray(
      project.snapshots
    )
  ) {
    project.snapshots =
      [];
  }

  /*
   * ---------------------------------------------------
   * History
   * ---------------------------------------------------
   */

  if (
    !Array.isArray(
      project.history
    )
  ) {
    project.history =
      [];
  }

  /*
   * ---------------------------------------------------
   * Project Database Backups
   * ---------------------------------------------------
   */

  if (
    !Array.isArray(
      project.backupHistory
    )
  ) {
    project.backupHistory =
      [];
  }

  /*
   * ---------------------------------------------------
   * Export History
   * ---------------------------------------------------
   */

  if (
    !Array.isArray(
      project.exportHistory
    )
  ) {
    project.exportHistory =
      [];
  }

  return project;
}

/*
 * =====================================================
 * Schema 2 → Schema 3
 * =====================================================
 *
 * Schema 2 already contains the Sprint 03 PDF
 * structures.
 *
 * Schema 3 adds the generic Document collection.
 *
 * IMPORTANT:
 *
 * We do NOT convert existing Designer Revisions into
 * generic Documents.
 *
 * This is intentional.
 *
 * The existing Sprint 03 services still operate on:
 *
 * - designerRevisions
 * - currentDesignerRevisionId
 * - backupPdf
 *
 * Therefore this migration only introduces the new
 * collection and preserves every existing value.
 */

function migrateSchema2ToSchema3(
  project
) {
  const migrated =
    project;

  /*
   * ---------------------------------------------------
   * Preserve Existing Project Data
   * ---------------------------------------------------
   *
   * No existing document, revision, recognition record,
   * history record, snapshot, or backup is deleted.
   */

  ensureProjectDocumentStructure(
    migrated
  );

  /*
   * ---------------------------------------------------
   * Normalize Existing Recognition Structures
   * ---------------------------------------------------
   */

  ensureSprint03RecognitionStructure(
    migrated
  );

  /*
   * ---------------------------------------------------
   * Upgrade Version Markers
   * ---------------------------------------------------
   *
   * Version markers are updated only after the required
   * Schema 3 structures have been created.
   */

  migrated.schemaVersion =
    SCHEMA_VERSION;

  migrated.migrationVersion =
    MIGRATION_VERSION;

  return migrated;
}

/*
 * =====================================================
 * Schema 1 → Schema 3
 * =====================================================
 *
 * Sprint 02 projects may not contain all Sprint 03
 * structures.
 *
 * We therefore:
 *
 * 1. Preserve the existing project.
 * 2. Add missing Sprint 03 structures.
 * 3. Add generic Document structure.
 * 4. Upgrade directly to Schema 3.
 *
 * No fake documents or recognition records are created.
 */

function migrateSchema1ToSchema3(
  project
) {
  const migrated =
    project;

  /*
   * ---------------------------------------------------
   * Furniture Objects
   * ---------------------------------------------------
   *
   * Sprint 02 did not necessarily contain this
   * collection.
   */

  if (
    !Array.isArray(
      migrated.furnitureObjects
    )
  ) {
    migrated.furnitureObjects =
      [];
  }

  /*
   * ---------------------------------------------------
   * Upgrade Structure
   * ---------------------------------------------------
   */

  ensureSprint03RecognitionStructure(
    migrated
  );

  /*
   * ---------------------------------------------------
   * Upgrade Version Markers
   * ---------------------------------------------------
   */

  migrated.schemaVersion =
    SCHEMA_VERSION;

  migrated.migrationVersion =
    MIGRATION_VERSION;

  return migrated;
}

/*
 * =====================================================
 * Project Migration
 * =====================================================
 */

function migrateProject(project) {
  if (
    !project ||
    !project.project
  ) {
    throw new Error(
      'Project data is invalid'
    );
  }

  /*
   * Always work on a clone.
   *
   * Migration must not mutate the object supplied by
   * the caller before the migrated result is returned.
   */

  const migrated =
    JSON.parse(
      JSON.stringify(
        project
      )
    );

  /*
   * ===================================================
   * Sprint 02 → Schema 3
   * ===================================================
   */

  if (
    migrated.schemaVersion ===
      1 &&
    migrated.migrationVersion ===
      1
  ) {
    const upgraded =
      migrateSchema1ToSchema3(
        migrated
      );

    return {
      project:
        upgraded,

      migrated:
        true,
    };
  }

  /*
   * ===================================================
   * Schema 2 → Schema 3
   * ===================================================
   *
   * This is the important migration for projects
   * currently created by the Sprint 03 implementation.
   */

  if (
    migrated.schemaVersion ===
      2 &&
    migrated.migrationVersion ===
      2
  ) {
    const upgraded =
      migrateSchema2ToSchema3(
        migrated
      );

    return {
      project:
        upgraded,

      migrated:
        true,
    };
  }

  /*
   * ===================================================
   * Current Schema
   * ===================================================
   *
   * Projects already at Schema 3 may have been created
   * before all Schema 3 structures were normalized.
   *
   * Therefore we normalize the structure here as well.
   */

  if (
    migrated.schemaVersion ===
      SCHEMA_VERSION &&
    migrated.migrationVersion ===
      MIGRATION_VERSION
  ) {
    const before =
      JSON.stringify(
        migrated
      );

    ensureSprint03RecognitionStructure(
      migrated
    );

    const after =
      JSON.stringify(
        migrated
      );

    return {
      project:
        migrated,

      migrated:
        before !== after,
    };
  }

  /*
   * ===================================================
   * Unsupported Version
   * ===================================================
   */

  validateVersions(
    migrated
  );

  return {
    project:
      migrated,

    migrated:
      false,
  };
}

/*
 * =====================================================
 * Identity Preservation
 * =====================================================
 *
 * Migration must preserve the original project identity.
 *
 * This includes:
 *
 * - Project ID
 * - Project Name
 * - Owner ID
 * - Factory ID
 * - Project History
 * - Designer Revision IDs
 * - Current Designer Revision ID
 * - Backup PDF relationship
 * - Existing Revision IDs
 * - Existing Snapshot IDs
 *
 * No new project identity is generated here.
 */

function preserveIdentityAcrossMigration(
  project
) {
  return migrateProject(
    project
  ).project;
}

/*
 * =====================================================
 * Module Exports
 * =====================================================
 */

module.exports = {
  SCHEMA_VERSION,

  MIGRATION_VERSION,

  validateVersions,

  migrateProject,

  preserveIdentityAcrossMigration,
};