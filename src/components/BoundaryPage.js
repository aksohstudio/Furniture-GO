import { projectClient } from '../services/project-client.js';

export function BoundaryPage({
  router,
  kind,
}) {
  const section =
    document.createElement('section');

  section.className =
    'page boundary-page';

  const database =
    kind === 'database';

  const account =
    kind === 'account';

  section.innerHTML = `
    <button
      class="back-link"
      data-back
    >
      ← Projects
    </button>

    <p class="eyebrow">
      Sprint 02 Boundary
    </p>

    <h2>
      ${
        database
          ? 'Database'
          : account
            ? 'Account & User Profile'
            : 'Project Settings'
      }
    </h2>

    <p class="muted">
      This page exposes the approved boundary
      without implementing later-Sprint
      business logic.
    </p>

    <div class="panel boundary-card">

      <h3>
        ${
          database
            ? 'Official / Factory / Project Database'
            : account
              ? 'Offline account foundation'
              : 'Project Settings foundation'
        }
      </h3>

      ${
        account
          ? `
            <label>
              Display name

              <input
                data-display-name
                value="Local User"
              >
            </label>

            <label>
              Primary role

              <select data-primary-role>
                <option value="Designer">
                  Designer
                </option>

                <option value="Factory">
                  Factory
                </option>
              </select>
            </label>

            <label>
              Account role

              <select data-account-role>
                <option value="Designer">
                  Designer
                </option>

                <option value="Factory">
                  Factory
                </option>
              </select>
            </label>

            <button
              class="button primary"
              data-save-account
            >
              Save profile
            </button>
          `
          : `
            <p class="muted">
              ${
                database
                  ? 'Official Database is read-only. Factory Database and Factory Configuration remain separate from Project Database.'
                  : 'Production-relevant settings persist through Project Service. Theme, toolbar, language, layout, and notifications remain UI-only.'
              }
            </p>
          `
      }

      <span class="status-pill">
        Offline boundary ready
      </span>

    </div>
  `;

  /*
   * =====================================================
   * Account
   * =====================================================
   */

  if (account) {
    const display =
      section.querySelector(
        '[data-display-name]'
      );

    const primary =
      section.querySelector(
        '[data-primary-role]'
      );

    const role =
      section.querySelector(
        '[data-account-role]'
      );

    /*
     * Load current local account context.
     */

    projectClient
      .getUserContext()
      .then(
        (context) => {
          display.value =
            context.displayName ||
            'Local User';

          /*
           * Furniture GO has exactly two roles:
           *
           * Designer
           * Factory
           */

          primary.value =
            context.primaryRole ===
              'Factory'
              ? 'Factory'
              : 'Designer';

          role.value =
            context.accountRole ===
              'Factory'
              ? 'Factory'
              : 'Designer';
        }
      );

    /*
     * Save local account context.
     */

    section
      .querySelector(
        '[data-save-account]'
      )
      .addEventListener(
        'click',
        async () => {
          try {
            /*
             * Keep Primary Role and Account Role
             * synchronized with the two-role PRD.
             */

            const selectedRole =
              role.value === 'Factory'
                ? 'Factory'
                : 'Designer';

            await projectClient
              .saveUserContext({
                displayName:
                  display.value.trim(),

                primaryRole:
                  selectedRole,

                accountRole:
                  selectedRole,
              });

            window.alert(
              'Local profile saved offline.'
            );
          } catch (error) {
            window.alert(
              error.message
            );
          }
        }
      );
  }

  /*
   * =====================================================
   * Project Settings
   * =====================================================
   */

  if (
    !database &&
    !account
  ) {
    const projectId =
      new URLSearchParams(
        window.location.hash
          .split('?')[1] || ''
      ).get(
        'project'
      );

    section
      .querySelector(
        '.boundary-card'
      )
      .innerHTML += `
        <hr>

        <h4>
          Production-relevant settings
        </h4>

        <label>
          Measurement unit

          <select data-unit>
            <option value="mm">
              mm
            </option>

            <option value="inch">
              inch
            </option>
          </select>
        </label>

        <label>
          Default material

          <input
            data-material
            placeholder="Material code"
          >
        </label>

        <button
          class="button primary"
          data-save-settings
        >
          Save production settings
        </button>

        <p
          class="muted"
          data-settings-status
        >
          These values remain Working State
          until a later confirmation flow.
        </p>

        <hr>

        <h4>
          UI-only preferences
        </h4>

        <p class="muted">
          Theme · Toolbar Layout · Language ·
          Dashboard Layout · Notification Preference
          are not stored in Production Snapshot.
        </p>
      `;

    section
      .querySelector(
        '[data-save-settings]'
      )
      .addEventListener(
        'click',
        async () => {
          const status =
            section.querySelector(
              '[data-settings-status]'
            );

          try {
            await projectClient
              .saveWorkingState(
                projectId,
                {
                  productionSettings: {
                    measurementUnit:
                      section.querySelector(
                        '[data-unit]'
                      ).value,

                    defaultMaterial:
                      section.querySelector(
                        '[data-material]'
                      ).value,
                  },
                }
              );

            status.textContent =
              'Saved to Working State. No Snapshot created.';
          } catch (error) {
            status.textContent =
              error.message;
          }
        }
      );
  }

  /*
   * =====================================================
   * Back
   * =====================================================
   */

  section
    .querySelector(
      '[data-back]'
    )
    .addEventListener(
      'click',
      () => {
        router.navigate(
          '/projects'
        );
      }
    );

  return section;
}