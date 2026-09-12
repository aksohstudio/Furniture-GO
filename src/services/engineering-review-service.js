const {
  ENGINEERING_ISSUE_STATUS,
  ENGINEERING_ISSUE_SEVERITY,
} = require('../database/constants');

const {
  createEngineeringIssue,
  validateEngineeringIssue,
  startEngineeringIssueReview,
  confirmEngineeringIssue,
  dismissEngineeringIssue,
  reopenEngineeringIssue,
} = require('../modules/engineering-issue');

const {
  ENGINEERING_ISSUE_REPOSITORY_AUTHORITY,
} = require('../database/engineering-issue-repository');

function now() {
  return new Date().toISOString();
}

class EngineeringReviewService {
  constructor(projectService) {
    if (
      !projectService ||
      typeof projectService.openProject !== 'function'
    ) {
      throw new Error(
        'EngineeringReviewService requires ProjectService'
      );
    }

    if (
      !projectService.data ||
      !projectService.data.engineeringIssues
    ) {
      throw new Error(
        'EngineeringReviewService requires EngineeringIssueRepository'
      );
    }

    this.projectService = projectService;

    this.repository =
      projectService.data.engineeringIssues;
  }

  /*
   * =====================================================
   * Create Engineering Issue
   * =====================================================
   *
   * Recognition Service uses this method to record
   * detected engineering risks.
   *
   * This service does NOT resolve the issue.
   */

