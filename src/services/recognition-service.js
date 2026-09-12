const {
  createEngineeringRecord,
  validateEngineeringRecord,
  supersedeEngineeringRecord,
} = require('../modules/engineering-record');

const {
  createEngineeringIssue,
  validateEngineeringIssue,
  startEngineeringIssueReview,
  confirmEngineeringIssue,
  dismissEngineeringIssue,
  reopenEngineeringIssue,
} = require('../modules/engineering-issue');

const {
  ENGINEERING_RECORD_REPOSITORY_AUTHORITY,
} = require('../database/engineering-record-repository');

const {
  ENGINEERING_ISSUE_REPOSITORY_AUTHORITY,
} = require('../database/engineering-issue-repository');

const {
  ENGINEERING_ISSUE_STATUS,
  ENGINEERING_ISSUE_SEVERITY,
  RECOGNITION_STATUS,
} = require('../database/constants');

function now() {
  return new Date().toISOString();
}

class RecognitionService {
  constructor(projectService) {
    if (
      !projectService ||
      typeof projectService.openProject !==
        'function'
    ) {
      throw new Error(
        'RecognitionService requires ProjectService'
      );
    }

    if (
      !projectService.data ||
      !projectService.data.engineeringRecords
    ) {
      throw new Error(
        'RecognitionService requires EngineeringRecordRepository'
      );
    }

    if (
      !projectService.data.engineeringIssues
    ) {
      throw new Error(
        'RecognitionService requires EngineeringIssueRepository'
      );
    }

    this.projectService =
      projectService;

    this.recordRepository =
      projectService.data
        .engineeringRecords;

    this.issueRepository =
      projectService.data
        .engineeringIssues;
  }

  /*
   * =====================================================
   * Whole Project Recognition
   * =====================================================
   *
   * PRD09:
   *
   * The Recognition Engine transforms structured
   * recognition information into Engineering Records
   * and Engineering Issues.
   *
   * This service does NOT:
   *
   * - perform production calculations
   * - create Furniture Objects
   * - determine manufacturing methods
   * - generate production boards
   * - resolve engineering issues automatically
   */

  recognizeProject(
    projectId,
    recognitionInput = {}
  ) {
    const project =
      this.projectService.openProject(
        projectId
      );

    this.projectService.assertWritable(
      project
    );

    this.projectService.assertActiveProject(
      project
    );

    /*
     * Recognition starts from the current Designer
     * Revision.
     */

    const currentRevision =
      project.projectDocuments
        ?.currentDesignerRevisionId ||
      null;

    this.projectService.setRecognitionStatus(
      projectId,
      RECOGNITION_STATUS.IN_PROGRESS,
      {
        currentDesignerRevisionId:
          currentRevision,
      }
    );

    const candidates =
      Array.isArray(
        recognitionInput.records
      )
        ? recognitionInput.records
        : [];

    const issueCandidates =
      Array.isArray(
        recognitionInput.issues
      )
        ? recognitionInput.issues
        : [];

    const generatedRecords = [];

    /*
     * ---------------------------------------------------
     * Engineering Record Generation
     * ---------------------------------------------------
     */

    for (
      const candidate of candidates
    ) {
      const record =
        this.generateEngineeringRecord(
          projectId,
          candidate
        );

      generatedRecords.push(
        record
      );
    }

    /*
     * ---------------------------------------------------
     * Engineering Issue Detection
     * ---------------------------------------------------
     *
     * The Recognition Service receives detected issue
     * information from the recognition pipeline.
     *
     * It stores the issue.
     *
     * It does not resolve it.
     */

    const generatedIssues = [];

    for (
      const candidate of issueCandidates
    ) {
      const issue =
        this.generateEngineeringIssue(
          projectId,
          candidate
        );

      generatedIssues.push(
        issue
      );
    }

    /*
     * ---------------------------------------------------
     * Determine Recognition Status
     * ---------------------------------------------------
     */

    let status;

    if (
      generatedIssues.some(
        (issue) =>
          issue.status ===
          ENGINEERING_ISSUE_STATUS.OPEN
      )
    ) {
      status =
        RECOGNITION_STATUS.REVIEW_REQUIRED;
    } else if (
      generatedRecords.length
    ) {
      status =
        RECOGNITION_STATUS.COMPLETED;
    } else {
      status =
        RECOGNITION_STATUS.REVIEW_REQUIRED;
    }

    this.projectService.setRecognitionStatus(
      projectId,
      status,
      {
        engineeringRecordCount:
          generatedRecords.length,

        engineeringIssueCount:
          generatedIssues.length,

        currentDesignerRevisionId:
          currentRevision,
      }
    );

    return {
      projectId,

      status,

      currentDesignerRevisionId:
        currentRevision,

      engineeringRecords:
        generatedRecords,

      engineeringIssues:
        generatedIssues,

      reviewRequired:
        generatedIssues.some(
          (issue) =>
            issue.status ===
            ENGINEERING_ISSUE_STATUS.OPEN
        ),
    };
  }

