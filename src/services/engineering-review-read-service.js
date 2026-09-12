const {
  ENGINEERING_ISSUE_STATUS,
  ENGINEERING_ISSUE_SEVERITY,
} = require('../database/constants');

const { canPerform } = require('./access-policy');

function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

function deepFreeze(value) {
  if (
    value &&
    typeof value === 'object' &&
    !Object.isFrozen(value)
  ) {
    Object.freeze(value);

    Object.values(value).forEach(
      deepFreeze
    );
  }

  return value;
}

function readOnly(value) {
  return deepFreeze(
    clone(value)
  );
}

class EngineeringReviewReadService {
  constructor(projectService) {
    if (
      !projectService ||
      typeof projectService.openProject !==
        'function'
    ) {
      throw new Error(
        'EngineeringReviewReadService requires ProjectService'
      );
    }

    if (
      !projectService.data ||
      !projectService.data.engineeringIssues
    ) {
      throw new Error(
        'EngineeringReviewReadService requires EngineeringIssueRepository'
      );
    }

    this.projectService =
      projectService;

    this.repository =
      projectService.data
        .engineeringIssues;
  }

  /*
   * =====================================================
   * Read Access
   * =====================================================
   *
   * This service is strictly read-only.
   *
   * It never:
   *
   * - creates issues
   * - updates issues
   * - confirms issues
   * - dismisses issues
   * - reopens issues
   * - changes Project state
   */

  openReadOnly(
    projectId,
    accountRole
  ) {
    const project =
      this.projectService.openProject(
        projectId
      );

    if (
      !canPerform(
        'open',
        {
          accountRole,

          archiveStatus:
            project.project
              .archiveStatus,

          lockStatus:
            project.project
              .lockStatus,
        }
      )
    ) {
      throw new Error(
        'Account role cannot perform open'
      );
    }

    return project;
  }

  /*
   * =====================================================
   * Get Issue
   * =====================================================
   */

  getIssue(
    projectId,
    issueId,
    accountRole
  ) {
    const project =
      this.openReadOnly(
        projectId,
        accountRole
      );

    const issue =
      this.repository.getById(
        project,
        issueId
      );

    if (!issue) {
      throw new Error(
        'Engineering Issue not found'
      );
    }

    return readOnly(
      issue
    );
  }

  /*
   * =====================================================
   * List Issues
   * =====================================================
   */

  listIssues(
    projectId,
    accountRole
  ) {
    const project =
      this.openReadOnly(
        projectId,
        accountRole
      );

    return readOnly(
      this.repository.listByProjectId(
        project
      )
    );
  }

  /*
   * =====================================================
   * List By Engineering Record
   * =====================================================
   */

  listIssuesByEngineeringRecord(
    projectId,
    engineeringRecordId,
    accountRole
  ) {
    const project =
      this.openReadOnly(
        projectId,
        accountRole
      );

    return readOnly(
      this.repository
        .listByEngineeringRecordId(
          project,
          engineeringRecordId
        )
    );
  }

  /*
   * =====================================================
   * List By Status
   * =====================================================
   */

  listIssuesByStatus(
    projectId,
    status,
    accountRole
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
      this.openReadOnly(
        projectId,
        accountRole
      );

    return readOnly(
      this.repository.listByStatus(
        project,
        status
      )
    );
  }

  /*
   * =====================================================
   * List By Severity
   * =====================================================
   */

  listIssuesBySeverity(
    projectId,
    severity,
    accountRole
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
      this.openReadOnly(
        projectId,
        accountRole
      );

    return readOnly(
      this.repository.listBySeverity(
        project,
        severity
      )
    );
  }

  /*
   * =====================================================
   * Current Review List
   * =====================================================
   *
   * Open and Reviewing issues are the active review work.
   */

  getReviewList(
    projectId,
    accountRole
  ) {
    const issues =
      this.listIssues(
        projectId,
        accountRole
      );

    return readOnly(
      issues.filter(
        (issue) =>
          issue.status ===
            ENGINEERING_ISSUE_STATUS.OPEN ||
          issue.status ===
            ENGINEERING_ISSUE_STATUS.REVIEWING
      )
    );
  }

  /*
   * =====================================================
   * Review Summary
   * =====================================================
   */

  getReviewSummary(
    projectId,
    accountRole
  ) {
    const project =
      this.openReadOnly(
        projectId,
        accountRole
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

    const info =
      issues.filter(
        (issue) =>
          issue.severity ===
          ENGINEERING_ISSUE_SEVERITY.INFO
      );

    return readOnly({
      projectId,

      recognitionStatus:
        project.project
          .workflowStatus,

      currentDesignerRevisionId:
        project.projectDocuments
          ?.currentDesignerRevisionId ||
        null,

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

      infoIssues:
        info.length,

      reviewRequired:
        open.length +
          reviewing.length >
        0,

      readyForProjectConfirmation:
        open.length === 0 &&
        reviewing.length === 0,
    });
  }
}

module.exports = {
  EngineeringReviewReadService,
};