const {
  validateEngineeringRecord,
} = require('../modules/engineering-record');

function error(
  code,
  message,
  details = {}
) {
  return {
    code,
    message,
    ...details,
  };
}

function findEntity(
  project,
  id
) {
  const visit = (node) => {
    if (node.id === id) {
      return node;
    }

    for (
      const child of
      node.children || []
    ) {
      const found =
        visit(child);

      if (found) {
        return found;
      }
    }

    return null;
  };

  for (
    const floor of
    project.hierarchy?.floors || []
  ) {
    const found =
      visit(floor);

    if (found) {
      return found;
    }
  }

  return null;
}

class ProjectReferenceValidator {
  constructor({
    officialCatalog,
    factoryReferences,
  }) {
    this.officialCatalog =
      officialCatalog;

    this.factoryReferences =
      factoryReferences;
  }

  /*
   * =====================================================
   * Engineering Record
   * =====================================================
   *
   * Engineering Records are recognition output.
   *
   * They are validated here for project traceability
   * and hierarchy references.
   *
   * They must not contain production decisions.
   */

  validateEngineeringRecord(
    project,
    record,
    ids = new Set()
  ) {
    const errors = [];

    if (
      !record ||
      typeof record !== 'object'
    ) {
      return [
        error(
          'ENGINEERING_RECORD_INVALID',
          'Engineering Record must be an object'
        ),
      ];
    }

    /*
     * Core Engineering Record validation.
     */

    errors.push(
      ...validateEngineeringRecord(
        record
      )
    );

    /*
     * Duplicate ID protection.
     */

    if (
      typeof record.id === 'string' &&
      record.id
    ) {
      if (
        ids.has(record.id)
      ) {
        errors.push(
          error(
            'ENGINEERING_RECORD_ID_DUPLICATE',
            `Duplicate Engineering Record ID ${record.id}`,
            {
              engineeringRecordId:
                record.id,
            }
          )
        );
      }

      ids.add(
        record.id
      );
    }

    /*
     * Project traceability.
     */

    if (
      record.projectId !==
      project.project.id
    ) {
      errors.push(
        error(
          'ENGINEERING_RECORD_PROJECT_REFERENCE_INVALID',
          'Engineering Record Project reference is invalid',
          {
            engineeringRecordId:
              record.id,
          }
        )
      );
    }

    /*
     * Floor reference.
     *
     * A record may temporarily exist without a floor
     * while recognition is incomplete.
     *
     * Therefore null is allowed.
     */

    if (
      record.floorId !== null &&
      record.floorId !== undefined
    ) {
      const floor =
        findEntity(
          project,
          record.floorId
        );

      if (
        !floor ||
        floor.type !== 'Floor'
      ) {
        errors.push(
          error(
            'ENGINEERING_RECORD_FLOOR_REFERENCE_INVALID',
            'Engineering Record Floor reference is invalid',
            {
              engineeringRecordId:
                record.id,
            }
          )
        );
      }
    }

    /*
     * Room reference.
     *
     * If a room is provided, it must be an actual Room
     * belonging to the referenced Floor when a Floor
     * reference exists.
     */

    if (
      record.roomId !== null &&
      record.roomId !== undefined
    ) {
      const room =
        findEntity(
          project,
          record.roomId
        );

      if (
        !room ||
        room.type !== 'Room'
      ) {
        errors.push(
          error(
            'ENGINEERING_RECORD_ROOM_REFERENCE_INVALID',
            'Engineering Record Room reference is invalid',
            {
              engineeringRecordId:
                record.id,
            }
          )
        );
      } else if (
        record.floorId &&
        room.parentId !==
          record.floorId
      ) {
        errors.push(
          error(
            'ENGINEERING_RECORD_ROOM_FLOOR_REFERENCE_INVALID',
            'Engineering Record Room does not belong to the referenced Floor',
            {
              engineeringRecordId:
                record.id,
            }
          )
        );
      }
    }

    /*
     * Furniture candidate reference.
     *
     * furnitureCandidateId is intentionally not required.
     *
     * Recognition may generate a record before the system
     * can confidently correlate it to a Furniture candidate.
     */

    if (
      record.furnitureCandidateId !==
        null &&
      record.furnitureCandidateId !==
        undefined
    ) {
      const candidate =
        findEntity(
          project,
          record.furnitureCandidateId
        );

      if (
        !candidate ||
        candidate.type !==
          'Furniture'
      ) {
        errors.push(
          error(
            'ENGINEERING_RECORD_FURNITURE_REFERENCE_INVALID',
            'Engineering Record Furniture candidate reference is invalid',
            {
              engineeringRecordId:
                record.id,
            }
          )
        );
      }
    }

    return errors;
  }

