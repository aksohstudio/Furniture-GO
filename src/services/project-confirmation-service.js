const {
  ENGINEERING_ISSUE_STATUS,
  WORKFLOW_STATUS,
  REVISION_STATUS,
} = require('../database/constants');

class ProjectConfirmationService {
  constructor(projectService) {
    if (
      !projectService ||
      typeof projectService.openProject !==
        'function'
    ) {
      throw new Error(
        'ProjectConfirmationService requires ProjectService'
      );
    }

    if (
      typeof projectService
        .persistConfirmedRevision !==
        'function'
    ) {
      throw new Error(
        'ProjectConfirmationService requires confirmed revision support'
      );
    }

    if (
      !projectService.data ||
      !projectService.data.engineeringRecords
    ) {
      throw new Error(
        'ProjectConfirmationService requires EngineeringRecordRepository'
      );
    }

    if (
      !projectService.data ||
      !projectService.data.engineeringIssues
    ) {
      throw new Error(
        'ProjectConfirmationService requires EngineeringIssueRepository'
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
   * Validation
   * =====================================================
   *
   * Project Confirmation is allowed only when:
   *
   * 1. Project is writable.
   * 2. Project is active.
   * 3. A current Designer Revision exists.
   * 4. At least one Engineering Record exists.
   * 5. No Engineering Issue remains OPEN.
   * 6. No Engineering Issue remains REVIEWING.
   *
   * Confirmed and dismissed Engineering Issues remain
   * part of the permanent project history.
   */

  validateConfirmationReadiness(
    projectId
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

    const currentDesignerRevisionId =
      project.projectDocuments
        ?.currentDesignerRevisionId ||
      null;

    if (!currentDesignerRevisionId) {
      throw new Error(
        'A current Designer PDF revision is required before Project Confirmation'
      );
    }

    const records =
      this.recordRepository
        .listByProjectId(
          project
        );

    if (!records.length) {
      throw new Error(
        'At least one Engineering Record is required before Project Confirmation'
      );
    }

    const issues =
      this.issueRepository
        .listByProjectId(
          project
        );

    const openIssues =
      issues.filter(
        (issue) =>
          issue.status ===
          ENGINEERING_ISSUE_STATUS.OPEN
      );

    const reviewingIssues =
      issues.filter(
        (issue) =>
          issue.status ===
          ENGINEERING_ISSUE_STATUS.REVIEWING
      );

    if (openIssues.length) {
      throw new Error(
        `Project has ${openIssues.length} open Engineering Issue(s) that must be reviewed before Project Confirmation`
      );
    }

    if (reviewingIssues.length) {
      throw new Error(
        `Project has ${reviewingIssues.length} Engineering Issue(s) still under review`
      );
    }

    return {
      ready: true,

      projectId,

      currentDesignerRevisionId,

      engineeringRecordCount:
        records.length,

      engineeringIssueCount:
        issues.length,

      confirmedIssueCount:
        issues.filter(
          (issue) =>
            issue.status ===
            ENGINEERING_ISSUE_STATUS.CONFIRMED
        ).length,

      dismissedIssueCount:
        issues.filter(
          (issue) =>
            issue.status ===
            ENGINEERING_ISSUE_STATUS.DISMISSED
        ).length,
    };
  }

  /*
   * =====================================================
   * Confirm Project
   * =====================================================
   *
   * Creates the immutable confirmed Project Revision
   * and Snapshot from the current Working State.
   *
   * Project Confirmation is separate from Engineering
   * Issue review confirmation.
   */

  confirmProject(
    projectId,
    confirmedBy = null
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

    const readiness =
      this.validateConfirmationReadiness(
        projectId
      );

    const snapshotData =
      this.buildConfirmationSnapshot(
        project
      );

    const result =
      this.projectService
        .persistConfirmedRevision(
          projectId,
          snapshotData
        );

    /*
     * persistConfirmedRevision changes the Project
     * workflow to Confirmed and stores the immutable
     * revision/snapshot.
     *
     * Reload the Project so the returned state reflects
     * the persisted confirmation.
     */

    const confirmedProject =
      this.projectService.openProject(
        projectId
      );

    /*
     * Confirmation identity is recorded in history.
     */

    const historyEntry =
      this.projectService.appendHistory(
        confirmedProject,
        'Project Confirmed',
        {
          revisionId:
            result.revision.id,

          snapshotId:
            result.snapshot.id,

          confirmedBy:
            confirmedBy || null,

          currentDesignerRevisionId:
            readiness.currentDesignerRevisionId,
        }
      );

    confirmedProject.project.workflowStatus =
      WORKFLOW_STATUS.CONFIRMED;

    confirmedProject.project.updatedAt =
      historyEntry.createdAt;

    this.projectService.writeProject(
      confirmedProject
    );

    return {
      projectId,

      status:
        WORKFLOW_STATUS.CONFIRMED,

      revision:
        result.revision,

      snapshot:
        result.snapshot,

      confirmedBy:
        confirmedBy || null,

      currentDesignerRevisionId:
        readiness.currentDesignerRevisionId,
    };
  }

  /*
   * =====================================================
   * Build Confirmation Snapshot
   * =====================================================
   *
   * The snapshot contains the current engineering
   * working state and the recognition output needed to
   * reproduce the confirmed project state.
   *
   * The stored Project Snapshot itself is made immutable
   * by ProjectService.
   */

  buildConfirmationSnapshot(
    project
  ) {
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

    return {
      project: {
        id:
          project.project.id,

        name:
          project.project.name,

        ownerId:
          project.project.ownerId,

        factoryId:
          project.project.factoryId,
      },

      currentDesignerRevisionId:
        project.projectDocuments
          ?.currentDesignerRevisionId ||
        null,

      workingState:
        JSON.parse(
          JSON.stringify(
            project.workingState ||
              {}
          )
        ),

      hierarchy:
        JSON.parse(
          JSON.stringify(
            project.hierarchy || {
              floors: [],
            }
          )
        ),

      furnitureObjects:
        JSON.parse(
          JSON.stringify(
            project.furnitureObjects ||
              []
          )
        ),

      engineeringRecords:
        JSON.parse(
          JSON.stringify(
            records
          )
        ),

      engineeringIssues:
        JSON.parse(
          JSON.stringify(
            issues
          )
        ),

      source:
        'Project Confirmation',
    };
  }

  /*
   * =====================================================
   * Readiness Check
   * =====================================================
   */

  isReadyForConfirmation(
    projectId
  ) {
    try {
      return this.validateConfirmationReadiness(
        projectId
      );
    } catch (error) {
      return {
        ready: false,

        projectId,

        reason:
          error.message,
      };
    }
  }

  /*
   * =====================================================
   * Current Confirmed Revision
   * =====================================================
   */

  getCurrentConfirmedRevision(
    projectId
  ) {
    const project =
      this.projectService.openProject(
        projectId
      );

    const activeRevisionId =
      project.project
        .activeRevisionId;

    if (!activeRevisionId) {
      return null;
    }

    return (
      project.revisions || []
    ).find(
      (revision) =>
        revision.id ===
        activeRevisionId
    ) || null;
  }

  /*
   * =====================================================
   * Current Confirmed Snapshot
   * =====================================================
   */

  getCurrentConfirmedSnapshot(
    projectId
  ) {
    const project =
      this.projectService.openProject(
        projectId
      );

    const activeSnapshotId =
      project.project
        .activeSnapshotId;

    if (!activeSnapshotId) {
      return null;
    }

    return (
      project.snapshots || []
    ).find(
      (snapshot) =>
        snapshot.id ===
        activeSnapshotId
    ) || null;
  }

  /*
   * =====================================================
   * Confirmation Summary
   * =====================================================
   */

  getConfirmationSummary(
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

    const openIssues =
      issues.filter(
        (issue) =>
          issue.status ===
            ENGINEERING_ISSUE_STATUS.OPEN ||
          issue.status ===
            ENGINEERING_ISSUE_STATUS.REVIEWING
      );

    const confirmedRevision =
      this.getCurrentConfirmedRevision(
        projectId
      );

    const confirmedSnapshot =
      this.getCurrentConfirmedSnapshot(
        projectId
      );

    return {
      projectId,

      workflowStatus:
        project.project
          .workflowStatus,

      isConfirmed:
        project.project
          .workflowStatus ===
        WORKFLOW_STATUS.CONFIRMED,

      currentDesignerRevisionId:
        project.projectDocuments
          ?.currentDesignerRevisionId ||
        null,

      activeRevisionId:
        project.project
          .activeRevisionId ||
        null,

      activeSnapshotId:
        project.project
          .activeSnapshotId ||
        null,

      engineeringRecordCount:
        records.length,

      engineeringIssueCount:
        issues.length,

      unresolvedIssueCount:
        openIssues.length,

      readyForConfirmation:
        openIssues.length === 0 &&
        records.length > 0 &&
        Boolean(
          project.projectDocuments
            ?.currentDesignerRevisionId
        ),

      confirmedRevision:
        confirmedRevision
          ? {
              id:
                confirmedRevision.id,

              status:
                confirmedRevision.status,

              createdAt:
                confirmedRevision.createdAt,
            }
          : null,

      confirmedSnapshot:
        confirmedSnapshot
          ? {
              id:
                confirmedSnapshot.id,

              revisionId:
                confirmedSnapshot.revisionId,

              createdAt:
                confirmedSnapshot.createdAt,
            }
          : null,
    };
  }
}

module.exports = {
  ProjectConfirmationService,
};