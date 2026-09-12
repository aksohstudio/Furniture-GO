/*
 * =====================================================
 * Furniture GO — Database Constants
 * =====================================================
 *
 * This file contains shared system constants used by
 * Project, Recognition, Document, Revision, Workflow
 * and Engineering Review systems.
 *
 * Important:
 *
 * - Document Type describes the physical file format.
 * - Document Source describes the project source/category.
 * - Document Status describes the imported file state.
 *
 * These concepts must remain separate.
 * =====================================================
 */

/*
 * =====================================================
 * Project Status
 * =====================================================
 */

const PROJECT_STATUS = Object.freeze({
  IMPORTED: 'Project Imported',

  ARCHIVED: 'Archived',
});

/*
 * =====================================================
 * Workflow Status
 * =====================================================
 */

const WORKFLOW_STATUS = Object.freeze({
  NOT_STARTED: 'Not Started',

  /*
   * Sprint 03 — Project Recognition
   */

  RECOGNITION_IN_PROGRESS:
    'Recognition In Progress',

  ENGINEERING_RECORDS_GENERATED:
    'Engineering Records Generated',

  ENGINEERING_REVIEW_REQUIRED:
    'Engineering Review Required',

  MANUAL_CORRELATION_REQUIRED:
    'Manual Correlation Required',

  SITE_VERIFICATION_REQUIRED:
    'Site Verification Required',

  READY_FOR_PROJECT_CONFIRMATION:
    'Ready for Project Confirmation',

  /*
   * Project Confirmation
   */

  CONFIRMED:
    'Confirmed',
});

/*
 * =====================================================
 * Lock Status
 * =====================================================
 */

const LOCK_STATUS = Object.freeze({
  UNLOCKED: 'Unlocked',

  LOCKED: 'Locked',
});

/*
 * =====================================================
 * Revision Status
 * =====================================================
 */

const REVISION_STATUS = Object.freeze({
  WORKING: 'Working',

  CONFIRMED: 'Confirmed',

  SUPERSEDED: 'Superseded',
});

/*
 * =====================================================
 * Archive Status
 * =====================================================
 */

const ARCHIVE_STATUS = Object.freeze({
  ACTIVE: 'Active',

  ARCHIVED: 'Archived',

  TRASH: 'Trash',
});

/*
 * =====================================================
 * Document Type
 * =====================================================
 *
 * PRD20 — Import and Export Management System
 *
 * Document Type represents the actual file format.
 *
 * This is intentionally separate from:
 *
 * - Document Source
 * - Document Status
 * - Revision Status
 *
 * Supported import / export formats for Version 1.
 * =====================================================
 */

const DOCUMENT_TYPE = Object.freeze({
  PDF: 'PDF',

  DWG: 'DWG',

  DXF: 'DXF',

  JPG: 'JPG',

  PNG: 'PNG',

  XLSX: 'XLSX',

  CSV: 'CSV',

  DOCX: 'DOCX',

  ZIP: 'ZIP',
});

/*
 * =====================================================
 * Document Source
 * =====================================================
 *
 * PRD09 — Project Recognition and Analysis Engine
 *
 * Document Source describes where the project
 * information originates from.
 *
 * It does NOT describe the physical file format.
 *
 * Example:
 *
 * Architecture Drawing
 *     ↓
 * PDF
 *
 * Electrical Drawing
 *     ↓
 * DWG
 *
 * Plumbing Drawing
 *     ↓
 * PNG
 *
 * Therefore source and type must remain separate.
 * =====================================================
 */

const DOCUMENT_SOURCE = Object.freeze({
  DESIGNER:
    'Designer',

  ARCHITECTURE:
    'Architecture',

  ELECTRICAL:
    'Electrical',

  CEILING:
    'Ceiling',

  PLUMBING:
    'Plumbing',

  FURNITURE:
    'Furniture',

  OTHER:
    'Other',
});

/*
 * =====================================================
 * Document Status
 * =====================================================
 *
 * PRD20 — Import Processing
 *
 * The status describes how an imported document
 * relates to the existing project data.
 *
 * New File
 * Updated File
 * Duplicate File
 *
 * This is NOT the same as a workflow status.
 * =====================================================
 */

const DOCUMENT_STATUS = Object.freeze({
  NEW:
    'New',

  UPDATED:
    'Updated',

  DUPLICATE:
    'Duplicate',
});

/*
 * =====================================================
 * Document Storage Status
 * =====================================================
 *
 * Internal storage lifecycle.
 *
 * This is separate from DOCUMENT_STATUS.
 *
 * DOCUMENT_STATUS answers:
 *
 * "What is the relationship of this imported file
 *  to existing project data?"
 *
 * DOCUMENT_STORAGE_STATUS answers:
 *
 * "Does Furniture GO currently have the file stored
 *  and available?"
 * =====================================================
 */