  /*
   * =====================================================
   * Furniture Object
   * =====================================================
   */

  validateFurnitureObject(
    project,
    object,
    ids = new Set()
  ) {
    const errors = [];

    if (
      !object ||
      typeof object !== 'object'
    ) {
      return [
        error(
          'FURNITURE_OBJECT_INVALID',
          'Furniture Object must be an object'
        ),
      ];
    }

    if (
      typeof object.id !== 'string' ||
      !object.id
    ) {
      errors.push(
        error(
          'FURNITURE_OBJECT_ID_REQUIRED',
          'Furniture Object ID is required'
        )
      );
    } else if (
      ids.has(object.id)
    ) {
      errors.push(
        error(
          'FURNITURE_OBJECT_ID_DUPLICATE',
          `Duplicate Furniture Object ID ${object.id}`,
          {
            objectId:
              object.id,
          }
        )
      );
    }

    ids.add(
      object.id
    );

    if (
      object.projectId !==
      project.project.id
    ) {
      errors.push(
        error(
          'PROJECT_TRACEABILITY_INVALID',
          'Furniture Object Project reference is invalid',
          {
            objectId:
              object.id,
          }
        )
      );
    }

    const floor =
      findEntity(
        project,
        object.floorId
      );

    const room =
      findEntity(
        project,
        object.roomId
      );

    if (
      !floor ||
      floor.type !== 'Floor'
    ) {
      errors.push(
        error(
          'FLOOR_REFERENCE_INVALID',
          'Furniture Object Floor reference is invalid',
          {
            objectId:
              object.id,
          }
        )
      );
    }

    if (
      !room ||
      room.type !== 'Room' ||
      room.parentId !==
        object.floorId
    ) {
      errors.push(
        error(
          'ROOM_REFERENCE_INVALID',
          'Furniture Object Room reference is invalid',
          {
            objectId:
              object.id,
          }
        )
      );
    }

    if (
      typeof object.engineeringRecordId !==
        'string' ||
      !object.engineeringRecordId
    ) {
      errors.push(
        error(
          'ENGINEERING_RECORD_REFERENCE_INVALID',
          'Furniture Object Engineering Record reference is required',
          {
            objectId:
              object.id,
          }
        )
      );
    } else {
      /*
       * Furniture Objects must point to an existing
       * Engineering Record.
       */

      const engineeringRecord =
        (
          project.engineeringRecords ||
          []
        ).find(
          (record) =>
            record.id ===
            object.engineeringRecordId
        );

      if (
        !engineeringRecord
      ) {
        errors.push(
          error(
            'ENGINEERING_RECORD_NOT_FOUND',
            'Furniture Object Engineering Record does not exist',
            {
              objectId:
                object.id,
              engineeringRecordId:
                object.engineeringRecordId,
            }
          )
        );
      }
    }

    if (
      object.factoryReferenceId
    ) {
      const reference =
        this.factoryReferences
          .getByEngineeringRecordId(
            object.engineeringRecordId
          );

      if (
        !reference ||
        reference.id !==
          object.factoryReferenceId
      ) {
        errors.push(
          error(
            'FACTORY_REFERENCE_INVALID',
            'Furniture Object Factory Reference is invalid',
            {
              objectId:
                object.id,
            }
          )
        );
      }
    }

    if (
      !Array.isArray(
        object.materialIds
      ) ||
      !object.materialIds.every(
        (id) =>
          this.officialCatalog
            .getMaterialById(id)
      )
    ) {
      errors.push(
        error(
          'MATERIAL_REFERENCE_INVALID',
          'Furniture Object contains an unknown Material ID',
          {
            objectId:
              object.id,
          }
        )
      );
    }

    if (
      !Array.isArray(
        object.hardwareIds
      ) ||
      !object.hardwareIds.every(
        (id) =>
          this.officialCatalog
            .getHardwareById(id)
      )
    ) {
      errors.push(
        error(
          'HARDWARE_REFERENCE_INVALID',
          'Furniture Object contains an unknown Hardware ID',
          {
            objectId:
              object.id,
          }
        )
      );
    }

    if (
      typeof object.productionStatus !==
        'string' ||
      !object.productionStatus
    ) {
      errors.push(
        error(
          'PRODUCTION_STATUS_INVALID',
          'Furniture Object productionStatus is required',
          {
            objectId:
              object.id,
          }
        )
      );
    }

    if (
      !object.validation ||
      typeof object.validation
        .isValid !==
        'boolean' ||
      !Array.isArray(
        object.validation.errors
      )
    ) {
      errors.push(
        error(
          'VALIDATION_RESULT_INVALID',
          'Furniture Object validation result is required',
          {
            objectId:
              object.id,
          }
        )
      );
    }

    return errors;
  }

