import { projectClient } from '../services/project-client.js';

const PDF_JS_URL =
  '/node_modules/pdfjs-dist/build/pdf.min.js';

const PDF_WORKER_URL =
  '/node_modules/pdfjs-dist/build/pdf.worker.min.js';

const MIN_ZOOM = 50;
const MAX_ZOOM = 200;
const ZOOM_STEP = 25;

let pdfJsPromise = null;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

function loadPdfJs() {
  if (window.pdfjsLib) {
    return Promise.resolve(window.pdfjsLib);
  }

  if (pdfJsPromise) {
    return pdfJsPromise;
  }

  pdfJsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = PDF_JS_URL;
    script.async = true;

    script.onload = () => {
      if (!window.pdfjsLib) {
        reject(new Error('PDF.js failed to initialize.'));
        return;
      }

      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        PDF_WORKER_URL;

      resolve(window.pdfjsLib);
    };

    script.onerror = () => {
      reject(new Error('PDF.js library could not be loaded.'));
    };

    document.head.appendChild(script);
  });

  return pdfJsPromise;
}

function getCurrentDesignerRevision(project) {
  const documents = project?.projectDocuments || {};
  const revisions = Array.isArray(documents.designerRevisions)
    ? documents.designerRevisions
    : [];

  return revisions.find(
    (revision) => revision.id === documents.currentDesignerRevisionId
  ) || null;
}

function formatBytes(value) {
  const size = Number(value);
  return Number.isFinite(size) && size >= 0
    ? `${size.toLocaleString()} bytes`
    : 'Not available';
}

function formatDate(value) {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not available'
    : date.toLocaleString();
}

function setViewerState(section, state, message = '') {
  const loading = section.querySelector('[data-viewer-loading]');
  const error = section.querySelector('[data-viewer-error]');
  const pageLayer = section.querySelector('[data-page-layer]');

  if (loading) loading.hidden = state !== 'loading';
  if (error) {
    error.hidden = state !== 'error';
    error.textContent = message;
  }
  if (pageLayer) pageLayer.hidden = state !== 'ready';
}

function updatePageControls(section, currentPage, numPages, busy) {
  const pageIndicator = section.querySelector('[data-page-indicator]');
  const previous = section.querySelector('[data-previous-page]');
  const next = section.querySelector('[data-next-page]');

  if (pageIndicator) {
    pageIndicator.textContent = `${currentPage} / ${numPages}`;
  }

  if (previous) {
    previous.disabled = busy || currentPage <= 1;
  }

  if (next) {
    next.disabled = busy || currentPage >= numPages;
  }
}

function updateZoomControls(section, zoomPercent, busy) {
  const zoomLevel =
    section.querySelector('[data-zoom-level]');

  const zoomOut =
    section.querySelector('[data-zoom-out]');

  const zoomIn =
    section.querySelector('[data-zoom-in]');

  const fit =
    section.querySelector('[data-fit]');

  if (zoomLevel) {
    zoomLevel.textContent = `${zoomPercent}%`;
  }

  if (zoomOut) {
    zoomOut.disabled =
      busy || zoomPercent <= MIN_ZOOM;
  }

  if (zoomIn) {
    zoomIn.disabled =
      busy || zoomPercent >= MAX_ZOOM;
  }

  if (fit) {
    fit.disabled = busy;
  }
}

