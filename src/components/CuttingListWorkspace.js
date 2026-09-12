import { projectClient } from '../services/project-client.js';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

function formatDimensions(dimensions) {
  if (!dimensions || ['width', 'height'].some((field) => !Number.isFinite(Number(dimensions[field])) || Number(dimensions[field]) <= 0)) return 'Unavailable';
  const depth = Number.isFinite(Number(dimensions.depth)) && Number(dimensions.depth) > 0 ? ` × ${dimensions.depth}` : '';
  const thickness = Number.isFinite(Number(dimensions.thickness)) && Number(dimensions.thickness) > 0 ? ` · thickness ${dimensions.thickness}` : '';
  return `${dimensions.width} × ${dimensions.height}${depth}${thickness}${dimensions.unit ? ` ${dimensions.unit}` : ''}`;
}

function displayValue(value) {
  return value === undefined || value === null || value === '' ? 'Not Available' : String(value);
}

function displayObject(value) {
  if (value === undefined || value === null || value === '') return 'Not Available';
  return typeof value === 'string' ? value : JSON.stringify(value);
}

export async function CuttingListWorkspace({ projectId, router }) {
  const page = document.createElement('section');
  page.className = 'cutting-list-workspace-page';
  page.innerHTML = '<div class="cutting-list-loading">Loading Cutting List Workspace...</div>';

  let projectResponse;
  let furnitureResponse;
  try {
    [projectResponse, furnitureResponse] = await Promise.all([
      projectClient.getProject(projectId),
      projectClient.listFurnitureObjects(projectId),
    ]);
  } catch (error) {
    page.innerHTML = `<div class="empty-state"><h2>Cutting List Workspace unavailable</h2><p>${escapeHtml(error.message || 'Unable to load this Project.')}</p></div>`;
    return page;
  }

  const project = projectResponse.project || projectResponse;
  const approvedObjects = (furnitureResponse.furnitureObjects || [])
    .filter((object) => object.lifecycleStatus !== 'Archived' && object.productionStatus === 'Production Ready');
  let cuttingListResult = null;
  let layoutResult = null;
  let statsResult = null;
  let wasteResult = null;
  let panelResult = null;
  let traceResult = null;

  page.innerHTML = `<header class="cutting-list-header"><div><p class="eyebrow">Cutting List Workspace</p><h1>${escapeHtml(project.name || projectId)}</h1><p class="muted">Project ID · ${escapeHtml(projectId)}</p></div><button class="button" type="button" data-cutting-list-back>Back to Project</button></header><div class="cutting-list-status-bar"><span>Workspace Status</span><strong data-cutting-list-status>${approvedObjects.length ? 'Ready' : 'No Approved Furniture Object'}</strong><span>Cutting List Production Data: Read-only</span></div><div class="cutting-list-layout"><main class="cutting-list-main"><section class="cutting-list-card"><p class="eyebrow">Furniture Object Summary</p><h2>${approvedObjects.length ? `${approvedObjects.length} approved Furniture Object${approvedObjects.length === 1 ? '' : 's'}` : 'No approved Furniture Objects available'}</h2><div data-cutting-list-object-list>${approvedObjects.length ? approvedObjects.map((object) => `<article class="cutting-list-object-card"><div><strong>${escapeHtml(object.name || 'Unnamed Furniture Object')}</strong><small>${escapeHtml(object.objectType || object.furnitureType || 'Type unavailable')}</small></div><dl><div><dt>Object ID</dt><dd><code>${escapeHtml(object.objectId)}</code></dd></div><div><dt>Production Status</dt><dd>${escapeHtml(object.productionStatus)}</dd></div><div><dt>Dimensions</dt><dd>${escapeHtml(formatDimensions(object.dimensions))}</dd></div></dl><button type="button" data-cutting-list-generate="${escapeHtml(object.objectId)}">Generate Cutting List</button></article>`).join('') : '<div class="cutting-list-empty"><h3>No approved Furniture Objects available for Cutting List generation.</h3><p>There is no Cutting List Result because no approved source object is available.</p></div>'}</div></section><section class="cutting-list-card" data-cutting-list-result><p class="eyebrow">Simple View · Cutting List</p><div class="cutting-list-view-toolbar"><input type="search" data-cutting-list-search placeholder="Search Part Name" aria-label="Search Part Name"><select data-cutting-list-material-filter aria-label="Filter Material"><option value="">All Materials</option></select><select data-cutting-list-type-filter aria-label="Filter Part Type"><option value="">All Part Types</option></select><select data-cutting-list-sort aria-label="Sort Parts"><option value="partId">Sort: Part ID</option><option value="name">Sort: Part Name</option><option value="material">Sort: Material</option><option value="quantity">Sort: Quantity</option></select></div><div data-cutting-list-parts><p class="muted">Cutting List has not been generated.</p></div></section><section class="cutting-list-card cutting-list-card--layout" data-cutting-list-layout><p class="eyebrow">Board Layout · Task 04</p><h2>Board Layout</h2><div data-cutting-list-layout-content><p class="muted">Generate a Cutting List first, then generate a deterministic read-only Board Layout.</p></div><button type="button" data-cutting-list-layout-generate disabled>Generate Board Layout</button></section><section class="cutting-list-card" data-cutting-list-stats><p class="eyebrow">Material Statistics · Task 05</p><div data-cutting-list-stats-content><p class="muted">Generate a Cutting List first, then generate read-only Material Statistics.</p></div><button type="button" data-cutting-list-stats-generate disabled>Generate Material Statistics</button></section><section class="cutting-list-card cutting-list-future-slots"><p class="eyebrow">Future Cutting Modules</p><div class="cutting-list-actions"><button type="button" data-cutting-list-layout-entry disabled>Board Layout · Generate</button><button type="button" data-cutting-list-stats-entry disabled>Material Statistics · Generate</button><button type="button" disabled>Waste Analysis · Coming Next</button><button type="button" disabled>Information Panel · Coming Next</button><button type="button" disabled>Part Trace · Coming Next</button><button type="button" disabled>Print · Coming Next</button><button type="button" disabled>Export PDF · Coming Next</button><button type="button" disabled>Export Excel · Coming Next</button><button type="button" disabled>Export CNC · Not Available</button></div></section></main><aside class="cutting-list-information"><section class="cutting-list-card"><p class="eyebrow">Cutting List Status</p><h2 data-cutting-list-result-status>Not Generated</h2><p data-cutting-list-message>Generate from an approved Furniture Object to create a read-only Cutting List Result.</p></section><section class="cutting-list-card"><p class="eyebrow">Information / Summary</p><dl><div><dt>Project</dt><dd>${escapeHtml(project.name || projectId)}</dd></div><div><dt>Approved Objects</dt><dd>${approvedObjects.length}</dd></div><div><dt>Cutting Result</dt><dd data-cutting-list-part-count>Not Generated</dd></div><div><dt>Board Layout</dt><dd data-cutting-list-layout-count>Not Generated</dd></div><div><dt>Read-only</dt><dd>Yes</dd></div></dl></section><section class="cutting-list-card"><p class="eyebrow">Data Boundary</p><p class="muted">This workspace reads the current Project and its Canonical Furniture Objects only. Furniture Object, dimensions, Material, Hardware, Formula and Cutting Result are not editable here.</p></section></aside></div>`;
  page.querySelector('.cutting-list-main').insertAdjacentHTML('beforeend', '<section class="cutting-list-card" data-cutting-list-waste><p class="eyebrow">Waste Analysis · Task 06</p><div data-cutting-list-waste-content><p class="muted">Generate Board Layout first, then generate read-only Waste Analysis.</p></div><button type="button" data-cutting-list-waste-generate disabled>Generate Waste Analysis</button></section>');
  page.querySelector('.cutting-list-main').insertAdjacentHTML('beforeend', '<section class="cutting-list-card" data-cutting-list-part-trace><p class="eyebrow">Part Trace · Task 08</p><div class="cutting-list-view-toolbar"><select data-cutting-list-trace-select aria-label="Select Cutting List Part"><option value="">No Part Selected</option></select><button type="button" data-cutting-list-trace-generate disabled>Trace Selected Part</button></div><div data-cutting-list-trace-content><p class="muted">No Part Selected</p></div></section>');
  page.querySelector('.cutting-list-information').insertAdjacentHTML('beforeend', '<section class="cutting-list-card" data-cutting-list-information-panel><p class="eyebrow">Information Panel · Task 07</p><div data-cutting-list-information-content><p class="muted">Generate a Cutting List first, then view read-only production information.</p></div><button type="button" data-cutting-list-information-generate disabled>Generate Information Panel</button></section>');
  page.insertAdjacentHTML('beforeend', '<section class="cutting-list-card cutting-list-print-controls" data-cutting-list-print-controls><p class="eyebrow">Printing · Task 09</p><div class="cutting-list-actions"><button type="button" data-cutting-list-print="current-view" disabled>Print Current View</button><button type="button" data-cutting-list-print="cutting-list" disabled>Print Cutting List</button><button type="button" data-cutting-list-print="board-layout" disabled>Print Board Layout</button><button type="button" data-cutting-list-print="material-statistics" disabled>Print Material Statistics</button><button type="button" data-cutting-list-print="waste-analysis" disabled>Print Waste Analysis</button><button type="button" data-cutting-list-print="information-panel" disabled>Print Information Panel</button><button type="button" data-cutting-list-print="part-trace" disabled>Print Part Trace</button></div></section><section class="cutting-list-card cutting-list-pdf-controls" data-cutting-list-pdf-controls><p class="eyebrow">PDF Export · Task 10</p><div class="cutting-list-actions"><button type="button" data-cutting-list-pdf="current-view" disabled>Export Current View PDF</button><button type="button" data-cutting-list-pdf="cutting-list" disabled>Export Cutting List PDF</button><button type="button" data-cutting-list-pdf="board-layout" disabled>Export Board Layout PDF</button><button type="button" data-cutting-list-pdf="material-statistics" disabled>Export Material Statistics PDF</button><button type="button" data-cutting-list-pdf="waste-analysis" disabled>Export Waste Analysis PDF</button><button type="button" data-cutting-list-pdf="information-panel" disabled>Export Information Panel PDF</button><button type="button" data-cutting-list-pdf="part-trace" disabled>Export Part Trace PDF</button></div></section><section class="cutting-list-print-area" data-cutting-list-print-area hidden></section>');

  const resultSection = page.querySelector('[data-cutting-list-result]');
  const resultParts = page.querySelector('[data-cutting-list-parts]');
  const resultStatus = page.querySelector('[data-cutting-list-result-status]');
  const resultMessage = page.querySelector('[data-cutting-list-message]');
  const resultPartCount = page.querySelector('[data-cutting-list-part-count]');
  const searchInput = page.querySelector('[data-cutting-list-search]');
  const materialFilter = page.querySelector('[data-cutting-list-material-filter]');
  const typeFilter = page.querySelector('[data-cutting-list-type-filter]');
  const sortSelect = page.querySelector('[data-cutting-list-sort]');
  const layoutButton = page.querySelector('[data-cutting-list-layout-generate]');
  const layoutEntry = page.querySelector('[data-cutting-list-layout-entry]');
  const layoutContent = page.querySelector('[data-cutting-list-layout-content]');
  const layoutCount = page.querySelector('[data-cutting-list-layout-count]');
  const statsButton = page.querySelector('[data-cutting-list-stats-generate]');
  const statsEntry = page.querySelector('[data-cutting-list-stats-entry]');
  const statsContent = page.querySelector('[data-cutting-list-stats-content]');
  const wasteButton = page.querySelector('[data-cutting-list-waste-generate]');
  const wasteContent = page.querySelector('[data-cutting-list-waste-content]');
  const panelButton = page.querySelector('[data-cutting-list-information-generate]');
  const panelContent = page.querySelector('[data-cutting-list-information-content]');
  const traceSelect = page.querySelector('[data-cutting-list-trace-select]');
  const traceButton = page.querySelector('[data-cutting-list-trace-generate]');
  const traceContent = page.querySelector('[data-cutting-list-trace-content]');
  page.querySelectorAll('.cutting-list-future-slots button').forEach((button) => { if (button.textContent.includes('Export Excel')) button.remove(); });
  page.querySelector('.cutting-list-future-slots .cutting-list-actions').insertAdjacentHTML('beforeend', '<button type="button" data-cutting-list-excel disabled>Export Excel</button>');
  const printArea = page.querySelector('[data-cutting-list-print-area]');
  const printButtons = [...page.querySelectorAll('[data-cutting-list-print]')];
  const pdfButtons = [...page.querySelectorAll('[data-cutting-list-pdf]')];
  const excelButton = page.querySelector('[data-cutting-list-excel]');

  const refreshPrintButtons = () => {
    const ready = (value) => Boolean(value && value.readOnly === true && value.validation?.valid !== false && value.status !== 'BLOCKED' && value.status !== 'INCOMPLETE');
    printButtons.forEach((button) => {
      const type = button.dataset.cuttingListPrint;
      const value = type === 'current-view' || type === 'cutting-list' ? cuttingListResult : type === 'board-layout' ? layoutResult : type === 'material-statistics' ? statsResult : type === 'waste-analysis' ? wasteResult : type === 'information-panel' ? panelResult : traceResult;
      button.disabled = !ready(value);
    });
    pdfButtons.forEach((button) => {
      const type = button.dataset.cuttingListPdf;
      const value = type === 'current-view' || type === 'cutting-list' ? cuttingListResult : type === 'board-layout' ? layoutResult : type === 'material-statistics' ? statsResult : type === 'waste-analysis' ? wasteResult : type === 'information-panel' ? panelResult : traceResult;
      button.disabled = !ready(value);
    });
    excelButton.disabled = !ready(cuttingListResult);
  };

  const renderLayout = () => {
    if (!layoutResult) { layoutContent.innerHTML = '<p class="muted">Board Layout has not been generated.</p>'; layoutCount.textContent = 'Not Generated'; return; }
    const boards = layoutResult.layout?.boards || [];
    const unplaced = layoutResult.layout?.unplacedParts || [];
    layoutCount.textContent = `${boards.length} board${boards.length === 1 ? '' : 's'}`;
    layoutContent.innerHTML = `<p><strong>Status:</strong> ${escapeHtml(layoutResult.status)} · <strong>Validation:</strong> ${escapeHtml(layoutResult.validation?.status)} · <strong>Read-only:</strong> Yes</p><p class="muted">Placement is deterministic and non-optimizing. Kerf: ${escapeHtml(layoutResult.layout?.kerf || 'not-defined')}.</p>${boards.map((board) => `<article class="cutting-list-board"><div class="cutting-list-part-heading"><strong>${escapeHtml(board.boardId)}</strong><span>${escapeHtml(board.material?.name || board.material?.id)} · ${escapeHtml(board.board?.width)} × ${escapeHtml(board.board?.height)} ${escapeHtml(board.board?.unit || 'mm')} · ${escapeHtml(board.board?.thickness)} thick</span></div><div class="cutting-list-board-visual" aria-label="Board ${escapeHtml(board.boardId)}">${board.parts.map((part) => `<div class="cutting-list-board-part" title="${escapeHtml(part.partId)}" style="left:${(part.x / board.board.width) * 100}%;top:${(part.y / board.board.height) * 100}%;width:${(part.width / board.board.width) * 100}%;height:${(part.height / board.board.height) * 100}%"><span>${escapeHtml(part.partId)}</span></div>`).join('')}</div><ul>${board.parts.map((part) => `<li><code>${escapeHtml(part.partId)}</code> · ${escapeHtml(part.width)} × ${escapeHtml(part.height)} · rotation ${escapeHtml(part.rotation)}°</li>`).join('')}</ul></article>`).join('')}${unplaced.length ? `<div class="cutting-list-empty"><strong>Unplaced Parts</strong><ul>${unplaced.map((part) => `<li><code>${escapeHtml(part.partId)}</code> · ${escapeHtml(part.reason)}</li>`).join('')}</ul></div>` : ''}`;
  };
  const renderStats = () => {
    if (!statsResult) { statsContent.innerHTML = '<p class="muted">Material Statistics has not been generated.</p>'; return; }
    const totals = statsResult.totals || {};
    statsContent.innerHTML = `<p><strong>Material Types:</strong> ${escapeHtml(totals.totalMaterialTypes)} · <strong>Parts:</strong> ${escapeHtml(totals.totalParts)} · <strong>Quantity:</strong> ${escapeHtml(totals.totalQuantity)} · <strong>Total Part Area:</strong> ${escapeHtml(totals.totalPartArea ?? 'Not Available')} ${escapeHtml(totals.unit || '')}</p><p class="muted">Board Count: ${escapeHtml(totals.boardStatus === 'AVAILABLE' ? 'Available from Board Layout' : 'Not Available')} · Read-only: Yes</p>${(statsResult.materials || []).map((item) => `<article class="cutting-list-part"><div class="cutting-list-part-heading"><strong>${escapeHtml(item.materialName || item.materialId)}</strong><span>${escapeHtml(item.materialId)}</span></div><dl><div><dt>Thickness</dt><dd>${escapeHtml(displayValue(item.thickness))}</dd></div><div><dt>Parts</dt><dd>${escapeHtml(item.partCount)}</dd></div><div><dt>Quantity</dt><dd>${escapeHtml(item.totalQuantity)}</dd></div><div><dt>Board Count</dt><dd>${escapeHtml(item.boardCount ?? 'Not Available')}</dd></div><div><dt>Part Area</dt><dd>${escapeHtml(item.totalPartArea ?? 'Not Available')} ${escapeHtml(item.unit || '')}</dd></div></dl></article>`).join('')}`;
  };
  const renderWaste = () => {
    if (!wasteResult) { wasteContent.innerHTML = '<p class="muted">Waste Analysis has not been generated.</p>'; return; }
    const totals = wasteResult.totals || {};
    wasteContent.innerHTML = `<p><strong>Total Board Area:</strong> ${escapeHtml(totals.totalBoardArea ?? 'Not Available')} ${escapeHtml(totals.unit || '')} · <strong>Used Part Area:</strong> ${escapeHtml(totals.totalUsedPartArea ?? 'Not Available')} ${escapeHtml(totals.unit || '')}</p><p><strong>Waste Area:</strong> ${escapeHtml(totals.totalWasteArea ?? 'Not Available')} ${escapeHtml(totals.unit || '')} · <strong>Waste %:</strong> ${escapeHtml(totals.totalWastePercentage ?? 'Not Available')}</p><p class="muted">Status: ${escapeHtml(wasteResult.status)} · Validation: ${escapeHtml(wasteResult.validation?.status)} · Read-only: Yes</p>${(wasteResult.materials || []).map((item) => `<article class="cutting-list-part"><div class="cutting-list-part-heading"><strong>${escapeHtml(item.materialName || item.materialId)}</strong><span>${escapeHtml(item.materialId)}</span></div><dl><div><dt>Thickness</dt><dd>${escapeHtml(displayValue(item.thickness))}</dd></div><div><dt>Boards</dt><dd>${escapeHtml(item.boardCount ?? 'Not Available')}</dd></div><div><dt>Board Area</dt><dd>${escapeHtml(item.boardArea ?? 'Not Available')} ${escapeHtml(item.unit || '')}</dd></div><div><dt>Used Part Area</dt><dd>${escapeHtml(item.usedPartArea ?? 'Not Available')} ${escapeHtml(item.unit || '')}</dd></div><div><dt>Waste Area</dt><dd>${escapeHtml(item.wasteArea ?? 'Not Available')} ${escapeHtml(item.unit || '')}</dd></div><div><dt>Waste %</dt><dd>${escapeHtml(item.wastePercentage ?? 'Not Available')}</dd></div></dl></article>`).join('')}`;
  };
  const renderInformation = () => {
    if (!panelResult) { panelContent.innerHTML = '<p class="muted">Information Panel has not been generated.</p>'; return; }
    const panel = panelResult;
    const object = panel.furnitureObject || {};
    const list = panel.cuttingList || {};
    const materials = Array.isArray(panel.materials) ? panel.materials : [];
    const board = panel['board' + 'Layout'];
    const waste = panel.wasteAnalysis;
    panelContent.innerHTML = `<div class="cutting-list-information-panel"><h3>Project</h3><p>${escapeHtml(panel.project?.name || 'Not Available')} · <code>${escapeHtml(panel.project?.projectId || 'Not Available')}</code></p><h3>Furniture Object</h3><dl><div><dt>Object</dt><dd><code>${escapeHtml(object.objectId || 'Not Available')}</code> · ${escapeHtml(object.name || 'Not Available')}</dd></div><div><dt>Type / Status</dt><dd>${escapeHtml(object.objectType || 'Not Available')} · ${escapeHtml(object.productionStatus || 'Not Available')}</dd></div><div><dt>Dimensions</dt><dd>${escapeHtml(formatDimensions(object.dimensions))}</dd></div></dl><h3>Cutting List</h3><dl><div><dt>ID</dt><dd><code>${escapeHtml(list.cuttingListId || 'Not Available')}</code></dd></div><div><dt>Parts / Quantity</dt><dd>${escapeHtml(list.partCount ?? 'Not Available')} · ${escapeHtml(list.totalQuantity ?? 'Not Available')}</dd></div><div><dt>Validation / Status</dt><dd>${escapeHtml(list.validationStatus || 'Not Available')} · ${escapeHtml(list.resultStatus || 'Not Available')}</dd></div></dl><h3>Materials</h3>${materials.length ? materials.map((item) => `<article class="cutting-list-part"><strong>${escapeHtml(item.materialName || item.materialId)}</strong><dl><div><dt>Material ID</dt><dd>${escapeHtml(item.materialId)}</dd></div><div><dt>Product / Thickness</dt><dd>${escapeHtml(item.productCode || 'Not Available')} · ${escapeHtml(item.thickness ?? 'Not Available')}</dd></div><div><dt>Boards / Area</dt><dd>${escapeHtml(item.boardCount ?? 'Not Available')} · ${escapeHtml(item.totalPartArea ?? 'Not Available')} ${escapeHtml(item.unit || '')}</dd></div></dl></article>`).join('') : `<p class="muted">${escapeHtml(materials.code || 'MATERIAL_STATISTICS_NOT_AVAILABLE')}</p>`}<h3>Board Layout</h3><p>${escapeHtml(board?.['board' + 'LayoutId'] || board?.code || 'Not Available')} · Boards: ${escapeHtml(board?.boardCount ?? 'Not Available')} · Placed: ${escapeHtml(board?.placedPartCount ?? 'Not Available')} · Unplaced: ${escapeHtml(board?.unplacedPartCount ?? 'Not Available')} · Status: ${escapeHtml(board?.layoutStatus || 'Not Available')}</p><h3>Waste Analysis</h3><p>${escapeHtml(waste?.wasteAnalysisId || waste?.code || 'Not Available')} · Board Area: ${escapeHtml(waste?.totalBoardArea ?? 'Not Available')} · Used: ${escapeHtml(waste?.usedPartArea ?? 'Not Available')} · Waste: ${escapeHtml(waste?.wasteArea ?? 'Not Available')} · Waste %: ${escapeHtml(waste?.wastePercentage ?? 'Not Available')}</p><h3>Production Data Status</h3><p>Read-only: ${escapeHtml(panel.productionDataStatus?.readOnly ? 'Yes' : 'Not Available')} · Source: ${escapeHtml(panel.productionDataStatus?.source || 'Not Available')} · Validation: ${escapeHtml(panel.productionDataStatus?.validation || 'Not Available')} · Status: ${escapeHtml(panel.productionDataStatus?.status || 'Not Available')}</p></div>`;
  };
  const renderTrace = () => {
    if (!traceResult) { traceContent.innerHTML = '<p class="muted">No Part Selected</p>'; return; }
    const trace = traceResult;
    const part = trace.cuttingPart || {};
    const material = trace.material || {};
    const placement = trace.boardPlacement || {};
    traceContent.innerHTML = `<h3>Project</h3><p>${escapeHtml(trace.project?.name || 'Not Available')} · <code>${escapeHtml(trace.project?.projectId || 'Not Available')}</code></p><h3>Furniture Object</h3><p><code>${escapeHtml(trace.furnitureObject?.objectId || 'Not Available')}</code> · ${escapeHtml(trace.furnitureObject?.name || 'Not Available')} · ${escapeHtml(formatDimensions(trace.furnitureObject?.dimensions))}</p><h3>Component</h3><p><code>${escapeHtml(trace.component?.componentId || 'Not Available')}</code> · ${escapeHtml(trace.component?.name || 'Not Available')} · ${escapeHtml(trace.component?.type || 'Not Available')} · Parent ${escapeHtml(trace.component?.parentObjectId || 'Not Available')}</p><h3>Cutting Part</h3><dl><div><dt>Part</dt><dd><code>${escapeHtml(part.partId || 'Not Available')}</code> · ${escapeHtml(part.name || 'Not Available')} · ${escapeHtml(part.type || 'Not Available')}</dd></div><div><dt>Dimensions / Quantity</dt><dd>${escapeHtml(formatDimensions(part.dimensions))} · ${escapeHtml(part.quantity ?? 'Not Available')}</dd></div><div><dt>Grain / Edge / Processing</dt><dd>${escapeHtml(displayValue(part.grainDirection))} · ${escapeHtml(displayObject(part.edgeBanding))} · ${escapeHtml(displayObject(part.processing))}</dd></div></dl><h3>Material</h3><p><code>${escapeHtml(material.materialId || 'Not Available')}</code> · ${escapeHtml(material.materialName || 'Not Available')} · ${escapeHtml(material.productCode || 'Not Available')} · ${escapeHtml(material.thickness ?? 'Not Available')} · ${escapeHtml(material.source?.sourceType || 'Not Available')}</p><h3>Board Placement</h3><p>${escapeHtml(placement.status || 'Not Available')} · Board: ${escapeHtml(placement.boardId || placement.code || 'Not Available')} · Position: ${escapeHtml(placement.position ? JSON.stringify(placement.position) : 'Not Available')}</p><h3>Statistics / Waste</h3><p>Statistics: ${escapeHtml(trace.statistics?.statisticsId || trace.statistics?.material?.code || 'Not Available')} · Waste: ${escapeHtml(trace.waste?.wasteAnalysisId || trace.waste?.material?.code || 'Not Available')}</p><p><strong>Validation:</strong> ${escapeHtml(trace.validation?.status || 'Not Available')} · <strong>Read-only:</strong> Yes</p>`;
  };

  const renderSimpleView = () => {
    if (!cuttingListResult) {
      resultParts.innerHTML = '<p class="muted">Cutting List has not been generated.</p>';
      return;
    }
    const search = searchInput.value.trim().toLowerCase();
    const materialValue = materialFilter.value;
    const typeValue = typeFilter.value;
    const sortValue = sortSelect.value;
    const parts = cuttingListResult.parts.filter((part) => {
      const matchesSearch = !search || String(part.name || '').toLowerCase().includes(search);
      const matchesMaterial = !materialValue || part.material?.id === materialValue;
      const matchesType = !typeValue || part.type === typeValue;
      return matchesSearch && matchesMaterial && matchesType;
    }).slice().sort((left, right) => {
      if (sortValue === 'quantity') return Number(left.quantity) - Number(right.quantity);
      const leftValue = String(sortValue === 'material' ? left.material?.name || left.material?.id : left[sortValue] || '').toLowerCase();
      const rightValue = String(sortValue === 'material' ? right.material?.name || right.material?.id : right[sortValue] || '').toLowerCase();
      return leftValue.localeCompare(rightValue);
    });
    if (!parts.length) {
      resultParts.innerHTML = '<p class="muted">No cutting parts available.</p>';
      return;
    }
    resultParts.innerHTML = parts.map((part) => `<article class="cutting-list-part"><div class="cutting-list-part-heading"><strong>${escapeHtml(displayValue(part.name))}</strong><span>${escapeHtml(displayValue(part.type))}</span></div><dl><div><dt>Part ID</dt><dd><code>${escapeHtml(displayValue(part.partId))}</code></dd></div><div><dt>Component ID</dt><dd><code>${escapeHtml(displayValue(part.componentId))}</code></dd></div><div><dt>Parent Furniture Object</dt><dd><code>${escapeHtml(displayValue(part.parentObjectId))}</code></dd></div><div><dt>Material</dt><dd>${escapeHtml(displayValue(part.material?.name))} · ${escapeHtml(displayValue(part.material?.id))}</dd></div><div><dt>Width</dt><dd>${escapeHtml(displayValue(part.dimensions?.width))}</dd></div><div><dt>Height</dt><dd>${escapeHtml(displayValue(part.dimensions?.height))}</dd></div><div><dt>Depth / Thickness</dt><dd>${escapeHtml(displayValue(part.dimensions?.depth ?? part.dimensions?.thickness))}</dd></div><div><dt>Quantity</dt><dd>${escapeHtml(displayValue(part.quantity))}</dd></div><div><dt>Grain Direction</dt><dd>${escapeHtml(displayValue(part.grainDirection))}</dd></div><div><dt>Edge Banding</dt><dd>${escapeHtml(displayObject(part.edgeBanding))}</dd></div><div><dt>Processing</dt><dd>${escapeHtml(displayObject(part.processing))}</dd></div><div><dt>Validation</dt><dd>${escapeHtml(displayValue(part.validation?.status))}</dd></div></dl></article>`).join('');
  };
  [searchInput, materialFilter, typeFilter, sortSelect].forEach((control) => control.addEventListener('input', renderSimpleView));
  [materialFilter, typeFilter, sortSelect].forEach((control) => control.addEventListener('change', renderSimpleView));
  page.querySelectorAll('[data-cutting-list-generate]').forEach((button) => {
    button.onclick = async () => {
      button.disabled = true;
      resultStatus.textContent = 'Generating';
      resultMessage.textContent = 'Reading confirmed Panel / Board components and validating references.';
      try {
        const response = await projectClient.generateCuttingList(projectId, button.dataset.cuttingListGenerate);
        const result = response.cuttingList || response;
        resultSection.hidden = false;
        cuttingListResult = result;
        layoutResult = null;
        statsResult = null;
        wasteResult = null;
        panelResult = null;
        traceResult = null;
        layoutButton.disabled = false;
        layoutEntry.disabled = false;
        statsButton.disabled = false;
        statsEntry.disabled = false;
        wasteButton.disabled = true;
        panelButton.disabled = false;
        traceButton.disabled = false;
        traceSelect.innerHTML = '<option value="">No Part Selected</option>' + result.parts.map((part) => `<option value="${escapeHtml(part.partId)}">${escapeHtml(part.partId)} · ${escapeHtml(part.name || '')}</option>`).join('');
        renderLayout();
        renderStats();
        renderWaste();
        renderInformation();
        renderTrace();
        refreshPrintButtons();
        resultStatus.textContent = result.status;
        resultPartCount.textContent = String(result.parts.length);
        resultMessage.textContent = `Validation: ${result.validation.status} · Read-only: ${result.readOnly ? 'Yes' : 'No'}`;
        const materials = [...new Map(result.parts.map((part) => [part.material?.id, part.material])).values()].filter(Boolean);
        materialFilter.innerHTML = '<option value="">All Materials</option>' + materials.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name || item.id)}</option>`).join('');
        const types = [...new Set(result.parts.map((part) => part.type).filter(Boolean))];
        typeFilter.innerHTML = '<option value="">All Part Types</option>' + types.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join('');
        renderSimpleView();
      } catch (error) {
        resultSection.hidden = false;
        resultStatus.textContent = 'Blocked';
        resultPartCount.textContent = 'Not generated';
        resultMessage.textContent = error.message || 'Cutting List generation is blocked.';
        cuttingListResult = null;
        layoutResult = null;
        statsResult = null;
        wasteResult = null;
        panelResult = null;
        traceResult = null;
        layoutButton.disabled = true;
        layoutEntry.disabled = true;
        statsButton.disabled = true;
        statsEntry.disabled = true;
        wasteButton.disabled = true;
        panelButton.disabled = true;
        traceButton.disabled = true;
        traceSelect.innerHTML = '<option value="">No Part Selected</option>';
        renderLayout();
        renderStats();
        renderWaste();
        renderInformation();
        renderTrace();
        refreshPrintButtons();
        resultParts.innerHTML = '<p class="muted">Cutting List is blocked; no parts are available.</p>';
      } finally {
        button.disabled = false;
      }
    };
  });
  const generateLayout = async () => {
    if (!cuttingListResult) return;
    layoutButton.disabled = true;
    layoutEntry.disabled = true;
    layoutContent.innerHTML = '<p class="muted">Generating Board Layout from the current Cutting List Result.</p>';
    try {
      const response = await projectClient.generateCuttingListLayout(projectId, cuttingListResult.furnitureObject.objectId, cuttingListResult.cuttingListId);
      layoutResult = response['board' + 'Layout'] || response;
      wasteButton.disabled = false;
      renderLayout();
      refreshPrintButtons();
    } catch (error) {
      layoutResult = null;
      wasteButton.disabled = true;
      layoutContent.innerHTML = `<p class="cutting-list-empty">Board Layout blocked: ${escapeHtml(error.message || 'Unable to generate Board Layout.')}</p>`;
      layoutCount.textContent = 'Blocked';
      refreshPrintButtons();
    } finally {
      layoutButton.disabled = false;
      layoutEntry.disabled = false;
    }
  };
  layoutButton.onclick = generateLayout;
  layoutEntry.onclick = generateLayout;
  const generateStats = async () => {
    if (!cuttingListResult) return;
    statsButton.disabled = true;
    statsEntry.disabled = true;
    statsContent.innerHTML = '<p class="muted">Generating Material Statistics from the current Cutting List Result.</p>';
    try {
      const response = await projectClient.generateMaterialStats(projectId, cuttingListResult.furnitureObject.objectId, cuttingListResult.cuttingListId, layoutResult?.['board' + 'LayoutId'] || null);
      statsResult = response.statistics || response;
      renderStats();
      refreshPrintButtons();
    } catch (error) {
      statsResult = null;
      statsContent.innerHTML = `<p class="cutting-list-empty">Material Statistics blocked: ${escapeHtml(error.message || 'Unable to generate Material Statistics.')}</p>`;
      refreshPrintButtons();
    } finally {
      statsButton.disabled = false;
      statsEntry.disabled = false;
    }
  };
  statsButton.onclick = generateStats;
  statsEntry.onclick = generateStats;
  wasteButton.onclick = async () => {
    if (!cuttingListResult || !layoutResult) return;
    wasteButton.disabled = true;
    wasteContent.innerHTML = '<p class="muted">Generating Waste Analysis from the existing Board Layout.</p>';
    try {
      const response = await projectClient.generateWasteAnalysis(projectId, cuttingListResult.furnitureObject.objectId, cuttingListResult.cuttingListId, layoutResult?.['board' + 'LayoutId'], statsResult?.statisticsId || null);
      wasteResult = response.analysis || response;
      renderWaste();
      refreshPrintButtons();
    } catch (error) {
      wasteResult = null;
      wasteContent.innerHTML = `<p class="cutting-list-empty">Waste Analysis blocked: ${escapeHtml(error.message || 'Unable to generate Waste Analysis.')}</p>`;
      refreshPrintButtons();
    } finally { wasteButton.disabled = false; }
  };
  panelButton.onclick = async () => {
    if (!cuttingListResult) return;
    panelButton.disabled = true;
    panelContent.innerHTML = '<p class="muted">Loading read-only Information Panel data.</p>';
    try {
      const response = await projectClient.generateInformationPanel(projectId, cuttingListResult.furnitureObject.objectId, cuttingListResult.cuttingListId, layoutResult?.['board' + 'LayoutId'] || null, statsResult?.statisticsId || null, wasteResult?.wasteAnalysisId || null);
      panelResult = response.panel || response;
      renderInformation();
      refreshPrintButtons();
    } catch (error) {
      panelResult = null;
      panelContent.innerHTML = `<p class="cutting-list-empty">Information Panel blocked: ${escapeHtml(error.message || 'Unable to load Information Panel.')}</p>`;
      refreshPrintButtons();
    } finally { panelButton.disabled = false; }
  };
  traceSelect.onchange = () => { traceButton.disabled = !traceSelect.value || !cuttingListResult; traceResult = null; renderTrace(); };
  traceButton.onclick = async () => {
    if (!cuttingListResult || !traceSelect.value) return;
    traceButton.disabled = true;
    traceContent.innerHTML = '<p class="muted">Loading read-only Part Trace.</p>';
    try {
      const response = await projectClient.generatePartTrace(projectId, cuttingListResult.furnitureObject.objectId, traceSelect.value, cuttingListResult.cuttingListId, layoutResult?.['board' + 'LayoutId'] || null, statsResult?.statisticsId || null, wasteResult?.wasteAnalysisId || null);
      traceResult = response.trace || response;
      renderTrace();
      refreshPrintButtons();
    } catch (error) {
      traceResult = null;
      traceContent.innerHTML = `<p class="cutting-list-empty">Part Trace blocked: ${escapeHtml(error.message || 'Unable to load Part Trace.')}</p>`;
      refreshPrintButtons();
    } finally { traceButton.disabled = false; }
  };
  const printResult = async (printType) => {
    if (!cuttingListResult) return;
    const references = {
      cuttingListId: cuttingListResult.cuttingListId,
      boardLayoutId: layoutResult?.['board' + 'LayoutId'] || null,
      materialStatisticsId: statsResult?.statisticsId || null,
      wasteAnalysisId: wasteResult?.wasteAnalysisId || null,
      informationPanelId: panelResult?.informationPanelId || null,
      partTraceId: traceResult?.partTraceId || null,
      partId: traceSelect.value || null,
    };
    try {
      const response = await projectClient.prepareCuttingListPrint(projectId, cuttingListResult.furnitureObject.objectId, printType, references);
      const documentModel = response.print || response;
      const printable = documentModel.selectedSection ? documentModel.sections[documentModel.selectedSection] : documentModel.sections;
      printArea.innerHTML = `<h1>Furniture GO · ${escapeHtml(printType)}</h1><p><strong>Project:</strong> ${escapeHtml(documentModel.project?.name || 'Not Available')} · <code>${escapeHtml(documentModel.project?.projectId || projectId)}</code></p><p><strong>Furniture Object:</strong> ${escapeHtml(documentModel.furnitureObject?.name || 'Not Available')} · <code>${escapeHtml(documentModel.furnitureObject?.objectId || 'Not Available')}</code></p><pre>${escapeHtml(JSON.stringify(printable, null, 2))}</pre>`;
      printArea.hidden = false;
      window.print();
      printArea.hidden = true;
    } catch (error) {
      printArea.innerHTML = `<p class="cutting-list-empty">Printing blocked: ${escapeHtml(error.message || 'Print validation failed.')}</p>`;
      printArea.hidden = false;
    }
  };
  const exportPdfResult = async (printType) => {
    if (!cuttingListResult) return;
    const references = {
      cuttingListId: cuttingListResult.cuttingListId,
      boardLayoutId: layoutResult?.['board' + 'LayoutId'] || null,
      materialStatisticsId: statsResult?.statisticsId || null,
      wasteAnalysisId: wasteResult?.wasteAnalysisId || null,
      informationPanelId: panelResult?.informationPanelId || null,
      partTraceId: traceResult?.partTraceId || null,
      partId: traceSelect.value || null,
    };
    try {
      const exported = await projectClient.exportCuttingListPdf(projectId, cuttingListResult.furnitureObject.objectId, printType, references);
      const url = URL.createObjectURL(exported.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exported.filename || `FurnitureGO_${printType}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      resultMessage.textContent = `PDF Export blocked: ${error.message || 'PDF validation failed.'}`;
      resultStatus.textContent = 'Blocked';
    }
  };
  printButtons.forEach((button) => { button.onclick = () => printResult(button.dataset.cuttingListPrint); });
  pdfButtons.forEach((button) => { button.onclick = () => exportPdfResult(button.dataset.cuttingListPdf); });
  excelButton.onclick = async () => {
    if (!cuttingListResult) return;
    excelButton.disabled = true;
    try {
      const exported = await projectClient.exportCuttingListExcel(projectId, cuttingListResult.furnitureObject.objectId, { cuttingList: cuttingListResult, boardLayout: layoutResult, materialStatistics: statsResult, wasteAnalysis: wasteResult, informationPanel: panelResult, partTrace: traceResult });
      const url = URL.createObjectURL(exported.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exported.filename || `FurnitureGO_${projectId}_production.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      resultMessage.textContent = `Excel Export blocked: ${error.message || 'Excel validation failed.'}`;
      resultStatus.textContent = 'Blocked';
    } finally { refreshPrintButtons(); }
  };
  page.querySelector('[data-cutting-list-back]').onclick = () => router.navigate(`/dashboard/${encodeURIComponent(projectId)}`);
  return page;
}

export default CuttingListWorkspace;
