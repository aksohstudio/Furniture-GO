const ENGINEERING_ISSUE_REPOSITORY_AUTHORITY =
  Symbol('engineering-issue-repository-authority');

class EngineeringIssueRepository {
  /*
   * =====================================================
   * Read
   * =====================================================
   */

  getById(project, issueId) {
    return (
      (project.engineeringIssues || [])
        .find(
          (issue) =>
            issue.id === issueId
        ) ||
      null
    );
  }

  listByProjectId(project) {
    return [
      ...(project.engineeringIssues || []),
    ];
  }

  listByEngineeringRecordId(
    project,
    engineeringRecordId
  ) {
    return (
      project.engineeringIssues || []
    ).filter(
      (issue) =>
        issue.engineeringRecordId ===
        engineeringRecordId
    );
  }

  listByStatus(
    project,
    status
  ) {
    return (
      project.engineeringIssues || []
    ).filter(
      (issue) =>
        issue.status === status
    );
  }

  listBySeverity(
    project,
    severity
  ) {
    return (
      project.engineeringIssues || []
    ).filter(
      (issue) =>
        issue.severity === severity
    );
  }

  /*
   * =====================================================
   * Write — Recognition Service only
   * =====================================================
   */

  saveFromRecognitionService(
    project,
    issue,
    authority
  ) {
    this.assertAuthority(
      authority
    );

    if (
      !Array.isArray(
        project.engineeringIssues
      )
    ) {
      project.engineeringIssues = [];
    }

    const existingIndex =
      project.engineeringIssues.findIndex(
        (item) =>
          item.id === issue.id
      );

    if (
      existingIndex !== -1
    ) {
      throw new Error(
        'Engineering Issue already exists'
      );
    }

    project.engineeringIssues.push(
      issue
    );

    return issue;
  }

  updateFromRecognitionService(
    project,
    issue,
    authority
  ) {
    this.assertAuthority(
      authority
    );

    if (
      !Array.isArray(
        project.engineeringIssues
      )
    ) {
      throw new Error(
        'Project Engineering Issue collection is missing'
      );
    }

    const index =
      project.engineeringIssues.findIndex(
        (item) =>
          item.id === issue.id
      );

    if (
      index === -1
    ) {
      throw new Error(
        'Engineering Issue not found'
      );
    }

    project.engineeringIssues[index] =
      issue;

    return issue;
  }

  removeFromRecognitionService(
    project,
    issueId,
    authority
  ) {
    this.assertAuthority(
      authority
    );

    if (
      !Array.isArray(
        project.engineeringIssues
      )
    ) {
      return null;
    }

    const index =
      project.engineeringIssues.findIndex(
        (item) =>
          item.id === issueId
      );

    if (
      index === -1
    ) {
      return null;
    }

    const [
      removed,
    ] =
      project.engineeringIssues.splice(
        index,
        1
      );

    return removed;
  }

  /*
   * =====================================================
   * Internal Authority Check
   * =====================================================
   */

  assertAuthority(
    authority
  ) {
    if (
      authority !==
      ENGINEERING_ISSUE_REPOSITORY_AUTHORITY
    ) {
      throw new Error(
        'Engineering Issues may only be written by Recognition Service'
      );
    }
  }
}

module.exports = {
  EngineeringIssueRepository,
  ENGINEERING_ISSUE_REPOSITORY_AUTHORITY,
};