const path = require('node:path');

const { parseDwg } = require('./dwg-import-service');
const { parseDxf } = require('./dxf-import-service');

const {
  createObjectId,
} = require('../database/id');

const {
  createProjectSchema,
} = require('../database/schema');

const {
  ARCHIVE_STATUS,
  PROJECT_STATUS,
  WORKFLOW_STATUS,
  LOCK_STATUS,
  REVISION_STATUS,

  DESIGNER_REVISION_STATUS,
  PROJECT_PDF_STATUS,

  RECOGNITION_STATUS,

  DOCUMENT_TYPE,
  DOCUMENT_SOURCE,
  DOCUMENT_STATUS,
  DOCUMENT_STORAGE_STATUS,
  DOCUMENT_PERMISSION,
  DOCUMENT_REVISION_STATUS,
} = require('../database/constants');

const {
  createDataAccess,
} = require('../database/repositories');

const {
  migrateProject,
} = require('../database/migrations');

const {
  ProjectReferenceValidator,
} = require('../database/reference-validator');

function now() {
  return new Date().toISOString();
}

class ProjectService {
  constructor(rootDirectory) {
    this.data =
      createDataAccess(
        rootDirectory
      );

    this.referenceValidator =
      new ProjectReferenceValidator({
        officialCatalog:
          this.data.official,

        factoryReferences:
          this.data.factoryReferences,
      });

    this.index =
      this.data.projects.get({
        projectIds: [],
      });

    if (
      !this.index ||
      typeof this.index !== 'object' ||
      Array.isArray(this.index)
    ) {
      this.index = {
        projectIds: [],
      };
    }

    if (
      !Array.isArray(
        this.index.projectIds
      )
    ) {
      this.index.projectIds = [];
    }
  }

  /*
   * =====================================================
   * Index
   * =====================================================
   */

  persistIndex() {
    this.data.projects.save(
      this.index,
      this.data.authority
    );
  }

  /*
   * =====================================================
   * Project Read / Write
   * =====================================================
   */

  readProject(projectId) {
    return this.data.projectDatabase.getById(
      projectId
    );
  }

  writeProject(project) {
    const {
      integrity,
      ...persisted
    } = project;

    this.data.projectDatabase.saveById(
      persisted,
      this.data.authority
    );
  }

  /*
   * =====================================================
   * Validation
   * =====================================================
   */

  applyValidation(project) {
    const errors =
      this.referenceValidator.validateProject(
        project
      );

    project.integrity = {
      readOnly:
        errors.length > 0,

      validationErrors:
        errors,
    };

    return project;
  }

  assertWritable(project) {
    if (
      project.integrity?.readOnly
    ) {
      throw new Error(
        `Project is read-only because validation failed: ${project.integrity.validationErrors
          .map(
            (item) => item.code
          )
          .join(', ')}`
      );
    }
  }

  assertActiveProject(project) {
    if (
      project.project.archiveStatus !==
      ARCHIVE_STATUS.ACTIVE
    ) {
      throw new Error(
        'Project is not active'
      );
    }

    if (
      project.project.lockStatus ===
      LOCK_STATUS.LOCKED
    ) {
      throw new Error(
        'Locked projects cannot be edited'
      );
    }
  }

  /*
   * =====================================================
   * History
   * =====================================================
   */

  appendHistory(
    project,
    type,
    details = {}
  ) {
    if (
      !Array.isArray(
        project.history
      )
    ) {
      project.history = [];
    }

    const entry = {
      id:
        createObjectId(),

      type,

      projectId:
        project.project.id,

      createdAt:
        now(),

      ...details,
    };

    project.history.push(
      entry
    );

    return entry;
  }

  /*
   * =====================================================
   * Project Creation
   * =====================================================
   */

  createProject(
    name,
    options = {}
  ) {
    const projectId =
      createObjectId();

    const timestamp =
      now();

    const project =
      createProjectSchema({
        id:
          projectId,

        name,

        now:
          timestamp,

        ownerId:
          options.ownerId,

        factoryId:
          options.factoryId,
      });

    this.appendHistory(
      project,
      'Project Created',
      {
        createdAt:
          timestamp,
      }
    );

    this.writeProject(
      project
    );

    if (
      !this.index.projectIds.includes(
        projectId
      )
    ) {
      this.index.projectIds.push(
        projectId
      );
    }

    this.persistIndex();

    return project;
  }

  /*
   * =====================================================
   * Project Loading
   * =====================================================
   */

  loadProject(
    projectId,
    allowTrash = false
  ) {
    const stored =
      this.readProject(
        projectId
      );

    if (!stored) {
      throw new Error(
        'Project not found'
      );
    }

    let project;

    try {
      const result =
        migrateProject(
          stored
        );

      project =
        result.project;

      if (
        result.migrated
      ) {
        this.writeProject(
          project
        );
      }
    } catch (error) {
      return {
        ...stored,

        integrity: {
          readOnly:
            true,

          validationErrors: [
            {
              code:
                'SCHEMA_VERSION_INVALID',

              message:
                error.message,
            },
          ],
        },
      };
    }

    if (
      !allowTrash &&
      project.project.archiveStatus ===
        ARCHIVE_STATUS.TRASH
    ) {
      throw new Error(
        'Trash projects cannot be opened directly'
      );
    }

    return this.applyValidation(
      project
    );
  }

  openProject(projectId) {
    return this.loadProject(
      projectId
    );
  }

  /*
   * =====================================================
   * Sprint 03 — Designer PDF Revision Management
   * =====================================================
   *
   * Original Designer PDFs are immutable.
   *
   * Every imported Designer PDF:
   *
   * - receives a permanent revision ID
   * - receives its own storage location
   * - becomes Current
   * - causes the previous Current revision to become
   *   Superseded
   *
   * Original Designer PDFs are never overwritten.
   */

  getDesignerRevisions(
    projectId
  ) {
    const project =
      this.openProject(
        projectId
      );

    return Array.isArray(
      project.projectDocuments
        ?.designerRevisions
    )
      ? project.projectDocuments
          .designerRevisions
      : [];
  }

  getCurrentDesignerRevision(
    projectId
  ) {
    const project =
      this.openProject(
        projectId
      );

    const documents =
      project.projectDocuments ||
      {};

    const revisions =
      Array.isArray(
        documents.designerRevisions
      )
        ? documents.designerRevisions
        : [];

    const currentId =
      documents.currentDesignerRevisionId;

    if (!currentId) {
      return null;
    }

    return (
      revisions.find(
        (revision) =>
          revision.id ===
          currentId
      ) || null
    );
  }

  getDesignerRevision(
    projectId,
    revisionId
  ) {
    const project =
      this.openProject(
        projectId
      );

    const revisions =
      project.projectDocuments
        ?.designerRevisions || [];

    return (
      revisions.find(
        (revision) =>
          revision.id ===
          revisionId
      ) || null
    );
  }

  /*
   * =====================================================
   * Designer PDF Import
   * =====================================================
   */

