const {
  createObjectId,
} = require('../database/id');

const {
  JsonLocalStorage,
} = require('../database/local-storage');

const {
  ACCOUNT_ROLE,
} = require('./access-policy');

/*
 * =====================================================
 * Default Account Context
 * =====================================================
 *
 * Furniture GO has exactly two primary roles:
 *
 * - Designer
 * - Factory
 *
 * There are no Owner / Admin / Worker roles.
 */

const DEFAULT_CONTEXT =
  Object.freeze({
    id:
      'local-user',

    displayName:
      'Local User',

    primaryRole:
      'Designer',

    accountRole:
      ACCOUNT_ROLE.DESIGNER,
  });

/*
 * =====================================================
 * Account Service
 * =====================================================
 */

class AccountService {
  constructor(
    rootDirectory
  ) {
    this.storage =
      new JsonLocalStorage(
        rootDirectory
      );
  }

  /*
   * ---------------------------------------------------
   * Get Current Account Context
   * ---------------------------------------------------
   */

  getContext() {
    const stored =
      this.storage.readJson(
        'account-context.json',
        null
      );

    /*
     * No stored account yet.
     */

    if (!stored) {
      return {
        ...DEFAULT_CONTEXT,
      };
    }

    /*
     * -------------------------------------------------
     * Legacy Role Protection
     * -------------------------------------------------
     *
     * Older versions of Furniture GO used:
     *
     * Owner
     * Admin
     * Worker
     *
     * Those roles are no longer part of the PRD.
     *
     * If an old context is found, convert it to the
     * valid two-role model.
     */

    let accountRole =
      stored.accountRole;

    if (
      accountRole !==
        ACCOUNT_ROLE.DESIGNER &&
      accountRole !==
        ACCOUNT_ROLE.FACTORY
    ) {
      accountRole =
        ACCOUNT_ROLE.DESIGNER;
    }

    return {
      ...DEFAULT_CONTEXT,
      ...stored,

      accountRole,

      /*
       * Keep primaryRole aligned with the two-role model
       * when the stored value is invalid.
       */

      primaryRole:
        stored.primaryRole ===
          ACCOUNT_ROLE.DESIGNER ||
        stored.primaryRole ===
          ACCOUNT_ROLE.FACTORY
          ? stored.primaryRole
          : accountRole,
    };
  }

  /*
   * ---------------------------------------------------
   * Save Account Context
   * ---------------------------------------------------
   *
   * Account role may be changed through the local
   * account profile because this is the offline
   * two-role foundation.
   */

  saveContext(
    changes
  ) {
    return this.persistContext(
      changes,
      true
    );
  }

  /*
   * ---------------------------------------------------
   * Trusted Context
   * ---------------------------------------------------
   */

  saveTrustedContext(
    changes
  ) {
    return this.persistContext(
      changes,
      true
    );
  }

  /*
   * ---------------------------------------------------
   * Persist Context
   * ---------------------------------------------------
   */

  persistContext(
    changes,
    allowAccountRoleChange
  ) {
    const current =
      this.getContext();

    const profileChanges =
      {
        ...(changes || {}),
      };

    /*
     * Remove accountRole if the caller is not allowed
     * to change it.
     */

    if (
      !allowAccountRoleChange
    ) {
      delete profileChanges.accountRole;
    }

    /*
     * -------------------------------------------------
     * Validate Account Role
     * -------------------------------------------------
     */

    if (
      profileChanges.accountRole !==
        undefined &&
      !Object.values(
        ACCOUNT_ROLE
      ).includes(
        profileChanges.accountRole
      )
    ) {
      throw new Error(
        'Account Role must be Designer or Factory'
      );
    }

    /*
     * -------------------------------------------------
     * Validate Primary Role
     * -------------------------------------------------
     */

    if (
      profileChanges.primaryRole !==
        undefined &&
      profileChanges.primaryRole !==
        ACCOUNT_ROLE.DESIGNER &&
      profileChanges.primaryRole !==
        ACCOUNT_ROLE.FACTORY
    ) {
      throw new Error(
        'Primary Role must be Designer or Factory'
      );
    }

    /*
     * -------------------------------------------------
     * Build Next Context
     * -------------------------------------------------
     */

    const next =
      {
        ...current,
        ...profileChanges,

        id:
          current.id ||
          createObjectId(),

        updatedAt:
          new Date()
            .toISOString(),
      };

    /*
     * -------------------------------------------------
     * Final Validation
     * -------------------------------------------------
     */

    if (
      !Object.values(
        ACCOUNT_ROLE
      ).includes(
        next.accountRole
      )
    ) {
      throw new Error(
        'Account Role must be Designer or Factory'
      );
    }

    if (
      !Object.values(
        ACCOUNT_ROLE
      ).includes(
        next.primaryRole
      )
    ) {
      throw new Error(
        'Primary Role must be Designer or Factory'
      );
    }

    /*
     * -------------------------------------------------
     * Keep Roles Consistent
     * -------------------------------------------------
     *
     * For the current two-role model, the primary role
     * and account role represent the same workspace role.
     */

    next.primaryRole =
      next.accountRole;

    /*
     * -------------------------------------------------
     * Save
     * -------------------------------------------------
     */

    this.storage.writeJson(
      'account-context.json',
      next
    );

    return next;
  }
}

/*
 * =====================================================
 * Exports
 * =====================================================
 */

module.exports = {
  AccountService,
  DEFAULT_CONTEXT,
};