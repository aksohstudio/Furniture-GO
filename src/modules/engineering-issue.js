const {
  ENGINEERING_ISSUE_STATUS,
  ENGINEERING_ISSUE_SEVERITY,
} = require('../database/constants');

const ENGINEERING_ISSUE_VERSION = 1;

function now() {
  return new Date().toISOString();
}

function createId(prefix = 'ei') {
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
 * Engineering Issue
 * =====================================================
 *
 * PRD09 — Project Recognition and Analysis Engine
 *
 * Engineering Issue represents an engineering risk or
 * review item detected during Project Recognition.
 *
 * Engineering Issue does NOT resolve the problem.
 *
 * It only records:
 *
 * - what was detected
 * - where it was detected
 * - which Engineering Record it belongs to
 * - how serious it is
 * - whether it has been reviewed
 *
 * Engineering decisions belong to downstream workflows.
 */

function createEngineeringIssue({
  id = null,

  projectId,

  engineeringRecordId = null,

  type = null,

  severity =
    ENGINEERING_ISSUE_SEVERITY.WARNING,

  status =
    ENGINEERING_ISSUE_STATUS.OPEN,

  location = {},

  description = '',

  details = {},

  suggestedAction = null,

  recognitionConfidence = null,

  source = null,

  sourceReference = null,

  relatedDrawingIds = [],

  relatedEntityIds = [],

  recognitionMetadata = {},
} = {}) {
  if (
    typeof projectId !== 'string' ||
    !projectId.trim()
  ) {
    throw new Error(
      'Engineering Issue requires a projectId'
    );
  }

  const timestamp = now();

  return {
    id:
      id || createId(),

    version:
      ENGINEERING_ISSUE_VERSION,

    projectId:
      projectId.trim(),

    engineeringRecordId,

    type,

    severity,

    status,

    location:
      normalizeObject(location),

    description:
      String(description ?? ''),

    details:
      normalizeObject(details),

    suggestedAction,

    recognitionConfidence,

    source,

    sourceReference,

    relatedDrawingIds:
      normalizeArray(
        relatedDrawingIds
      ),

    relatedEntityIds:
      normalizeArray(
        relatedEntityIds
      ),

    recognitionMetadata:
      normalizeObject(
        recognitionMetadata
      ),

    createdAt:
      timestamp,

    updatedAt:
      timestamp,

    reviewedAt:
      null,

    reviewedBy:
      null,

    dismissedAt:
      null,

    dismissedBy:
      null,
  };
}

/*
 * =====================================================
 * Validation
 * =====================================================
 */

function validateEngineeringIssue(
  issue
) {
  const errors = [];

  if (
    !issue ||
    typeof issue !== 'object'
  ) {
    return [
      {
        code:
          'ENGINEERING_ISSUE_INVALID',
        message:
          'Engineering Issue must be an object',
      },
    ];
  }

  if (
    typeof issue.id !== 'string' ||
    !issue.id
  ) {
    errors.push({
      code:
        'ENGINEERING_ISSUE_ID_REQUIRED',
      message:
        'Engineering Issue ID is required',
    });
  }

  if (
    typeof issue.projectId !== 'string' ||
    !issue.projectId
  ) {
    errors.push({
      code:
        'ENGINEERING_ISSUE_PROJECT_REQUIRED',
      message:
        'Engineering Issue projectId is required',
    });
  }

  if (
    typeof issue.version !== 'number'
  ) {
    errors.push({
      code:
        'ENGINEERING_ISSUE_VERSION_INVALID',
      message:
        'Engineering Issue version is required',
    });
  }

  if (
    !Object.values(
      ENGINEERING_ISSUE_STATUS
    ).includes(
      issue.status
    )
  ) {
    errors.push({
      code:
        'ENGINEERING_ISSUE_STATUS_INVALID',
      message:
        'Engineering Issue status is invalid',
    });
  }

  if (
    !Object.values(
      ENGINEERING_ISSUE_SEVERITY
    ).includes(
      issue.severity
    )
  ) {
    errors.push({
      code:
        'ENGINEERING_ISSUE_SEVERITY_INVALID',
      message:
        'Engineering Issue severity is invalid',
    });
  }

  if (
    issue.engineeringRecordId !== null &&
    (
      typeof issue.engineeringRecordId !==
        'string' ||
      !issue.engineeringRecordId
    )
  ) {
    errors.push({
      code:
        'ENGINEERING_RECORD_REFERENCE_INVALID',
      message:
        'Engineering Issue Engineering Record reference is invalid',
    });
  }

  if (
    typeof issue.description !==
      'string'
  ) {
    errors.push({
      code:
        'ENGINEERING_ISSUE_DESCRIPTION_INVALID',
      message:
        'Engineering Issue description must be a string',
    });
  }

  if (
    !issue.location ||
    typeof issue.location !==
      'object' ||
    Array.isArray(issue.location)
  ) {
    errors.push({
      code:
        'ENGINEERING_ISSUE_LOCATION_INVALID',
      message:
        'Engineering Issue location must be an object',
    });
  }

  const arrayFields = [
    'relatedDrawingIds',
    'relatedEntityIds',
  ];

  for (
    const field of arrayFields
  ) {
    if (
      !Array.isArray(
        issue[field]
      )
    ) {
      errors.push({
        code:
          'ENGINEERING_ISSUE_COLLECTION_INVALID',
        message:
          `Engineering Issue ${field} must be an array`,
        field,
      });
    }
  }

  if (
    issue.recognitionConfidence !==
      null &&
    (
      typeof issue.recognitionConfidence !==
        'number' ||
      issue.recognitionConfidence < 0 ||
      issue.recognitionConfidence > 1
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
    typeof issue.createdAt !==
      'string' ||
    !issue.createdAt
  ) {
    errors.push({
      code:
        'ENGINEERING_ISSUE_CREATED_AT_INVALID',
      message:
        'Engineering Issue createdAt is required',
    });
  }

  if (
    typeof issue.updatedAt !==
      'string' ||
    !issue.updatedAt
  ) {
    errors.push({
      code:
        'ENGINEERING_ISSUE_UPDATED_AT_INVALID',
      message:
        'Engineering Issue updatedAt is required',
    });
  }

  return errors;
}

/*
 * =====================================================
 * Start Review
 * =====================================================
 *
 * This changes only the review state.
 *
 * It does NOT resolve the engineering issue.
 */

function startEngineeringIssueReview(
  issue,
  reviewerId
) {
  const copy =
    clone(issue);

  const errors =
    validateEngineeringIssue(
      copy
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

  if (
    typeof reviewerId !==
      'string' ||
    !reviewerId.trim()
  ) {
    throw new Error(
      'reviewerId is required'
    );
  }

  if (
    copy.status ===
      ENGINEERING_ISSUE_STATUS.CONFIRMED
  ) {
    throw new Error(
      'Confirmed Engineering Issues cannot be moved back to review'
    );
  }

  if (
    copy.status ===
      ENGINEERING_ISSUE_STATUS.DISMISSED
  ) {
    throw new Error(
      'Dismissed Engineering Issues cannot be moved back to review'
    );
  }

  const timestamp =
    now();

  copy.status =
    ENGINEERING_ISSUE_STATUS.REVIEWING;

  copy.reviewedAt =
    timestamp;

  copy.reviewedBy =
    reviewerId.trim();

  copy.updatedAt =
    timestamp;

  return copy;
}

/*
 * =====================================================
 * Confirm Review
 * =====================================================
 *
 * "Confirmed" here means the review item has been
 * reviewed/acknowledged.
 *
 * It does NOT mean that the entire Project has been
 * Project Confirmed.
 *
 * Project Confirmation remains a separate workflow.
 */

function confirmEngineeringIssue(
  issue,
  reviewerId
) {
  const copy =
    clone(issue);

  const errors =
    validateEngineeringIssue(
      copy
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

  if (
    typeof reviewerId !==
      'string' ||
    !reviewerId.trim()
  ) {
    throw new Error(
      'reviewerId is required'
    );
  }

  if (
    copy.status ===
      ENGINEERING_ISSUE_STATUS.DISMISSED
  ) {
    throw new Error(
      'Dismissed Engineering Issues cannot be confirmed'
    );
  }

  const timestamp =
    now();

  copy.status =
    ENGINEERING_ISSUE_STATUS.CONFIRMED;

  copy.reviewedAt =
    timestamp;

  copy.reviewedBy =
    reviewerId.trim();

  copy.updatedAt =
    timestamp;

  return copy;
}

/*
 * =====================================================
 * Dismiss
 * =====================================================
 *
 * Dismissal records that the review item has been
 * intentionally dismissed by a user.
 *
 * Recognition Service does not make this decision
 * automatically.
 */

function dismissEngineeringIssue(
  issue,
  reviewerId
) {
  const copy =
    clone(issue);

  const errors =
    validateEngineeringIssue(
      copy
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

  if (
    typeof reviewerId !==
      'string' ||
    !reviewerId.trim()
  ) {
    throw new Error(
      'reviewerId is required'
    );
  }

  const timestamp =
    now();

  copy.status =
    ENGINEERING_ISSUE_STATUS.DISMISSED;

  copy.dismissedAt =
    timestamp;

  copy.dismissedBy =
    reviewerId.trim();

  copy.reviewedAt =
    timestamp;

  copy.reviewedBy =
    reviewerId.trim();

  copy.updatedAt =
    timestamp;

  return copy;
}

/*
 * =====================================================
 * Reopen
 * =====================================================
 *
 * Reopening is useful when a previously reviewed issue
 * becomes relevant again.
 */

function reopenEngineeringIssue(
  issue
) {
  const copy =
    clone(issue);

  const errors =
    validateEngineeringIssue(
      copy
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

  const timestamp =
    now();

  copy.status =
    ENGINEERING_ISSUE_STATUS.OPEN;

  copy.updatedAt =
    timestamp;

  return copy;
}

/*
 * =====================================================
 * Read-only Clone
 * =====================================================
 */

function cloneEngineeringIssue(
  issue
) {
  const copy =
    clone(issue);

  const errors =
    validateEngineeringIssue(
      copy
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

  return copy;
}

module.exports = {
  ENGINEERING_ISSUE_VERSION,

  createEngineeringIssue,
  validateEngineeringIssue,

  startEngineeringIssueReview,
  confirmEngineeringIssue,
  dismissEngineeringIssue,
  reopenEngineeringIssue,

  cloneEngineeringIssue,
};