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

function fileSize(bytes) {
  if (!Number.isFinite(bytes)) {
    return 'Not available';
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export async function DesignerPdfImport({
  projectId,
  router,
}) {
  const project =
    await projectClient.getProject(projectId);

  const section =
    document.createElement('section');

  section.className =
    'page designer-pdf-import-page';

  section.innerHTML = `
    <div class="pdf-import-shell">

      <header class="pdf-import-header">

        <button
          class="back-link"
          type="button"
          data-back
        >
          ← Recognition Workspace
        </button>

        <div class="pdf-import-header__content">

          <div>

            <p class="eyebrow">
              Project Workspace / Recognition / Import
            </p>

            <h1>
              Import Designer PDF
            </h1>

            <p class="muted">
              ${escapeHtml(project.project.name)}
              · Original Designer PDF remains
              read-only after import.
            </p>

          </div>

          <span class="recognition-boundary-label">
            Sprint 03 · Task 01
          </span>

        </div>

      </header>

      <main class="pdf-import-main">

        <section class="pdf-import-panel">

          <div class="pdf-import-panel__intro">

            <div class="recognition-empty-icon">
              PDF
            </div>

            <div>

              <p class="eyebrow">
                Designer source document
              </p>

              <h2>
                Select a Designer PDF
              </h2>

              <p>
                Choose the official Designer PDF
                for this project.
              </p>

              <p class="muted">
                The original drawing is the source
                document and must not be modified.
              </p>

            </div>

          </div>

          <label
            class="pdf-import-dropzone"
            data-dropzone
          >

            <input
              type="file"
              accept="application/pdf,.pdf"
              data-file-input
            />

            <span class="pdf-import-dropzone__icon">
              ＋
            </span>

            <strong>
              Choose Designer PDF
            </strong>

            <small>
              PDF only
            </small>

            <small>
              The file will be inspected locally
              before import confirmation.
            </small>

          </label>

          <div
            class="pdf-import-file-state"
            data-file-state
          >

            <div class="pdf-import-file-state__empty">

              <strong>
                No PDF selected
              </strong>

              <span>
                No Designer PDF is currently
                selected.
              </span>

            </div>

          </div>

        </section>

        <aside class="pdf-import-aside">

          <section class="pdf-import-aside__section">

            <p class="eyebrow">
              Current Project
            </p>

            <h3>
              ${escapeHtml(project.project.name)}
            </h3>

            <span class="status-pill">
              ${escapeHtml(
                project.project.status ||
                'Active'
              )}
            </span>

          </section>

          <section class="pdf-import-aside__section">

            <p class="eyebrow">
              Import Status
            </p>

            <h3 data-import-status>
              Not selected
            </h3>

            <p class="muted">
              Select a PDF to continue.
            </p>

          </section>

          <section class="pdf-import-aside__section">

            <p class="eyebrow">
              Original PDF Rules
            </p>

            <ul>
              <li>
                Official Designer drawing
              </li>

              <li>
                Read-only after import
              </li>

              <li>
                Remains associated with this project
              </li>

              <li>
                Used as the source for Backup PDF
              </li>
            </ul>

          </section>

          <button
            class="button primary"
            type="button"
            data-confirm
            disabled
          >
            Confirm Import
          </button>

          <p
            class="pdf-import-confirmation"
            data-confirmation
          >
            Select a valid PDF before confirming
            the Designer PDF import.
          </p>

        </aside>

      </main>

    </div>
  `;

  const input =
    section.querySelector('[data-file-input]');

  const state =
    section.querySelector('[data-file-state]');

  const confirmButton =
    section.querySelector('[data-confirm]');

  const importStatus =
    section.querySelector('[data-import-status]');

  const confirmation =
    section.querySelector('[data-confirmation]');

  let selectedFile = null;

  function showEmptyState() {
    state.innerHTML = `
      <div class="pdf-import-file-state__empty">

        <strong>
          No PDF selected
        </strong>

        <span>
          No Designer PDF is currently
          selected.
        </span>

      </div>
    `;

    importStatus.textContent =
      'Not selected';

    confirmButton.disabled = true;

    confirmation.textContent =
      'Select a valid PDF before confirming the Designer PDF import.';
  }

  function showInvalidState(message) {
    state.innerHTML = `
      <div class="pdf-import-file-state__empty">

        <strong>
          PDF required
        </strong>

        <span>
          ${escapeHtml(message)}
        </span>

      </div>
    `;

    importStatus.textContent =
      'Invalid file';

    confirmButton.disabled = true;

    confirmation.textContent =
      'Please select a valid PDF file.';
  }

  function showSelectedState(file) {
    state.innerHTML = `
      <div class="pdf-import-file-card">

        <div class="recognition-empty-icon">
          PDF
        </div>

        <div>

          <strong>
            ${escapeHtml(file.name)}
          </strong>

          <span>
            ${escapeHtml(fileSize(file.size))}
            · Selected locally
          </span>

          <small>
            Ready for import confirmation.
          </small>

        </div>

        <span class="status-pill">
          Ready
        </span>

      </div>
    `;

    importStatus.textContent =
      'Ready to import';

    confirmButton.disabled = false;

    confirmation.textContent =
      'Confirming will associate this Designer PDF with the current project.';
  }

  input.addEventListener('change', () => {
    const file =
      input.files?.[0];

    selectedFile = null;

    if (!file) {
      showEmptyState();
      return;
    }

    const isPdf =
      file.type === 'application/pdf' ||
      file.name
        .toLowerCase()
        .endsWith('.pdf');

    if (!isPdf) {
      showInvalidState(
        'Please select a .pdf file.'
      );
      return;
    }

    selectedFile = file;

    showSelectedState(file);
  });

  confirmButton.addEventListener(
    'click',
    async () => {
      if (!selectedFile) {
        return;
      }

      confirmButton.disabled = true;

      importStatus.textContent =
        'Importing…';

      confirmation.textContent =
        'Saving the Designer PDF to this project…';

      try {
        await projectClient.importDesignerPdf(
          projectId,
          selectedFile
        );

        importStatus.textContent =
          'Imported';

        confirmation.textContent =
          'Designer PDF imported successfully.';

        state.innerHTML = `
          <div class="pdf-import-file-card">

            <div class="recognition-empty-icon">
              PDF
            </div>

            <div>

              <strong>
                ${escapeHtml(
                  selectedFile.name
                )}
              </strong>

              <span>
                ${escapeHtml(
                  fileSize(selectedFile.size)
                )}
                · Imported
              </span>

              <small>
                Original PDF is now associated
                with this project.
              </small>

            </div>

            <span class="status-pill">
              Imported
            </span>

          </div>
        `;

      } catch (error) {
        importStatus.textContent =
          'Import unavailable';

        confirmation.textContent =
          error.message ||
          'Designer PDF import failed.';

        confirmButton.disabled = false;
      }
    }
  );

  section
    .querySelector('[data-back]')
    .addEventListener('click', () => {
      router.navigate(
        `/recognition/${encodeURIComponent(
          projectId
        )}`
      );
    });

  return section;
}