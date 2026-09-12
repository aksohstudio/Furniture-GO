const ACCOUNT_ROLE = Object.freeze({
  DESIGNER: 'Designer',

  PROFESSIONAL: 'Professional',

  /*
   * ---------------------------------------------------
   * Legacy Compatibility
   * ---------------------------------------------------
   *
   * Older local account contexts used:
   *
   * Factory
   *
   * Factory is no longer treated as a separate product.
   * It is normalized to Professional when permissions
   * are evaluated.
   *
   * This keeps existing local account-context.json files
   * readable while the product model transitions to:
   *
   * Designer
   * Professional
   */

  FACTORY: 'Factory',
});

const ACTION = Object.freeze({
  CREATE: 'create',
  OPEN: 'open',
  EDIT: 'edit',
  CONFIRM: 'confirm',
  LOCK: 'lock',
  UNLOCK: 'unlock',
  GENERATE: 'generate',
  EXPORT: 'export',
  PRINT: 'print',
  ARCHIVE: 'archive',
  DELETE: 'delete',
  RESTORE: 'restore',
  PERMANENT_DELETE: 'permanent-delete',
});

/*
 * =====================================================
 * Account Role Normalization
 * =====================================================
 *
 * Furniture GO currently has two product roles:
 *
 * - Designer
 * - Professional
 *
 * Older local data may still contain:
 *
 * - Factory
 *
 * Factory is a legacy name for Professional.
 *
 * This function allows existing local data to continue
 * working without treating Factory as a third product.
 */

function normalizeAccountRole(
  role
) {
  if (
    role ===
    ACCOUNT_ROLE.FACTORY
  ) {
    return ACCOUNT_ROLE.PROFESSIONAL;
  }

  if (
    role ===
    ACCOUNT_ROLE.DESIGNER
  ) {
    return ACCOUNT_ROLE.DESIGNER;
  }

  if (
    role ===
    ACCOUNT_ROLE.PROFESSIONAL
  ) {
    return ACCOUNT_ROLE.PROFESSIONAL;
  }

  return null;
}

/*
 * =====================================================
 * Role Permission Matrix
 * =====================================================
 *
 * Furniture GO has two product roles:
 *
 * Designer
 * Professional
 *
 * Subscription limits are intentionally NOT handled
 * here.
 *
 * Sprint 03–11:
 *
 * - No project-count restriction
 * - No Trial restriction
 * - No subscription gate
 * - No Paywall
 *
 * Subscription and project limits will be introduced
 * in Sprint 12.
 *
 * =====================================================
 */

