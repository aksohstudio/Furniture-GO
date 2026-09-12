const {
  PROJECT_STATUS,
  WORKFLOW_STATUS,
  LOCK_STATUS,
  ARCHIVE_STATUS,
  REVISION_STATUS,
  PROJECT_PDF_STATUS,
  DOCUMENT_TYPE,
  DOCUMENT_SOURCE,
  DOCUMENT_STATUS,
  DOCUMENT_STORAGE_STATUS,
  DOCUMENT_PERMISSION,
  DOCUMENT_REVISION_STATUS,
} = require('./constants');

/*
 * =====================================================
 * Project Schema Version
 * =====================================================
 *
 * Schema 3 introduces the generic Project Document
 * structure.
 *
 * Important:
 *
 * Existing Sprint 03 Designer PDF structures are
 * intentionally preserved for compatibility.
 *
 * The generic Document system is introduced as the
 * common project-source layer.
 *
 * Existing fields:
 *
 * - designerRevisions
 * - currentDesignerRevisionId
 * - backupPdf
 *
 * remain available for Sprint 03 compatibility.
 *
 * Generic project documents are stored in:
 *
 * projectDocuments.documents
 *
 * The generic Document structure supports:
 *
 * - PDF
 * - DWG
 * - DXF
 * - JPG
 * - PNG
 * - XLSX
 * - CSV
 * - DOCX
 * - ZIP
 *
 * No recognition result is created by this schema.
 *
 * The schema only defines the persistent structure
 * required for imported project documents.
 * =====================================================
 */

const SCHEMA_VERSION = 3;

const MIGRATION_VERSION = 3;

/*
 * =====================================================
 * Generic Project Document Schema
 * =====================================================
 *
 * This function creates the persistent structure for
 * one imported project document.
 *
 * Document Type and Document Source are intentionally
 * separate.
 *
 * Example:
 *
 * PDF + Designer
 * DWG + Electrical
 * PNG + Furniture
 * XLSX + Furniture
 *
 * Recognition data does not belong here.
 *
 * This record represents the imported source file.
 * =====================================================
 */

function createProjectDocumentSchema({
  id,
  projectId,
  fileName,
  documentType,
  documentSource =
    DOCUMENT_SOURCE.OTHER,
  mimeType = null,
  size = 0,
  storageKey = null,
  hash = null,
  status = DOCUMENT_STATUS.NEW,
  storageStatus =
    DOCUMENT_STORAGE_STATUS.AVAILABLE,
  permission =
    DOCUMENT_PERMISSION.READ_ONLY,
  revisionNumber = 1,
  revisionStatus =
    DOCUMENT_REVISION_STATUS.CURRENT,
  importedAt,
  createdAt = importedAt,
  updatedAt = importedAt,
}) {
  /*
   * ---------------------------------------------------
   * Document Type Validation
   * ---------------------------------------------------
   *
   * The schema does not perform business validation,
   * but it provides a stable supported-format definition
   * through DOCUMENT_TYPE.
   *
   * Import services are responsible for validating the
   * supplied documentType before persistence.
   */

  return {
    /*
     * -------------------------------------------------
     * Identity
     * -------------------------------------------------
     */

    id,

    projectId,

    /*
     * -------------------------------------------------
     * File Information
     * -------------------------------------------------
     *
     * documentType describes the physical file format.
     *
     * documentSource describes where the project
     * information originates.
     *
     * They must remain independent.
     */

    fileName,

    documentType,

    documentSource,

    mimeType,

    size,

    /*
     * -------------------------------------------------
     * Storage
     * -------------------------------------------------
     *
     * storageKey points to the actual stored file.
     *
     * storageStatus describes whether the file is
     * currently available in the storage layer.
     */

    storageKey,

    storageStatus,

    /*
     * -------------------------------------------------
     * Content Identity
     * -------------------------------------------------
     *
     * hash is used by the Import System for duplicate
     * content detection.
     *
     * The schema does not calculate the hash.
     */

    hash,

    /*
     * -------------------------------------------------
     * Import Status
     * -------------------------------------------------
     *
     * This describes the relationship of this imported
     * document to existing project data.
     *
     * Possible values:
     *
     * - New
     * - Updated
     * - Duplicate
     */

    status,

    /*
     * -------------------------------------------------
     * Permission
     * -------------------------------------------------
     *
     * Permission describes how Furniture GO manages
     * access to the stored document.
     */

    permission,

    /*
     * -------------------------------------------------
     * Generic Document Revision
     * -------------------------------------------------
     *
     * This revision belongs to the imported document
     * itself.
     *
     * It is intentionally separate from:
     *
     * - Project Revision
     * - Designer PDF Revision
     */

    revisionNumber,

    revisionStatus,

    /*
     * -------------------------------------------------
     * Timestamps
     * -------------------------------------------------
     */

    importedAt,

    createdAt,

    updatedAt,
  };
}

/*
 * =====================================================
 * Project Schema
 * =====================================================
 */