  /*
   * =====================================================
   * Engineering Record
   * =====================================================
   */

  generateEngineeringRecord(
    projectId,
    input = {}
  ) {
    const project =
      this.projectService.openProject(
        projectId
      );

    this.projectService.assertWritable(
      project
    );

    this.projectService.assertActiveProject(
      project
    );

    const record =
      createEngineeringRecord({
        ...input,
        projectId,
      });

    const errors =
      validateEngineeringRecord(
        record
      );

    if (
      errors.length
    ) {
      throw new Error(
        `Engineering Record validation failed: ${errors
          .map(
            (item) =>
              item.code
          )
          .join(', ')}`
      );
    }

    this.recordRepository
      .saveFromRecognitionService(
        project,
        record,
        ENGINEERING_RECORD_REPOSITORY_AUTHORITY
      );

    project.project.updatedAt =
      now();

    this.projectService.appendHistory(
      project,
      'Engineering Record Generated',
      {
        engineeringRecordId:
          record.id,
      }
    );

    this.projectService.writeProject(
      project
    );

    return record;
  }

  /*
   * =====================================================
   * Engineering Issue
   * =====================================================
   */

  generateEngineeringIssue(
    projectId,
    input = {}
  ) {
    const project =
      this.projectService.openProject(
        projectId
      );

    this.projectService.assertWritable(
      project
    );

    this.projectService.assertActiveProject(
      project
    );

    /*
     * If an Engineering Record reference is supplied,
     * verify that the record belongs to this project.
     */

    if (
      input.engineeringRecordId
    ) {
      const record =
        this.recordRepository.getById(
          project,
          input.engineeringRecordId
        );

      if (!record) {
        throw new Error(
          'Engineering Issue Engineering Record reference is invalid'
        );
      }
    }

    const issue =
      createEngineeringIssue({
        ...input,
        projectId,
      });

    const errors =
      validateEngineeringIssue(
        issue
      );

    if (
      errors.length
    ) {
      throw new Error(
        `Engineering Issue validation failed: ${errors
          .map(
            (item) =>
              item.code
          )
          .join(', ')}`
      );
    }

    this.issueRepository
      .saveFromRecognitionService(
        project,
        issue,
        ENGINEERING_ISSUE_REPOSITORY_AUTHORITY
      );

    project.project.updatedAt =
      now();

    this.projectService.appendHistory(
      project,
      'Engineering Issue Detected',
      {
        engineeringIssueId:
          issue.id,

        engineeringRecordId:
          issue.engineeringRecordId,

        severity:
          issue.severity,

        issueType:
          issue.type,
      }
    );

    this.projectService.writeProject(
      project
    );

    return issue;
  }

  /*
   * =====================================================
   * Update Engineering Record
   * =====================================================
   */

  updateEngineeringRecord(
    projectId,
    record
  ) {
    const project =
      this.projectService.openProject(
        projectId
      );

    this.projectService.assertWritable(
      project
    );

    this.projectService.assertActiveProject(
      project
    );

    if (
      !record ||
      record.projectId !==
        projectId
    ) {
      throw new Error(
        'Engineering Record does not belong to project'
      );
    }

    const errors =
      validateEngineeringRecord(
        record
      );

    if (
      errors.length
    ) {
      throw new Error(
        `Engineering Record validation failed: ${errors
          .map(
            (item) =>
              item.code
          )
          .join(', ')}`
      );
    }

    const existing =
      this.recordRepository.getById(
        project,
        record.id
      );

    if (!existing) {
      throw new Error(
        'Engineering Record not found'
      );
    }

    const updated = {
      ...record,
      updatedAt:
        now(),
    };

    this.recordRepository
      .updateFromRecognitionService(
        project,
        updated,
        ENGINEERING_RECORD_REPOSITORY_AUTHORITY
      );

    project.project.updatedAt =
      updated.updatedAt;

    this.projectService.appendHistory(
      project,
      'Engineering Record Updated',
      {
        engineeringRecordId:
          updated.id,
      }
    );

    this.projectService.writeProject(
      project
    );

    return updated;
  }

  /*
   * =====================================================
   * Supersede Engineering Record
   * =====================================================
   */

