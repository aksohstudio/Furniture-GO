const {
  RECOGNITION_STATUS,
  ENGINEERING_ISSUE_STATUS,
} = require('../database/constants');

class ProjectRecognitionService {
  constructor({
    projectService,
    recognitionService,
    engineeringReviewService,
  } = {}) {
    if (
      !projectService ||
      typeof projectService.openProject !== 'function'
    ) {
      throw new Error(
        'ProjectRecognitionService requires ProjectService'
      );
    }

    if (!recognitionService) {
      throw new Error(
        'ProjectRecognitionService requires RecognitionService'
      );
    }

    if (!engineeringReviewService) {
      throw new Error(
        'ProjectRecognitionService requires EngineeringReviewService'
      );
    }

    this.projectService =
      projectService;

    this.recognitionService =
      recognitionService;

    this.engineeringReviewService =
      engineeringReviewService;
  }

  /*
   * =====================================================
   * Start Project Recognition
   * =====================================================
   *
   * This is the application-level entry point for
   * Project Recognition.
   *
   * RecognitionService performs the actual generation of
   * Engineering Records and Engineering Issues.
   *
   * This service coordinates the workflow only.
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

    return this.recognitionService.recognizeProject(
      projectId,
      recognitionInput
    );
  }

  /*
   * =====================================================
   * Recognition Status
   * =====================================================
   */

  getStatus(
    projectId
  ) {
    const project =
      this.projectService.openProject(
        projectId
      );

    return {
      projectId,

      status:
        project.project.workflowStatus,

      currentDesignerRevisionId:
        project.projectDocuments
          ?.currentDesignerRevisionId ||
        null,

      activeRevisionId:
        project.project.activeRevisionId ||
        null,

      activeSnapshotId:
        project.project.activeSnapshotId ||
        null,
    };
  }

  /*
   * =====================================================
   * Recognition Summary
   * =====================================================
   */

  getSummary(
    projectId
  ) {
    return this.recognitionService
      .getRecognitionSummary(
        projectId
      );
  }

  /*
   * =====================================================
   * Engineering Records
   * =====================================================
   */

  listEngineeringRecords(
    projectId
  ) {
    return this.recognitionService
      .listEngineeringRecords(
        projectId
      );
  }

  getEngineeringRecord(
    projectId,
    recordId
  ) {
    return this.recognitionService
      .getEngineeringRecord(
        projectId,
        recordId
      );
  }

  /*
   * =====================================================
   * Engineering Issues
   * =====================================================
   */

  listEngineeringIssues(
    projectId
  ) {
    return this.recognitionService
      .listEngineeringIssues(
        projectId
      );
  }

  getEngineeringIssue(
    projectId,
    issueId
  ) {
    return this.recognitionService
      .getEngineeringIssue(
        projectId,
        issueId
      );
  }

  /*
   * =====================================================
   * Engineering Review List
   * =====================================================
   *
   * These are the currently unresolved recognition
   * issues that require engineering review.
   */

  getReviewList(
    projectId
  ) {
    return this.recognitionService
      .getEngineeringReviewList(
        projectId
      );
  }

  getReviewSummary(
    projectId
  ) {
    return this.engineeringReviewService
      .getReviewSummary(
        projectId
      );
  }

  /*
   * =====================================================
   * Issue Review
   * =====================================================
   */

  startIssueReview(
    projectId,
    issueId,
    reviewerId
  ) {
    return this.engineeringReviewService
      .startReview(
        projectId,
        issueId,
        reviewerId
      );
  }

  confirmIssueReview(
    projectId,
    issueId,
    reviewerId
  ) {
    return this.engineeringReviewService
      .confirmReview(
        projectId,
        issueId,
        reviewerId
      );
  }

  dismissIssue(
    projectId,
    issueId,
    reviewerId
  ) {
    return this.engineeringReviewService
      .dismissIssue(
        projectId,
        issueId,
        reviewerId
      );
  }

  reopenIssue(
    projectId,
    issueId
  ) {
    return this.engineeringReviewService
      .reopenIssue(
        projectId,
        issueId
      );
  }

  /*
   * =====================================================
   * Issues By Engineering Record
   * =====================================================
   */

  listIssuesByEngineeringRecord(
    projectId,
    engineeringRecordId
  ) {
    return this.engineeringReviewService
      .listIssuesByEngineeringRecord(
        projectId,
        engineeringRecordId
      );
  }