  importDesignerPdf(
    projectId,
    file
  ) {
    const project =
      this.openProject(
        projectId
      );

    this.assertWritable(
      project
    );

    this.assertActiveProject(
      project
    );

    if (
      !file ||
      !Buffer.isBuffer(
        file.buffer
      )
    ) {
      throw new Error(
        'Designer PDF file is required'
      );
    }

    if (
      !file.buffer.length
    ) {
      throw new Error(
        'Designer PDF file is empty'
      );
    }

    const fileName =
      String(
        file.fileName || ''
      ).trim();

    if (!fileName) {
      throw new Error(
        'Designer PDF file name is required'
      );
    }

    if (
      !fileName
        .toLowerCase()
        .endsWith('.pdf')
    ) {
      throw new Error(
        'Designer PDF must be a PDF file'
      );
    }

    const timestamp =
      now();

    const revisionId =
      createObjectId();

    const revisionNumber =
      (
        project.projectDocuments
          ?.designerRevisions
          ?.length || 0
      ) + 1;

    const storageKey =
      path.join(
        'projects',
        projectId,
        'pdf',
        'designer',
        `revision-${String(
          revisionNumber
        ).padStart(
          2,
          '0'
        )}.pdf`
      );

    /*
     * Ensure compatibility with migrated projects.
     */

    this.ensureProjectDocuments(
      project
    );

    /*
     * Store the immutable original file first.
     */

    this.data.storage.writeBuffer(
      storageKey,
      file.buffer
    );

    /*
     * Previous Current revision becomes Superseded.
     */

    project.projectDocuments
      .designerRevisions
      .forEach(
        (revision) => {
          if (
            revision.status ===
            DESIGNER_REVISION_STATUS.CURRENT
          ) {
            revision.status =
              DESIGNER_REVISION_STATUS.SUPERSEDED;

            revision.supersededAt =
              timestamp;

            revision.updatedAt =
              timestamp;
          }
        }
      );

    const revision = {
      id:
        revisionId,

      projectId,

      revisionNumber,

      status:
        DESIGNER_REVISION_STATUS.CURRENT,

      fileName,

      mimeType:
        'application/pdf',

      size:
        file.buffer.length,

      storageKey,

      readOnly:
        true,

      importedAt:
        timestamp,

      createdAt:
        timestamp,

      updatedAt:
        timestamp,

      supersededAt:
        null,
    };

    project.projectDocuments
      .designerRevisions
      .push(
        revision
      );

    project.projectDocuments
      .currentDesignerRevisionId =
      revisionId;

    /*
     * A new Designer Revision invalidates the
     * relationship with the previous Backup PDF.
     *
     * The previous Designer PDF remains untouched.
     */

    project.projectDocuments
      .backupPdf = {
        id:
          null,

        sourceDesignerRevisionId:
          revisionId,

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

    project.project.workflowStatus =
      WORKFLOW_STATUS.RECOGNITION_IN_PROGRESS;

    project.project.status =
      PROJECT_STATUS.IMPORTED;

    project.project.updatedAt =
      timestamp;

    this.appendHistory(
      project,
      'Designer PDF Imported',
      {
        revisionId,

        revisionNumber,

        fileName,

        size:
          file.buffer.length,
      }
    );

    this.writeProject(
      project
    );

    return project;
  }

  /*
   * =====================================================
   * Designer PDF Read
   * =====================================================
   */

  getDesignerPdf(
    projectId,
    revisionId = null
  ) {
    const project =
      this.openProject(
        projectId
      );

    const revision =
      revisionId
        ? this.getDesignerRevision(
            projectId,
            revisionId
          )
        : this.getCurrentDesignerRevision(
            projectId
          );

    if (!revision) {
      return null;
    }

    if (
      !revision.storageKey
    ) {
      return null;
    }

    const buffer =
      this.data.storage.readBuffer(
        revision.storageKey,
        null
      );

    if (!buffer) {
      return null;
    }

    return {
      buffer,

      metadata:
        revision,
    };
  }

  /*
   * =====================================================
   * Sprint 03 — Backup PDF
   * =====================================================
   */

  getBackupPdf(
    projectId
  ) {
    const project =
      this.openProject(
        projectId
      );

    const backup =
      project.projectDocuments
        ?.backupPdf;

    if (
      !backup ||
      !backup.storageKey
    ) {
      return null;
    }

    const buffer =
      this.data.storage.readBuffer(
        backup.storageKey,
        null
      );

    if (!buffer) {
      return null;
    }

    return {
      buffer,

      metadata:
        backup,
    };
  }

  createBackupPdf(
    projectId,
    pdfBuffer,
    metadata = {}
  ) {
    const project =
      this.openProject(
        projectId
      );

    this.assertWritable(
      project
    );

    this.assertActiveProject(
      project
    );

    const currentRevision =
      this.getCurrentDesignerRevision(
        projectId
      );

    if (!currentRevision) {
      throw new Error(
        'A current Designer PDF revision is required before creating a Backup PDF'
      );
    }

    if (
      !Buffer.isBuffer(
        pdfBuffer
      )
    ) {
      throw new Error(
        'Backup PDF data is required'
      );
    }

    if (
      !pdfBuffer.length
    ) {
      throw new Error(
        'Backup PDF cannot be empty'
      );
    }

    const timestamp =
      now();

    const backupId =
      createObjectId();

    const storageKey =
      path.join(
        'projects',
        projectId,
        'pdf',
        'backup',
        `${backupId}.pdf`
      );

    this.data.storage.writeBuffer(
      storageKey,
      pdfBuffer
    );

    this.ensureProjectDocuments(
      project
    );

    project.projectDocuments
      .backupPdf = {
        id:
          backupId,

        sourceDesignerRevisionId:
          currentRevision.id,

        fileName:
          metadata.fileName ||
          `Backup-${currentRevision.revisionNumber}.pdf`,

        mimeType:
          'application/pdf',

        size:
          pdfBuffer.length,

        storageKey,

        status:
          PROJECT_PDF_STATUS.AVAILABLE,

        readOnly:
          false,

        createdAt:
          timestamp,

        updatedAt:
          timestamp,
      };

    project.project.updatedAt =
      timestamp;

    this.appendHistory(
      project,
      'Backup PDF Created',
      {
        backupId,

        sourceDesignerRevisionId:
          currentRevision.id,
      }
    );

    this.writeProject(
      project
    );

    return project;
  }

  /*
   * =====================================================
   * Project Document Structure Helper
   * =====================================================
   */

  ensureProjectDocuments(
    project
  ) {
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

    if (
      !Array.isArray(
        project.projectDocuments
          .documents
      )
    ) {
      project.projectDocuments
        .documents = [];
    }

    if (
      !Array.isArray(
        project.projectDocuments
          .designerRevisions
      )
    ) {
      project.projectDocuments
        .designerRevisions = [];
    }

    if (
      !Object.prototype.hasOwnProperty.call(
        project.projectDocuments,
        'currentDesignerRevisionId'
      )
    ) {
      project.projectDocuments
        .currentDesignerRevisionId =
        null;
    }

    if (
      !project.projectDocuments
        .backupPdf ||
      typeof project.projectDocuments
        .backupPdf !==
        'object' ||
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
    }

    return project.projectDocuments;
  }

  /*
   * =====================================================
   * Recognition Status
   * =====================================================
   */

  setRecognitionStatus(
    projectId,
    recognitionStatus,
    details = {}
  ) {
    const project =
      this.openProject(
        projectId
      );

    this.assertWritable(
      project
    );

    this.assertActiveProject(
      project
    );

    const allowed =
      Object.values(
        RECOGNITION_STATUS
      );

    if (
      !allowed.includes(
        recognitionStatus
      )
    ) {
      throw new Error(
        'Unsupported recognition status'
      );
    }

    const timestamp =
      now();

    project.project.workflowStatus =
      recognitionStatus;

    project.project.updatedAt =
      timestamp;

    this.appendHistory(
      project,
      'Recognition Status Updated',
      {
        recognitionStatus,

        ...details,
      }
    );

    this.writeProject(
      project
    );

    return project;
  }

  /*
   * =====================================================
   * Working State
   * =====================================================
   */

  saveWorkingState(
    projectId,
    changes
  ) {
    const project =
      this.openProject(
        projectId
      );

    this.assertWritable(
      project
    );

    if (
      project.project.archiveStatus ===
      ARCHIVE_STATUS.ARCHIVED
    ) {
      throw new Error(
        'Archived projects are read-only'
      );
    }

    if (
      project.project.archiveStatus ===
      ARCHIVE_STATUS.TRASH
    ) {
      throw new Error(
        'Trash projects are read-only'
      );
    }

    if (
      project.project.lockStatus ===
      LOCK_STATUS.LOCKED
    ) {
      throw new Error(
        'Locked projects cannot be edited'
      );
    }

    const nextChanges =
      changes &&
      typeof changes === 'object' &&
      !Array.isArray(
        changes
      )
        ? changes
        : {};

    // Working State is project-scoped. Reject attempts to inject another
    // project context through a workspace payload instead of persisting a
    // cross-project snapshot.
    if (
      Object.prototype.hasOwnProperty.call(nextChanges, 'projectId') &&
      nextChanges.projectId !== projectId
    ) {
      throw new Error('Working State project context mismatch');
    }

    if (
      Array.isArray(nextChanges.cadDrawings) &&
      nextChanges.cadDrawings.some((drawing) => drawing?.projectId !== projectId)
    ) {
      throw new Error('CAD working state project context mismatch');
    }

    project.workingState = {
      ...project.workingState,

      ...nextChanges,

      status:
        REVISION_STATUS.WORKING,

      updatedAt:
        now(),
    };

    project.project.updatedAt =
      project.workingState.updatedAt;

    this.appendHistory(
      project,
      'Working State Saved'
    );

    this.writeProject(
      project
    );

    return project;
  }

  /* Site Survey is project engineering information, separate from PDF data. */
  getSiteSurvey(
    projectId
  ) {
    const project = this.openProject(projectId);
    return project.siteSurvey || null;
  }

  saveSiteSurvey(
    projectId,
    survey
  ) {
    const project = this.openProject(projectId);
    this.assertWritable(project);

    if (
      project.project.archiveStatus === ARCHIVE_STATUS.ARCHIVED ||
      project.project.archiveStatus === ARCHIVE_STATUS.TRASH
    ) {
      throw new Error('Archived or trash projects are read-only');
    }

    if (project.project.lockStatus === LOCK_STATUS.LOCKED) {
      throw new Error('Locked projects cannot be edited');
    }

    const input = survey && typeof survey === 'object' && !Array.isArray(survey)
      ? survey
      : {};
    const statuses = ['Not Started', 'In Progress', 'Completed'];
    const text = (value) => typeof value === 'string' ? value.trim() : '';
    const siteSurvey = {
      status: statuses.includes(input.status) ? input.status : 'In Progress',
      measurements: text(input.measurements),
      siteNotes: text(input.siteNotes),
      observations: text(input.observations),
      updatedAt: now(),
    };

    project.siteSurvey = siteSurvey;
    project.project.updatedAt = siteSurvey.updatedAt;
    this.appendHistory(project, 'Site Survey Saved');
    this.writeProject(project);
    return project;
  }

  getBackupPdfAnnotations(
    projectId
  ) {
    const project = this.openProject(projectId);
    const annotations = project.projectDocuments?.backupPdf?.annotations;
    return Array.isArray(annotations) ? annotations : [];
  }

  saveBackupPdfAnnotations(
    projectId,
    annotations
  ) {
    const project = this.openProject(projectId);
    this.assertWritable(project);

    if (!Array.isArray(annotations)) {
      throw Object.assign(
        new Error('Backup PDF annotations must be an array'),
        { statusCode: 400 }
      );
    }

    const backupPdf = project.projectDocuments?.backupPdf;
    if (!backupPdf?.storageKey) {
      throw Object.assign(
        new Error('Backup PDF is not available'),
        { statusCode: 404 }
      );
    }

    const timestamp = now();
    const revisionId = backupPdf.sourceDesignerRevisionId || null;
    const normalized = annotations.map((annotation) => {
      if (!annotation || typeof annotation !== 'object' || Array.isArray(annotation)) {
        throw Object.assign(new Error('Invalid Backup PDF annotation'), { statusCode: 400 });
      }
      const page = Number(annotation.page);
      const type = String(annotation.type || '').trim();
      if (!Number.isInteger(page) || page < 1 || !type) {
        throw Object.assign(new Error('Annotation page and type are required'), { statusCode: 400 });
      }
      return {
        ...annotation,
        id: String(annotation.id || createObjectId()),
        projectId,
        revisionId,
        page,
        type,
        createdAt: annotation.createdAt || timestamp,
        updatedAt: timestamp,
      };
    });

    project.projectDocuments.backupPdf = {
      ...backupPdf,
      annotations: normalized,
      updatedAt: timestamp,
    };
    project.project.updatedAt = timestamp;
    this.appendHistory(project, 'Backup PDF Annotations Saved', {
      annotationCount: normalized.length,
      revisionId,
    });
    this.writeProject(project);
    return normalized;
  }

  /* Project-level Recognition Review record. */
  getRecognitionReview(
    projectId
  ) {
    const project = this.openProject(projectId);
    return project.recognitionReview || null;
  }

  saveRecognitionReview(
    projectId,
    review
  ) {
    const project = this.openProject(projectId);
    this.assertWritable(project);

    if (
      project.project.archiveStatus === ARCHIVE_STATUS.ARCHIVED ||
      project.project.archiveStatus === ARCHIVE_STATUS.TRASH
    ) {
      throw new Error('Archived or trash projects are read-only');
    }

    if (project.project.lockStatus === LOCK_STATUS.LOCKED) {
      throw new Error('Locked projects cannot be edited');
    }

    const invalid = (message) => {
      throw Object.assign(new Error(message), { statusCode: 400 });
    };

    if (!review || typeof review !== 'object' || Array.isArray(review)) {
      invalid('Review payload must be an object');
    }

    if (review.status !== 'Draft' && review.status !== 'Saved') {
      invalid('Review status must be Draft or Saved');
    }

    if (review.notes !== undefined && typeof review.notes !== 'string') {
      invalid('Review notes must be text');
    }

    const notes = review.notes?.trim() || '';
    const status = review.status;
    const recognitionReview = {
      projectId,
      status,
      notes,
      updatedAt: now(),
    };

    project.recognitionReview = recognitionReview;
    project.project.updatedAt = recognitionReview.updatedAt;
    this.appendHistory(project, 'Recognition Review Saved');
    this.writeProject(project);
    return project;
  }
    /*
   * =====================================================
   * Project Archive / Restore
   * =====================================================
   */

  archiveProject(
    projectId
  ) {
    const project =
      this.openProject(
        projectId
      );

    this.assertWritable(
      project
    );

    if (
      project.project.archiveStatus ===
      ARCHIVE_STATUS.TRASH
    ) {
      throw new Error(
        'Trash projects cannot be archived'
      );
    }

    project.project.archiveStatus =
      ARCHIVE_STATUS.ARCHIVED;

    project.project.status =
      PROJECT_STATUS.ARCHIVED;

    project.project.workflowStatus =
      WORKFLOW_STATUS.NOT_STARTED;

    project.project.updatedAt =
      now();

    this.appendHistory(
      project,
      'Project Archived'
    );

    this.writeProject(
      project
    );

    return project;
  }

  restoreProject(
    projectId
  ) {
    const project =
      this.loadProject(
        projectId,
        true
      );

    this.assertWritable(
      project
    );

    if (
      !project ||
      ![
        ARCHIVE_STATUS.ARCHIVED,
        ARCHIVE_STATUS.TRASH,
      ].includes(
        project.project.archiveStatus
      )
    ) {
      throw new Error(
        'Project is not restorable'
      );
    }

    project.project.archiveStatus =
      ARCHIVE_STATUS.ACTIVE;

    project.project.status =
      PROJECT_STATUS.IMPORTED;

    project.project.workflowStatus =
      WORKFLOW_STATUS.NOT_STARTED;

    project.project.lockStatus =
      LOCK_STATUS.UNLOCKED;

    project.project.updatedAt =
      now();

    this.appendHistory(
      project,
      'Project Restored'
    );

    this.writeProject(
      project
    );

    return project;
  }

  moveToTrash(
    projectId
  ) {
    const project =
      this.openProject(
        projectId
      );

    this.assertWritable(
      project
    );

    if (
      project.project.archiveStatus ===
      ARCHIVE_STATUS.TRASH
    ) {
      return project;
    }

    project.project.archiveStatus =
      ARCHIVE_STATUS.TRASH;

    project.project.updatedAt =
      now();

    this.appendHistory(
      project,
      'Project Moved to Trash'
    );

    this.writeProject(
      project
    );

    return project;
  }

  /*
   * =====================================================
   * Project Hierarchy
   * =====================================================
   */

  addEntity(
    projectId,
    type,
    name,
    parentId = null
  ) {
    const project =
      this.openProject(
        projectId
      );

    this.assertWritable(
      project
    );

    this.assertActiveProject(
      project
    );

    const nextName =
      String(
        name ?? ''
      ).trim();

    if (!nextName) {
      throw new Error(
        'Entity name is required'
      );
    }

    const timestamp =
      now();

    const entity = {
      id:
        createObjectId(),

      type,

      name:
        nextName,

      parentId,

      createdAt:
        timestamp,

      updatedAt:
        timestamp,
    };

    const levels = {
      Floor:
        'floors',

      Room:
        'rooms',

      Furniture:
        'furniture',

      Cabinet:
        'cabinets',

      Module:
        'modules',

      Component:
        'components',
    };

    if (
      !levels[type]
    ) {
      throw new Error(
        `Unsupported hierarchy type: ${type}`
      );
    }

    if (
      !project.hierarchy ||
      typeof project.hierarchy !==
        'object'
    ) {
      project.hierarchy = {
        floors: [],
      };
    }

    if (
      !Array.isArray(
        project.hierarchy.floors
      )
    ) {
      project.hierarchy.floors = [];
    }

    if (
      type === 'Floor'
    ) {
      project.hierarchy.floors.push({
        ...entity,

        children: [],
      });
    } else {
      const parentTypes = {
        Room:
          'Floor',

        Furniture:
          'Room',

        Cabinet:
          'Furniture',

        Module:
          'Furniture',

        Component:
          'CabinetOrModule',
      };

      const requiredParent =
        parentTypes[type];

      const parent =
        this.findEntity(
          project,
          parentId
        );

      if (
        !parent ||
        (
          requiredParent !==
            'CabinetOrModule' &&
          parent.type !==
            requiredParent
        ) ||
        (
          requiredParent ===
            'CabinetOrModule' &&
          ![
            'Cabinet',
            'Module',
          ].includes(
            parent.type
          )
        )
      ) {
        throw new Error(
          `${type} requires a valid ${requiredParent} parent`
        );
      }

      parent.children =
        parent.children || [];

      parent.children.push(
        entity
      );
    }

    this.appendHistory(
      project,
      'Hierarchy Entity Added',
      {
        entityId:
          entity.id,

        entityType:
          type,
      }
    );

    project.project.updatedAt =
      timestamp;

    this.writeProject(
      project
    );

    return entity;
  }

  findEntity(
    project,
    id
  ) {
    if (
      !project ||
      !project.hierarchy ||
      !Array.isArray(
        project.hierarchy.floors
      )
    ) {
      return null;
    }

    const visit =
      (node) => {
        if (
          node.id === id
        ) {
          return node;
        }

        for (
          const child of
          node.children || []
        ) {
          const found =
            visit(
              child
            );

          if (found) {
            return found;
          }
        }

        return null;
      };

    for (
      const floor of
      project.hierarchy.floors
    ) {
      const found =
        visit(
          floor
        );

      if (found) {
        return found;
      }
    }

    return null;
  }

  renameEntity(
    projectId,
    entityId,
    name
  ) {
    const project =
      this.openProject(
        projectId
      );

    this.assertWritable(
      project
    );

    this.assertActiveProject(
      project
    );

    const entity =
      this.findEntity(
        project,
        entityId
      );

    if (!entity) {
      throw new Error(
        'Entity not found'
      );
    }

    const nextName =
      String(
        name ?? ''
      ).trim();

    if (!nextName) {
      throw new Error(
        'Entity name is required'
      );
    }

    entity.name =
      nextName;

    entity.updatedAt =
      now();

    this.appendHistory(
      project,
      'Hierarchy Entity Renamed',
      {
        entityId,

        name:
          nextName,
      }
    );

    project.project.updatedAt =
      entity.updatedAt;

    this.writeProject(
      project
    );

    return entity;
  }

  /*
   * =====================================================
   * Confirmed Project Revision
   * =====================================================
   */

  persistConfirmedRevision(
    projectId,
    snapshotData = {}
  ) {
    const project =
      this.openProject(
        projectId
      );

    this.assertWritable(
      project
    );

    const timestamp =
      now();

    const revisionId =
      createObjectId();

    const snapshotId =
      createObjectId();

    const revision = {
      id:
        revisionId,

      projectId,

      status:
        REVISION_STATUS.CONFIRMED,

      createdAt:
        timestamp,

      source:
        'Working State',
    };

    const snapshot = {
      id:
        snapshotId,

      revisionId,

      createdAt:
        timestamp,

      data:
        JSON.parse(
          JSON.stringify(
            snapshotData
          )
        ),

      immutable:
        true,
    };

    if (
      !Array.isArray(
        project.revisions
      )
    ) {
      project.revisions =
        [];
    }

    if (
      !Array.isArray(
        project.snapshots
      )
    ) {
      project.snapshots =
        [];
    }

    project.revisions.forEach(
      (item) => {
        if (
          item.status ===
          REVISION_STATUS.CONFIRMED
        ) {
          item.status =
            REVISION_STATUS.SUPERSEDED;
        }
      }
    );

    project.revisions.push(
      revision
    );

    project.snapshots.push(
      snapshot
    );

    project.project.activeRevisionId =
      revisionId;

    project.project.activeSnapshotId =
      snapshotId;

    project.project.workflowStatus =
      WORKFLOW_STATUS.CONFIRMED;

    project.project.updatedAt =
      timestamp;

    this.appendHistory(
      project,
      'Confirmed Revision Persisted',
      {
        revisionId,

        snapshotId,
      }
    );

    this.writeProject(
      project
    );

    return {
      revision,

      snapshot,
    };
  }

  /*
   * =====================================================
   * Sprint 02 — Project Database Backup
   * =====================================================
   *
   * This is the JSON project database backup.
   *
   * It is separate from:
   *
   * - Backup PDF
   * - Generic Project Documents
   * - Export files
   */

  createBackup(
    projectId,
    reason = 'Manual'
  ) {
    const project =
      this.openProject(
        projectId
      );

    this.assertWritable(
      project
    );

    const backupId =
      createObjectId();

    const timestamp =
      now();

    this.data.storage.writeJson(
      `backups/${backupId}.json`,
      JSON.parse(
        JSON.stringify(
          project
        )
      )
    );

    if (
      !Array.isArray(
        project.backupHistory
      )
    ) {
      project.backupHistory =
        [];
    }

    project.backupHistory.push({
      id:
        backupId,

      projectId,

      reason,

      createdAt:
        timestamp,
    });

    project.project.lastBackupId =
      backupId;

    project.project.updatedAt =
      timestamp;

    this.writeProject(
      project
    );

    return backupId;
  }

  /*
   * =====================================================
   * Generic Project Documents
   * =====================================================
   *
   * Schema 3 / PRD20
   *
   * Generic documents are project-source files.
   *
   * They are intentionally separate from:
   *
   * - Engineering Records
   * - Engineering Issues
   * - Furniture Objects
   * - Project Revisions
   * - Designer PDF Revisions
   */

  getProjectDocuments(
    projectId
  ) {
    const project =
      this.openProject(
        projectId
      );

    const documents =
      project.projectDocuments
        ?.documents;

    return Array.isArray(
      documents
    )
      ? documents
      : [];
  }

  getProjectDocument(
    projectId,
    documentId
  ) {
    const documents =
      this.getProjectDocuments(
        projectId
      );

    return (
      documents.find(
        (document) =>
          document.id ===
          documentId
      ) || null
    );
  }

  /*
   * =====================================================
   * Generic Document Validation Helpers
   * =====================================================
   */

  assertDocumentType(
    documentType
  ) {
    const allowed =
      Object.values(
        DOCUMENT_TYPE
      );

    if (
      !allowed.includes(
        documentType
      )
    ) {
      throw new Error(
        `Unsupported document type: ${documentType}`
      );
    }
  }

  assertDocumentSource(
    documentSource
  ) {
    const allowed =
      Object.values(
        DOCUMENT_SOURCE
      );

    if (
      !allowed.includes(
        documentSource
      )
    ) {
      throw new Error(
        `Unsupported document source: ${documentSource}`
      );
    }
  }

  assertDocumentStatus(
    status
  ) {
    const allowed =
      Object.values(
        DOCUMENT_STATUS
      );

    if (
      !allowed.includes(
        status
      )
    ) {
      throw new Error(
        `Unsupported document status: ${status}`
      );
    }
  }

  assertDocumentStorageStatus(
    storageStatus
  ) {
    const allowed =
      Object.values(
        DOCUMENT_STORAGE_STATUS
      );

    if (
      !allowed.includes(
        storageStatus
      )
    ) {
      throw new Error(
        `Unsupported document storage status: ${storageStatus}`
      );
    }
  }

  assertDocumentPermission(
    permission
  ) {
    const allowed =
      Object.values(
        DOCUMENT_PERMISSION
      );

    if (
      !allowed.includes(
        permission
      )
    ) {
      throw new Error(
        `Unsupported document permission: ${permission}`
      );
    }
  }

  assertDocumentRevisionStatus(
    revisionStatus
  ) {
    const allowed =
      Object.values(
        DOCUMENT_REVISION_STATUS
      );

    if (
      !allowed.includes(
        revisionStatus
      )
    ) {
      throw new Error(
        `Unsupported document revision status: ${revisionStatus}`
      );
    }
  }

  /*
   * =====================================================
   * Add Generic Project Document
   * =====================================================
   */

  addProjectDocument(
    projectId,
    document,
    fileBuffer
  ) {
    const project =
      this.openProject(
        projectId
      );

    this.assertWritable(
      project
    );

    this.assertActiveProject(
      project
    );

    if (
      !document ||
      typeof document !==
        'object' ||
      Array.isArray(
        document
      )
    ) {
      throw new Error(
        'Project document data is required'
      );
    }

    if (
      !Buffer.isBuffer(
        fileBuffer
      )
    ) {
      throw new Error(
        'Project document file data is required'
      );
    }

    if (
      !fileBuffer.length
    ) {
      throw new Error(
        'Project document file cannot be empty'
      );
    }

    const fileName =
      String(
        document.fileName ||
          ''
      ).trim();

    if (!fileName) {
      throw new Error(
        'Project document file name is required'
      );
    }

    const extension =
      path.extname(
        fileName
      )
        .replace(
          '.',
          ''
        )
        .toUpperCase();

    const documentType =
      document.documentType ||
      extension;

    this.assertDocumentType(
      documentType
    );

    const documentSource =
      document.documentSource ||
      DOCUMENT_SOURCE.OTHER;

    this.assertDocumentSource(
      documentSource
    );

    const status =
      document.status ||
      DOCUMENT_STATUS.NEW;

    this.assertDocumentStatus(
      status
    );

    const storageStatus =
      document.storageStatus ||
      DOCUMENT_STORAGE_STATUS.AVAILABLE;

    this.assertDocumentStorageStatus(
      storageStatus
    );

    const permission =
      document.permission ||
      DOCUMENT_PERMISSION.READ_ONLY;

    this.assertDocumentPermission(
      permission
    );

    const revisionStatus =
      document.revisionStatus ||
      DOCUMENT_REVISION_STATUS.CURRENT;

    this.assertDocumentRevisionStatus(
      revisionStatus
    );

    const documentId =
      document.id ||
      createObjectId();

    this.ensureProjectDocuments(
      project
    );

    const existing =
      project.projectDocuments
        .documents.find(
          (item) =>
            item.id ===
            documentId
        );

    if (existing) {
      throw new Error(
        'Project document already exists'
      );
    }

    const timestamp =
      now();

    const storageKey =
      document.storageKey ||
      path.join(
        'projects',
        projectId,
        'documents',
        `${documentId}-${fileName}`
      );

    this.data.storage.writeBuffer(
      storageKey,
      fileBuffer
    );

    const record = {
      id:
        documentId,

      projectId,

      fileName,

      documentType,

      documentSource,

      mimeType:
        document.mimeType ||
        null,

      size:
        fileBuffer.length,

      storageKey,

      storageStatus,

      hash:
        document.hash ||
        null,

      status,

      permission,

      revisionNumber:
        Number.isInteger(
          document.revisionNumber
        )
          ? document.revisionNumber
          : 1,

      revisionStatus,

      importedAt:
        document.importedAt ||
        timestamp,

      createdAt:
        document.createdAt ||
        timestamp,

      updatedAt:
        timestamp,
    };

    project.projectDocuments
      .documents.push(
        record
      );

    project.project.updatedAt =
      timestamp;

    this.appendHistory(
      project,
      'Project Document Added',
      {
        documentId,

        fileName,

        documentType,

        documentSource,
      }
    );

    this.writeProject(
      project
    );

    return record;
  }

  async importDwg(projectId, { fileName, buffer }) {
    const drawingData = await parseDwg(buffer);
    const record = this.addProjectDocument(projectId, {
      fileName,
      documentType: DOCUMENT_TYPE.DWG,
      documentSource: DOCUMENT_SOURCE.OTHER,
      mimeType: 'application/acad',
      permission: DOCUMENT_PERMISSION.READ_ONLY,
    }, buffer);

    const project = this.openProject(projectId);
    const stored = project.projectDocuments.documents.find((item) => item.id === record.id);
    Object.assign(stored, {
      drawingId: record.id,
      sourceFormat: 'DWG',
      units: drawingData.units,
      bounds: drawingData.bounds,
      entityCount: drawingData.entityCount,
      supportedEntityCount: drawingData.supportedEntityCount,
      unsupportedEntityCount: drawingData.unsupportedEntityCount,
      unsupportedEntities: drawingData.unsupportedEntities,
      layers: drawingData.layers,
      entities: drawingData.entities,
    });
    this.writeProject(project);
    return stored;
  }

  async importDxf(projectId, { fileName, buffer }) {
    const drawingData = await parseDxf(buffer);
    const record = this.addProjectDocument(projectId, {
      fileName,
      documentType: DOCUMENT_TYPE.DXF,
      documentSource: DOCUMENT_SOURCE.OTHER,
      mimeType: 'application/dxf',
      permission: DOCUMENT_PERMISSION.READ_ONLY,
    }, buffer);
    const project = this.openProject(projectId);
    const stored = project.projectDocuments.documents.find((item) => item.id === record.id);
    Object.assign(stored, {
      drawingId: record.id,
      sourceFormat: 'DXF',
      units: drawingData.units,
      bounds: drawingData.bounds,
      entityCount: drawingData.entityCount,
      supportedEntityCount: drawingData.supportedEntityCount,
      unsupportedEntityCount: drawingData.unsupportedEntityCount,
      unsupportedEntities: drawingData.unsupportedEntities,
      layers: drawingData.layers,
      layerCount: drawingData.layerCount,
      entities: drawingData.entities,
    });
    this.writeProject(project);
    return stored;
  }
    /*
   * =====================================================
   * Remove Generic Project Document
   * =====================================================
   *
   * Removing the database record does NOT delete the
   * immutable source file from storage.
   */

  removeProjectDocument(
    projectId,
    documentId
  ) {
    const project =
      this.openProject(
        projectId
      );

    this.assertWritable(
      project
    );

    this.assertActiveProject(
      project
    );

    this.ensureProjectDocuments(
      project
    );

    const documents =
      project.projectDocuments
        .documents;

    const index =
      documents.findIndex(
        (document) =>
          document.id ===
          documentId
      );

    if (
      index === -1
    ) {
      throw new Error(
        'Project document not found'
      );
    }

    const removed =
      documents[index];

    /*
     * If this is a root document with revisions,
     * prevent accidental removal of the revision chain.
     */

    const hasChildren =
      documents.some(
        (document) =>
          document.parentDocumentId ===
          removed.id
      );

    if (hasChildren) {
      throw new Error(
        'Project document has revisions and cannot be removed directly'
      );
    }

    documents.splice(
      index,
      1
    );

    const timestamp =
      now();

    project.project.updatedAt =
      timestamp;

    this.appendHistory(
      project,
      'Project Document Removed',
      {
        documentId,

        fileName:
          removed.fileName,
      }
    );

    this.writeProject(
      project
    );

    return removed;
  }

  /*
   * =====================================================
   * Read Generic Project Document
   * =====================================================
   *
   * If the supplied ID is the root document and a
   * current revision exists, the current revision file
   * is returned.
   *
   * If there is no revision, the original document is
   * returned.
   */

  readProjectDocument(
    projectId,
    documentId
  ) {
    const document =
      this.getProjectDocument(
        projectId,
        documentId
      );

    if (!document) {
      return null;
    }

    let target =
      document;

    if (
      !document.parentDocumentId
    ) {
      const current =
        this.getCurrentProjectDocumentRevision(
          projectId,
          documentId
        );

      if (
        current &&
        current.id !==
          document.id
      ) {
        target =
          current;
      }
    }

    if (
      !target.storageKey
    ) {
      return null;
    }

    const buffer =
      this.data.storage.readBuffer(
        target.storageKey,
        null
      );

    if (!buffer) {
      return null;
    }

    return {
      buffer,

      metadata:
        target,
    };
  }

  /*
   * =====================================================
   * Update Generic Document Status
   * =====================================================
   */

  updateProjectDocumentStatus(
    projectId,
    documentId,
    status
  ) {
    const project =
      this.openProject(
        projectId
      );

    this.assertWritable(
      project
    );

    this.assertActiveProject(
      project
    );

    const document =
      this.findProjectDocumentInProject(
        project,
        documentId
      );

    if (!document) {
      throw new Error(
        'Project document not found'
      );
    }

    this.assertDocumentStatus(
      status
    );

    document.status =
      status;

    document.updatedAt =
      now();

    project.project.updatedAt =
      document.updatedAt;

    this.appendHistory(
      project,
      'Project Document Status Updated',
      {
        documentId,

        status,
      }
    );

    this.writeProject(
      project
    );

    return document;
  }

  /*
   * =====================================================
   * Update Generic Document Storage Status
   * =====================================================
   */

  updateProjectDocumentStorageStatus(
    projectId,
    documentId,
    storageStatus
  ) {
    const project =
      this.openProject(
        projectId
      );

    this.assertWritable(
      project
    );

    this.assertActiveProject(
      project
    );

    const document =
      this.findProjectDocumentInProject(
        project,
        documentId
      );

    if (!document) {
      throw new Error(
        'Project document not found'
      );
    }

    this.assertDocumentStorageStatus(
      storageStatus
    );

    document.storageStatus =
      storageStatus;

    document.updatedAt =
      now();

    project.project.updatedAt =
      document.updatedAt;

    this.appendHistory(
      project,
      'Project Document Storage Status Updated',
      {
        documentId,

        storageStatus,
      }
    );

    this.writeProject(
      project
    );

    return document;
  }

  /*
   * =====================================================
   * Update Generic Document Permission
   * =====================================================
   */

  updateProjectDocumentPermission(
    projectId,
    documentId,
    permission
  ) {
    const project =
      this.openProject(
        projectId
      );

    this.assertWritable(
      project
    );

    this.assertActiveProject(
      project
    );

    const document =
      this.findProjectDocumentInProject(
        project,
        documentId
      );

    if (!document) {
      throw new Error(
        'Project document not found'
      );
    }

    this.assertDocumentPermission(
      permission
    );

    document.permission =
      permission;

    document.updatedAt =
      now();

    project.project.updatedAt =
      document.updatedAt;

    this.appendHistory(
      project,
      'Project Document Permission Updated',
      {
        documentId,

        permission,
      }
    );

    this.writeProject(
      project
    );

    return document;
  }

  /*
   * =====================================================
   * Generic Project Document Revision
   * =====================================================
   *
   * Revision model:
   *
   * Original:
   *
   *   id = document-01
   *   revisionNumber = 1
   *   revisionStatus = Superseded
   *
   * Revision:
   *
   *   id = document-02
   *   parentDocumentId = document-01
   *   revisionNumber = 2
   *   revisionStatus = Current
   *
   * Every physical file remains stored.
   */

  createProjectDocumentRevision(
    projectId,
    documentId,
    file,
    metadata = {}
  ) {
    const project =
      this.openProject(
        projectId
      );

    this.assertWritable(
      project
    );

    this.assertActiveProject(
      project
    );

    if (
      !file ||
      !Buffer.isBuffer(
        file.buffer
      )
    ) {
      throw new Error(
        'Project document revision file is required'
      );
    }

    if (
      !file.buffer.length
    ) {
      throw new Error(
        'Project document revision file cannot be empty'
      );
    }

    this.ensureProjectDocuments(
      project
    );

    const documents =
      project.projectDocuments
        .documents;

    const rootDocument =
      documents.find(
        (document) =>
          document.id ===
          documentId
      );

    if (!rootDocument) {
      throw new Error(
        'Project document not found'
      );
    }

    /*
     * If a revision ID was supplied instead of the root
     * document ID, resolve the root.
     */

    const rootId =
      rootDocument.parentDocumentId ||
      rootDocument.id;

    const baseDocument =
      documents.find(
        (document) =>
          document.id ===
          rootId
      );

    if (!baseDocument) {
      throw new Error(
        'Root project document not found'
      );
    }

    const current =
      this.getCurrentProjectDocumentRevisionFromProject(
        project,
        rootId
      );

    const currentNumber =
      current &&
      Number.isInteger(
        current.revisionNumber
      )
        ? current.revisionNumber
        : Number.isInteger(
            baseDocument.revisionNumber
          )
          ? baseDocument.revisionNumber
          : 1;

    const revisionNumber =
      currentNumber + 1;

    const timestamp =
      now();

    const revisionId =
      createObjectId();

    const fileName =
      String(
        file.fileName ||
          metadata.fileName ||
          current?.fileName ||
          baseDocument.fileName ||
          ''
      ).trim();

    if (!fileName) {
      throw new Error(
        'Project document revision file name is required'
      );
    }

    const extension =
      path.extname(
        fileName
      )
        .replace(
          '.',
          ''
        )
        .toUpperCase();

    const documentType =
      metadata.documentType ||
      current?.documentType ||
      baseDocument.documentType ||
      extension;

    this.assertDocumentType(
      documentType
    );

    const documentSource =
      metadata.documentSource ||
      current?.documentSource ||
      baseDocument.documentSource ||
      DOCUMENT_SOURCE.OTHER;

    this.assertDocumentSource(
      documentSource
    );

    const permission =
      metadata.permission ||
      current?.permission ||
      baseDocument.permission ||
      DOCUMENT_PERMISSION.READ_ONLY;

    this.assertDocumentPermission(
      permission
    );

    const storageKey =
      metadata.storageKey ||
      path.join(
        'projects',
        projectId,
        'documents',
        `${revisionId}-${fileName}`
      );

    this.data.storage.writeBuffer(
      storageKey,
      file.buffer
    );

    /*
     * Mark the existing Current revision as Superseded.
     */

    documents.forEach(
      (document) => {
        if (
          document.id ===
            rootId ||
          document.parentDocumentId ===
            rootId
        ) {
          if (
            document.revisionStatus ===
            DOCUMENT_REVISION_STATUS.CURRENT
          ) {
            document.revisionStatus =
              DOCUMENT_REVISION_STATUS.SUPERSEDED;

            document.updatedAt =
              timestamp;
          }
        }
      }
    );

    /*
     * The new revision becomes Current.
     */

    const revision = {
      id:
        revisionId,

      projectId,

      parentDocumentId:
        rootId,

      fileName,

      documentType,

      documentSource,

      mimeType:
        metadata.mimeType ||
        current?.mimeType ||
        baseDocument.mimeType ||
        null,

      size:
        file.buffer.length,

      storageKey,

      storageStatus:
        DOCUMENT_STORAGE_STATUS.AVAILABLE,

      hash:
        metadata.hash ||
        null,

      status:
        DOCUMENT_STATUS.UPDATED,

      permission,

      revisionNumber,

      revisionStatus:
        DOCUMENT_REVISION_STATUS.CURRENT,

      importedAt:
        timestamp,

      createdAt:
        timestamp,

      updatedAt:
        timestamp,
    };

    documents.push(
      revision
    );

    project.project.updatedAt =
      timestamp;

    this.appendHistory(
      project,
      'Project Document Revision Created',
      {
        documentId:
          rootId,

        revisionId,

        revisionNumber,

        fileName,
      }
    );

    this.writeProject(
      project
    );

    return revision;
  }

  /*
   * =====================================================
   * Internal Document Lookup
   * =====================================================
   */

  findProjectDocumentInProject(
    project,
    documentId
  ) {
    if (
      !project ||
      !project.projectDocuments ||
      !Array.isArray(
        project.projectDocuments
          .documents
      )
    ) {
      return null;
    }

    return (
      project.projectDocuments
        .documents.find(
          (document) =>
            document.id ===
            documentId
        ) || null
    );
  }

  /*
   * =====================================================
   * Find Current Generic Document Revision
   * =====================================================
   */

  getCurrentProjectDocumentRevisionFromProject(
    project,
    documentId
  ) {
    if (
      !project ||
      !project.projectDocuments ||
      !Array.isArray(
        project.projectDocuments
          .documents
      )
    ) {
      return null;
    }

    const documents =
      project.projectDocuments
        .documents;

    const requested =
      documents.find(
        (document) =>
          document.id ===
          documentId
      );

    if (!requested) {
      return null;
    }

    const rootId =
      requested.parentDocumentId ||
      requested.id;

    const revisions =
      documents.filter(
        (document) =>
          document.id ===
            rootId ||
          document.parentDocumentId ===
            rootId
      );

    if (
      !revisions.length
    ) {
      return null;
    }

    const current =
      revisions.find(
        (document) =>
          document.revisionStatus ===
          DOCUMENT_REVISION_STATUS.CURRENT
      );

    if (current) {
      return current;
    }

    return (
      revisions
        .slice()
        .sort(
          (a, b) =>
            (
              b.revisionNumber ||
              0
            ) -
            (
              a.revisionNumber ||
              0
            )
        )[0] || null
    );
  }

  /*
   * =====================================================
   * Public Current Generic Document Revision
   * =====================================================
   */

  getCurrentProjectDocumentRevision(
    projectId,
    documentId
  ) {
    const project =
      this.openProject(
        projectId
      );

    return this.getCurrentProjectDocumentRevisionFromProject(
      project,
      documentId
    );
  }
    /*
   * =====================================================
   * Get All Generic Document Revisions
   * =====================================================
   */

  getProjectDocumentRevisions(
    projectId,
    documentId
  ) {
    const project =
      this.openProject(
        projectId
      );

    if (
      !project.projectDocuments ||
      !Array.isArray(
        project.projectDocuments
          .documents
      )
    ) {
      return [];
    }

    const documents =
      project.projectDocuments
        .documents;

    const requested =
      documents.find(
        (document) =>
          document.id ===
          documentId
      );

    if (!requested) {
      return [];
    }

    const rootId =
      requested.parentDocumentId ||
      requested.id;

    return documents
      .filter(
        (document) =>
          document.id ===
            rootId ||
          document.parentDocumentId ===
            rootId
      )
      .sort(
        (a, b) =>
          (
            a.revisionNumber ||
            0
          ) -
          (
            b.revisionNumber ||
            0
          )
      );
  }

  /*
   * =====================================================
   * Read Current Generic Document Revision
   * =====================================================
   */

  readCurrentProjectDocument(
    projectId,
    documentId
  ) {
    const revision =
      this.getCurrentProjectDocumentRevision(
        projectId,
        documentId
      );

    if (!revision) {
      return null;
    }

    if (
      !revision.storageKey
    ) {
      return null;
    }

    const buffer =
      this.data.storage.readBuffer(
        revision.storageKey,
        null
      );

    if (!buffer) {
      return null;
    }

    return {
      buffer,

      metadata:
        revision,
    };
  }

  /*
   * =====================================================
   * Lock / Unlock
   * =====================================================
   */

  lockProject(
    projectId
  ) {
    const project =
      this.openProject(
        projectId
      );

    this.assertWritable(
      project
    );

    if (
      project.project.archiveStatus !==
      ARCHIVE_STATUS.ACTIVE
    ) {
      throw new Error(
        'Only active projects can be locked'
      );
    }

    if (
      project.project.lockStatus ===
      LOCK_STATUS.LOCKED
    ) {
      return project;
    }

    project.project.lockStatus =
      LOCK_STATUS.LOCKED;

    project.project.updatedAt =
      now();

    this.appendHistory(
      project,
      'Project Locked'
    );

    this.writeProject(
      project
    );

    return project;
  }

  unlockProject(
    projectId
  ) {
    const project =
      this.openProject(
        projectId
      );

    this.assertWritable(
      project
    );

    if (
      project.project.lockStatus ===
      LOCK_STATUS.UNLOCKED
    ) {
      return project;
    }

    project.project.lockStatus =
      LOCK_STATUS.UNLOCKED;

    project.project.updatedAt =
      now();

    this.appendHistory(
      project,
      'Project Unlocked'
    );

    this.writeProject(
      project
    );

    return project;
  }

  /*
   * =====================================================
   * Project Lookup Helpers
   * =====================================================
   */

  listProjectIds() {
    return Array.isArray(
      this.index.projectIds
    )
      ? [
          ...this.index.projectIds,
        ]
      : [];
  }

  projectExists(
    projectId
  ) {
    return Boolean(
      this.readProject(
        projectId
      )
    );
  }

  /*
   * =====================================================
   * Project Document Collection Helpers
   * =====================================================
   */

  hasProjectDocument(
    projectId,
    documentId
  ) {
    return Boolean(
      this.getProjectDocument(
        projectId,
        documentId
      )
    );
  }

  /*
   * =====================================================
   * Generic Document Source Queries
   * =====================================================
   */

  getProjectDocumentsBySource(
    projectId,
    documentSource
  ) {
    this.assertDocumentSource(
      documentSource
    );

    return this.getProjectDocuments(
      projectId
    ).filter(
      (document) =>
        document.documentSource ===
        documentSource
    );
  }

  /*
   * =====================================================
   * Generic Document Type Queries
   * =====================================================
   */

  getProjectDocumentsByType(
    projectId,
    documentType
  ) {
    this.assertDocumentType(
      documentType
    );

    return this.getProjectDocuments(
      projectId
    ).filter(
      (document) =>
        document.documentType ===
        documentType
    );
  }

  /*
   * =====================================================
   * Current Generic Documents
   * =====================================================
   *
   * Returns only records currently marked as Current.
   *
   * This is useful for consumers that do not want
   * superseded document revisions.
   */

  getCurrentProjectDocuments(
    projectId
  ) {
    return this.getProjectDocuments(
      projectId
    ).filter(
      (document) =>
        document.revisionStatus ===
        DOCUMENT_REVISION_STATUS.CURRENT
    );
  }

  /*
   * =====================================================
   * Project Document Revision Count
   * =====================================================
   */

  getProjectDocumentRevisionCount(
    projectId,
    documentId
  ) {
    return this.getProjectDocumentRevisions(
      projectId,
      documentId
    ).length;
  }

  /*
   * =====================================================
   * Project Document History Metadata
   * =====================================================
   */

  getProjectDocumentHistory(
    projectId,
    documentId
  ) {
    const project =
      this.openProject(
        projectId
      );

    if (
      !Array.isArray(
        project.history
      )
    ) {
      return [];
    }

    return project.history.filter(
      (entry) =>
        entry.documentId ===
        documentId ||
        entry.parentDocumentId ===
        documentId ||
        entry.revisionId ===
        documentId
    );
  }

  /*
   * =====================================================
   * Project State Helpers
   * =====================================================
   */

  isProjectLocked(
    projectId
  ) {
    const project =
      this.openProject(
        projectId
      );

    return (
      project.project.lockStatus ===
      LOCK_STATUS.LOCKED
    );
  }

  isProjectArchived(
    projectId
  ) {
    const project =
      this.openProject(
        projectId
      );

    return (
      project.project.archiveStatus ===
      ARCHIVE_STATUS.ARCHIVED
    );
  }

  isProjectInTrash(
    projectId
  ) {
    const project =
      this.loadProject(
        projectId,
        true
      );

    return (
      project.project.archiveStatus ===
      ARCHIVE_STATUS.TRASH
    );
  }

  /*
   * =====================================================
   * Workflow Helpers
   * =====================================================
   */

  getWorkflowStatus(
    projectId
  ) {
    const project =
      this.openProject(
        projectId
      );

    return project.project
      .workflowStatus;
  }

  /*
   * =====================================================
   * Active Revision Helpers
   * =====================================================
   */

  getActiveRevision(
    projectId
  ) {
    const project =
      this.openProject(
        projectId
      );

    const revisionId =
      project.project
        .activeRevisionId;

    if (!revisionId) {
      return null;
    }

    return (
      project.revisions?.find(
        (revision) =>
          revision.id ===
          revisionId
      ) || null
    );
  }

  getActiveSnapshot(
    projectId
  ) {
    const project =
      this.openProject(
        projectId
      );

    const snapshotId =
      project.project
        .activeSnapshotId;

    if (!snapshotId) {
      return null;
    }

    return (
      project.snapshots?.find(
        (snapshot) =>
          snapshot.id ===
          snapshotId
      ) || null
    );
  }

  /*
   * =====================================================
   * Confirmed Revision List
   * =====================================================
   */

  getConfirmedRevisions(
    projectId
  ) {
    const project =
      this.openProject(
        projectId
      );

    if (
      !Array.isArray(
        project.revisions
      )
    ) {
      return [];
    }

    return project.revisions.filter(
      (revision) =>
        revision.status ===
        REVISION_STATUS.CONFIRMED
    );
  }

  /*
   * =====================================================
   * Project History
   * =====================================================
   */

  getHistory(
    projectId
  ) {
    const project =
      this.openProject(
        projectId
      );

    return Array.isArray(
      project.history
    )
      ? project.history
      : [];
  }

  /*
   * =====================================================
   * Engineering Records
   * =====================================================
   *
   * The ProjectService does not make recognition
   * decisions.
   *
   * RecognitionService / Engineering services own
   * Engineering Record creation.
   */

  getEngineeringRecords(
    projectId
  ) {
    const project =
      this.openProject(
        projectId
      );

    return Array.isArray(
      project.engineeringRecords
    )
      ? project.engineeringRecords
      : [];
  }

  /*
   * =====================================================
   * Engineering Issues
   * =====================================================
   *
   * The ProjectService does not resolve Engineering
   * Issues.
   */

  getEngineeringIssues(
    projectId
  ) {
    const project =
      this.openProject(
        projectId
      );

    return Array.isArray(
      project.engineeringIssues
    )
      ? project.engineeringIssues
      : [];
  }

  /*
   * =====================================================
   * Furniture Objects
   * =====================================================
   *
   * Furniture Objects remain downstream objects.
   *
   * This service only exposes the stored collection.
   */

  getFurnitureObjects(
    projectId
  ) {
    const project =
      this.openProject(
        projectId
      );

    return Array.isArray(
      project.furnitureObjects
    )
      ? project.furnitureObjects
      : [];
  }

  /*
   * =====================================================
   * Backup History
   * =====================================================
   */

  getBackupHistory(
    projectId
  ) {
    const project =
      this.openProject(
        projectId
      );

    return Array.isArray(
      project.backupHistory
    )
      ? project.backupHistory
      : [];
  }

  /*
   * =====================================================
   * Export History
   * =====================================================
   */

  getExportHistory(
    projectId
  ) {
    const project =
      this.openProject(
        projectId
      );

    return Array.isArray(
      project.exportHistory
    )
      ? project.exportHistory
      : [];
  }
    /*
   * =====================================================
   * Project Document Storage Verification
   * =====================================================
   *
   * This checks whether the physical file represented by
   * a Document Record can currently be read.
   *
   * It does not change the stored status automatically.
   */

  verifyProjectDocumentStorage(
    projectId,
    documentId
  ) {
    const document =
      this.getProjectDocument(
        projectId,
        documentId
      );

    if (!document) {
      return {
        exists:
          false,

        available:
          false,

        document:
          null,
      };
    }

    if (
      !document.storageKey
    ) {
      return {
        exists:
          true,

        available:
          false,

        document,
      };
    }

    const buffer =
      this.data.storage.readBuffer(
        document.storageKey,
        null
      );

    return {
      exists:
        true,

      available:
        Boolean(buffer),

      document,
    };
  }

  /*
   * =====================================================
   * Project Document Current File Verification
   * =====================================================
   */

  verifyCurrentProjectDocumentStorage(
    projectId,
    documentId
  ) {
    const current =
      this.getCurrentProjectDocumentRevision(
        projectId,
        documentId
      );

    if (!current) {
      return {
        exists:
          false,

        available:
          false,

        document:
          null,
      };
    }

    if (
      !current.storageKey
    ) {
      return {
        exists:
          true,

        available:
          false,

        document:
          current,
      };
    }

    const buffer =
      this.data.storage.readBuffer(
        current.storageKey,
        null
      );

    return {
      exists:
        true,

      available:
        Boolean(buffer),

      document:
        current,
    };
  }

  /*
   * =====================================================
   * Designer Revision Storage Verification
   * =====================================================
   */

  verifyDesignerRevisionStorage(
    projectId,
    revisionId
  ) {
    const revision =
      this.getDesignerRevision(
        projectId,
        revisionId
      );

    if (!revision) {
      return {
        exists:
          false,

        available:
          false,

        revision:
          null,
      };
    }

    if (
      !revision.storageKey
    ) {
      return {
        exists:
          true,

        available:
          false,

        revision,
      };
    }

    const buffer =
      this.data.storage.readBuffer(
        revision.storageKey,
        null
      );

    return {
      exists:
        true,

      available:
        Boolean(buffer),

      revision,
    };
  }

  /*
   * =====================================================
   * Backup PDF Storage Verification
   * =====================================================
   */

  verifyBackupPdfStorage(
    projectId
  ) {
    const project =
      this.openProject(
        projectId
      );

    const backup =
      project.projectDocuments
        ?.backupPdf;

    if (
      !backup
    ) {
      return {
        exists:
          false,

        available:
          false,

        backup:
          null,
      };
    }

    if (
      !backup.storageKey
    ) {
      return {
        exists:
          true,

        available:
          false,

        backup,
      };
    }

    const buffer =
      this.data.storage.readBuffer(
        backup.storageKey,
        null
      );

    return {
      exists:
        true,

      available:
        Boolean(buffer),

      backup,
    };
  }

  /*
   * =====================================================
   * Project Summary
   * =====================================================
   *
   * Lightweight project information for callers that do
   * not need the complete project object.
   */

  getProjectSummary(
    projectId
  ) {
    const project =
      this.openProject(
        projectId
      );

    return {
      id:
        project.project.id,

      name:
        project.project.name,

      status:
        project.project.status,

      workflowStatus:
        project.project.workflowStatus,

      lockStatus:
        project.project.lockStatus,

      archiveStatus:
        project.project.archiveStatus,

      activeRevisionId:
        project.project.activeRevisionId,

      activeSnapshotId:
        project.project.activeSnapshotId,

      currentDesignerRevisionId:
        project.projectDocuments
          ?.currentDesignerRevisionId ||
        null,

      documentCount:
        Array.isArray(
          project.projectDocuments
            ?.documents
        )
          ? project.projectDocuments
              .documents.length
          : 0,

      designerRevisionCount:
        Array.isArray(
          project.projectDocuments
            ?.designerRevisions
        )
          ? project.projectDocuments
              .designerRevisions.length
          : 0,

      engineeringRecordCount:
        Array.isArray(
          project.engineeringRecords
        )
          ? project.engineeringRecords
              .length
          : 0,

      engineeringIssueCount:
        Array.isArray(
          project.engineeringIssues
        )
          ? project.engineeringIssues
              .length
          : 0,

      furnitureObjectCount:
        Array.isArray(
          project.furnitureObjects
        )
          ? project.furnitureObjects
              .length
          : 0,

      createdAt:
        project.project.createdAt,

      updatedAt:
        project.project.updatedAt,
    };
  }

  /*
   * =====================================================
   * Module Exports
   * =====================================================
   */
}

module.exports = {
  ProjectService,
};