  supersedeEngineeringRecord(
    projectId,
    recordId
  ) {
    const project =
      this.projectService.openProject(
        projectId
      );

    this.projectService.assertWritable(
      project
    );

    this.projectService.assertActiveProject(
      project
    );

    const existing =
      this.recordRepository.getById(
        project,
        recordId
      );

    if (!existing) {
      throw new Error(
        'Engineering Record not found'
      );
    }

    const superseded =
      supersedeEngineeringRecord(
        existing
      );

    this.recordRepository
      .updateFromRecognitionService(
        project,
        superseded,
        ENGINEERING_RECORD_REPOSITORY_AUTHORITY
      );

    project.project.updatedAt =
      superseded.updatedAt;

    this.projectService.appendHistory(
      project,
      'Engineering Record Superseded',
      {
        engineeringRecordId:
          superseded.id,
      }
    );

    this.projectService.writeProject(
      project
    );

    return superseded;
  }

  /*
   * =====================================================
   * Engineering Issue Review
   * =====================================================
   *
   * These operations change review state.
   *
   * They do NOT perform Project Confirmation.
   */

  startIssueReview(
    projectId,
    issueId,
    reviewerId
  ) {
    const project =
      this.projectService.openProject(
        projectId
      );

    this.projectService.assertWritable(
      project
    );

    this.projectService.assertActiveProject(
      project
    );

    const existing =
      this.issueRepository.getById(
        project,
        issueId
      );

    if (!existing) {
      throw new Error(
        'Engineering Issue not found'
      );
    }

    const updated =
      startEngineeringIssueReview(
        existing,
        reviewerId
      );

    this.issueRepository
      .updateFromRecognitionService(
        project,
        updated,
        ENGINEERING_ISSUE_REPOSITORY_AUTHORITY
      );

    project.project.updatedAt =
      updated.updatedAt;

    this.projectService.appendHistory(
      project,
      'Engineering Issue Review Started',
      {
        engineeringIssueId:
          updated.id,

        reviewedBy:
          updated.reviewedBy,
      }
    );

    this.projectService.writeProject(
      project
    );

    return updated;
  }

  confirmIssueReview(
    projectId,
    issueId,
    reviewerId
  ) {
    const project =
      this.projectService.openProject(
        projectId
      );

    this.projectService.assertWritable(
      project
    );

    this.projectService.assertActiveProject(
      project
    );

    const existing =
      this.issueRepository.getById(
        project,
        issueId
      );

    if (!existing) {
      throw new Error(
        'Engineering Issue not found'
      );
    }

    const updated =
      confirmEngineeringIssue(
        existing,
        reviewerId
      );

    this.issueRepository
      .updateFromRecognitionService(
        project,
        updated,
        ENGINEERING_ISSUE_REPOSITORY_AUTHORITY
      );

    project.project.updatedAt =
      updated.updatedAt;

    this.projectService.appendHistory(
      project,
      'Engineering Issue Reviewed',
      {
        engineeringIssueId:
          updated.id,

        reviewedBy:
          updated.reviewedBy,

        status:
          updated.status,
      }
    );

    this.projectService.writeProject(
      project
    );

    return updated;
  }

  dismissIssue(
    projectId,
    issueId,
    reviewerId
  ) {
    const project =
      this.projectService.openProject(
        projectId
      );

    this.projectService.assertWritable(
      project
    );

    this.projectService.assertActiveProject(
      project
    );

    const existing =
      this.issueRepository.getById(
        project,
        issueId
      );

    if (!existing) {
      throw new Error(
        'Engineering Issue not found'
      );
    }

    const updated =
      dismissEngineeringIssue(
        existing,
        reviewerId
      );

    this.issueRepository
      .updateFromRecognitionService(
        project,
        updated,
        ENGINEERING_ISSUE_REPOSITORY_AUTHORITY
      );

    project.project.updatedAt =
      updated.updatedAt;

    this.projectService.appendHistory(
      project,
      'Engineering Issue Dismissed',
      {
        engineeringIssueId:
          updated.id,

        dismissedBy:
          updated.dismissedBy,
      }
    );

    this.projectService.writeProject(
      project
    );

    return updated;
  }

  reopenIssue(
    projectId,
    issueId
  ) {
    const project =
      this.projectService.openProject(
        projectId
      );

    this.projectService.assertWritable(
      project
    );

    this.projectService.assertActiveProject(
      project
    );

    const existing =
      this.issueRepository.getById(
        project,
        issueId
      );

    if (!existing) {
      throw new Error(
        'Engineering Issue not found'
      );
    }

    const updated =
      reopenEngineeringIssue(
        existing
      );

    this.issueRepository
      .updateFromRecognitionService(
        project,
        updated,
        ENGINEERING_ISSUE_REPOSITORY_AUTHORITY
      );

    project.project.updatedAt =
      updated.updatedAt;

    this.projectService.appendHistory(
      project,
      'Engineering Issue Reopened',
      {
        engineeringIssueId:
          updated.id,
      }
    );

    this.projectService.writeProject(
      project
    );

    return updated;
  }

  /*
   * =====================================================
   * Engineering Record Read
   * =====================================================
   */

