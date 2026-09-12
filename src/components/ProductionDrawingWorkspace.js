import { projectClient } from '../services/project-client.js';
import { prepareDrawingPreview } from '../services/production-drawing-preview-service.js';
import { preparePrintDocument } from '../services/production-drawing-print-service.js';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

export async function ProductionDrawingWorkspace({ projectId, router }) {
  const page = document.createElement('section');
  page.className = 'production-drawing-workspace-page';
  page.innerHTML = '<div class="production-drawing-loading">Loading Production Drawing Workspace...</div>';

  let projectResponse;
  let furnitureResponse;
  try {
    [projectResponse, furnitureResponse] = await Promise.all([
      projectClient.getProject(projectId),
      projectClient.listFurnitureObjects(projectId),
    ]);
  } catch (error) {
    page.innerHTML = `<div class="empty-state"><h2>Production Drawing Workspace unavailable</h2><p>${escapeHtml(error.message || 'Unable to load this Project.')}</p></div>`;
    return page;
  }

  const project = projectResponse.project || projectResponse;
  const furnitureObjects = (furnitureResponse.furnitureObjects || [])
    .filter((object) => object.lifecycleStatus !== 'Archived');
  let selectedObjectId = null;
  let generationStatus = 'Ready';
  let generatedDrawing = null;

  page.innerHTML = `<header class="production-drawing-header"><div><p class="eyebrow">Production Drawing Workspace</p><h1>${escapeHtml(project.name || projectId)}</h1><p class="muted">Project context · ${escapeHtml(projectId)}</p></div><button class="button" type="button" data-production-drawing-back>Back to Project</button></header><div class="production-drawing-layout"><aside class="production-drawing-tree"><div class="production-drawing-panel-heading"><div><p class="eyebrow">Project Tree</p><strong>${escapeHtml(project.name || projectId)}</strong></div><span data-production-object-count>${furnitureObjects.length}</span></div><p class="production-drawing-tree-path">Project / Furniture Objects / Drawing Set</p><div data-production-object-list></div></aside><main class="production-drawing-preview"><div class="production-drawing-toolbar"><strong>Drawing Workspace</strong><span>Read-only production documentation</span></div><div class="production-drawing-preview-surface"><div class="production-drawing-placeholder"><p class="eyebrow">Production Drawing Preview</p><h2 data-production-preview-title>No Furniture Object selected</h2><p data-production-preview-message>Select a Furniture Object to prepare the drawing workspace.</p><small data-production-preview-views>Runtime representation only; no drawing file is created.</small></div></div><div class="production-drawing-tool-shelf" aria-label="Drawing tools"><strong>Drawing tools</strong><button type="button" data-production-generate disabled>Generate Drawing</button><button type="button" data-production-assembly disabled>Generate Assembly Drawing</button><button type="button" data-production-preview disabled>Preview</button><button type="button" data-production-print-drawing disabled>Print Drawing</button><button type="button" data-production-print-package disabled>Print Production Package</button><button type="button" data-production-export-drawing disabled>Export PDF</button><button type="button" data-production-export-package disabled>Export Production Package PDF</button><button type="button" data-production-export-dwg disabled>Export DWG</button><button type="button" data-production-export-package-dwg disabled>Export Production Package DWG</button><button type="button" data-production-create-revision disabled>Create Revision</button><button type="button" data-production-view-revisions disabled>View Revision History</button></div></main><aside class="production-drawing-information"><p class="eyebrow">Drawing Information</p><div data-production-drawing-info><h2>No Selection</h2><p class="muted">No production drawing has been generated.</p></div><div class="production-drawing-status-card"><p class="eyebrow">Workspace Status</p><strong data-production-generation-status>Ready</strong><span data-production-generation-message>Generate a runtime representation from a Production Ready Furniture Object.</span></div><section class="production-drawing-revisions"><p class="eyebrow">Revision Management</p><div data-production-revision-summary>No revision is selected.</div><div data-production-revision-history><p class="muted">Revision history is available after a valid Drawing is generated.</p></div></section></aside></div>`;

  const objectList = page.querySelector('[data-production-object-list]');
  const objectCount = page.querySelector('[data-production-object-count]');
  const previewTitle = page.querySelector('[data-production-preview-title]');
  const previewMessage = page.querySelector('[data-production-preview-message]');
  const drawingInfo = page.querySelector('[data-production-drawing-info]');
  const generateButton = page.querySelector('[data-production-generate]');
  const assemblyButton = page.querySelector('[data-production-assembly]');
  assemblyButton.insertAdjacentHTML('afterend', '<button type="button" data-production-panel disabled>Generate Panel Drawing</button>');
  const panelButton = page.querySelector('[data-production-panel]');
  assemblyButton.insertAdjacentHTML('afterend', '<button type="button" data-production-door disabled>Generate Door Drawing</button>');
  const doorButton = page.querySelector('[data-production-door]');
  assemblyButton.insertAdjacentHTML('afterend', '<button type="button" data-production-drawer disabled>Generate Drawer Drawing</button>');
  const drawerButton = page.querySelector('[data-production-drawer]');
  assemblyButton.insertAdjacentHTML('afterend', '<button type="button" data-production-hardware disabled>Generate Hardware Layout</button>');
  const hardwareButton = page.querySelector('[data-production-hardware]');
  assemblyButton.insertAdjacentHTML('afterend', '<button type="button" data-production-package disabled>Generate Production Package</button>');
  const packageButton = page.querySelector('[data-production-package]');
  const generationStatusElement = page.querySelector('[data-production-generation-status]');
  const generationMessage = page.querySelector('[data-production-generation-message]');
  const previewViews = page.querySelector('[data-production-preview-views]');
  const previewSurface = page.querySelector('.production-drawing-preview-surface');
  const previewButton = page.querySelector('[data-production-preview]');
  const printDrawingButton = page.querySelector('[data-production-print-drawing]');
  const printPackageButton = page.querySelector('[data-production-print-package]');
  const exportDrawingButton = page.querySelector('[data-production-export-drawing]');
  const exportPackageButton = page.querySelector('[data-production-export-package]');
  const exportDwgButton = page.querySelector('[data-production-export-dwg]');
  const exportPackageDwgButton = page.querySelector('[data-production-export-package-dwg]');
  const createRevisionButton = page.querySelector('[data-production-create-revision]');
  const viewRevisionsButton = page.querySelector('[data-production-view-revisions]');
  const revisionSummary = page.querySelector('[data-production-revision-summary]');
  const revisionHistory = page.querySelector('[data-production-revision-history]');
  const printArea = document.createElement('section');
  printArea.dataset.productionPrintArea = '';
  page.appendChild(printArea);

  const drawingTypeForApi = (drawing) => drawing?.drawingType === 'Assembly Drawing' ? 'assembly'
    : drawing?.drawingType === 'Panel Drawing' ? 'panel'
      : drawing?.drawingType === 'Door Drawing' ? 'door'
        : drawing?.drawingType === 'Drawer Drawing' ? 'drawer'
          : drawing?.drawingType === 'Hardware Layout' ? 'hardware' : 'basic';

  const updateRevisionButtons = () => {
    const available = Boolean(generatedDrawing && selectedObjectId && generatedDrawing.contract === 'production-drawing-data');
    createRevisionButton.disabled = !available;
    viewRevisionsButton.disabled = !available;
  };

  const renderRevisionHistory = async () => {
    updateRevisionButtons();
    if (!generatedDrawing || !selectedObjectId || generatedDrawing.contract !== 'production-drawing-data') {
      revisionSummary.innerHTML = '<p class="muted">Revision history is unavailable until a valid Drawing is generated.</p>';
      revisionHistory.innerHTML = '';
      return;
    }
    try {
      const response = await projectClient.listProductionDrawingRevisions(projectId, selectedObjectId, generatedDrawing.drawingId);
      const revisions = response.revisions || [];
      const current = revisions[revisions.length - 1] || null;
      revisionSummary.innerHTML = current
        ? `<dl><div><dt>Current Revision</dt><dd>${escapeHtml(current.revisionNumber)}</dd></div><div><dt>Date</dt><dd>${escapeHtml(current.createdAt)}</dd></div><div><dt>Status</dt><dd>${escapeHtml(current.status)}</dd></div><div><dt>Previous Revision</dt><dd>${escapeHtml(current.previousRevisionId || 'None')}</dd></div></dl>`
        : '<p class="muted">No Revision has been created for this Drawing.</p>';
      revisionHistory.innerHTML = revisions.length
        ? revisions.map((revision) => `<article class="production-drawing-revision-record"><strong>${escapeHtml(revision.revisionNumber)}</strong><span>${escapeHtml(revision.createdAt)} · ${escapeHtml(revision.status)}</span><p>${escapeHtml(revision.changeSummary)}</p><small>Read-only · ${escapeHtml(revision.revisionId)}</small></article>`).join('')
        : '<p class="muted">Revision history is empty.</p>';
    } catch (error) {
      revisionSummary.innerHTML = `<p class="muted">Revision history unavailable: ${escapeHtml(error.message || 'Unknown error')}</p>`;
      revisionHistory.innerHTML = '';
    }
  };

  const updatePrintButtons = () => {
    printDrawingButton.disabled = true;
    printPackageButton.disabled = true;
    exportDrawingButton.disabled = true;
    exportPackageButton.disabled = true;
    exportDwgButton.disabled = true;
    exportPackageDwgButton.disabled = true;
    updateRevisionButtons();
    if (!generatedDrawing || !selectedObjectId) return;
    try {
      const prepared = preparePrintDocument(generatedDrawing, projectId, selectedObjectId);
      if (prepared.kind === 'package') {
        printPackageButton.disabled = false;
        exportPackageButton.disabled = false;
      } else {
        printDrawingButton.disabled = false;
        exportDrawingButton.disabled = false;
        exportDwgButton.disabled = false;
      }
    } catch (error) {
      updateStatus('Print Blocked', error.message || 'Print is not available for this output.');
    }
  };

  const renderPrintArea = (prepared) => {
    const dimensions = (value) => Object.entries(value || {}).filter(([key, item]) => key !== 'unit' && item !== undefined && item !== null).map(([key, item]) => `${key}: ${escapeHtml(item)}`).join(' · ') || 'Not Available';
    const rows = prepared.kind === 'package'
      ? prepared.drawings.map((drawing) => `<div class="production-print-view"><strong>${escapeHtml(drawing.drawingType || 'Drawing')}</strong><p>ID: ${escapeHtml(drawing.drawingId || 'Not Available')} · Status: ${escapeHtml(drawing.status || 'Not Available')}</p><p>Validation: ${escapeHtml(drawing.validation?.status || 'Not Available')} · Read-only: ${drawing.readOnly === true ? 'Yes' : 'No'}</p></div>`).join('')
      : prepared.views.map((view) => `<div class="production-print-view"><h2>${escapeHtml(view.label || view.type || 'Drawing View')}</h2><p>Dimensions: ${dimensions(view.dimensions)}</p></div>`).join('');
    const title = prepared.kind === 'package' ? 'Production Package' : prepared.drawingType;
    const object = prepared.kind === 'package' ? prepared.furnitureObjects[0] : prepared.furnitureObject;
    printArea.innerHTML = `<h1>Furniture GO · ${escapeHtml(title)}</h1><dl><dt>Project</dt><dd>${escapeHtml(prepared.project.name || prepared.projectId)}</dd><dt>Project ID</dt><dd>${escapeHtml(prepared.projectId || prepared.project.projectId)}</dd><dt>Furniture Object</dt><dd>${escapeHtml(object?.name || object?.objectId || 'Not Available')}</dd><dt>Furniture Object ID</dt><dd>${escapeHtml(object?.objectId || 'Not Available')}</dd><dt>Drawing / Package ID</dt><dd>${escapeHtml(prepared.drawingId || prepared.packageId || 'Not Available')}</dd><dt>Type</dt><dd>${escapeHtml(title)}</dd><dt>Status</dt><dd>${escapeHtml(prepared.status)}</dd><dt>Validation</dt><dd>${escapeHtml(prepared.validation.status)}</dd><dt>Read-only</dt><dd>Yes</dd></dl><h2>Drawing Views / References</h2>${rows}${prepared.kind === 'drawing' ? `<h2>Details</h2><p>Components: ${prepared.components.length} · Hardware: ${prepared.hardware.references?.length || 0} · Material: ${prepared.material.references?.length || 0} · Annotations: ${prepared.annotations.length} · Processing: ${prepared.processing.length}</p>` : `<p>Furniture Objects: ${prepared.furnitureObjects.length} · Drawings: ${prepared.drawingCount}</p>`}`;
  };

  const printCurrent = (kind) => {
    if (!generatedDrawing || !selectedObjectId) return;
    try {
      const prepared = preparePrintDocument(generatedDrawing, projectId, selectedObjectId);
      if ((kind === 'package' && prepared.kind !== 'package') || (kind === 'drawing' && prepared.kind !== 'drawing')) throw new Error('The selected output does not match the requested print action.');
      renderPrintArea(prepared);
      if (typeof window === 'undefined' || typeof window.print !== 'function') {
        updateStatus('Print Blocked', 'Browser/system print is unavailable in the current environment.');
        return;
      }
      updateStatus('Print Ready', 'Opening the browser/system print flow for the read-only print area.');
      window.print();
    } catch (error) {
      updateStatus('Print Blocked', error.message || 'Printing is blocked for this output.');
    }
  };

  const renderDrawingPreview = (drawing, viewId = null) => {
    let model;
    try {
      model = prepareDrawingPreview(drawing, projectId, selectedObjectId, viewId);
    } catch (error) {
      previewButton.disabled = true;
      previewMessage.textContent = error.message || 'Drawing Preview is blocked.';
      previewViews.textContent = `Preview blocked: ${error.code || 'DRAWING_DATA_INVALID'}`;
      updateStatus('Failed', error.message || 'Drawing Preview is blocked.');
      return false;
    }
    previewButton.disabled = false;
    updatePrintButtons();
    previewTitle.textContent = `${model.drawingType} · ${model.furnitureObject.name || model.furnitureObject.objectId}`;
    previewMessage.textContent = `Read-only preview · ${model.status} · ${model.validation.status}`;
    previewViews.textContent = model.views.map((view) => view.label).join(' · ');
    const controls = previewSurface.querySelector('[data-production-preview-controls]') || document.createElement('div');
    controls.dataset.productionPreviewControls = '';
    controls.setAttribute('aria-label', 'Drawing views');
    controls.innerHTML = model.views.map((view) => `<button type="button" data-production-preview-view="${escapeHtml(view.id)}"${view.id === model.view.id ? ' disabled' : ''}>${escapeHtml(view.label)}</button>`).join('');
    controls.querySelectorAll('[data-production-preview-view]').forEach((button) => {
      button.onclick = () => renderDrawingPreview(drawing, button.dataset.productionPreviewView);
    });
    if (!controls.parentElement) previewSurface.appendChild(controls);
    const canvas = previewSurface.querySelector('[data-production-preview-canvas]') || document.createElement('div');
    canvas.dataset.productionPreviewCanvas = '';
    const dimensions = Object.entries(model.view.dimensions || {}).filter(([key, value]) => key !== 'unit' && value !== undefined && value !== null).map(([key, value]) => `${key}: ${escapeHtml(value)}`).join(' · ');
    const componentCount = model.components.length;
    const hardwareCount = model.hardware.references?.length || 0;
    const annotationCount = model.annotations.length;
    canvas.innerHTML = `<div class="production-drawing-preview-card"><strong>${escapeHtml(model.view.label || model.view.type || 'Drawing View')}</strong><p>${dimensions || 'Dimensions: Not Available'}</p><p>Components: ${componentCount} · Hardware: ${hardwareCount} · Annotations: ${annotationCount}</p><p class="production-drawing-read-only">Read-only visual representation. No dimensions, positions or engineering data were changed.</p></div>`;
    if (!canvas.parentElement) previewSurface.appendChild(canvas);
    drawingInfo.innerHTML = `<h2>${escapeHtml(model.drawingType)}</h2><dl><div><dt>Project</dt><dd>${escapeHtml(model.project.name || model.project.projectId)}</dd></div><div><dt>Project ID</dt><dd><code>${escapeHtml(model.project.projectId)}</code></dd></div><div><dt>Furniture Object</dt><dd>${escapeHtml(model.furnitureObject.name || model.furnitureObject.objectId)}</dd></div><div><dt>Drawing ID</dt><dd><code>${escapeHtml(model.drawingId)}</code></dd></div><div><dt>Validation</dt><dd>${escapeHtml(model.validation.status)}</dd></div><div><dt>Read-only</dt><dd>Yes</dd></div><div><dt>Source</dt><dd>${escapeHtml(model.source.sourceType || 'Not Available')}</dd></div></dl>`;
    return true;
  };

  const updateStatus = (status, message) => {
    generationStatus = status;
    generationStatusElement.textContent = status;
    generationMessage.textContent = message;
  };

  previewButton.onclick = () => {
    if (generatedDrawing) renderDrawingPreview(generatedDrawing);
  };

  const renderSelection = () => {
    const selected = furnitureObjects.find((object) => object.objectId === selectedObjectId) || null;
    generatedDrawing = null;
    updatePrintButtons();
    previewButton.disabled = true;
    previewSurface.querySelector('[data-production-preview-controls]')?.remove();
    previewSurface.querySelector('[data-production-preview-canvas]')?.remove();
    generateButton.disabled = !selected;
    assemblyButton.disabled = !selected;
    panelButton.disabled = !selected;
    doorButton.disabled = !selected;
    drawerButton.disabled = !selected;
    hardwareButton.disabled = !selected;
    packageButton.disabled = !selected;
    objectList.innerHTML = furnitureObjects.length
      ? furnitureObjects.map((object) => `<button type="button" class="production-drawing-object-row${object.objectId === selectedObjectId ? ' is-selected' : ''}" data-production-object-id="${escapeHtml(object.objectId)}"><strong>${escapeHtml(object.name || 'Unnamed Furniture Object')}</strong><small>${escapeHtml(object.objectType || 'Type unavailable')} · ${escapeHtml(object.productionStatus || 'Status unavailable')}</small><code>${escapeHtml(object.objectId)}</code></button>`).join('')
      : '<div class="production-drawing-empty">No Furniture Objects available</div>';
    objectList.querySelectorAll('[data-production-object-id]').forEach((button) => {
      button.onclick = () => {
        selectedObjectId = button.dataset.productionObjectId;
        renderSelection();
      };
    });

    if (!selected) {
      previewTitle.textContent = 'No Furniture Object selected';
      previewMessage.textContent = furnitureObjects.length ? 'Select a Furniture Object to prepare the drawing workspace.' : 'No Furniture Objects available for production documentation.';
      drawingInfo.innerHTML = '<h2>No Selection</h2><p class="muted">No production drawing has been generated.</p>';
      previewViews.textContent = 'Runtime representation only; no drawing file is created.';
      updateStatus('Ready', furnitureObjects.length ? 'Select a Furniture Object to generate a runtime representation.' : 'No Furniture Objects available.');
      return;
    }

    previewTitle.textContent = selected.name || 'Unnamed Furniture Object';
    previewMessage.textContent = 'Select Generate Drawing to create the basic standardized representation.';
    previewViews.textContent = 'Front / Elevation · Side / Profile · Top / Plan';
    drawingInfo.innerHTML = `<h2>${escapeHtml(selected.name || 'Unnamed Furniture Object')}</h2><dl><div><dt>Object ID</dt><dd><code>${escapeHtml(selected.objectId)}</code></dd></div><div><dt>Object Type</dt><dd>${escapeHtml(selected.objectType || 'Not defined')}</dd></div><div><dt>Production Status</dt><dd>${escapeHtml(selected.productionStatus || 'Not defined')}</dd></div><div><dt>Drawing Status</dt><dd>Not generated</dd></div></dl><p class="production-drawing-read-only">Read-only workspace shell. Confirmed production information will be presented by later tasks.</p>`;
    updateStatus('Ready', 'Generation uses this Project’s current Furniture Object only.');
  };

  assemblyButton.onclick = async () => {
    if (!selectedObjectId) return;
    assemblyButton.disabled = true;
    panelButton.disabled = true;
    doorButton.disabled = true;
    drawerButton.disabled = true;
    hardwareButton.disabled = true;
    generateButton.disabled = true;
    updateStatus('Generating', 'Validating the selected assembly hierarchy and building a runtime representation.');
    try {
      const response = await projectClient.generateProductionDrawing(projectId, selectedObjectId, 'assembly');
      generatedDrawing = response.drawing || response;
      const assemblyData = generatedDrawing.assembly || generatedDrawing;
      renderDrawingPreview(generatedDrawing);
      previewTitle.textContent = 'Assembly Drawing';
      previewMessage.textContent = 'Read-only assembly representation from the authoritative Furniture Object hierarchy.';
      previewViews.textContent = `Root: ${escapeHtml(assemblyData.rootObjectId)} · Components: ${assemblyData.metadata.objectCount} · Levels: ${assemblyData.metadata.hierarchyDepth}`;
      drawingInfo.innerHTML = `<h2>Assembly Drawing</h2><dl><div><dt>Root Object</dt><dd><code>${escapeHtml(assemblyData.rootObjectId)}</code></dd></div><div><dt>Components</dt><dd>${assemblyData.metadata.objectCount}</dd></div><div><dt>Hierarchy Depth</dt><dd>${assemblyData.metadata.hierarchyDepth}</dd></div><div><dt>Hardware References</dt><dd>${generatedDrawing.hardware?.references?.length || 0}</dd></div><div><dt>Validation</dt><dd>${escapeHtml(generatedDrawing.validation?.status || 'Unavailable')}</dd></div><div><dt>Drawing Status</dt><dd>${escapeHtml(generatedDrawing.status)}</dd></div></dl><p class="production-drawing-read-only">Logical assembly view only; no physical installation coordinates or drawing file were created.</p>`;
      updateStatus('Generated', 'Assembly hierarchy is ready as a runtime-only representation.');
    } catch (error) {
      generatedDrawing = null;
      updateStatus('Failed', error.message || 'Assembly drawing generation failed.');
      drawingInfo.innerHTML = `<h2>Assembly Generation Failed</h2><p class="muted">${escapeHtml(error.message || 'Unable to generate assembly drawing.')}</p>`;
    } finally {
      assemblyButton.disabled = !selectedObjectId;
      panelButton.disabled = !selectedObjectId;
      doorButton.disabled = !selectedObjectId;
      drawerButton.disabled = !selectedObjectId;
      hardwareButton.disabled = !selectedObjectId;
      generateButton.disabled = !selectedObjectId;
    }
  };

  doorButton.onclick = async () => {
    if (!selectedObjectId) return;
    doorButton.disabled = true;
    generateButton.disabled = true;
    assemblyButton.disabled = true;
    panelButton.disabled = true;
    drawerButton.disabled = true;
    hardwareButton.disabled = true;
    updateStatus('Generating', 'Validating confirmed door components and building a read-only door drawing.');
    try {
      const response = await projectClient.generateProductionDrawing(projectId, selectedObjectId, 'door');
      generatedDrawing = response.drawing || response;
      renderDrawingPreview(generatedDrawing);
      previewTitle.textContent = 'Door Drawing';
      previewMessage.textContent = 'Read-only door drawing from confirmed Furniture Object component data.';
      previewViews.textContent = generatedDrawing.views.map((view) => `${view.label}: ${view.dimensions.width} × ${view.dimensions.height}${view.dimensions.thickness ? ` × ${view.dimensions.thickness}` : ''}`).join(' · ');
      drawingInfo.innerHTML = `<h2>Door Drawing</h2><dl><div><dt>Parent Object</dt><dd><code>${escapeHtml(generatedDrawing.furnitureObject.objectId)}</code></dd></div><div><dt>Doors</dt><dd>${generatedDrawing.door.doors.length}</dd></div><div><dt>Material References</dt><dd>${generatedDrawing.material.references.length}</dd></div><div><dt>Hardware References</dt><dd>${generatedDrawing.hardware.references.length}</dd></div><div><dt>Validation</dt><dd>${escapeHtml(generatedDrawing.validation.status)}</dd></div><div><dt>Drawing Status</dt><dd>${escapeHtml(generatedDrawing.status)}</dd></div></dl><p class="production-drawing-read-only">Confirmed door dimensions and references only; no hinge or door deduction was calculated.</p>`;
      updateStatus('Generated', 'Door drawing is ready as a read-only runtime representation.');
    } catch (error) {
      generatedDrawing = null;
      updateStatus('Failed', error.message || 'Door drawing generation failed.');
      drawingInfo.innerHTML = `<h2>Door Drawing Blocked</h2><p class="muted">${escapeHtml(error.message || 'Unable to generate door drawing.')}</p>`;
    } finally {
      doorButton.disabled = !selectedObjectId;
      assemblyButton.disabled = !selectedObjectId;
      panelButton.disabled = !selectedObjectId;
      drawerButton.disabled = !selectedObjectId;
      hardwareButton.disabled = !selectedObjectId;
      generateButton.disabled = !selectedObjectId;
    }
  };

  panelButton.onclick = async () => {
    if (!selectedObjectId) return;
    panelButton.disabled = true;
    drawerButton.disabled = true;
    hardwareButton.disabled = true;
    generateButton.disabled = true;
    assemblyButton.disabled = true;
    updateStatus('Generating', 'Validating confirmed panel components and building a read-only panel drawing.');
    try {
      const response = await projectClient.generateProductionDrawing(projectId, selectedObjectId, 'panel');
      generatedDrawing = response.drawing || response;
      renderDrawingPreview(generatedDrawing);
      previewTitle.textContent = 'Panel Drawing';
      previewMessage.textContent = 'Read-only panel drawing from confirmed Furniture Object component data.';
      previewViews.textContent = generatedDrawing.views.map((view) => `${view.label}: ${view.dimensions.width} × ${view.dimensions.height} × ${view.dimensions.depth}`).join(' · ');
      drawingInfo.innerHTML = `<h2>Panel Drawing</h2><dl><div><dt>Parent Object</dt><dd><code>${escapeHtml(generatedDrawing.furnitureObject.objectId)}</code></dd></div><div><dt>Panels</dt><dd>${generatedDrawing.panel.panels.length}</dd></div><div><dt>Material References</dt><dd>${generatedDrawing.panel.panels.reduce((count, panel) => count + panel.material.references.length, 0)}</dd></div><div><dt>Validation</dt><dd>${escapeHtml(generatedDrawing.validation.status)}</dd></div><div><dt>Drawing Status</dt><dd>${escapeHtml(generatedDrawing.status)}</dd></div></dl><p class="production-drawing-read-only">Confirmed component dimensions only; no panel deduction or production formula was created.</p>`;
      updateStatus('Generated', 'Panel drawing is ready as a read-only runtime representation.');
    } catch (error) {
      generatedDrawing = null;
      updateStatus('Failed', error.message || 'Panel drawing generation failed.');
      drawingInfo.innerHTML = `<h2>Panel Drawing Blocked</h2><p class="muted">${escapeHtml(error.message || 'Unable to generate panel drawing.')}</p>`;
    } finally {
      panelButton.disabled = !selectedObjectId;
      drawerButton.disabled = !selectedObjectId;
      hardwareButton.disabled = !selectedObjectId;
      assemblyButton.disabled = !selectedObjectId;
      generateButton.disabled = !selectedObjectId;
    }
  };

  drawerButton.onclick = async () => {
    if (!selectedObjectId) return;
    drawerButton.disabled = true;
    generateButton.disabled = true;
    assemblyButton.disabled = true;
    panelButton.disabled = true;
    doorButton.disabled = true;
    hardwareButton.disabled = true;
    updateStatus('Generating', 'Validating confirmed drawer components and building a read-only drawer drawing.');
    try {
      const response = await projectClient.generateProductionDrawing(projectId, selectedObjectId, 'drawer');
      generatedDrawing = response.drawing || response;
      renderDrawingPreview(generatedDrawing);
      previewTitle.textContent = 'Drawer Drawing';
      previewMessage.textContent = 'Read-only drawer drawing from confirmed Furniture Object component data.';
      previewViews.textContent = generatedDrawing.views.map((view) => `${view.label}: ${view.dimensions.width} × ${view.dimensions.height} × ${view.dimensions.depth}`).join(' · ');
      const formulaStatus = generatedDrawing.formula?.status || 'Unavailable';
      drawingInfo.innerHTML = `<h2>Drawer Drawing</h2><dl><div><dt>Parent Object</dt><dd><code>${escapeHtml(generatedDrawing.furnitureObject.objectId)}</code></dd></div><div><dt>Drawers</dt><dd>${generatedDrawing.drawer.drawers.length}</dd></div><div><dt>Material References</dt><dd>${generatedDrawing.material.references.length}</dd></div><div><dt>Hardware References</dt><dd>${generatedDrawing.hardware.references.length}</dd></div><div><dt>Formula / Rule Status</dt><dd>${escapeHtml(formulaStatus)}</dd></div><div><dt>Validation</dt><dd>${escapeHtml(generatedDrawing.validation.status)}</dd></div><div><dt>Drawing Status</dt><dd>${escapeHtml(generatedDrawing.status)}</dd></div></dl><p class="production-drawing-read-only">Confirmed drawer dimensions and references only; no drawer deduction was calculated.</p>`;
      updateStatus('Generated', 'Drawer drawing is ready as a read-only runtime representation.');
    } catch (error) {
      generatedDrawing = null;
      updateStatus('Failed', error.message || 'Drawer drawing generation failed.');
      drawingInfo.innerHTML = `<h2>Drawer Drawing Blocked</h2><p class="muted">${escapeHtml(error.message || 'Unable to generate drawer drawing.')}</p>`;
    } finally {
      drawerButton.disabled = !selectedObjectId;
      generateButton.disabled = !selectedObjectId;
      assemblyButton.disabled = !selectedObjectId;
      panelButton.disabled = !selectedObjectId;
      doorButton.disabled = !selectedObjectId;
      hardwareButton.disabled = !selectedObjectId;
    }
  };

  hardwareButton.onclick = async () => {
    if (!selectedObjectId) return;
    hardwareButton.disabled = true;
    generateButton.disabled = true;
    assemblyButton.disabled = true;
    panelButton.disabled = true;
    doorButton.disabled = true;
    drawerButton.disabled = true;
    updateStatus('Generating', 'Validating confirmed hardware references and building a read-only hardware layout.');
    try {
      const response = await projectClient.generateProductionDrawing(projectId, selectedObjectId, 'hardware');
      generatedDrawing = response.drawing || response;
      renderDrawingPreview(generatedDrawing);
      previewTitle.textContent = 'Hardware Layout';
      previewMessage.textContent = 'Read-only hardware reference layout from the authoritative Furniture Object.';
      previewViews.textContent = generatedDrawing.hardware.references.map((item) => `${item.name} · ${item.productCode || 'Product code unavailable'}`).join(' · ');
      const verifiedRules = generatedDrawing.hardware.references.filter((item) => item.engineeringRule).length;
      drawingInfo.innerHTML = `<h2>Hardware Layout</h2><dl><div><dt>Parent Object</dt><dd><code>${escapeHtml(generatedDrawing.furnitureObject.objectId)}</code></dd></div><div><dt>Hardware References</dt><dd>${generatedDrawing.hardware.references.length}</dd></div><div><dt>Verified Rules</dt><dd>${verifiedRules}</dd></div><div><dt>Validation</dt><dd>${escapeHtml(generatedDrawing.validation.status)}</dd></div><div><dt>Drawing Status</dt><dd>${escapeHtml(generatedDrawing.status)}</dd></div></dl><p class="production-drawing-read-only">Reference and specification information only; no quantity, coordinates, hole positions or drilling operations were inferred.</p>`;
      updateStatus('Generated', 'Hardware reference layout is ready as a read-only runtime representation.');
    } catch (error) {
      generatedDrawing = null;
      updateStatus('Failed', error.message || 'Hardware layout generation failed.');
      drawingInfo.innerHTML = `<h2>Hardware Layout Blocked</h2><p class="muted">${escapeHtml(error.message || 'Unable to generate hardware layout.')}</p>`;
    } finally {
      hardwareButton.disabled = !selectedObjectId;
      generateButton.disabled = !selectedObjectId;
      assemblyButton.disabled = !selectedObjectId;
      panelButton.disabled = !selectedObjectId;
      doorButton.disabled = !selectedObjectId;
      drawerButton.disabled = !selectedObjectId;
    }
  };

  packageButton.onclick = async () => {
    if (!selectedObjectId) return;
    packageButton.disabled = true;
    generateButton.disabled = true;
    assemblyButton.disabled = true;
    panelButton.disabled = true;
    doorButton.disabled = true;
    drawerButton.disabled = true;
    hardwareButton.disabled = true;
    updateStatus('Generating', 'Collecting validated read-only Drawing references into a Production Package.');
    try {
      const response = await projectClient.generateProductionPackage(projectId, selectedObjectId);
      generatedDrawing = response.package || response;
      updatePrintButtons();
      previewTitle.textContent = 'Production Package';
      previewMessage.textContent = generatedDrawing.status === 'Generated' ? 'Production Package Ready · read-only drawing references.' : 'Production Package Incomplete · missing Drawing references are shown explicitly.';
      previewViews.textContent = generatedDrawing.drawings.map((drawing) => `${drawing.drawingType || drawing.drawingType} · ${drawing.status}`).join(' · ');
      drawingInfo.innerHTML = `<h2>Production Package</h2><dl><div><dt>Package ID</dt><dd><code>${escapeHtml(generatedDrawing.packageId)}</code></dd></div><div><dt>Project</dt><dd>${escapeHtml(generatedDrawing.project.name || generatedDrawing.projectId)}</dd></div><div><dt>Furniture Objects</dt><dd>${generatedDrawing.furnitureObjects.length}</dd></div><div><dt>Drawings</dt><dd>${generatedDrawing.drawingCount}</dd></div><div><dt>Drawing Types</dt><dd>${escapeHtml(generatedDrawing.drawingTypes.join(', ') || 'None')}</dd></div><div><dt>Validation</dt><dd>${escapeHtml(generatedDrawing.validation.status)}</dd></div><div><dt>Package Status</dt><dd>${escapeHtml(generatedDrawing.status)}</dd></div><div><dt>Read-only</dt><dd>Yes</dd></div></dl><p class="production-drawing-read-only">Runtime package of existing Drawing references only; no Drawing data was recalculated or persisted.</p>`;
      updateStatus(generatedDrawing.status === 'Generated' ? 'Generated' : 'Incomplete', generatedDrawing.status === 'Generated' ? 'Production Package Ready.' : 'Production Package contains explicit missing Drawing references.');
    } catch (error) {
      generatedDrawing = null;
      updateStatus('Failed', error.message || 'Production Package generation failed.');
      drawingInfo.innerHTML = `<h2>Production Package Blocked</h2><p class="muted">${escapeHtml(error.message || 'Unable to generate Production Package.')}</p>`;
    } finally {
      packageButton.disabled = !selectedObjectId;
      generateButton.disabled = !selectedObjectId;
      assemblyButton.disabled = !selectedObjectId;
      panelButton.disabled = !selectedObjectId;
      doorButton.disabled = !selectedObjectId;
      drawerButton.disabled = !selectedObjectId;
      hardwareButton.disabled = !selectedObjectId;
    }
  };

  printDrawingButton.onclick = () => printCurrent('drawing');
  printPackageButton.onclick = () => printCurrent('package');

  const exportDrawing = async (kind) => {
    if (!generatedDrawing || !selectedObjectId) return;
    try {
      const prepared = preparePrintDocument(generatedDrawing, projectId, selectedObjectId);
      if ((kind === 'package' && prepared.kind !== 'package') || (kind === 'drawing' && prepared.kind !== 'drawing')) throw new Error('The selected output does not match the requested PDF export.');
      const drawingType = prepared.kind === 'package'
        ? 'package'
        : prepared.drawingType === 'Assembly Drawing' ? 'assembly'
          : prepared.drawingType === 'Panel Drawing' ? 'panel'
            : prepared.drawingType === 'Door Drawing' ? 'door'
              : prepared.drawingType === 'Drawer Drawing' ? 'drawer'
                : prepared.drawingType === 'Hardware Layout' ? 'hardware' : 'basic';
      updateStatus('Exporting', 'Validating the read-only output and creating an offline PDF file.');
      const result = await projectClient.exportProductionDrawingPdf(projectId, selectedObjectId, drawingType);
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(url);
      updateStatus('PDF Ready', `${result.filename} was generated from the validated read-only output.`);
    } catch (error) {
      updateStatus('PDF Export Blocked', error.message || 'PDF Export is blocked for this output.');
    }
  };

  exportDrawingButton.onclick = () => exportDrawing('drawing');
  exportPackageButton.onclick = () => exportDrawing('package');

  const exportDwgDrawing = async () => {
    if (!generatedDrawing || !selectedObjectId) return;
    try {
      const prepared = preparePrintDocument(generatedDrawing, projectId, selectedObjectId);
      if (prepared.kind !== 'drawing') throw new Error('DWG Export is unavailable for Production Package output.');
      const drawingType = prepared.drawingType === 'Assembly Drawing' ? 'assembly'
        : prepared.drawingType === 'Panel Drawing' ? 'panel'
          : prepared.drawingType === 'Door Drawing' ? 'door'
            : prepared.drawingType === 'Drawer Drawing' ? 'drawer'
              : prepared.drawingType === 'Hardware Layout' ? 'hardware' : 'basic';
      updateStatus('Exporting', 'Validating the read-only drawing and creating an offline DWG file.');
      const result = await projectClient.exportProductionDrawingDwg(projectId, selectedObjectId, drawingType);
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(url);
      updateStatus('DWG Ready', `${result.filename} was generated from the validated read-only drawing.`);
    } catch (error) {
      updateStatus('DWG Export Unavailable', error.message || 'DWG Export is unavailable for this output.');
    }
  };

  exportDwgButton.onclick = exportDwgDrawing;
  exportPackageDwgButton.onclick = () => updateStatus('DWG Export Unavailable', 'Production Package DWG composition is not safely supported.');

  createRevisionButton.onclick = async () => {
    if (!generatedDrawing || !selectedObjectId || generatedDrawing.contract !== 'production-drawing-data') return;
    createRevisionButton.disabled = true;
    try {
      const response = await projectClient.createProductionDrawingRevision(projectId, selectedObjectId, drawingTypeForApi(generatedDrawing), 'Drawing regenerated');
      const revision = response.revision || response;
      updateStatus('Revision Created', `${revision.revisionNumber} was created as a read-only Revision Record.`);
      await renderRevisionHistory();
    } catch (error) {
      updateStatus('Revision Blocked', error.message || 'Revision creation is unavailable for this Drawing.');
    } finally {
      updateRevisionButtons();
    }
  };

  viewRevisionsButton.onclick = renderRevisionHistory;

  generateButton.onclick = async () => {
    if (!selectedObjectId) return;
    generateButton.disabled = true;
    updateStatus('Generating', 'Validating the selected Furniture Object and building runtime views.');
    try {
      const response = await projectClient.generateProductionDrawing(projectId, selectedObjectId);
      generatedDrawing = response.drawing || response;
      renderDrawingPreview(generatedDrawing);
      const unit = generatedDrawing.dimensions.unit ? ` ${generatedDrawing.dimensions.unit}` : '';
      previewTitle.textContent = 'Basic Furniture Object Drawing';
      previewMessage.textContent = 'Generated runtime representation from the authoritative Furniture Object dimensions.';
      previewViews.textContent = generatedDrawing.views.map((view) => {
        const viewDimensions = view.dimensions || {};
        const size = viewDimensions.depth === undefined
          ? `${viewDimensions.width} × ${viewDimensions.height}`
          : `${viewDimensions.width} × ${viewDimensions.height} × ${viewDimensions.depth}`;
        return `${view.label}: ${size}${unit}`;
      }).join(' · ');
      drawingInfo.innerHTML = `<h2>Generated Drawing</h2><dl><div><dt>Object ID</dt><dd><code>${escapeHtml(generatedDrawing.objectId)}</code></dd></div><div><dt>Drawing Type</dt><dd>${escapeHtml(generatedDrawing.drawingType)}</dd></div><div><dt>Dimensions</dt><dd>${generatedDrawing.dimensions.width} × ${generatedDrawing.dimensions.height} × ${generatedDrawing.dimensions.depth}${escapeHtml(unit)}</dd></div><div><dt>Views</dt><dd>${generatedDrawing.views.length}</dd></div><div><dt>Drawing Status</dt><dd>${escapeHtml(generatedDrawing.status)}</dd></div></dl><p class="production-drawing-read-only">Runtime-only representation. No drawing data was persisted.</p>`;
      updateStatus('Generated', 'Basic Front, Side and Top views are ready for later task-specific preview work.');
    } catch (error) {
      generatedDrawing = null;
      updateStatus('Failed', error.message || 'Drawing generation failed.');
      drawingInfo.innerHTML = `<h2>Generation Failed</h2><p class="muted">${escapeHtml(error.message || 'Unable to generate drawing.')}</p>`;
    } finally {
      generateButton.disabled = !selectedObjectId;
    }
  };

  objectCount.textContent = String(furnitureObjects.length);
  page.querySelector('[data-production-drawing-back]').onclick = () => router.navigate(`/dashboard/${encodeURIComponent(projectId)}`);
  renderSelection();
  return page;
}

export default ProductionDrawingWorkspace;
