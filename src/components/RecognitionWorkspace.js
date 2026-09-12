import { projectClient } from '../services/project-client.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

function collect(project, type) {
  const result = [];

  const visit = (node) => {
    if (node?.type === type) {
      result.push(node);
    }

    (node?.children || []).forEach(visit);
  };

  (project.hierarchy?.floors || []).forEach(visit);

  return result;
}

/*
 * =====================================================
 * Designer PDF
 * =====================================================
 *
 * Sprint 03 stores Designer PDF information under:
 *
 * project.projectDocuments.designerRevisions[]
 * project.projectDocuments.currentDesignerRevisionId
 *
 * The old project.originalPdf structure is no longer
 * the source of truth.
 */

function getCurrentDesignerPdf(project) {
  const revisions =
    Array.isArray(
      project?.projectDocuments?.designerRevisions
    )
      ? project.projectDocuments.designerRevisions
      : [];

  const currentRevisionId =
    project?.projectDocuments
      ?.currentDesignerRevisionId ||
    null;

  if (!currentRevisionId) {
    return null;
  }

  return (
    revisions.find(
      (revision) =>
        revision.id ===
        currentRevisionId
    ) || null
  );
}

function explorerMarkup(project) {
  const floors =
    project.hierarchy?.floors || [];

  if (!floors.length) {
    return `
      <div class="recognition-tree-empty">
        No Floor / Room / Furniture data available.
      </div>
    `;
  }

  return floors.map((floor) => `
    <div class="recognition-tree-group">

      <strong>
        <span>Floor</span>
        ${escapeHtml(floor.name)}
      </strong>

      ${(floor.children || [])
        .filter(
          (room) =>
            room.type === 'Room'
        )
        .map((room) => `
          <div class="recognition-tree-room">

            <span>Room</span>
            ${escapeHtml(room.name)}

            ${(room.children || [])
              .filter((item) =>
                [
                  'Furniture',
                  'Cabinet',
                  'Module',
                ].includes(
                  item.type
                )
              )
              .map((item) => `
                <div class="recognition-tree-item">
                  <span>
                    ${escapeHtml(item.type)}
                  </span>

                  ${escapeHtml(item.name)}
                </div>
              `)
              .join('')}

          </div>
        `)
        .join('')}

    </div>
  `).join('');
}

function renderPdfState(project) {
  const pdf =
    getCurrentDesignerPdf(
      project
    );

  if (!pdf) {
    return `
      <div class="recognition-empty-state">

        <div class="recognition-empty-icon">
          PDF
        </div>

        <h2>
          No Designer PDF available
        </h2>

        <p>
          Import the Designer PDF to begin
          the Project Recognition workflow.
        </p>

        <span class="recognition-status-note">
          Original PDF is read-only after import.
        </span>

      </div>
    `;
  }

  return `
    <div class="recognition-empty-state">

      <div class="recognition-empty-icon">
        PDF
      </div>

      <h2>
        ${escapeHtml(
          pdf.fileName ||
          'Designer PDF'
        )}
      </h2>

      <p>
        Designer PDF imported and associated
        with this project.
      </p>

      <span class="recognition-status-note">
        PDF Viewer is ready for implementation.
      </span>

    </div>
  `;
}