  /*
   * =====================================================
   * Project Recognition Readiness
   * =====================================================
   *
   * Recognition is ready for Project Confirmation only
   * when:
   *
   * 1. Engineering Records exist
   * 2. There are no open/reviewing Engineering Issues
   * 3. Recognition has completed
   *
   * This service does NOT perform Project Confirmation.
   */

  getConfirmationReadiness(
    projectId
  ) {
    const project =
      this.projectService.openProject(
        projectId
      );

    const summary =
      this.recognitionService
        .getRecognitionSummary(
          projectId
        );

    const reviewList =
      this.recognitionService
        .getEngineeringReviewList(
          projectId
        );

    const hasRecords =
      summary.totalRecords > 0;

    const hasOpenIssues =
      reviewList.length > 0;

    const recognitionCompleted =
      summary.recognitionStatus ===
      RECOGNITION_STATUS.COMPLETED;

    const ready =
      hasRecords &&
      !hasOpenIssues &&
      recognitionCompleted;

    return {
      projectId,

      ready,

      recognitionStatus:
        summary.recognitionStatus,

      engineeringRecordCount:
        summary.totalRecords,

      engineeringIssueCount:
        summary.totalIssues,

      openEngineeringIssueCount:
        reviewList.length,

      hasRecords,

      hasOpenIssues,

      recognitionCompleted,

      currentDesignerRevisionId:
        project.projectDocuments
          ?.currentDesignerRevisionId ||
        null,

      reason:
        ready
          ? null
          : this.getReadinessReason(
              summary,
              reviewList
            ),
    };
  }

  /*
   * =====================================================
   * Readiness Reason
   * =====================================================
   */

  getReadinessReason(
    summary,
    reviewList
  ) {
    if (
      summary.totalRecords === 0
    ) {
      return (
        'Engineering Records are required before Project Confirmation'
      );
    }

    if (
      reviewList.length > 0
    ) {
      return (
        'Engineering Issues require review before Project Confirmation'
      );
    }

    if (
      summary.recognitionStatus !==
      RECOGNITION_STATUS.COMPLETED
    ) {
      return (
        'Project Recognition has not completed'
      );
    }

    return (
      'Project is not ready for Project Confirmation'
    );
  }

  /*
   * =====================================================
   * Recognition Dashboard
   * =====================================================
   *
   * Provides one read model for the Project Recognition
   * page.
   *
   * No mutation is performed here.
   */

  getDashboard(
    projectId
  ) {
    const project =
      this.projectService.openProject(
        projectId
      );

    const summary =
      this.recognitionService
        .getRecognitionSummary(
          projectId
        );

    const reviewSummary =
      this.engineeringReviewService
        .getReviewSummary(
          projectId
        );

    const reviewList =
      this.recognitionService
        .getEngineeringReviewList(
          projectId
        );

    const readiness =
      this.getConfirmationReadiness(
        projectId
      );

    return {
      projectId,

      project: {
        id:
          project.project.id,

        name:
          project.project.name,

        workflowStatus:
          project.project.workflowStatus,

        archiveStatus:
          project.project.archiveStatus,

        lockStatus:
          project.project.lockStatus,
      },

      recognition: {
        status:
          summary.recognitionStatus,

        currentDesignerRevisionId:
          summary.currentDesignerRevisionId,

        engineeringRecordCount:
          summary.totalRecords,

        engineeringIssueCount:
          summary.totalIssues,
      },

      engineeringRecords: {
        total:
          summary.totalRecords,

        generated:
          summary.generatedRecords,

        confirmed:
          summary.confirmedRecords,

        superseded:
          summary.supersededRecords,
      },

      engineeringIssues: {
        total:
          reviewSummary.totalIssues,

        open:
          reviewSummary.openIssues,

        reviewing:
          reviewSummary.reviewingIssues,

        confirmed:
          reviewSummary.confirmedIssues,

        dismissed:
          reviewSummary.dismissedIssues,

        critical:
          reviewSummary.criticalIssues,

        errors:
          reviewSummary.errorIssues,

        warnings:
          reviewSummary.warningIssues,
      },

      review: {
        required:
          reviewList.length > 0,

        count:
          reviewList.length,

        issueIds:
          reviewList.map(
            (issue) =>
              issue.id
          ),
      },

      confirmation: {
        ready:
          readiness.ready,

        reason:
          readiness.reason,
      },
    };
  }
}

module.exports = {
  ProjectRecognitionService,
};