const DOCUMENT_STORAGE_STATUS = Object.freeze({
  AVAILABLE:
    'Available',

  PROCESSING:
    'Processing',

  FAILED:
    'Failed',

  MISSING:
    'Missing',
});

/*
 * =====================================================
 * Document Permission
 * =====================================================
 *
 * PRD20 — File Permission Management
 * =====================================================
 */

const DOCUMENT_PERMISSION = Object.freeze({
  READ_ONLY:
    'Read Only',

  SYSTEM_MANAGED:
    'System Managed',

  SYSTEM_CONTROLLED:
    'System Controlled',

  SHAREABLE:
    'Shareable',
});

/*
 * =====================================================
 * Document Revision Status
 * =====================================================
 *
 * Generic document revision lifecycle.
 *
 * This is different from the legacy
 * DESIGNER_REVISION_STATUS.
 *
 * DESIGNER_REVISION_STATUS remains because the
 * Designer Revision workflow has specific PRD09
 * semantics.
 * =====================================================
 */

const DOCUMENT_REVISION_STATUS = Object.freeze({
  CURRENT:
    'Current',

  SUPERSEDED:
    'Superseded',
});

/*
 * =====================================================
 * Designer Revision Status
 * =====================================================
 *
 * Sprint 03 — Designer PDF Revision
 *
 * Original Designer Documents are immutable.
 *
 * Every imported Designer PDF remains permanently
 * stored as a Designer Revision.
 *
 * This constant is retained for compatibility with
 * the existing Sprint 03 implementation.
 * =====================================================
 */

const DESIGNER_REVISION_STATUS = Object.freeze({
  CURRENT:
    'Current',

  SUPERSEDED:
    'Superseded',
});

/*
 * =====================================================
 * Project PDF Status
 * =====================================================
 *
 * Sprint 03 — Project PDF
 *
 * This constant is retained for the existing
 * Designer PDF / Backup PDF implementation.
 *
 * Future generic Document handling should use
 * DOCUMENT_STORAGE_STATUS where appropriate.
 * =====================================================
 */

const PROJECT_PDF_STATUS = Object.freeze({
  NOT_CREATED:
    'Not Created',

  AVAILABLE:
    'Available',

  PROCESSING:
    'Processing',

  FAILED:
    'Failed',
});

/*
 * =====================================================
 * Recognition Status
 * =====================================================
 *
 * Sprint 03 — Recognition
 * =====================================================
 */

const RECOGNITION_STATUS = Object.freeze({
  NOT_STARTED:
    'Not Started',

  IN_PROGRESS:
    'Recognition In Progress',

  COMPLETED:
    'Engineering Records Generated',

  REVIEW_REQUIRED:
    'Engineering Review Required',

  MANUAL_CORRELATION_REQUIRED:
    'Manual Correlation Required',

  SITE_VERIFICATION_REQUIRED:
    'Site Verification Required',

  READY_FOR_CONFIRMATION:
    'Ready for Project Confirmation',
});

/*
 * =====================================================
 * Engineering Issue Status
 * =====================================================
 */

const ENGINEERING_ISSUE_STATUS = Object.freeze({
  OPEN:
    'Open',

  REVIEWING:
    'Reviewing',

  CONFIRMED:
    'Confirmed',

  DISMISSED:
    'Dismissed',
});

/*
 * =====================================================
 * Engineering Issue Severity
 * =====================================================
 */

const ENGINEERING_ISSUE_SEVERITY = Object.freeze({
  INFO:
    'Info',

  WARNING:
    'Warning',

  ERROR:
    'Error',

  CRITICAL:
    'Critical',
});

/*
 * =====================================================
 * Module Exports
 * =====================================================
 */

module.exports = {
  /*
   * Project
   */

  PROJECT_STATUS,

  WORKFLOW_STATUS,

  LOCK_STATUS,

  REVISION_STATUS,

  ARCHIVE_STATUS,

  /*
   * Generic Documents
   */

  DOCUMENT_TYPE,

  DOCUMENT_SOURCE,

  DOCUMENT_STATUS,

  DOCUMENT_STORAGE_STATUS,

  DOCUMENT_PERMISSION,

  DOCUMENT_REVISION_STATUS,

  /*
   * Sprint 03 Compatibility
   */

  DESIGNER_REVISION_STATUS,

  PROJECT_PDF_STATUS,

  /*
   * Recognition
   */

  RECOGNITION_STATUS,

  ENGINEERING_ISSUE_STATUS,

  ENGINEERING_ISSUE_SEVERITY,
};