export async function RecognitionWorkspace({
  projectId,
  router,
}) {
  const project =
    await projectClient.getProject(
      projectId
    );

  const section =
    document.createElement(
      'section'
    );

  section.className =
    'page recognition-workspace-page';

  const rooms =
    collect(
      project,
      'Room'
    );

  /*
   * Sprint 03 Designer PDF source.
   *
   * Do not read:
   *
   * project.project.originalPdf
   * project.originalPdf
   *
   * The current Designer Revision is the source
   * of truth.
   */

  const originalPdf =
    getCurrentDesignerPdf(
      project
    );

  const recognitionReview =
    project.recognitionReview || {};

  const designerRevisions =
    Array.isArray(
      project.projectDocuments
        ?.designerRevisions
    )
      ? [...project.projectDocuments.designerRevisions]
          .sort(
            (a, b) =>
              (b.revisionNumber || 0) -
              (a.revisionNumber || 0)
          )
      : [];

  const currentRevisionId =
    project.projectDocuments
      ?.currentDesignerRevisionId ||
    null;

  section.innerHTML = `
    <div class="recognition-shell">

      <aside class="recognition-sidebar">

        <div class="recognition-brand">

          <span class="project-brand-mark">
            GO
          </span>

          <div>
            <strong>
              Furniture GO
            </strong>

            <small>
              Recognition Workspace
            </small>
          </div>

        </div>

        <div class="recognition-project-title">

          <p class="eyebrow">
            Current Project
          </p>

          <h2>
            ${escapeHtml(
              project.project.name
            )}
          </h2>

          <span class="status-pill">
            ${escapeHtml(
              project.project.status ||
              'Active'
            )}
          </span>

        </div>

        <div class="recognition-explorer">

          <div class="recognition-panel-heading">

            <h3>
              Project Explorer
            </h3>

            <span>
              ${
                rooms.length
                  ? `${rooms.length} rooms`
                  : 'Empty'
              }
            </span>

          </div>

          <div class="recognition-tree">
            ${explorerMarkup(
              project
            )}
          </div>

        </div>

        <button
          class="button recognition-back"
          type="button"
          data-back
        >
          ← Back to Project
        </button>

      </aside>

      <main class="recognition-main">

        <header class="recognition-main-header">

          <div>

            <p class="eyebrow">
              Project Workspace / Recognition
            </p>

            <h1>
              Source Document
            </h1>

            <p class="muted">
              Original PDF review and recognition
              preparation.
            </p>

            <div class="recognition-main-actions">

              <button
                class="button recognition-import-button"
                type="button"
                data-import
              >
                Import Designer PDF
              </button>

              <button
                class="button recognition-backup-button"
                type="button"
                data-backup
              >
                Open Backup PDF
              </button>

              <button
                class="button primary"
                type="button"
                data-pdf-viewer
                ${originalPdf ? '' : 'disabled'}
              >
                Open PDF Viewer
              </button>

              <button
                class="button"
                type="button"
                data-site-survey
              >
                Open Site Survey
              </button>

            </div>

          </div>

          <span class="recognition-boundary-label">
            Sprint 03
          </span>

        </header>

        <section class="recognition-document-panel">

          <div class="recognition-document-toolbar">

            <div>

              <strong>
                ${
                  originalPdf?.fileName ||
                  'Original PDF'
                }
              </strong>

              <span class="muted">
                ${
                  originalPdf
                    ? 'Designer source document'
                    : 'Source document'
                }
              </span>

            </div>

            <div class="recognition-page-controls">

              <button
                class="button"
                type="button"
                disabled
              >
                ‹ Previous
              </button>

              <span>
                ${
                  originalPdf
                    ? 'Open PDF Viewer to view the source document'
                    : 'Page not available'
                }
              </span>

              <button
                class="button"
                type="button"
                disabled
              >
                Next ›
              </button>

            </div>

          </div>

          ${renderPdfState(
            project
          )}

        </section>

        <section class="recognition-review-card">

          <div class="recognition-review-header">
            <div>
              <p class="eyebrow">Recognition Review</p>
              <h2>Review Saving</h2>
              <p class="muted">
                Save the current project review status and notes.
                Annotations and Site Survey remain separate records.
              </p>
            </div>

            <span class="status-pill" data-review-status>
              ${escapeHtml(recognitionReview.status || 'Draft')}
            </span>
          </div>

          <form class="recognition-review-form" data-review-form>
            <label>
              Review Status
              <select name="status">
                <option value="Draft" ${recognitionReview.status !== 'Saved' ? 'selected' : ''}>Draft</option>
                <option value="Saved" ${recognitionReview.status === 'Saved' ? 'selected' : ''}>Saved</option>
              </select>
            </label>

            <label>
              Review Notes
              <textarea name="notes" rows="5" placeholder="Record the current recognition review notes.">${escapeHtml(recognitionReview.notes || '')}</textarea>
            </label>

            <div class="recognition-review-actions">
              <span class="recognition-review-message" data-review-message aria-live="polite">
                ${recognitionReview.updatedAt ? `Last saved ${escapeHtml(recognitionReview.updatedAt)}` : 'No review saved yet.'}
              </span>
              <button class="button primary" type="submit" data-save-review>
                Save Review
              </button>
            </div>
          </form>

        </section>

        <section class="recognition-revision-card">

          <div class="recognition-revision-header">
            <div>
              <p class="eyebrow">Designer PDF</p>
              <h2>Revision History</h2>
              <p class="muted">
                Immutable Designer PDF revisions associated with this project.
              </p>
            </div>

            <span class="status-pill">
              ${designerRevisions.length} revision${designerRevisions.length === 1 ? '' : 's'}
            </span>
          </div>

          ${designerRevisions.length ? `
            <div class="recognition-revision-list">
              ${designerRevisions.map((revision) => `
                <article class="recognition-revision-row ${revision.id === currentRevisionId ? 'is-current' : ''}">
                  <div class="recognition-revision-row__title">
                    <strong>Revision ${escapeHtml(revision.revisionNumber)}</strong>
                    <span class="status-pill ${revision.id === currentRevisionId ? 'status-pill--current' : ''}">
                      ${revision.id === currentRevisionId ? 'Current' : 'Previous'}
                    </span>
                  </div>
                  <div class="recognition-revision-row__file">
                    ${escapeHtml(revision.fileName || 'Designer PDF')}
                  </div>
                  <dl class="recognition-revision-meta">
                    <div><dt>Status</dt><dd>${escapeHtml(revision.status || 'Not available')}</dd></div>
                    <div><dt>Size</dt><dd>${Number.isFinite(revision.size) ? `${(revision.size / 1024 / 1024).toFixed(1)} MB` : 'Not available'}</dd></div>
                    <div><dt>Imported</dt><dd>${escapeHtml(revision.importedAt || revision.createdAt || 'Not available')}</dd></div>
                  </dl>
                  <span class="recognition-revision-readonly">Read-only · ${escapeHtml(revision.storageKey || 'Storage not available')}</span>
                </article>
              `).join('')}
            </div>
          ` : `
            <div class="recognition-revision-empty">
              No Designer PDF revisions are recorded for this project.
            </div>
          `}

        </section>

      </main>

      <aside class="recognition-inspector">

        <div class="recognition-inspector-section">

          <p class="eyebrow">
            Recognition Status
          </p>

          <h3>
            ${
              originalPdf
                ? 'Source Available'
                : 'Not available'
            }
          </h3>

          <span class="status-pill">
            ${
              originalPdf
                ? 'Ready for Review'
                : 'Waiting for PDF'
            }
          </span>

          <p class="muted">
            ${
              originalPdf
                ? 'The Designer PDF is associated with this project.'
                : 'No source document has been provided.'
            }
          </p>

        </div>

        <div class="recognition-inspector-section">

          <p class="eyebrow">
            Review
          </p>

          <h3>
            Review Required
          </h3>

          <p class="muted">
            Review controls will become available
            when the PDF Viewer is implemented.
          </p>

        </div>

        <div class="recognition-inspector-section">

          <p class="eyebrow">
            Selected Item
          </p>

          <h3>
            None selected
          </h3>

          <p class="muted">
            No Room, Furniture, Cabinet,
            or recognition result is selected.
          </p>

        </div>

        <div class="recognition-inspector-section">

          <p class="eyebrow">
            Properties / Details
          </p>

          <dl class="recognition-details">

            <div>
              <dt>
                Project ID
              </dt>

              <dd>
                ${escapeHtml(
                  project.project.id
                )}
              </dd>
            </div>

            <div>
              <dt>
                Source
              </dt>

              <dd>
                ${
                  originalPdf?.fileName
                    ? escapeHtml(
                        originalPdf.fileName
                      )
                    : 'Not available'
                }
              </dd>
            </div>

            <div>
              <dt>
                Confirmation
              </dt>

              <dd>
                Not available
              </dd>
            </div>

          </dl>

        </div>

        <div class="recognition-confirmation">

          <strong>
            Confirmation boundary
          </strong>

          <span>
            Engineering Record and Furniture
            Object generation are not enabled
            in Sprint 03.
          </span>

        </div>

      </aside>

    </div>
  `;

  section
    .querySelector(
      '[data-back]'
    )
    .addEventListener(
      'click',
      () => {
        router.navigate(
          `/dashboard/${encodeURIComponent(
            projectId
          )}`
        );
      }
    );

  section
    .querySelector(
      '[data-import]'
    )
    .addEventListener(
      'click',
      () => {
        router.navigate(
          `/designer-pdf-import/${encodeURIComponent(
            projectId
          )}`
        );
      }
    );

  section
    .querySelector(
      '[data-backup]'
    )
    .addEventListener(
      'click',
      () => {
        router.navigate(
          `/backup-pdf/${encodeURIComponent(
            projectId
          )}`
        );
      }
    );

  section
    .querySelector(
      '[data-pdf-viewer]'
    )
    .addEventListener(
      'click',
      () => {
        router.navigate(
          `/pdf-viewer/${encodeURIComponent(
            projectId
          )}`
        );
      }
    );

  section
    .querySelector(
      '[data-site-survey]'
    )
    .addEventListener(
      'click',
      () => {
        router.navigate(
          `/site-survey/${encodeURIComponent(
            projectId
          )}`
        );
      }
    );

  const reviewForm =
    section.querySelector(
      '[data-review-form]'
    );

  const reviewButton =
    section.querySelector(
      '[data-save-review]'
    );

  const reviewMessage =
    section.querySelector(
      '[data-review-message]'
    );

  const reviewStatus =
    section.querySelector(
      '[data-review-status]'
    );

  reviewForm.addEventListener(
    'submit',
    async (event) => {
      event.preventDefault();

      reviewButton.disabled = true;
      reviewButton.textContent =
        'Saving…';
      reviewMessage.className =
        'recognition-review-message';
      reviewMessage.textContent =
        'Saving Review…';

      const formData =
        new FormData(reviewForm);

      try {
        await projectClient
          .saveRecognitionReview(
            projectId,
            {
              status:
                formData.get('status'),
              notes:
                formData.get('notes'),
            }
          );

        const refreshed =
          await projectClient.getProject(
            projectId
          );

        const savedReview =
          refreshed.recognitionReview;

        if (
          !savedReview?.updatedAt ||
          savedReview.projectId !== projectId
        ) {
          throw new Error(
            'Server did not persist Review data.'
          );
        }

        reviewForm.querySelector(
          '[name="status"]'
        ).value =
          savedReview.status;

        reviewForm.querySelector(
          '[name="notes"]'
        ).value =
          savedReview.notes || '';

        reviewStatus.textContent =
          savedReview.status;
        reviewMessage.className =
          'recognition-review-message success';
        reviewMessage.textContent =
          `Saved to project at ${savedReview.updatedAt}`;
      } catch (error) {
        reviewMessage.className =
          'recognition-review-message error';
        reviewMessage.textContent =
          error.message ||
          'Unable to save Review.';
      } finally {
        reviewButton.disabled = false;
        reviewButton.textContent =
          'Save Review';
      }
    }
  );

  return section;
}