const roleMatrix = {
  /*
   * ---------------------------------------------------
   * Project / Document Access
   * ---------------------------------------------------
   *
   * Both Designer and Professional can work with
   * Projects during development.
   *
   * Product-specific feature restrictions are handled
   * by their corresponding business actions.
   *
   * Project creation is intentionally available to both
   * roles until Sprint 12 subscription logic exists.
   */

  open: [
    ACCOUNT_ROLE.DESIGNER,
    ACCOUNT_ROLE.PROFESSIONAL,
  ],

  create: [
    ACCOUNT_ROLE.DESIGNER,
    ACCOUNT_ROLE.PROFESSIONAL,
  ],

  /*
   * ---------------------------------------------------
   * Editing
   * ---------------------------------------------------
   *
   * Designer can edit Designer-side project information.
   *
   * Professional can edit Professional-side engineering
   * information.
   *
   * This generic edit permission does NOT mean that
   * Professional can modify CAD.
   *
   * CAD editing must be controlled by the specific CAD
   * feature/action when that feature is implemented.
   */

  edit: [
    ACCOUNT_ROLE.DESIGNER,
    ACCOUNT_ROLE.PROFESSIONAL,
  ],

  /*
   * ---------------------------------------------------
   * Project Confirmation
   * ---------------------------------------------------
   *
   * Professional owns production confirmation.
   *
   * Designer prepares the project but does not confirm
   * it for production.
   */

  confirm: [
    ACCOUNT_ROLE.PROFESSIONAL,
  ],

  /*
   * ---------------------------------------------------
   * Production
   * ---------------------------------------------------
   *
   * Production-side generation belongs to Professional.
   */

  generate: [
    ACCOUNT_ROLE.PROFESSIONAL,
  ],

  /*
   * ---------------------------------------------------
   * Export
   * ---------------------------------------------------
   *
   * Designer:
   *   Export Designer / Project PDF
   *
   * Professional:
   *   Export production documents
   *
   * The specific export target must be enforced by the
   * feature-level service when those workflows exist.
   */

  export: [
    ACCOUNT_ROLE.DESIGNER,
    ACCOUNT_ROLE.PROFESSIONAL,
  ],

  /*
   * ---------------------------------------------------
   * Print
   * ---------------------------------------------------
   *
   * Production printing belongs to Professional.
   */

  print: [
    ACCOUNT_ROLE.PROFESSIONAL,
  ],

  /*
   * ---------------------------------------------------
   * Lock / Unlock
   * ---------------------------------------------------
   *
   * These remain internal project-control actions.
   *
   * They are currently assigned to Professional.
   */

  lock: [
    ACCOUNT_ROLE.PROFESSIONAL,
  ],

  unlock: [
    ACCOUNT_ROLE.PROFESSIONAL,
  ],

  /*
   * ---------------------------------------------------
   * Project Lifecycle
   * ---------------------------------------------------
   *
   * Subscription limits are NOT implemented here.
   *
   * Archive / delete / restore remain outside the current
   * product-role permission model.
   */

  archive: [],

  delete: [],

  restore: [
    ACCOUNT_ROLE.PROFESSIONAL,
  ],

  'permanent-delete': [],
};

/*
 * =====================================================
 * Permission Evaluation
 * =====================================================
 */

function canPerform(
  action,
  context = {}
) {
  const roles =
    roleMatrix[action];

  const normalizedRole =
    normalizeAccountRole(
      context.accountRole
    );

  if (
    !roles ||
    !normalizedRole ||
    !roles.includes(
      normalizedRole
    )
  ) {
    return false;
  }

  /*
   * ---------------------------------------------------
   * Trash Protection
   * ---------------------------------------------------
   */

  if (
    context.archiveStatus ===
      'Trash' &&
    [
      'open',
      'edit',
      'generate',
      'confirm',
    ].includes(action)
  ) {
    return false;
  }

  /*
   * ---------------------------------------------------
   * Archived Project Protection
   * ---------------------------------------------------
   */

  if (
    context.archiveStatus ===
      'Archived' &&
    [
      'edit',
      'generate',
      'confirm',
      'lock',
      'unlock',
    ].includes(action)
  ) {
    return false;
  }

  /*
   * ---------------------------------------------------
   * Locked Project Protection
   * ---------------------------------------------------
   */

  if (
    context.lockStatus ===
      'Locked' &&
    [
      'edit',
      'confirm',
    ].includes(action)
  ) {
    return false;
  }

  return true;
}

/*
 * =====================================================
 * Trusted Permission Context
 * =====================================================
 *
 * The server must never trust arbitrary role values
 * supplied by a client request.
 *
 * Existing Factory account contexts are normalized to
 * Professional here.
 *
 * =====================================================
 */

function trustedPermissionContext(
  accountContext = {},
  resource = {}
) {
  const accountRole =
    normalizeAccountRole(
      accountContext.accountRole
    );

  if (!accountRole) {
    throw new Error(
      'Trusted Account Context has an invalid Account Role'
    );
  }

  return {
    accountRole,

    archiveStatus:
      resource.archiveStatus,

    lockStatus:
      resource.lockStatus,
  };
}

/*
 * =====================================================
 * Server Authorization
 * =====================================================
 */

function canPerformFromAccountContext(
  action,
  accountContext,
  resource = {}
) {
  return canPerform(
    action,
    trustedPermissionContext(
      accountContext,
      resource
    )
  );
}

/*
 * =====================================================
 * Exports
 * =====================================================
 */

module.exports = {
  ACCOUNT_ROLE,

  ACTION,

  canPerform,

  canPerformFromAccountContext,

  trustedPermissionContext,

  roleMatrix,

  normalizeAccountRole,
};