function createProjectSchema({
  id,
  name,
  now,
  ownerId = null,
  factoryId = null,
}) {
  return {
    schemaVersion:
      SCHEMA_VERSION,

    migrationVersion:
      MIGRATION_VERSION,

    /*
     * ===================================================
     * Project
     * ===================================================
     */

    project: {
      id,

      name,

      status:
        PROJECT_STATUS.IMPORTED,

      workflowStatus:
        WORKFLOW_STATUS.NOT_STARTED,

      lockStatus:
        LOCK_STATUS.UNLOCKED,

      archiveStatus:
        ARCHIVE_STATUS.ACTIVE,

      /*
       * Confirmed Project Revision
       */

      activeRevisionId:
        null,

      activeSnapshotId:
        null,

      ownerId,

      factoryId,

      createdAt:
        now,

      updatedAt:
        now,

      lastBackupId:
        null,
    },

    /*
     * ===================================================
     * Project Hierarchy
     * ===================================================
     *
     * Project
     *   ↓
     * Floor
     *   ↓
     * Room
     *   ↓
     * Furniture
     *
     * Additional downstream hierarchy may be added by
     * the appropriate project services.
     */

    hierarchy: {
      floors: [],
    },

    /*
     * ===================================================
     * Furniture Objects
     * ===================================================
     *
     * Furniture Objects are downstream objects.
     *
     * They may only be created from confirmed
     * Engineering Records.
     *
     * This schema does not create Furniture Objects.
     */

    furnitureObjects: [],

    /*
     * ===================================================
     * Engineering Records
     * ===================================================
     *
     * PRD09 — Project Recognition and Analysis Engine
     *
     * Recognition output.
     *
     * Engineering Records contain recognition
     * information only.
     *
     * They do NOT contain:
     *
     * - production calculations
     * - manufacturing methods
     * - board generation
     * - cutting optimization
     */

    engineeringRecords: [],

    /*
     * ===================================================
     * Engineering Issues
     * ===================================================
     *
     * PRD09 — Engineering Review List
     *
     * Issues detected during recognition.
     *
     * Engineering Issues identify risks and review
     * items.
     *
     * They do NOT automatically resolve engineering
     * problems.
     */

    engineeringIssues: [],

    /*
     * ===================================================
     * Project Documents
     * ===================================================
     *
     * PRD09
     * PRD20
     *
     * Generic project document storage.
     *
     * One project may contain multiple source
     * documents and multiple file formats.
     *
     * Supported document types:
     *
     * - PDF
     * - DWG
     * - DXF
     * - JPG
     * - PNG
     * - XLSX
     * - CSV
     * - DOCX
     * - ZIP
     *
     * Document format and document source are separate
     * concepts.
     *
     * Example:
     *
     * Architecture + PDF
     * Electrical + DWG
     * Furniture + PNG
     *
     * The documents collection contains imported
     * project-source files.
     *
     * It does NOT contain recognition results.
     */

    projectDocuments: {
      /*
       * -------------------------------------------------
       * Generic Documents
       * -------------------------------------------------
       *
       * Every imported project file may become a
       * persistent Document Record.
       *
       * The actual record is created by the Import
       * and Export Management System.
       *
       * New projects begin with an empty collection.
       */

      documents: [],

      /*
       * -------------------------------------------------
       * Current Designer Revision
       * -------------------------------------------------
       *
       * Sprint 03 compatibility.
       *
       * Recognition currently uses the Current Designer
       * Revision.
       */

      currentDesignerRevisionId:
        null,

      /*
       * -------------------------------------------------
       * Designer Revisions
       * -------------------------------------------------
       *
       * Sprint 03 compatibility.
       *
       * Every imported Designer PDF becomes a permanent
       * Designer Revision.
       *
       * This structure remains available while the
       * generic Document Revision system is introduced.
       */

      designerRevisions: [],

      /*
       * -------------------------------------------------
       * Backup PDF
       * -------------------------------------------------
       *
       * Sprint 03 compatibility.
       *
       * The Backup PDF is the editable engineering
       * working copy.
       *
       * It never replaces the Original Designer PDF.
       */

      backupPdf: {
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
      },
    },

    /*
     * ===================================================
     * Working State
     * ===================================================
     *
     * Temporary engineering working state.
     *
     * This is separate from confirmed Project
     * Revisions.
     */

    workingState: {
      status:
        REVISION_STATUS.WORKING,

      updatedAt:
        now,
    },

    /*
     * ===================================================
     * Confirmed Project Revisions
     * ===================================================
     *
     * Official engineering revisions created after
     * Project Confirmation.
     */

    revisions: [],

    /*
     * ===================================================
     * Immutable Project Snapshots
     * ===================================================
     *
     * Confirmed project snapshots are immutable.
     */

    snapshots: [],

    /*
     * ===================================================
     * Project Recognition / Engineering History
     * ===================================================
     *
     * Records project-level recognition, review,
     * confirmation, document and related history.
     */

    history: [],

    /*
     * ===================================================
     * Project Database Backup
     * ===================================================
     *
     * Sprint 02 JSON project database backup.
     *
     * This is intentionally separate from:
     *
     * - Backup PDF
     * - Document storage
     * - Export files
     */

    backupHistory: [],

    /*
     * ===================================================
     * Export History
     * ===================================================
     *
     * Records project export operations.
     */

    exportHistory: [],
  };
}

/*
 * =====================================================
 * Module Exports
 * =====================================================
 */

module.exports = {
  SCHEMA_VERSION,

  MIGRATION_VERSION,

  createProjectSchema,

  createProjectDocumentSchema,
};