export async function PdfViewer({
  projectId,
  router,
  pdfType = 'original',
}) {
  const isBackup = pdfType === 'backup';
  const documentTitle = isBackup ? 'Backup PDF' : 'Original Designer PDF';
  const documentSubtitle = isBackup ? 'Editable engineering working copy' : 'Read-only source document';
  const section = document.createElement('section');
  section.className = `page pdf-viewer-page ${isBackup ? 'pdf-viewer-page--backup' : ''}`;

  section.innerHTML = `
    <div class="pdf-viewer-shell">
      <header class="pdf-viewer-header">
        <button class="back-link" type="button" data-back>
          ← Recognition Workspace
        </button>
        <div class="pdf-viewer-header__content">
          <div>
            <p class="eyebrow">Project Workspace / Recognition / PDF Viewer</p>
            <h1>${documentTitle} Workspace</h1>
            <p class="muted" data-project-name>Loading project…</p>
          </div>
          <span class="recognition-boundary-label">Sprint 03 · Task 04</span>
        </div>
      </header>

      <main class="pdf-viewer-main ${isBackup ? 'pdf-viewer-main--backup' : ''}">
        <section class="pdf-viewer-panel">
          <div class="pdf-viewer-toolbar">
            <div class="pdf-viewer-toolbar__document">
              <strong>${documentTitle}</strong>
              <span class="muted">${documentSubtitle}</span>
            </div>

            <div class="pdf-viewer-page-controls" aria-label="Page navigation">
              <button
                class="button"
                type="button"
                data-previous-page
                disabled
              >
                Previous
              </button>
              <span class="pdf-viewer-page-indicator" data-page-indicator>
                Loading
              </span>
              <button
                class="button"
                type="button"
                data-next-page
                disabled
              >
                Next
              </button>
            </div>

            <div class="pdf-viewer-zoom-controls" aria-label="Zoom controls">
              <button
                class="button"
                type="button"
                data-zoom-out
                disabled
                aria-label="Zoom out"
              >
                −
              </button>
              <span class="pdf-viewer-zoom-level" data-zoom-level>
                100%
              </span>
              <button
                class="button"
                type="button"
                data-zoom-in
                disabled
                aria-label="Zoom in"
              >
                +
              </button>
              <button
                class="button"
                type="button"
                data-fit
                disabled
              >
                Fit
              </button>
            </div>

            <div class="pdf-viewer-annotation-controls" aria-label="Annotation tools">
              <button class="button is-active" type="button" data-tool="select">
                Select
              </button>
              <button class="button" type="button" data-tool="pen">Pen</button>
              <button class="button" type="button" data-tool="pencil">Pencil</button>
              <button class="button" type="button" data-tool="highlighter">Highlighter</button>
              <button class="button" type="button" data-tool="text">
                Text
              </button>
              <button class="button" type="button" data-tool="rectangle">
                Rectangle
              </button>
              <button class="button" type="button" data-tool="circle">Circle</button>
              <button class="button" type="button" data-tool="arrow">
                Arrow
              </button>
              <button class="button" type="button" data-tool="dimension">Dimension</button>
              <button class="button" type="button" data-tool="eraser">Eraser</button>
              <label class="pdf-ink-control">
                Color
                <input type="color" data-ink-color value="#111827" />
              </label>
              <label class="pdf-ink-control">
                Width
                <select data-ink-width>
                  <option value="2">2</option>
                  <option value="4" selected>4</option>
                  <option value="8">8</option>
                  <option value="12">12</option>
                </select>
              </label>
              <button class="button" type="button" data-undo disabled>Undo</button>
              <button class="button" type="button" data-redo disabled>Redo</button>
              <button class="button" type="button" data-delete-annotation disabled>
                Delete
              </button>
              <button class="button" type="button" data-clear-page disabled>
                Clear Page
              </button>
            </div>

            <span class="status-pill">${isBackup ? 'Editable workspace' : 'Read-only'}</span>
          </div>

          <div class="pdf-viewer-stage">
            <div class="pdf-viewer-loading" data-viewer-loading role="status">
              Loading Original Designer PDF…
            </div>
            <div class="pdf-viewer-error" data-viewer-error role="alert" hidden></div>
            <div class="pdf-viewer-page-layer" data-page-layer hidden>
              <canvas class="pdf-viewer-canvas" data-pdf-canvas></canvas>
              <div
                class="pdf-viewer-annotation-overlay"
                data-annotation-overlay
                aria-label="Viewer annotations"
              ></div>
            </div>
          </div>
        </section>

        <aside class="pdf-viewer-inspector" ${isBackup ? 'hidden' : ''}>
          <section class="pdf-viewer-inspector__section">
            <p class="eyebrow">Document Status</p>
            <h3 data-document-status>Loading</h3>
            <span class="status-pill" data-document-status-pill>Read-only</span>
            <p class="muted" data-document-status-note>
              Reading the current Designer Revision.
            </p>
          </section>

          <section class="pdf-viewer-inspector__section">
            <p class="eyebrow">Current Designer Revision</p>
            <dl class="pdf-viewer-details">
              <div><dt>File name</dt><dd data-revision-file-name>Loading</dd></div>
              <div><dt>Revision</dt><dd data-revision-number>Loading</dd></div>
              <div><dt>Status</dt><dd data-revision-status>Loading</dd></div>
              <div><dt>Size</dt><dd data-revision-size>Loading</dd></div>
              <div><dt>Imported</dt><dd data-revision-imported-at>Loading</dd></div>
            </dl>
          </section>

          <div class="pdf-viewer-boundary">
            <strong>Read-only Original Designer PDF</strong>
            <span>
              This viewer only reads and renders the Original Designer PDF.
              It does not edit, annotate, replace, or save changes.
            </span>
          </div>
        </aside>
      </main>
    </div>
  `;

  section.querySelector('[data-back]').addEventListener('click', () => {
    router.navigate(`/recognition/${encodeURIComponent(projectId)}`);
  });

  let currentPage = 1;
  let numPages = 0;
  let pdfDocument = null;
  let rendering = false;
  let zoomPercent = 100;
  let panX = 0;
  let panY = 0;
  let panSession = null;
  let drawSession = null;
  let toolMode = 'select';
  let selectedAnnotationId = null;
  let annotations = [];
  let undoStack = [];
  let redoStack = [];
  let draftAnnotation = null;
  let annotationDragSession = null;

  const canvas = section.querySelector('[data-pdf-canvas]');
  const context = canvas.getContext('2d');
  const stage = section.querySelector('.pdf-viewer-stage');
  const pageLayer = section.querySelector('[data-page-layer]');
  const annotationOverlay = section.querySelector('[data-annotation-overlay]');
  const previousButton = section.querySelector('[data-previous-page]');
  const nextButton = section.querySelector('[data-next-page]');
  const zoomOutButton = section.querySelector('[data-zoom-out]');
  const zoomInButton = section.querySelector('[data-zoom-in]');
  const fitButton = section.querySelector('[data-fit]');
  const deleteButton = section.querySelector('[data-delete-annotation]');
  const clearPageButton = section.querySelector('[data-clear-page]');
  const undoButton = section.querySelector('[data-undo]');
  const redoButton = section.querySelector('[data-redo]');
  const inkColorInput = section.querySelector('[data-ink-color]');
  const inkWidthInput = section.querySelector('[data-ink-width]');

  const cloneAnnotations = () =>
    JSON.parse(JSON.stringify(annotations));

  const updateHistoryControls = () => {
    undoButton.disabled = !undoStack.length;
    redoButton.disabled = !redoStack.length;
  };

  const persistAnnotations = async () => {
    if (!isBackup) return;
    await projectClient.saveBackupPdfAnnotations(
      projectId,
      annotations
    );
  };

  const beginChange = () => {
    undoStack.push(cloneAnnotations());
    if (undoStack.length > 50) undoStack.shift();
    redoStack = [];
    updateHistoryControls();
  };

  const finishChange = () => {
    void persistAnnotations().catch(showError);
  };

  const applyPan = () => {
    pageLayer.style.transform =
      `translate(${panX}px, ${panY}px)`;
  };

  const resetPan = () => {
    panX = 0;
    panY = 0;
    applyPan();
  };

  const clampPan = () => {
    const maxX = Math.max(
      (pageLayer.getBoundingClientRect().width - stage.clientWidth) / 2,
      0
    );

    const maxY = Math.max(
      (pageLayer.getBoundingClientRect().height - stage.clientHeight) / 2,
      0
    );

    panX = Math.min(Math.max(panX, -maxX), maxX);
    panY = Math.min(Math.max(panY, -maxY), maxY);
    applyPan();
  };

  const pagePoint = (event) => {
    const bounds = pageLayer.getBoundingClientRect();

    return {
      x: Math.min(
        Math.max((event.clientX - bounds.left) / bounds.width, 0),
        1
      ),
      y: Math.min(
        Math.max((event.clientY - bounds.top) / bounds.height, 0),
        1
      ),
      pressure: Number.isFinite(event.pressure) ? event.pressure : null,
    };
  };

  const normalizedRect = (start, end) => ({
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.max(Math.abs(end.x - start.x), .01),
    height: Math.max(Math.abs(end.y - start.y), .01),
  });

  const renderAnnotations = () => {
    const pageAnnotations = annotations.filter(
      (annotation) => annotation.page === currentPage
    );

    const visibleAnnotations = draftAnnotation
      ? [...pageAnnotations, draftAnnotation]
      : pageAnnotations;

    annotationOverlay.innerHTML = visibleAnnotations
      .map((annotation) => {
        const selected =
          annotation.id === selectedAnnotationId;

        const style = [
          `left:${annotation.x * 100}%`,
          `top:${annotation.y * 100}%`,
          `width:${annotation.width * 100}%`,
          `height:${annotation.height * 100}%`,
        ].join(';');

        if (
          ['pen', 'pencil', 'highlighter'].includes(annotation.type) &&
          Array.isArray(annotation.points) &&
          annotation.points.length > 1
        ) {
          const points = annotation.points
            .map((point) => `${point.x * 100},${point.y * 100}`)
            .join(' ');
          const strokeWidth = Number(annotation.strokeWidth || 4);
          const opacity = annotation.type === 'highlighter' ? .35 : 1;
          return `
            <div
              class="pdf-annotation pdf-annotation--stroke ${selected ? 'is-selected' : ''}"
              data-annotation-id="${escapeHtml(annotation.id)}"
              style="left:0;top:0;width:100%;height:100%;"
            >
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <polyline points="${points}" fill="none" stroke="${escapeHtml(annotation.color || '#111827')}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" vector-effect="non-scaling-stroke" />
              </svg>
            </div>
          `;
        }

        if (['text', 'note'].includes(annotation.type)) {
          return `
            <div
              class="pdf-annotation pdf-annotation--text ${selected ? 'is-selected' : ''}"
              data-annotation-id="${escapeHtml(annotation.id)}"
              style="${style}"
            >${escapeHtml(annotation.text)}</div>
          `;
        }

        if (annotation.type === 'dimension') {
          const startX = annotation.start?.x ?? annotation.x;
          const startY = annotation.start?.y ?? annotation.y;
          const endX = annotation.end?.x ?? annotation.x + annotation.width;
          const endY = annotation.end?.y ?? annotation.y + annotation.height;
          return `
            <div class="pdf-annotation pdf-annotation--dimension ${selected ? 'is-selected' : ''}" data-annotation-id="${escapeHtml(annotation.id)}" style="left:0;top:0;width:100%;height:100%;">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <line x1="${startX * 100}" y1="${startY * 100}" x2="${endX * 100}" y2="${endY * 100}" />
                <text x="${((startX + endX) / 2) * 100}" y="${((startY + endY) / 2) * 100 - 2}">${escapeHtml(annotation.value || '')}</text>
              </svg>
            </div>
          `;
        }

        if (annotation.type === 'arrow') {
          const startX = annotation.startX ?? annotation.x;
          const startY = annotation.startY ?? annotation.y;
          const endX = annotation.endX ?? annotation.x + annotation.width;
          const endY = annotation.endY ?? annotation.y + annotation.height;
          const lineX1 = ((startX - annotation.x) / annotation.width) * 100;
          const lineY1 = ((startY - annotation.y) / annotation.height) * 100;
          const lineX2 = ((endX - annotation.x) / annotation.width) * 100;
          const lineY2 = ((endY - annotation.y) / annotation.height) * 100;

          return `
            <div
              class="pdf-annotation pdf-annotation--arrow ${selected ? 'is-selected' : ''}"
              data-annotation-id="${escapeHtml(annotation.id)}"
              style="${style}"
            >
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <marker id="arrowhead-${escapeHtml(annotation.id)}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L7,3 z" fill="currentColor" />
                  </marker>
                </defs>
                <line x1="${lineX1}" y1="${lineY1}" x2="${lineX2}" y2="${lineY2}" marker-end="url(#arrowhead-${escapeHtml(annotation.id)})" />
              </svg>
            </div>
          `;
        }

        const shapeClass = annotation.type === 'circle'
          ? 'pdf-annotation--circle'
          : 'pdf-annotation--rectangle';
        return `
          <div
            class="pdf-annotation ${shapeClass} ${selected ? 'is-selected' : ''}"
            data-annotation-id="${escapeHtml(annotation.id)}"
            style="${style}"
          ></div>
        `;
      })
      .join('');

    annotationOverlay
      .querySelectorAll('[data-annotation-id]')
      .forEach((element) => {
        element.addEventListener('pointerdown', (event) => {
          event.stopPropagation();

          if (toolMode !== 'select') return;

          const annotation = annotations.find(
            (item) => item.id === element.dataset.annotationId
          );

          if (!annotation) return;

          selectedAnnotationId = annotation.id;
          beginChange();
          annotationDragSession = {
            annotation,
            element,
            start: pagePoint(event),
            originX: annotation.x,
            originY: annotation.y,
            originStartX: annotation.startX,
            originStartY: annotation.startY,
            originEndX: annotation.endX,
            originEndY: annotation.endY,
          };

          element.classList.add('is-selected');
          deleteButton.disabled = false;
          element.setPointerCapture(event.pointerId);
        });

        element.addEventListener('pointermove', (event) => {
          if (
            !annotationDragSession ||
            annotationDragSession.element !== element
          ) {
            return;
          }

          const point = pagePoint(event);
          const deltaX = point.x - annotationDragSession.start.x;
          const deltaY = point.y - annotationDragSession.start.y;
          const annotation = annotationDragSession.annotation;

          annotation.x = Math.min(
            Math.max(annotationDragSession.originX + deltaX, 0),
            1 - annotation.width
          );
          annotation.y = Math.min(
            Math.max(annotationDragSession.originY + deltaY, 0),
            1 - annotation.height
          );

          if (annotation.type === 'arrow') {
            const appliedDeltaX =
              annotation.x - annotationDragSession.originX;
            const appliedDeltaY =
              annotation.y - annotationDragSession.originY;

            annotation.startX =
              (annotationDragSession.originStartX ?? annotationDragSession.originX) +
              appliedDeltaX;
            annotation.endX =
              (annotationDragSession.originEndX ?? annotationDragSession.originX) +
              appliedDeltaX;
            annotation.startY =
              (annotationDragSession.originStartY ?? annotationDragSession.originY) +
              appliedDeltaY;
            annotation.endY =
              (annotationDragSession.originEndY ?? annotationDragSession.originY) +
              appliedDeltaY;
          }

          element.style.left = `${annotation.x * 100}%`;
          element.style.top = `${annotation.y * 100}%`;
        });

        const endAnnotationDrag = (event) => {
          if (
            !annotationDragSession ||
            annotationDragSession.element !== element
          ) {
            return;
          }

          annotationDragSession.annotation.updatedAt =
            new Date().toISOString();
          annotationDragSession = null;
          finishChange();

          if (element.hasPointerCapture(event.pointerId)) {
            element.releasePointerCapture(event.pointerId);
          }
        };

        element.addEventListener('pointerup', endAnnotationDrag);
        element.addEventListener('pointercancel', endAnnotationDrag);

        element.addEventListener('click', (event) => {
          event.stopPropagation();

          if (toolMode === 'select') {
            selectedAnnotationId =
              element.dataset.annotationId;
            renderAnnotations();
          }
        });
      });

    deleteButton.disabled = !selectedAnnotationId;
    clearPageButton.disabled = !pageAnnotations.length;
  };

  const renderPage = async (pageNumber) => {
    if (!pdfDocument || rendering) return;

    rendering = true;
    updatePageControls(section, currentPage, numPages, true);
    updateZoomControls(section, zoomPercent, true);
    setViewerState(section, 'loading');
    resetPan();

    try {
      const page = await pdfDocument.getPage(pageNumber);
      const unscaledViewport = page.getViewport({ scale: 1 });
      const availableWidth = Math.max(
        stage.clientWidth - 32,
        320
      );
      const fitScale =
        availableWidth / unscaledViewport.width;

      const scale =
        fitScale * (zoomPercent / 100);

      const viewport = page.getViewport({ scale });

      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      canvas.style.width = `${canvas.width}px`;
      canvas.style.height = `${canvas.height}px`;
      pageLayer.style.width = `${canvas.width}px`;
      pageLayer.style.height = `${canvas.height}px`;

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      currentPage = pageNumber;
      renderAnnotations();
      setViewerState(section, 'ready');
    } finally {
      rendering = false;
      updatePageControls(section, currentPage, numPages, false);
      updateZoomControls(section, zoomPercent, false);
    }
  };

  previousButton.addEventListener('click', () => {
    if (!rendering && currentPage > 1) {
      selectedAnnotationId = null;
      draftAnnotation = null;
      void renderPage(currentPage - 1).catch(showError);
    }
  });

  nextButton.addEventListener('click', () => {
    if (!rendering && currentPage < numPages) {
      selectedAnnotationId = null;
      draftAnnotation = null;
      void renderPage(currentPage + 1).catch(showError);
    }
  });

  zoomOutButton.addEventListener('click', () => {
    if (rendering || zoomPercent <= MIN_ZOOM) return;

    zoomPercent = Math.max(
      MIN_ZOOM,
      zoomPercent - ZOOM_STEP
    );

    void renderPage(currentPage).catch(showError);
  });

  zoomInButton.addEventListener('click', () => {
    if (rendering || zoomPercent >= MAX_ZOOM) return;

    zoomPercent = Math.min(
      MAX_ZOOM,
      zoomPercent + ZOOM_STEP
    );

    void renderPage(currentPage).catch(showError);
  });

  fitButton.addEventListener('click', () => {
    if (rendering) return;

    zoomPercent = 100;
    void renderPage(currentPage).catch(showError);
  });

  const createAnnotationId = () =>
    `annotation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const createTextAnnotation = (event) => {
    const point = pagePoint(event);
    const text = window.prompt('Annotation text');

    if (!text?.trim()) return;

    const width = .24;
    const height = .06;

    const annotation = {
      id: createAnnotationId(),
      type: 'note',
      page: currentPage,
      x: Math.min(point.x, 1 - width),
      y: Math.min(point.y, 1 - height),
      width,
      height,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    beginChange();
    annotations.push(annotation);
    finishChange();
    selectedAnnotationId = annotation.id;
    renderAnnotations();
  };

  const finishDrawing = (event) => {
    if (!drawSession) return;

    const point = pagePoint(event);
    const rect = normalizedRect(drawSession.start, point);
    const now = new Date().toISOString();
    const annotation = {
      id: createAnnotationId(),
      type: drawSession.type,
      page: currentPage,
      ...rect,
      createdAt: now,
      updatedAt: now,
    };

    if (['pen', 'pencil', 'highlighter'].includes(drawSession.type)) {
      annotation.points = drawSession.points;
      annotation.color = inkColorInput.value;
      annotation.strokeWidth = Number(inkWidthInput.value);
    }

    if (drawSession.type === 'dimension') {
      const value = window.prompt('Dimension value');
      if (!value?.trim()) {
        drawSession = null;
        draftAnnotation = null;
        stage.classList.remove('is-annotating');
        return;
      }
      annotation.value = value.trim();
      annotation.unit = 'mm';
      annotation.start = { x: drawSession.start.x, y: drawSession.start.y };
      annotation.end = { x: point.x, y: point.y };
    }

    if (drawSession.type === 'arrow') {
      annotation.startX = drawSession.start.x;
      annotation.startY = drawSession.start.y;
      annotation.endX = point.x;
      annotation.endY = point.y;
    }

    beginChange();
    annotations.push(annotation);
    finishChange();
    selectedAnnotationId = annotation.id;
    drawSession = null;
    draftAnnotation = null;
    stage.classList.remove('is-annotating');

    if (stage.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
    }

    renderAnnotations();
  };

  const updateDrawing = (event) => {
    if (!drawSession) return;

    const point = pagePoint(event);
    const rect = normalizedRect(drawSession.start, point);

    draftAnnotation = {
      id: 'draft-annotation',
      type: drawSession.type,
      page: currentPage,
      ...rect,
      startX: drawSession.start.x,
      startY: drawSession.start.y,
      endX: point.x,
      endY: point.y,
    };

    if (['pen', 'pencil', 'highlighter'].includes(drawSession.type)) {
      draftAnnotation.points = drawSession.points;
      draftAnnotation.color = inkColorInput.value;
      draftAnnotation.strokeWidth = Number(inkWidthInput.value);
    }

    renderAnnotations();
  };

  stage.addEventListener('pointerdown', (event) => {
    if (rendering || pageLayer.hidden) return;

    if (toolMode === 'eraser') {
      eraseAtPoint(pagePoint(event));
      return;
    }

    if (toolMode === 'text') {
      createTextAnnotation(event);
      return;
    }

    if (
      ['rectangle', 'circle', 'arrow', 'dimension', 'pen', 'pencil', 'highlighter'].includes(toolMode)
    ) {
      drawSession = {
        type: toolMode,
        start: pagePoint(event),
        points: [pagePoint(event)],
      };
      stage.setPointerCapture(event.pointerId);
      stage.classList.add('is-annotating');
      updateDrawing(event);
      return;
    }

    panSession = {
      startX: event.clientX,
      startY: event.clientY,
      originX: panX,
      originY: panY,
      moved: false,
    };

    stage.setPointerCapture(event.pointerId);
    stage.classList.add('is-panning');
  });

  stage.addEventListener('pointermove', (event) => {
    if (drawSession) {
      if (['pen', 'pencil', 'highlighter'].includes(drawSession.type)) {
        drawSession.points.push(pagePoint(event));
      }
      updateDrawing(event);
      return;
    }

    if (!panSession) return;

    panSession.moved =
      panSession.moved ||
      Math.abs(event.clientX - panSession.startX) > 3 ||
      Math.abs(event.clientY - panSession.startY) > 3;

    panX =
      panSession.originX +
      event.clientX -
      panSession.startX;

    panY =
      panSession.originY +
      event.clientY -
      panSession.startY;

    clampPan();
  });

  const endPointerAction = (event) => {
    if (drawSession) {
      finishDrawing(event);
      return;
    }

    if (!panSession) return;

    const wasClick = !panSession.moved;
    panSession = null;
    stage.classList.remove('is-panning');

    if (
      event?.pointerId !== undefined &&
      stage.hasPointerCapture(event.pointerId)
    ) {
      stage.releasePointerCapture(event.pointerId);
    }

    if (wasClick) {
      selectedAnnotationId = null;
      renderAnnotations();
    }
  };

  stage.addEventListener('pointerup', endPointerAction);
  stage.addEventListener('pointercancel', endPointerAction);

  section.querySelectorAll('[data-tool]').forEach((button) => {
    button.addEventListener('click', () => {
      toolMode = button.dataset.tool;

      section.querySelectorAll('[data-tool]').forEach((item) => {
        item.classList.toggle('is-active', item === button);
      });
    });
  });

  deleteButton.addEventListener('click', () => {
    if (!selectedAnnotationId) return;

    beginChange();
    annotations = annotations.filter(
      (annotation) => annotation.id !== selectedAnnotationId
    );
    selectedAnnotationId = null;
    renderAnnotations();
    finishChange();
  });

  clearPageButton.addEventListener('click', () => {
    if (!annotations.some((annotation) => annotation.page === currentPage)) return;
    beginChange();
    annotations = annotations.filter(
      (annotation) => annotation.page !== currentPage
    );
    selectedAnnotationId = null;
    renderAnnotations();
    finishChange();
  });

  undoButton.addEventListener('click', () => {
    if (!undoStack.length) return;
    redoStack.push(cloneAnnotations());
    annotations = undoStack.pop();
    selectedAnnotationId = null;
    updateHistoryControls();
    renderAnnotations();
    finishChange();
  });

  redoButton.addEventListener('click', () => {
    if (!redoStack.length) return;
    undoStack.push(cloneAnnotations());
    annotations = redoStack.pop();
    selectedAnnotationId = null;
    updateHistoryControls();
    renderAnnotations();
    finishChange();
  });

  const eraseAtPoint = (point) => {
    const index = annotations.findIndex((annotation) => {
      if (annotation.page !== currentPage) return false;
      const width = annotation.width || .04;
      const height = annotation.height || .04;
      return point.x >= annotation.x - width * .5 &&
        point.x <= annotation.x + width * 1.5 &&
        point.y >= annotation.y - height * .5 &&
        point.y <= annotation.y + height * 1.5;
    });
    if (index < 0) return;
    beginChange();
    annotations.splice(index, 1);
    selectedAnnotationId = null;
    renderAnnotations();
    finishChange();
  };

  function showError(error) {
    rendering = false;
    updatePageControls(section, currentPage, numPages, false);
    section.querySelector('[data-document-status]').textContent = 'Unavailable';
    section.querySelector('[data-document-status-pill]').textContent = 'Error';
    section.querySelector('[data-document-status-note]').textContent =
      `${documentTitle} could not be rendered.`;
    setViewerState(
      section,
      'error',
      error.message || `Unable to render the ${documentTitle}.`
    );
  }

  const loadViewer = async () => {
    try {
      const project = await projectClient.getProject(projectId);
      const revision = getCurrentDesignerRevision(project);
      const backup = project?.projectDocuments?.backupPdf;

      if (!isBackup && !revision) {
        throw new Error('Current Designer PDF revision is not available.');
      }

      if (isBackup && !backup?.storageKey) {
        throw new Error('Backup PDF is not available for this project.');
      }

      const pdfUrl = isBackup
        ? projectClient.getBackupPdfUrl(projectId)
        : projectClient.getOriginalPdfUrl(projectId);
      const response = await fetch(pdfUrl, {
        method: 'GET',
        headers: { Accept: 'application/pdf' },
      });

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/pdf')) {
        throw new Error(
          `${documentTitle} could not be loaded (${response.status}).`
        );
      }

      const pdfBytes = await response.arrayBuffer();
      const pdfJs = await loadPdfJs();
      pdfDocument = await pdfJs.getDocument({ data: pdfBytes }).promise;
      numPages = pdfDocument.numPages;

      if (isBackup) {
        const annotationResponse =
          await projectClient.getBackupPdfAnnotations(projectId);
        annotations = Array.isArray(annotationResponse.annotations)
          ? annotationResponse.annotations
          : [];
        updateHistoryControls();
      }

      if (!numPages) {
        throw new Error(`The ${documentTitle} has no pages.`);
      }

      section.querySelector('[data-project-name]').textContent =
        `${project.project.name} · Source document viewer`;
      section.querySelector('[data-document-status]').textContent = 'Available';
      section.querySelector('[data-document-status-note]').textContent =
        isBackup
          ? 'Backup PDF loaded from project storage.'
          : 'Current Designer Revision loaded from project storage.';
      section.querySelector('[data-revision-file-name]').textContent =
        (isBackup ? backup.fileName : revision.fileName) || 'Not available';
      section.querySelector('[data-revision-number]').textContent =
        isBackup
          ? `Source Revision ${revision?.revisionNumber ?? 'Not available'}`
          : revision.revisionNumber ?? 'Not available';
      section.querySelector('[data-revision-status]').textContent =
        (isBackup ? backup.status : revision.status) || 'Not available';
      section.querySelector('[data-revision-size]').textContent =
        formatBytes(isBackup ? backup.size : revision.size);
      section.querySelector('[data-revision-imported-at]').textContent =
        formatDate(isBackup ? backup.createdAt : revision.importedAt);

      updatePageControls(section, currentPage, numPages, true);
      updateZoomControls(section, zoomPercent, true);
      await renderPage(1);
    } catch (error) {
      showError(error);
    }
  };

  void loadViewer();
  return section;
}