  createIssue(
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

    const issue =
      createEngineeringIssue({
        ...input,
        projectId,
      });

    const errors =
      validateEngineeringIssue(
        issue
      );

    if (errors.length) {
      throw new Error(
        `Engineering Issue validation failed: ${errors
          .map(
            (item) =>
              item.code
          )
          .join(', ')}`
      );
    }

    this.repository.saveFromRecognitionService(
      project,
      issue,
      ENGINEERING_ISSUE_REPOSITORY_AUTHORITY
    );

    project.project.updatedAt =
      now();

    this.projectService.appendHistory(
      project,
      'Engineering Issue Created',
      {
        engineeringIssueId:
          issue.id,

        engineeringRecordId:
          issue.engineeringRecordId,

        severity:
          issue.severity,

        type:
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
   * Create Multiple Engineering Issues
   * =====================================================
   */

  createIssues(
    projectId,
    inputs = []
  ) {
    if (!Array.isArray(inputs)) {
      throw new Error(
        'Engineering Issue input must be an array'
      );
    }

    const issues = [];

    for (
      const input of inputs
    ) {
      issues.push(
        this.createIssue(
          projectId,
          input
        )
      );
    }

    return issues;
  }

  /*
   * =====================================================
   * Get
   * =====================================================
   */

  getIssue(
    projectId,
    issueId
  ) {
    const project =
      this.projectService.openProject(
        projectId
      );

    return this.repository.getById(
      project,
      issueId
    );
  }

  /*
   * =====================================================
   * List
   * =====================================================
   */

  listIssues(
    projectId
  ) {
    const project =
      this.projectService.openProject(
        projectId
      );

    return this.repository.listByProjectId(
      project
    );
  }

  /*
   * =====================================================
   * List By Engineering Record
   * =====================================================
   */

  listIssuesByEngineeringRecord(
    projectId,
    engineeringRecordId
  ) {
    const project =
      this.projectService.openProject(
        projectId
      );

    return this.repository.listByEngineeringRecordId(
      project,
      engineeringRecordId
    );
  }

  /*
   * =====================================================
   * List By Status
   * =====================================================
   */

  listIssuesByStatus(
    projectId,
    status
  ) {
    if (
      !Object.values(
        ENGINEERING_ISSUE_STATUS
      ).includes(status)
    ) {
      throw new Error(
        'Unsupported Engineering Issue status'
      );
    }

    const project =
      this.projectService.openProject(
        projectId
      );

    return this.repository.listByStatus(
      project,
      status
    );
  }

  /*
   * =====================================================
   * List By Severity
   * =====================================================
   */

  listIssuesBySeverity(
    projectId,
    severity
  ) {
    if (
      !Object.values(
        ENGINEERING_ISSUE_SEVERITY
      ).includes(severity)
    ) {
      throw new Error(
        'Unsupported Engineering Issue severity'
      );
    }

    const project =
      this.projectService.openProject(
        projectId
      );

    return this.repository.listBySeverity(
      project,
      severity
    );
  }

  /*
   * =====================================================
   * Start Review
   * =====================================================
   */

  startReview(
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
      this.repository.getById(
        project,
        issueId
      );

    if (!existing) {
      throw new Error(
        'Engineering Issue not found'
      );
    }

    const reviewed =
      startEngineeringIssueReview(
        existing,
        reviewerId
      );

    this.repository.updateFromRecognitionService(
      project,
      reviewed,
      ENGINEERING_ISSUE_REPOSITORY_AUTHORITY
    );

    project.project.updatedAt =
      reviewed.updatedAt;

    this.projectService.appendHistory(
      project,
      'Engineering Issue Review Started',
      {
        engineeringIssueId:
          reviewed.id,

        reviewerId:
          reviewed.reviewedBy,
      }
    );

    this.projectService.writeProject(
      project
    );

    return reviewed;
  }

  /*
   * =====================================================
   * Confirm Review
   * =====================================================
   *
   * This confirms the review item only.
   *
   * It does NOT confirm the Project.
   */

  confirmReview(
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
      this.repository.getById(
        project,
        issueId
      );

    if (!existing) {
      throw new Error(
        'Engineering Issue not found'
      );
    }

    const confirmed =
      confirmEngineeringIssue(
        existing,
        reviewerId
      );

    this.repository.updateFromRecognitionService(
      project,
      confirmed,
      ENGINEERING_ISSUE_REPOSITORY_AUTHORITY
    );

    project.project.updatedAt =
      confirmed.updatedAt;

    this.projectService.appendHistory(
      project,
      'Engineering Issue Review Confirmed',
      {
        engineeringIssueId:
          confirmed.id,

        reviewerId:
          confirmed.reviewedBy,
      }
    );

    this.projectService.writeProject(
      project
    );

    return confirmed;
  }

  /*
   * =====================================================
   * Dismiss
   * =====================================================
   */

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
      this.repository.getById(
        project,
        issueId
      );

    if (!existing) {
      throw new Error(
        'Engineering Issue not found'
      );
    }

    const dismissed =
      dismissEngineeringIssue(
        existing,
        reviewerId
      );

    this.repository.updateFromRecognitionService(
      project,
      dismissed,
      ENGINEERING_ISSUE_REPOSITORY_AUTHORITY
    );

    project.project.updatedAt =
      dismissed.updatedAt;

    this.projectService.appendHistory(
      project,
      'Engineering Issue Dismissed',
      {
        engineeringIssueId:
          dismissed.id,

        reviewerId:
          dismissed.dismissedBy,
      }
    );

    this.projectService.writeProject(
      project
    );

    return dismissed;
  }

  /*
   * =====================================================
   * Reopen
   * =====================================================
   */

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
      this.repository.getById(
        project,
        issueId
      );

    if (!existing) {
      throw new Error(
        'Engineering Issue not found'
      );
    }

    const reopened =
      reopenEngineeringIssue(
        existing
      );

    this.repository.updateFromRecognitionService(
      project,
      reopened,
      ENGINEERING_ISSUE_REPOSITORY_AUTHORITY
    );

    project.project.updatedAt =
      reopened.updatedAt;

    this.projectService.appendHistory(
      project,
      'Engineering Issue Reopened',
      {
        engineeringIssueId:
          reopened.id,
      }
    );

    this.projectService.writeProject(
      project
    );

    return reopened;
  }

  /*
   * =====================================================
   * Recognition Review Summary
   * =====================================================
   */

  getReviewSummary(
    projectId
  ) {
    const project =
      this.projectService.openProject(
        projectId
      );

    const issues =
      this.repository.listByProjectId(
        project
      );

    const open =
      issues.filter(
        (issue) =>
          issue.status ===
          ENGINEERING_ISSUE_STATUS.OPEN
      );

    const reviewing =
      issues.filter(
        (issue) =>
          issue.status ===
          ENGINEERING_ISSUE_STATUS.REVIEWING
      );

    const confirmed =
      issues.filter(
        (issue) =>
          issue.status ===
          ENGINEERING_ISSUE_STATUS.CONFIRMED
      );

    const dismissed =
      issues.filter(
        (issue) =>
          issue.status ===
          ENGINEERING_ISSUE_STATUS.DISMISSED
      );

    const critical =
      issues.filter(
        (issue) =>
          issue.severity ===
          ENGINEERING_ISSUE_SEVERITY.CRITICAL
      );

    const errors =
      issues.filter(
        (issue) =>
          issue.severity ===
          ENGINEERING_ISSUE_SEVERITY.ERROR
      );

    const warnings =
      issues.filter(
        (issue) =>
          issue.severity ===
          ENGINEERING_ISSUE_SEVERITY.WARNING
      );

    return {
      projectId,

      totalIssues:
        issues.length,

      openIssues:
        open.length,

      reviewingIssues:
        reviewing.length,

      confirmedIssues:
        confirmed.length,

      dismissedIssues:
        dismissed.length,

      criticalIssues:
        critical.length,

      errorIssues:
        errors.length,

      warningIssues:
        warnings.length,

      recognitionStatus:
        project.project.workflowStatus,

      currentDesignerRevisionId:
        project.projectDocuments
          ?.currentDesignerRevisionId ||
        null,
    };
  }
}

module.exports = {
  EngineeringReviewService,
};