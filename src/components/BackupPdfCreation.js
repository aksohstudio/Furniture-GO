import { projectClient } from '../services/project-client.js';
import { PdfViewer } from './PdfViewer.js';

function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[character])
  );
}

/*
 * =====================================================
 * Sprint 03 — Designer PDF
 * =====================================================
 *
 * Current Sprint 03 storage structure:
 *
 * project.projectDocuments
 *   ├── designerRevisions[]
 *   ├── currentDesignerRevisionId
 *   └── backupPdf
 *
 * The Original Designer PDF is represented by the
 * current Designer Revision.
 *
 * Do NOT read:
 *
 * project.project.originalPdf
 * project.originalPdf
 *
 * Those are not the current Sprint 03 source fields.
 * =====================================================
 */

function getDesignerRevisions(project) {
  const revisions =
    project?.projectDocuments
      ?.designerRevisions;

  return Array.isArray(revisions)
    ? revisions
    : [];
}

function getCurrentDesignerRevision(project) {
  const documents =
    project?.projectDocuments ||
    {};

  const revisions =
    getDesignerRevisions(project);

  const currentId =
    documents.currentDesignerRevisionId;

  if (!currentId) {
    return null;
  }

  return (
    revisions.find(
      (revision) =>
        revision.id === currentId
    ) || null
  );
}

function getOriginalPdf(project) {
  const currentRevision =
    getCurrentDesignerRevision(
      project
    );

  if (!currentRevision) {
    return null;
  }

  return {
    ...currentRevision,

    /*
     * Sprint 03 explicitly treats the
     * Designer Revision as the read-only
     * Original Designer PDF source.
     */
    readOnly: true,

    status:
      currentRevision.status ||
      'Current',
  };
}

function getBackupPdf(project) {
  const backup =
    project?.projectDocuments
      ?.backupPdf;

  if (
    !backup ||
    !backup.storageKey
  ) {
    return null;
  }

  return backup;
}

function renderSourceState(project) {
  const originalPdf =
    getOriginalPdf(project);

  if (!originalPdf) {
    return `
      <div class="backup-pdf-empty-state">

        <div class="recognition-empty-icon">
          PDF
        </div>

        <strong>
          Source Designer PDF not available
        </strong>

        <span>
          Import the official Designer PDF
          before creating a Backup PDF.
        </span>

      </div>
    `;
  }

  return `
    <div class="backup-pdf-file-card">

      <div class="recognition-empty-icon">
        PDF
      </div>

      <div>

        <strong>
          ${escapeHtml(
            originalPdf.fileName ||
            'Designer PDF'
          )}
        </strong>

        <span>
          Original Designer PDF
        </span>

        <small>
          Revision ${
            escapeHtml(
              originalPdf.revisionNumber ||
              'Current'
            )
          }
          · Read-only source document
        </small>

      </div>

      <span class="status-pill">
        Source Available
      </span>

    </div>
  `;
}

function renderBackupState(project) {
  const backupPdf =
    getBackupPdf(project);

  if (!backupPdf) {
    return `
      <div class="backup-pdf-empty-state">

        <strong>
          No Backup PDF created
        </strong>

        <span>
          The editable engineering working copy
          has not been generated yet.
        </span>

      </div>
    `;
  }

  return `
    <div class="backup-pdf-file-card">

      <div class="recognition-empty-icon">
        PDF
      </div>

      <div>

        <strong>
          ${escapeHtml(
            backupPdf.fileName ||
            'Backup PDF'
          )}
        </strong>

        <span>
          Editable engineering working copy
        </span>

        <small>
          Created ${
            backupPdf.createdAt
              ? escapeHtml(
                  new Date(
                    backupPdf.createdAt
                  ).toLocaleString()
                )
              : 'Not available'
          }
        </small>

      </div>

      <span class="status-pill">
        Available
      </span>

    </div>
  `;
}

