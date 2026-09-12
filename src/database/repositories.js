const path = require('node:path');

const {
  JsonLocalStorage,
} = require('./local-storage');

const {
  OfficialCatalogRepository,
} = require('./official-catalog-repository');

const {
  FactoryReferenceRepository,
} = require('./factory-reference-repository');

const {
  FurnitureObjectRepository,
} = require('./furniture-object-repository');

const {
  EngineeringRecordRepository,
} = require('./engineering-record-repository');

const {
  EngineeringIssueRepository,
} = require('./engineering-issue-repository');

/*
 * =====================================================
 * Application Write Authority
 * =====================================================
 *
 * Repository writes are intentionally restricted.
 *
 * Repositories provide persistence only.
 *
 * Business services remain responsible for:
 *
 * - validation
 * - workflow decisions
 * - recognition decisions
 * - revision decisions
 * - project state changes
 *
 * Repositories must never become an alternate business
 * logic layer.
 * =====================================================
 */

const WRITE_AUTHORITY =
  Symbol(
    'project-service-write-authority'
  );

/*
 * =====================================================
 * Generic JSON Repository
 * =====================================================
 */

class JsonRepository {
  constructor(
    storage,
    key
  ) {
    this.storage = storage;
    this.key = key;
  }

  get(
    fallback = null
  ) {
    return this.storage.readJson(
      this.key,
      fallback
    );
  }

  save(
    value,
    authority
  ) {
    if (
      authority !==
      WRITE_AUTHORITY
    ) {
      throw new Error(
        'Repository writes require an application service authority'
      );
    }

    this.storage.writeJson(
      this.key,
      value
    );
  }
}

/*
 * =====================================================
 * Project Database Repository
 * =====================================================
 *
 * Stores the complete persistent Project Database.
 *
 * Project-level data includes:
 *
 * - Project
 * - Hierarchy
 * - Furniture Objects
 * - Engineering Records
 * - Engineering Issues
 * - Project Documents metadata
 * - Working State
 * - Confirmed Revisions
 * - Snapshots
 * - History
 * - Backup History
 * - Export History
 *
 * Actual binary files are NOT stored inside the JSON
 * Project Database.
 *
 * Binary files are handled by the storage layer.
 * =====================================================
 */

class ProjectDatabaseRepository
  extends JsonRepository {
  constructor(storage) {
    super(
      storage,
      null
    );
  }

  getById(
    projectId
  ) {
    return this.storage.readJson(
      path.join(
        'projects',
        `${projectId}.json`
      ),
      null
    );
  }

  saveById(
    project,
    authority
  ) {
    if (
      authority !==
      WRITE_AUTHORITY
    ) {
      throw new Error(
        'Repository writes require an application service authority'
      );
    }

    if (
      !project ||
      !project.project ||
      !project.project.id
    ) {
      throw new Error(
        'A valid project is required'
      );
    }

    this.storage.writeJson(
      path.join(
        'projects',
        `${project.project.id}.json`
      ),
      project
    );
  }
}

/*
 * =====================================================
 * Project Document Repository
 * =====================================================
 *
 * PRD09
 * PRD20
 *
 * Generic Project Document persistence layer.
 *
 * This repository manages metadata records stored under:
 *
 * project.projectDocuments.documents[]
 *
 * It does NOT:
 *
 * - import files
 * - calculate hashes
 * - detect duplicates
 * - determine revisions
 * - perform recognition
 * - correlate drawings
 * - generate Engineering Records
 * - modify Designer Revision logic
 *
 * Those responsibilities belong to application services.
 *
 * The repository only provides persistence operations.
 * =====================================================
 */

class ProjectDocumentRepository {
  constructor(
    projectDatabase
  ) {
    this.projectDatabase =
      projectDatabase;
  }

  getAll(
    projectId
  ) {
    const project =
      this.projectDatabase.getById(
        projectId
      );

    if (!project) {
      throw new Error(
        'Project not found'
      );
    }

    const documents =
      project.projectDocuments
        ?.documents;

    return Array.isArray(
      documents
    )
      ? documents
      : [];
  }