  /*
   * =====================================================
   * Project
   * =====================================================
   */

  validateProject(
    project
  ) {
    const errors = [];

    if (
      !project ||
      project.schemaVersion ==
        null ||
      project.migrationVersion ==
        null
    ) {
      return [
        error(
          'SCHEMA_VERSION_INVALID',
          'Project schema or migration version is missing'
        ),
      ];
    }

    if (
      !project.project?.id
    ) {
      errors.push(
        error(
          'PROJECT_ID_INVALID',
          'Project ID is required'
        )
      );
    }

    if (
      !Array.isArray(
        project.hierarchy?.floors
      )
    ) {
      errors.push(
        error(
          'HIERARCHY_INVALID',
          'Project hierarchy floors are required'
        )
      );
    }

    if (
      !project.workingState ||
      typeof project.workingState !==
        'object'
    ) {
      errors.push(
        error(
          'WORKING_STATE_INVALID',
          'Project Working State is required'
        )
      );
    }

    [
      'history',
      'revisions',
      'snapshots',
      'backupHistory',
    ].forEach(
      (field) => {
        if (
          !Array.isArray(
            project[field]
          )
        ) {
          errors.push(
            error(
              'PROJECT_COLLECTION_INVALID',
              `Project ${field} collection is required`,
              {
                field,
              }
            )
          );
        }
      }
    );

    /*
     * ===================================================
     * Engineering Records
     * ===================================================
     */

    if (
      !Array.isArray(
        project.engineeringRecords
      )
    ) {
      errors.push(
        error(
          'ENGINEERING_RECORD_COLLECTION_INVALID',
          'Project Engineering Records collection is required'
        )
      );
    } else {
      const engineeringRecordIds =
        new Set();

      for (
        const record of
        project.engineeringRecords
      ) {
        errors.push(
          ...this.validateEngineeringRecord(
            project,
            record,
            engineeringRecordIds
          )
        );
      }
    }

    /*
     * ===================================================
     * Confirmed Revisions
     * ===================================================
     */

    const revisionIds =
      new Set();

    for (
      const revision of
      project.revisions || []
    ) {
      if (
        !revision?.id ||
        revisionIds.has(
          revision.id
        )
      ) {
        errors.push(
          error(
            'REVISION_INVALID',
            'Revision ID is missing or duplicated'
          )
        );
      }

      revisionIds.add(
        revision?.id
      );
    }

    /*
     * ===================================================
     * Snapshots
     * ===================================================
     */

    const snapshotIds =
      new Set();

    for (
      const snapshot of
      project.snapshots || []
    ) {
      if (
        !snapshot?.id ||
        snapshotIds.has(
          snapshot.id
        ) ||
        !revisionIds.has(
          snapshot.revisionId
        )
      ) {
        errors.push(
          error(
            'SNAPSHOT_INVALID',
            'Snapshot ID or Revision reference is invalid'
          )
        );
      }

      snapshotIds.add(
        snapshot?.id
      );
    }

    /*
     * Active Revision
     */

    if (
      project.project
        .activeRevisionId &&
      !revisionIds.has(
        project.project
          .activeRevisionId
      )
    ) {
      errors.push(
        error(
          'ACTIVE_REVISION_INVALID',
          'Active Revision reference is invalid'
        )
      );
    }

    /*
     * Active Snapshot
     */

    if (
      project.project
        .activeSnapshotId &&
      !snapshotIds.has(
        project.project
          .activeSnapshotId
      )
    ) {
      errors.push(
        error(
          'ACTIVE_SNAPSHOT_INVALID',
          'Active Snapshot reference is invalid'
        )
      );
    }

    /*
     * ===================================================
     * Furniture Objects
     * ===================================================
     */

    const furnitureObjectIds =
      new Set();

    for (
      const object of
      project.furnitureObjects ||
      []
    ) {
      errors.push(
        ...this.validateFurnitureObject(
          project,
          object,
          furnitureObjectIds
        )
      );
    }

    return errors;
  }
}

module.exports = {
  ProjectReferenceValidator,
  findEntity,
};