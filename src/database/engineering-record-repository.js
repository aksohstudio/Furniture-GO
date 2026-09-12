const ENGINEERING_RECORD_REPOSITORY_AUTHORITY =
  Symbol('engineering-record-repository-authority');

class EngineeringRecordRepository {
  getById(project, recordId) {
    return (
      (project.engineeringRecords || [])
        .find((record) => record.id === recordId) ||
      null
    );
  }

  listByProjectId(project) {
    return [
      ...(project.engineeringRecords || []),
    ];
  }

  saveFromRecognitionService(
    project,
    record,
    authority
  ) {
    if (
      authority !==
      ENGINEERING_RECORD_REPOSITORY_AUTHORITY
    ) {
      throw new Error(
        'Engineering Records may only be written by Recognition Service'
      );
    }

    if (
      !Array.isArray(
        project.engineeringRecords
      )
    ) {
      project.engineeringRecords = [];
    }

    const existingIndex =
      project.engineeringRecords.findIndex(
        (item) =>
          item.id === record.id
      );

    if (existingIndex !== -1) {
      throw new Error(
        'Engineering Record already exists'
      );
    }

    project.engineeringRecords.push(
      record
    );

    return record;
  }

  updateFromRecognitionService(
    project,
    record,
    authority
  ) {
    if (
      authority !==
      ENGINEERING_RECORD_REPOSITORY_AUTHORITY
    ) {
      throw new Error(
        'Engineering Records may only be written by Recognition Service'
      );
    }

    if (
      !Array.isArray(
        project.engineeringRecords
      )
    ) {
      throw new Error(
        'Project Engineering Record collection is missing'
      );
    }

    const index =
      project.engineeringRecords.findIndex(
        (item) =>
          item.id === record.id
      );

    if (index === -1) {
      throw new Error(
        'Engineering Record not found'
      );
    }

    project.engineeringRecords[index] =
      record;

    return record;
  }

  removeFromRecognitionService(
    project,
    recordId,
    authority
  ) {
    if (
      authority !==
      ENGINEERING_RECORD_REPOSITORY_AUTHORITY
    ) {
      throw new Error(
        'Engineering Records may only be written by Recognition Service'
      );
    }

    if (
      !Array.isArray(
        project.engineeringRecords
      )
    ) {
      return null;
    }

    const index =
      project.engineeringRecords.findIndex(
        (item) =>
          item.id === recordId
      );

    if (index === -1) {
      return null;
    }

    const [
      removed,
    ] =
      project.engineeringRecords.splice(
        index,
        1
      );

    return removed;
  }
}

module.exports = {
  EngineeringRecordRepository,
  ENGINEERING_RECORD_REPOSITORY_AUTHORITY,
};