export async function BackupPdfCreation({
  projectId,
  router,
}) {
  const project =
    await projectClient.getProject(
      projectId
    );

  const section =
    document.createElement('section');

  section.className =
    'page backup-pdf-creation-page';

  const originalPdf =
    getOriginalPdf(project);

  const backupPdf =
    getBackupPdf(project);

  if (backupPdf) {
    return PdfViewer({
      projectId,
      router,
      pdfType: 'backup',
    });
  }

  section.innerHTML = `
    <div class="backup-pdf-shell">

      <header class="backup-pdf-header">

        <button
          class="back-link"
          type="button"
          data-back
        >
          ← Recognition Workspace
        </button>

        <div class="backup-pdf-header__content">

          <div>

            <p class="eyebrow">
              Project Workspace / Recognition / Backup PDF
            </p>

            <h1>
              Backup PDF
            </h1>

            <p class="muted">
              ${escapeHtml(
                project.project.name
              )}
              · Editable engineering working copy
            </p>

          </div>

          <span class="recognition-boundary-label">
            Sprint 03 · Task 02
          </span>

        </div>

      </header>

      <main class="backup-pdf-main">

        <section class="backup-pdf-panel">

          <div class="backup-pdf-panel__intro">

            <div class="recognition-empty-icon">
              PDF
            </div>

            <div>

              <p class="eyebrow">
                Engineering working copy
              </p>

              <h2>
                Backup PDF
              </h2>

              <p>
                The Backup PDF is created from the
                imported Designer PDF.
              </p>

              <p class="muted">
                The Original PDF remains unchanged
                and read-only.
              </p>

            </div>

          </div>

          <section class="backup-pdf-source-section">

            <div class="backup-pdf-section-heading">

              <div>

                <p class="eyebrow">
                  Source
                </p>

                <h3>
                  Designer PDF
                </h3>

              </div>

              <span class="status-pill">
                ${
                  originalPdf
                    ? 'Available'
                    : 'Not available'
                }
              </span>

            </div>

            ${renderSourceState(
              project
            )}

          </section>

          <section class="backup-pdf-source-section">

            <div class="backup-pdf-section-heading">

              <div>

                <p class="eyebrow">
                  Working Copy
                </p>

                <h3>
                  Backup PDF
                </h3>

              </div>

              <span class="status-pill">
                ${
                  backupPdf
                    ? 'Available'
                    : 'Not created'
                }
              </span>

            </div>

            ${renderBackupState(
              project
            )}

          </section>

        </section>

        <aside class="backup-pdf-aside">

          <section class="backup-pdf-aside__section">

            <p class="eyebrow">
              Current Project
            </p>

            <h3>
              ${escapeHtml(
                project.project.name
              )}
            </h3>

            <span class="status-pill">
              ${escapeHtml(
                project.project.status ||
                'Active'
              )}
            </span>

          </section>

          <section class="backup-pdf-aside__section">

            <p class="eyebrow">
              Source / Origin
            </p>

            <h3>
              Designer PDF
            </h3>

            <p class="muted">
              ${
                originalPdf
                  ? escapeHtml(
                      originalPdf.fileName ||
                      'Imported Designer PDF'
                    )
                  : 'No Designer PDF imported'
              }
            </p>

            ${
              originalPdf
                ? `
                  <small class="muted">
                    Current Revision:
                    ${escapeHtml(
                      originalPdf.revisionNumber ||
                      '—'
                    )}
                  </small>
                `
                : ''
            }

          </section>

          <section class="backup-pdf-aside__section">

            <p class="eyebrow">
              Backup Status
            </p>

            <h3 data-backup-status>
              ${
                backupPdf
                  ? 'Available'
                  : 'Not created'
              }
            </h3>

            <p class="muted">
              ${
                backupPdf
                  ? 'An engineering working copy is associated with this project.'
                  : 'No Backup PDF has been generated.'
              }
            </p>

          </section>

          <section class="backup-pdf-aside__section">

            <p class="eyebrow">
              Creation Rules
            </p>

            <ul>

              <li>
                Created from Designer PDF
              </li>

              <li>
                Original PDF is never modified
              </li>

              <li>
                Backup PDF is the editable drawing
              </li>

              <li>
                Backup remains associated with project
              </li>

            </ul>

          </section>

          <button
            class="button primary"
            type="button"
            data-create
            ${
              originalPdf &&
              !backupPdf
                ? ''
                : 'disabled'
            }
          >
            ${
              backupPdf
                ? 'Backup PDF Already Created'
                : 'Create Backup PDF'
            }
          </button>

          <p
            class="backup-pdf-confirmation"
            data-confirmation
          >
            ${
              backupPdf
                ? 'The project already has a Backup PDF.'
                : originalPdf
                  ? 'Backup PDF creation is ready.'
                  : 'Import a Designer PDF before creating a Backup PDF.'
            }
          </p>

        </aside>

      </main>

    </div>
  `;

  /*
   * ===================================================
   * Back
   * ===================================================
   */

  section
    .querySelector(
      '[data-back]'
    )
    .addEventListener(
      'click',
      () => {
        router.navigate(
          `/recognition/${encodeURIComponent(
            projectId
          )}`
        );
      }
    );

  /*
   * ===================================================
   * Create Backup PDF
   * ===================================================
   */

  const createButton =
    section.querySelector(
      '[data-create]'
    );

  createButton.addEventListener(
    'click',
    async () => {
      if (
        createButton.disabled
      ) {
        return;
      }

      const status =
        section.querySelector(
          '[data-backup-status]'
        );

      const confirmation =
        section.querySelector(
          '[data-confirmation]'
        );

      /*
       * Prevent duplicate requests.
       */

      createButton.disabled =
        true;

      createButton.textContent =
        'Creating Backup PDF…';

      status.textContent =
        'Creating';

      confirmation.textContent =
        'Creating the editable engineering working copy from the current Designer PDF…';

      try {
        /*
         * -------------------------------------------------
         * Real backend request
         * -------------------------------------------------
         *
         * POST
         *
         * /api/projects/:id/pdf/backup
         *
         * The server reads the current Designer PDF and
         * creates a separate stored Backup PDF.
         */

        const response =
          await fetch(
            `/api/projects/${encodeURIComponent(
              projectId
            )}/pdf/backup`,
            {
              method:
                'POST',

              headers: {
                Accept:
                  'application/json',
              },
            }
          );

        let result = null;

        try {
          result =
            await response.json();
        } catch {
          result = null;
        }

        /*
         * -------------------------------------------------
         * Handle backend errors.
         * -------------------------------------------------
         */

        if (
          !response.ok
        ) {
          throw new Error(
            result?.error ||
            `Backup PDF creation failed (${response.status})`
          );
        }

        /*
         * -------------------------------------------------
         * Read the persisted project state.
         * -------------------------------------------------
         *
         * The POST response is not used as a source of
         * truth for the rendered metadata. The project is
         * read again so the UI only reports success when
         * the server persisted a real Backup PDF record.
         */

        const refreshedProject =
          await projectClient.getProject(
            projectId
          );

        const refreshedBackupPdf =
          getBackupPdf(
            refreshedProject
          );

        if (
          !refreshedBackupPdf?.storageKey
        ) {
          throw new Error(
            'Backup PDF creation succeeded, but the persisted Backup PDF is unavailable.'
          );
        }

        /*
         * Re-render the persisted Backup PDF state in
         * place. This keeps the existing page handlers
         * alive and avoids presenting client-generated
         * metadata or a fake success state.
         */

        const workingCopySection =
          section.querySelectorAll(
            '.backup-pdf-source-section'
          )[1];

        if (
          workingCopySection
        ) {
          workingCopySection.innerHTML = `
            <div class="backup-pdf-section-heading">
              <div>
                <p class="eyebrow">Working Copy</p>
                <h3>Backup PDF</h3>
              </div>
              <span class="status-pill">Available</span>
            </div>
            ${renderBackupState(
              refreshedProject
            )}
          `;
        }

        status.textContent =
          'Available';

        const backupStatus =
          section.querySelector(
            '[data-backup-status]'
          );

        if (
          backupStatus
        ) {
          backupStatus.textContent =
            'Available';
        }

        confirmation.textContent =
          'Backup PDF created successfully.';

        createButton.textContent =
          'Backup PDF Already Created';

        createButton.disabled =
          true;

        router.navigate(
          `/backup-pdf/${encodeURIComponent(
            projectId
          )}`
        );
      } catch (error) {
        /*
         * -------------------------------------------------
         * Failure
         * -------------------------------------------------
         */

        createButton.disabled =
          false;

        createButton.textContent =
          'Create Backup PDF';

        status.textContent =
          'Not created';

        confirmation.textContent =
          error.message ||
          'Backup PDF creation failed.';
      }
    }
  );

  return section;
}
