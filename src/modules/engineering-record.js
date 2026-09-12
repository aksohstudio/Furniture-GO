const ENGINEERING_RECORD_STATUS = Object.freeze({
  GENERATED: 'Generated',
  CONFIRMED: 'Confirmed',
  SUPERSEDED: 'Superseded',
});

const ENGINEERING_RECORD_VERSION = 1;

function now() {
  return new Date().toISOString();
}

function createId(prefix = 'er') {
  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeArray(value) {
  return Array.isArray(value)
    ? [...value]
    : [];
}

function normalizeObject(value) {
  return value &&
    typeof value === 'object' &&
    !Array.isArray(value)
    ? { ...value }
    : {};
}

/*
 * =====================================================
 * Engineering Record
 * =====================================================
 *
 * PRD 09 — Project Recognition and Analysis Engine
 *
 * Engineering Record is the structured recognition output
 * of the Project Recognition Engine.
 *
 * It contains recognition information only.
 *
 * It must NOT contain:
 *
 * - production calculations
 * - manufacturing methods
 * - Furniture Object production data
 * - cutting results
 * - board generation results
 *
 * Those belong to downstream systems.
 */

function createEngineeringRecord({
  id = null,
  projectId,
  floorId = null,
  roomId = null,
  furnitureCandidateId = null,

  geometry = {},
  dimensions = [],
  features = [],

  materialReferences = [],
  hardwareReferences = [],

  designerNotes = [],
  recognitionConfidence = null,
  relatedDrawings = [],

  recognitionSource = null,
  recognitionMetadata = {},
} = {}) {
  if (
    typeof projectId !== 'string' ||
    !projectId.trim()
  ) {
    throw new Error(
      'Engineering Record requires a projectId'
    );
  }

  const timestamp = now();

  return {
    id: id || createId(),

    version:
      ENGINEERING_RECORD_VERSION,

    projectId:
      projectId.trim(),

    floorId,

    roomId,

    furnitureCandidateId,

    status:
      ENGINEERING_RECORD_STATUS.GENERATED,

    geometry:
      normalizeObject(geometry),

    dimensions:
      normalizeArray(dimensions),

    features:
      normalizeArray(features),

    materialReferences:
      normalizeArray(
        materialReferences
      ),

    hardwareReferences:
      normalizeArray(
        hardwareReferences
      ),

    designerNotes:
      normalizeArray(
        designerNotes
      ),

    recognitionConfidence,

    relatedDrawings:
      normalizeArray(
        relatedDrawings
      ),

    recognitionSource,

    recognitionMetadata:
      normalizeObject(
        recognitionMetadata
      ),

    generatedAt:
      timestamp,

    updatedAt:
      timestamp,

    confirmedAt:
      null,

    confirmedBy:
      null,

    supersededAt:
      null,
  };
}

/*
 * =====================================================
 * Validation
 * =====================================================
 */

function validateEngineeringRecord(
  record
) {
  const errors = [];

  if (
    !record ||
    typeof record !== 'object'
  ) {
    return [
      {
        code:
          'ENGINEERING_RECORD_INVALID',
        message:
          'Engineering Record must be an object',
      },
    ];
  }

  if (
    typeof record.id !== 'string' ||
    !record.id
  ) {
    errors.push({
      code:
        'ENGINEERING_RECORD_ID_REQUIRED',
      message:
        'Engineering Record ID is required',
    });
  }

  if (
    typeof record.projectId !== 'string' ||
    !record.projectId
  ) {
    errors.push({
      code:
        'ENGINEERING_RECORD_PROJECT_REQUIRED',
      message:
        'Engineering Record projectId is required',
    });
  }

  if (
    !Object.values(
      ENGINEERING_RECORD_STATUS
    ).includes(record.status)
  ) {
    errors.push({
      code:
        'ENGINEERING_RECORD_STATUS_INVALID',
      message:
        'Engineering Record status is invalid',
    });
  }

  if (
    typeof record.version !== 'number'
  ) {
    errors.push({
      code:
        'ENGINEERING_RECORD_VERSION_INVALID',
      message:
        'Engineering Record version is required',
    });
  }

  if (
    !record.geometry ||
    typeof record.geometry !== 'object' ||
    Array.isArray(record.geometry)
  ) {
    errors.push({
      code:
        'ENGINEERING_RECORD_GEOMETRY_INVALID',
      message:
        'Engineering Record geometry must be an object',
    });
  }

  const arrayFields = [
    'dimensions',
    'features',
    'materialReferences',
    'hardwareReferences',
    'designerNotes',
    'relatedDrawings',
  ];

  for (
    const field of arrayFields
  ) {
    if (!Array.isArray(record[field])) {
      errors.push({
        code:
          'ENGINEERING_RECORD_COLLECTION_INVALID',
        message:
          `Engineering Record ${field} must be an array`,
        field,
      });
    }
  }

  if (
    record.recognitionConfidence !== null &&
    (
      typeof record.recognitionConfidence !==
        'number' ||
      record.recognitionConfidence < 0 ||
      record.recognitionConfidence > 1
    )
  ) {
    errors.push({
      code:
        'RECOGNITION_CONFIDENCE_INVALID',
      message:
        'Recognition confidence must be null or a number between 0 and 1',
    });
  }

  if (
    typeof record.generatedAt !== 'string' ||
    !record.generatedAt
  ) {
    errors.push({
      code:
        'ENGINEERING_RECORD_GENERATED_AT_INVALID',
      message:
        'Engineering Record generatedAt is required',
    });
  }

  return errors;
}

/*
 * =====================================================
 * Confirmation
 * =====================================================
 *
 * Confirmation belongs to the Project Confirmation
 * workflow.
 *
 * This helper only changes the Engineering Record state.
 * It does not perform Project Confirmation itself.
 */

function confirmEngineeringRecord(
  record,
  confirmedBy
) {
  const copy = clone(record);

  const errors =
    validateEngineeringRecord(
      copy
    );

  if (errors.length) {
    throw new Error(
      `Engineering Record validation failed: ${errors
        .map((item) => item.code)
        .join(', ')}`
    );
  }

  if (
    copy.status ===
    ENGINEERING_RECORD_STATUS.SUPERSEDED
  ) {
    throw new Error(
      'Superseded Engineering Records cannot be confirmed'
    );
  }

  if (
    typeof confirmedBy !== 'string' ||
    !confirmedBy.trim()
  ) {
    throw new Error(
      'confirmedBy is required'
    );
  }

  const timestamp = now();

  copy.status =
    ENGINEERING_RECORD_STATUS.CONFIRMED;

  copy.confirmedAt =
    timestamp;

  copy.confirmedBy =
    confirmedBy.trim();

  copy.updatedAt =
    timestamp;

  return copy;
}

/*
 * =====================================================
 * Supersede
 * =====================================================
 */

function supersedeEngineeringRecord(
  record
) {
  const copy = clone(record);

  const errors =
    validateEngineeringRecord(
      copy
    );

  if (errors.length) {
    throw new Error(
      `Engineering Record validation failed: ${errors
        .map((item) => item.code)
        .join(', ')}`
    );
  }

  const timestamp = now();

  copy.status =
    ENGINEERING_RECORD_STATUS.SUPERSEDED;

  copy.supersededAt =
    timestamp;

  copy.updatedAt =
    timestamp;

  return copy;
}

/*
 * =====================================================
 * Read-only clone
 * =====================================================
 */

function cloneEngineeringRecord(
  record
) {
  const copy = clone(record);

  const errors =
    validateEngineeringRecord(
      copy
    );

  if (errors.length) {
    throw new Error(
      `Engineering Record validation failed: ${errors
        .map((item) => item.code)
        .join(', ')}`
    );
  }

  return copy;
}

module.exports = {
  ENGINEERING_RECORD_STATUS,
  ENGINEERING_RECORD_VERSION,

  createEngineeringRecord,
  validateEngineeringRecord,

  confirmEngineeringRecord,
  supersedeEngineeringRecord,

  cloneEngineeringRecord,
};