  getById(
    projectId,
    documentId
  ) {
    const documents =
      this.getAll(
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

  saveAll(
    projectId,
    documents,
    authority
  ) {
    if (
      authority !==
      WRITE_AUTHORITY
    ) {
      throw new Error(
        'Repository writes require an application service authority'
      );
    }

    if (
      !Array.isArray(
        documents
      )
    ) {
      throw new Error(
        'Project documents must be an array'
      );
    }

    const project =
      this.projectDatabase.getById(
        projectId
      );

    if (!project) {
      throw new Error(
        'Project not found'
      );
    }

    if (
      !project.projectDocuments ||
      typeof project.projectDocuments !==
        'object' ||
      Array.isArray(
        project.projectDocuments
      )
    ) {
      project.projectDocuments =
        {};
    }

    project.projectDocuments
      .documents =
      documents;

    this.projectDatabase.saveById(
      project,
      authority
    );
  }

  save(
    projectId,
    document,
    authority
  ) {
    if (
      !document ||
      !document.id
    ) {
      throw new Error(
        'A valid project document is required'
      );
    }

    const documents =
      this.getAll(
        projectId
      );

    const index =
      documents.findIndex(
        (item) =>
          item.id ===
          document.id
      );

    if (index === -1) {
      documents.push(
        document
      );
    } else {
      documents[index] =
        document;
    }

    this.saveAll(
      projectId,
      documents,
      authority
    );

    return document;
  }

  remove(
    projectId,
    documentId,
    authority
  ) {
    const documents =
      this.getAll(
        projectId
      );

    const index =
      documents.findIndex(
        (document) =>
          document.id ===
          documentId
      );

    if (index === -1) {
      return null;
    }

    const removed =
      documents.splice(
        index,
        1
      )[0];

    this.saveAll(
      projectId,
      documents,
      authority
    );

    return removed;
  }
}

/*
 * =====================================================
 * Data Access Factory
 * =====================================================
 */

function createDataAccess(
  rootDirectory
) {
  /*
   * ---------------------------------------------------
   * Shared Storage
   * ---------------------------------------------------
   */

  const storage =
    new JsonLocalStorage(
      rootDirectory
    );

  /*
   * ---------------------------------------------------
   * Project Index
   * ---------------------------------------------------
   */

  const projects =
    new JsonRepository(
      storage,
      path.join(
        'projects',
        'index.json'
      )
    );

  /*
   * ---------------------------------------------------
   * Factory Database
   * ---------------------------------------------------
   */

  const factory =
    new JsonRepository(
      storage,
      'factory-database.json'
    );

  /*
   * ---------------------------------------------------
   * Project Database
   * ---------------------------------------------------
   *
   * Create this repository before the generic
   * ProjectDocumentRepository because the latter uses
   * ProjectDatabaseRepository as its persistence boundary.
   */

  const projectDatabase =
    new ProjectDatabaseRepository(
      storage
    );

  /*
   * ---------------------------------------------------
   * Generic Project Documents
   * ---------------------------------------------------
   */

  const projectDocuments =
    new ProjectDocumentRepository(
      projectDatabase
    );

  /*
   * ---------------------------------------------------
   * Data Access Object
   * ---------------------------------------------------
   */

  return {
    /*
     * -------------------------------------------------
     * Application write authority
     * -------------------------------------------------
     */

    authority:
      WRITE_AUTHORITY,

    /*
     * -------------------------------------------------
     * Shared storage
     * -------------------------------------------------
     */

    storage,

    /*
     * -------------------------------------------------
     * Official Engineering Knowledge
     * -------------------------------------------------
     */

    official:
      new OfficialCatalogRepository(),

    /*
     * -------------------------------------------------
     * Factory Database
     * -------------------------------------------------
     */

    factory,

    factoryReferences:
      new FactoryReferenceRepository(
        factory
      ),

    /*
     * -------------------------------------------------
     * Furniture Objects
     * -------------------------------------------------
     */

    furnitureObjects:
      new FurnitureObjectRepository(),

    /*
     * -------------------------------------------------
     * Engineering Records
     * -------------------------------------------------
     *
     * RecognitionService is the only service
     * responsible for writing Engineering Records.
     *
     * The repository itself contains no recognition
     * logic and no engineering decisions.
     */

    engineeringRecords:
      new EngineeringRecordRepository(),

    /*
     * -------------------------------------------------
     * Engineering Issues
     * -------------------------------------------------
     *
     * RecognitionService is the only service
     * responsible for writing Engineering Issues.
     *
     * The repository stores recognition review items
     * but does not resolve engineering decisions.
     */

    engineeringIssues:
      new EngineeringIssueRepository(),

    /*
     * -------------------------------------------------
     * Generic Project Documents
     * -------------------------------------------------
     *
     * PRD20 — Import and Export Management System
     *
     * Stores generic imported project document
     * metadata.
     */

    projectDocuments,

    /*
     * -------------------------------------------------
     * Factory Configuration
     * -------------------------------------------------
     */

    configuration:
      new JsonRepository(
        storage,
        'factory-configuration.json'
      ),

    /*
     * -------------------------------------------------
     * Project Database
     * -------------------------------------------------
     */

    projectDatabase,

    /*
     * -------------------------------------------------
     * Project Index
     * -------------------------------------------------
     */

    projects,
  };
}

/*
 * =====================================================
 * Module Exports
 * =====================================================
 */

module.exports = {
  createDataAccess,
};