  getEngineeringRecord(
    projectId,
    recordId
  ) {
    const project =
      this.projectService.openProject(
        projectId
      );

    return this.recordRepository
      .getById(
        project,
        recordId
      );
  }

  listEngineeringRecords(
    projectId
  ) {
    const project =
      this.projectService.openProject(
        projectId
      );

    return this.recordRepository
      .listByProjectId(
        project
      );
  }

  /*
   * =====================================================
   * Engineering Issue Read
   * =====================================================
   */

  getEngineeringIssue(
    projectId,
    issueId
  ) {
    const project =
      this.projectService.openProject(
        projectId
      );

    return this.issueRepository
      .getById(
        project,
        issueId
      );
  }

  listEngineeringIssues(
    projectId
  ) {
    const project =
      this.projectService.openProject(
        projectId
      );

    return this.issueRepository
      .listByProjectId(
        project
      );
  }

  listIssuesByEngineeringRecord(
    projectId,
    engineeringRecordId
  ) {
    const project =
      this.projectService.openProject(
        projectId
      );

    return this.issueRepository
      .listByEngineeringRecordId(
        project,
        engineeringRecordId
      );
  }

  /*
   * =====================================================
   * Engineering Review List
   * =====================================================
   *
   * The Review List contains unresolved engineering
   * review items.
   *
   * Confirmed and dismissed items remain in history but
   * are not considered currently open review work.
   */

  getEngineeringReviewList(
    projectId
  ) {
    const project =
      this.projectService.openProject(
        projectId
      );

    const issues =
      this.issueRepository
        .listByProjectId(
          project
        );

    return issues.filter(
      (issue) =>
        issue.status ===
          ENGINEERING_ISSUE_STATUS.OPEN ||
        issue.status ===
          ENGINEERING_ISSUE_STATUS.REVIEWING
    );
  }

  /*
   * =====================================================
   * Recognition Summary
   * =====================================================
   */

  getRecognitionSummary(
    projectId
  ) {
    const project =
      this.projectService.openProject(
        projectId
      );

    const records =
      this.recordRepository
        .listByProjectId(
          project
        );

    const issues =
      this.issueRepository
        .listByProjectId(
          project
        );

    const generated =
      records.filter(
        (record) =>
          record.status ===
          'Generated'
      );

    const confirmed =
      records.filter(
        (record) =>
          record.status ===
          'Confirmed'
      );

    const superseded =
      records.filter(
        (record) =>
          record.status ===
          'Superseded'
      );

    const openIssues =
      issues.filter(
        (issue) =>
          issue.status ===
            ENGINEERING_ISSUE_STATUS.OPEN ||
          issue.status ===
            ENGINEERING_ISSUE_STATUS.REVIEWING
      );

    const confirmedIssues =
      issues.filter(
        (issue) =>
          issue.status ===
          ENGINEERING_ISSUE_STATUS.CONFIRMED
      );

    const dismissedIssues =
      issues.filter(
        (issue) =>
          issue.status ===
          ENGINEERING_ISSUE_STATUS.DISMISSED
      );

    const criticalIssues =
      openIssues.filter(
        (issue) =>
          issue.severity ===
          ENGINEERING_ISSUE_SEVERITY.CRITICAL
      );

    const errorIssues =
      openIssues.filter(
        (issue) =>
          issue.severity ===
          ENGINEERING_ISSUE_SEVERITY.ERROR
      );

    const warningIssues =
      openIssues.filter(
        (issue) =>
          issue.severity ===
          ENGINEERING_ISSUE_SEVERITY.WARNING
      );

    const infoIssues =
      openIssues.filter(
        (issue) =>
          issue.severity ===
          ENGINEERING_ISSUE_SEVERITY.INFO
      );

    return {
      projectId,

      recognitionStatus:
        project.project.workflowStatus,

      currentDesignerRevisionId:
        project.projectDocuments
          ?.currentDesignerRevisionId ||
        null,

      /*
       * Engineering Records
       */

      totalRecords:
        records.length,

      generatedRecords:
        generated.length,

      confirmedRecords:
        confirmed.length,

      supersededRecords:
        superseded.length,

      /*
       * Engineering Issues
       */

      totalIssues:
        issues.length,

      openIssues:
        openIssues.length,

      confirmedIssues:
        confirmedIssues.length,

      dismissedIssues:
        dismissedIssues.length,

      criticalIssues:
        criticalIssues.length,

      errorIssues:
        errorIssues.length,

      warningIssues:
        warningIssues.length,

      infoIssues:
        infoIssues.length,

      /*
       * Review state
       */

      reviewRequired:
        openIssues.length > 0,

      readyForProjectConfirmation:
        openIssues.length === 0 &&
        records.length > 0,
    };
  }
}

module.exports = {
  RecognitionService,
};