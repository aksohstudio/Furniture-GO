import { projectClient } from '../services/project-client.js';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

function renderObjectSummary(object) {
  return `<article class="purchase-list-object-card"><div><strong>${escapeHtml(object.name || 'Unnamed Furniture Object')}</strong><small>${escapeHtml(object.objectType || object.furnitureType || 'Type unavailable')}</small></div><dl><div><dt>Object ID</dt><dd><code>${escapeHtml(object.objectId)}</code></dd></div><div><dt>Production Status</dt><dd>${escapeHtml(object.productionStatus)}</dd></div><div><dt>Lifecycle</dt><dd>${escapeHtml(object.lifecycleStatus || 'Active')}</dd></div></dl></article>`;
}

export async function PurchaseListWorkspace({ projectId, router }) {
  const page = document.createElement('section');
  page.className = 'purchase-list-workspace-page';
  page.innerHTML = '<div class="purchase-list-loading">Loading Purchase List Workspace...</div>';

  let projectResponse;
  let furnitureResponse;
  try {
    [projectResponse, furnitureResponse] = await Promise.all([
      projectClient.getProject(projectId),
      projectClient.listFurnitureObjects(projectId),
    ]);
  } catch (error) {
    page.innerHTML = `<div class="empty-state"><h2>Purchase List Workspace unavailable</h2><p>${escapeHtml(error.message || 'Unable to load this Project.')}</p></div>`;
    return page;
  }

  const project = projectResponse.project || projectResponse;
  const approvedObjects = (furnitureResponse.furnitureObjects || [])
    .filter((object) => object.lifecycleStatus !== 'Archived' && object.productionStatus === 'Production Ready');

  page.innerHTML = `<header class="purchase-list-header"><div><p class="eyebrow">Purchase List Workspace</p><h1>${escapeHtml(project.name || projectId)}</h1><p class="muted">Project ID · ${escapeHtml(projectId)}</p></div><button class="button" type="button" data-purchase-list-back>Back to Project</button></header><div class="purchase-list-status-bar"><span>Workspace Status</span><strong>${approvedObjects.length ? 'Ready for Purchase List Generation' : 'No Approved Furniture Object'}</strong><span>Purchasing Data: Read-only</span></div><div class="purchase-list-layout"><main class="purchase-list-main"><section class="purchase-list-card"><p class="eyebrow">Approved Furniture Object Summary</p><h2>${approvedObjects.length ? `${approvedObjects.length} approved Furniture Object${approvedObjects.length === 1 ? '' : 's'}` : 'No approved Furniture Objects available'}</h2><div data-purchase-list-object-list>${approvedObjects.length ? approvedObjects.map(renderObjectSummary).join('') : '<div class="purchase-list-empty"><h3>No approved Furniture Objects available.</h3><p>Purchase List generation is unavailable until a confirmed, Production Ready Furniture Object exists.</p></div>'}</div></section><section class="purchase-list-card"><p class="eyebrow">Material Purchase</p><h2>Board Materials</h2><div class="purchase-list-placeholder"><strong>Purchase List not generated</strong><p>Task 02 — Purchase List Generation</p><span>Coming Next</span></div></section><section class="purchase-list-card"><p class="eyebrow">Hardware Purchase</p><h2>Hardware</h2><div class="purchase-list-placeholder"><strong>Hardware list not generated</strong><p>Task 04 — Hardware List</p><span>Coming Next</span></div></section><section class="purchase-list-card"><p class="eyebrow">Accessories</p><h2>Accessories</h2><div class="purchase-list-placeholder"><strong>Accessories list not generated</strong><p>Task 05 — Accessories List</p><span>Coming Next</span></div></section><section class="purchase-list-card"><p class="eyebrow">Purchase Summary</p><div class="purchase-list-placeholder"><strong>Purchase Summary not available</strong><p>Task 06 — Purchase Summary</p><span>Not Available</span></div></section></main><aside class="purchase-list-information"><section class="purchase-list-card"><p class="eyebrow">Information / Status</p><dl><div><dt>Project</dt><dd>${escapeHtml(project.name || projectId)}</dd></div><div><dt>Project ID</dt><dd><code>${escapeHtml(projectId)}</code></dd></div><div><dt>Approved Objects</dt><dd>${approvedObjects.length}</dd></div><div><dt>Purchase Result</dt><dd>Not Generated</dd></div><div><dt>Read-only</dt><dd>Yes</dd></div></dl></section><section class="purchase-list-card"><p class="eyebrow">Purchase List Actions</p><div class="purchase-list-actions"><button type="button" disabled>Generate Purchase List · Task 02</button><button type="button" disabled>Refresh · Task 02</button><button type="button" disabled>Print · Task 08</button><button type="button" disabled>Export PDF · Task 09</button><button type="button" disabled>Export Excel · Task 10</button><button type="button" disabled>Settings · Task 07</button><button type="button" disabled>Purchase Reports · Task 11</button></div></section><section class="purchase-list-card"><p class="eyebrow">Data Boundary</p><p class="muted">This shell reads the current Project and its approved Furniture Objects only. It does not create or edit Purchase Results, Furniture Objects, Material Catalog, Hardware Catalog or Engineering Knowledge Base records.</p><p class="muted">Supplier, inventory, ERP, purchase order, quotation, accounting, cloud and AI purchasing features are not available.</p></section></aside></div>`;

  const actionButtons = [...page.querySelectorAll('.purchase-list-actions button')];
  const generateButton = actionButtons[0];
  const printButton = actionButtons[2];
  const exportPdfButton = actionButtons[3];
  const exportExcelButton = actionButtons[4];
  const reportsButton = actionButtons[6];
  generateButton.dataset.purchaseListGenerate = '';
  printButton.dataset.purchaseListPrint = '';
  exportPdfButton.dataset.purchaseListExportPdf = '';
  exportExcelButton.dataset.purchaseListExportExcel = '';
  reportsButton.dataset.purchaseListReports = '';
  printButton.disabled = true;
  exportPdfButton.disabled = true;
  exportExcelButton.disabled = true;
  reportsButton.disabled = true;
  generateButton.disabled = approvedObjects.length === 0;
  const statusElement = page.querySelector('.purchase-list-status-bar strong');
  const informationCard = page.querySelector('.purchase-list-information .purchase-list-card');
  const materialArea = page.querySelectorAll('.purchase-list-main .purchase-list-card')[1];
  const hardwareArea = page.querySelectorAll('.purchase-list-main .purchase-list-card')[2];
  const accessoryArea = page.querySelectorAll('.purchase-list-main .purchase-list-card')[3];
  const summaryArea = page.querySelectorAll('.purchase-list-main .purchase-list-card')[4];
  const categoryArea = document.createElement('section');
  categoryArea.className = 'purchase-list-card purchase-list-category-management';
  categoryArea.innerHTML = '<p class="eyebrow">Category Management</p><h2>Purchase Categories</h2><div class="purchase-list-placeholder"><strong>Category information unavailable.</strong><p>Purchase List has not been generated.</p><span>Read-only</span></div>';
  page.querySelector('.purchase-list-main').append(categoryArea);
  const reportsArea = document.createElement('section');
  reportsArea.className = 'purchase-list-card purchase-list-reports';
  reportsArea.innerHTML = '<p class="eyebrow">Purchase Reports</p><h2>Purchase Reports</h2><div class="purchase-list-placeholder"><strong>Report unavailable.</strong><p>Purchase List has not been generated.</p><span>Read-only</span></div>';
  page.querySelector('.purchase-list-main').append(reportsArea);
  const materialCountElement = document.createElement('small');
  materialCountElement.dataset.boardMaterialCount = '';
  materialCountElement.textContent = 'Not Generated';
  materialArea.querySelector('h2').append(' ', materialCountElement);
  informationCard.insertAdjacentHTML('beforeend', '<div class="purchase-list-result-summary" data-purchase-list-result-summary><p><strong>Generation Status:</strong> <span data-purchase-list-generation-status>Not Generated</span></p><p><strong>Material Items:</strong> <span data-purchase-list-material-count>Not Available</span></p><p><strong>Hardware Items:</strong> <span data-purchase-list-hardware-count>Not Available</span></p><p><strong>Accessory Items:</strong> <span data-purchase-list-accessory-count>Not Available</span></p><p><strong>Total Items:</strong> <span data-purchase-list-total-count>Not Available</span></p><p><strong>Validation:</strong> <span data-purchase-list-validation>Not Available</span></p><p><strong>Purchase Reports Status:</strong> <span data-purchase-list-reports-status>Not Available</span></p><p><strong>PDF Export Status:</strong> <span data-purchase-list-pdf-status>Not Available</span></p><p><strong>Excel Export Status:</strong> <span data-purchase-list-excel-status>Not Available</span></p><p><strong>Blocking Reason:</strong> <span data-purchase-list-blocking-reason>None</span></p></div>');
  let purchaseListResult = null;
  let purchaseReports = null;
  const printArea = document.createElement('section');
  printArea.className = 'purchase-list-print-area';
  printArea.dataset.purchasePrintArea = '';
  printArea.hidden = true;
  page.append(printArea);
  const renderPrintArea = (printModel) => {
    printArea.hidden = false;
    const renderItems = (items, title, fields) => `<h2>${title}</h2>${items.length ? items.map((item) => `<article class="purchase-print-item"><strong>${escapeHtml(item.name || 'Not Available')}</strong><dl>${fields.map(([label, key]) => `<div><dt>${label}</dt><dd>${escapeHtml(key === 'source' || key === 'validation' ? JSON.stringify(item[key]) : item[key] ?? 'Not Available')}</dd></div>`).join('')}</dl></article>`).join('') : '<p>Not Available</p>'}`;
    const summary = printModel.purchaseSummary;
    const category = printModel.categorySummary;
    printArea.innerHTML = `<h1>Furniture GO</h1><p>Project: ${escapeHtml(printModel.project?.name || 'Not Available')} (${escapeHtml(printModel.project?.projectId || 'Not Available')})</p><h2>Purchase List</h2><dl><div><dt>Purchase List ID</dt><dd>${escapeHtml(printModel.purchaseList.purchaseListId)}</dd></div><div><dt>Status</dt><dd>${escapeHtml(printModel.purchaseList.status)}</dd></div><div><dt>Validation</dt><dd>${escapeHtml(printModel.purchaseList.validation?.status || 'Not Available')}</dd></div><div><dt>Read-only</dt><dd>Yes</dd></div></dl><h2>Furniture Objects</h2><p>Object count: ${escapeHtml(printModel.furnitureObjects.length)}</p>${printModel.furnitureObjects.map((object) => `<article class="purchase-print-item"><strong>${escapeHtml(object.name || 'Not Available')}</strong><dl><div><dt>Object ID</dt><dd>${escapeHtml(object.objectId)}</dd></div><div><dt>Object Type</dt><dd>${escapeHtml(object.objectType || 'Not Available')}</dd></div></dl></article>`).join('')}${renderItems(printModel.materialItems, 'Board Material List', [['Material ID', 'materialId'], ['Product Code', 'productCode'], ['Specification', 'specification'], ['Quantity', 'quantity'], ['Unit', 'unit'], ['Validation', 'validation']])}${renderItems(printModel.hardwareItems, 'Hardware List', [['Hardware ID', 'hardwareId'], ['Product Code', 'productCode'], ['Type', 'type'], ['Category', 'category'], ['Specification', 'specification'], ['Quantity', 'quantity'], ['Unit', 'unit'], ['Validation', 'validation']])}${renderItems(printModel.accessoryItems, 'Accessories List', [['Accessory ID', 'accessoryId'], ['Product Code', 'productCode'], ['Category', 'category'], ['Type', 'type'], ['Specification', 'specification'], ['Quantity', 'quantity'], ['Unit', 'unit'], ['Validation', 'validation']])}<h2>Purchase Summary</h2><dl><div><dt>Material Item Count</dt><dd>${escapeHtml(summary.materialItemCount)}</dd></div><div><dt>Hardware Item Count</dt><dd>${escapeHtml(summary.hardwareItemCount)}</dd></div><div><dt>Accessories Item Count</dt><dd>${escapeHtml(summary.accessoryItemCount)}</dd></div><div><dt>Total Item Count</dt><dd>${escapeHtml(summary.totalItemCount)}</dd></div><div><dt>Quantity Summary</dt><dd>${escapeHtml(JSON.stringify(summary.quantitySummary))}</dd></div><div><dt>Category Summary</dt><dd>${escapeHtml(JSON.stringify(summary.categorySummary))}</dd></div><div><dt>Unit Summary</dt><dd>${escapeHtml(JSON.stringify(summary.unitSummary))}</dd></div></dl><h2>Category Management</h2><dl><div><dt>Category Count</dt><dd>${escapeHtml(category.categoryCount)}</dd></div><div><dt>Type Count</dt><dd>${escapeHtml(category.typeCount)}</dd></div><div><dt>Category Summary</dt><dd>${escapeHtml(JSON.stringify(category.categories))}</dd></div><div><dt>Type Summary</dt><dd>${escapeHtml(JSON.stringify(category.types))}</dd></div><div><dt>Breakdown</dt><dd>${escapeHtml(JSON.stringify(category.breakdown))}</dd></div></dl><h2>Source / Validation</h2><dl><div><dt>Source</dt><dd>${escapeHtml(JSON.stringify(printModel.source))}</dd></div><div><dt>Validation</dt><dd>${escapeHtml(printModel.validation.status)}</dd></div><div><dt>Status</dt><dd>${escapeHtml(printModel.status)}</dd></div><div><dt>Read-only</dt><dd>Yes</dd></div></dl>`;
  };
  let hardwareList = null;
  const renderHardwareItems = () => {
    if (!hardwareList) return;
    const view = hardwareList;
    const search = (hardwareArea.querySelector('[data-hardware-search]')?.value || '').trim().toLowerCase();
    const productCode = (hardwareArea.querySelector('[data-hardware-product-search]')?.value || '').trim().toLowerCase();
    const type = hardwareArea.querySelector('[data-hardware-type-filter]')?.value || '';
    const category = hardwareArea.querySelector('[data-hardware-category-filter]')?.value || '';
    const sort = hardwareArea.querySelector('[data-hardware-sort]')?.value || 'name';
    const items = view.items.filter((item) => (!search || `${item.name || ''} ${item.hardwareId || ''} ${item.specification || ''}`.toLowerCase().includes(search)) && (!productCode || String(item.productCode || '').toLowerCase().includes(productCode)) && (!type || item.type === type) && (!category || item.category === category));
    const sorted = [...items].sort((left, right) => String(left[sort] ?? '').localeCompare(String(right[sort] ?? ''), undefined, { numeric: true, sensitivity: 'base' }));
    hardwareArea.querySelector('[data-hardware-count]').textContent = `${sorted.length} item(s)`;
    hardwareArea.querySelector('[data-hardware-items]').innerHTML = sorted.length ? sorted.map((item) => `<article class="purchase-list-hardware-item"><div><strong>${escapeHtml(item.name || 'Not Available')}</strong><small>${escapeHtml(item.hardwareId || 'HARDWARE_REFERENCE_MISSING')} · ${escapeHtml(item.productCode || 'Not Available')}</small></div><dl><div><dt>Type / Category</dt><dd>${escapeHtml(item.type || item.category || 'Not Available')} / ${escapeHtml(item.category || 'Not Available')}</dd></div><div><dt>Specification</dt><dd>${escapeHtml(item.specification || 'Not Available')}</dd></div><div><dt>Quantity / Unit</dt><dd>${escapeHtml(item.quantity)} · ${escapeHtml(item.unit || 'Not Available')}</dd></div><div><dt>Source</dt><dd><code>${escapeHtml(JSON.stringify(item.source))}</code></dd></div><div><dt>Validation</dt><dd>${escapeHtml(item.validation?.status || 'Not Available')} · Read-only</dd></div></dl></article>`).join('') : '<p class="muted">No Hardware items match the current filters.</p>';
  };
  const setupHardwareView = () => {
    const types = [...new Set(hardwareList.items.map((item) => item.type).filter(Boolean))];
    const categories = [...new Set(hardwareList.items.map((item) => item.category).filter(Boolean))];
    hardwareArea.querySelector('.purchase-list-placeholder')?.remove();
    hardwareArea.insertAdjacentHTML('beforeend', `<div class="purchase-list-hardware-view" data-hardware-list><div class="purchase-list-filter-row"><input type="search" data-hardware-search placeholder="Search hardware" aria-label="Search hardware"><input type="search" data-hardware-product-search placeholder="Search product code" aria-label="Search product code"><select data-hardware-type-filter aria-label="Filter type"><option value="">All Types</option>${types.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('')}</select><select data-hardware-category-filter aria-label="Filter category"><option value="">All Categories</option>${categories.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('')}</select><select data-hardware-sort aria-label="Sort hardware"><option value="name">Sort: Hardware Name</option><option value="hardwareId">Sort: Hardware ID</option><option value="productCode">Sort: Product Code</option><option value="quantity">Sort: Quantity</option></select></div><small data-hardware-count>${hardwareList.itemCount} item(s)</small><div data-hardware-items></div></div>`);
    hardwareArea.querySelectorAll('[data-hardware-search], [data-hardware-product-search], [data-hardware-type-filter], [data-hardware-category-filter], [data-hardware-sort]').forEach((control) => control.addEventListener('input', renderHardwareItems));
    renderHardwareItems();
  };
  let accessoriesList = null;
  const renderAccessoriesItems = () => {
    if (!accessoriesList) return;
    const search = (accessoryArea.querySelector('[data-accessory-search]')?.value || '').trim().toLowerCase();
    const productCode = (accessoryArea.querySelector('[data-accessory-product-search]')?.value || '').trim().toLowerCase();
    const category = accessoryArea.querySelector('[data-accessory-category-filter]')?.value || '';
    const sort = accessoryArea.querySelector('[data-accessory-sort]')?.value || 'name';
    const items = accessoriesList.items.filter((item) => (!search || `${item.name || ''} ${item.accessoryId || ''} ${item.specification || ''}`.toLowerCase().includes(search)) && (!productCode || String(item.productCode || '').toLowerCase().includes(productCode)) && (!category || item.category === category || item.type === category));
    const sorted = [...items].sort((left, right) => String(left[sort] ?? '').localeCompare(String(right[sort] ?? ''), undefined, { numeric: true, sensitivity: 'base' }));
    accessoryArea.querySelector('[data-accessory-count]').textContent = `${sorted.length} item(s)`;
    accessoryArea.querySelector('[data-accessory-items]').innerHTML = sorted.length ? sorted.map((item) => `<article class="purchase-list-accessory-item"><div><strong>${escapeHtml(item.name || 'Not Available')}</strong><small>${escapeHtml(item.accessoryId || 'ACCESSORY_REFERENCE_MISSING')} · ${escapeHtml(item.productCode || 'Not Available')}</small></div><dl><div><dt>Category / Type</dt><dd>${escapeHtml(item.category || 'Not Available')} / ${escapeHtml(item.type || 'Not Available')}</dd></div><div><dt>Specification</dt><dd>${escapeHtml(item.specification || 'Not Available')}</dd></div><div><dt>Quantity / Unit</dt><dd>${escapeHtml(item.quantity)} · ${escapeHtml(item.unit || 'Not Available')}</dd></div><div><dt>Source</dt><dd><code>${escapeHtml(JSON.stringify(item.source))}</code></dd></div><div><dt>Validation</dt><dd>${escapeHtml(item.validation?.status || 'Not Available')} · Read-only</dd></div></dl></article>`).join('') : '<p class="muted">No Accessories</p>';
  };
  const setupAccessoriesView = () => {
    const categories = [...new Set(accessoriesList.items.flatMap((item) => [item.category, item.type]).filter(Boolean))];
    accessoryArea.querySelector('.purchase-list-placeholder')?.remove();
    accessoryArea.insertAdjacentHTML('beforeend', `<div class="purchase-list-accessory-view" data-accessory-list><div class="purchase-list-filter-row"><input type="search" data-accessory-search placeholder="Search accessory" aria-label="Search accessory"><input type="search" data-accessory-product-search placeholder="Search product code" aria-label="Search product code"><select data-accessory-category-filter aria-label="Filter category or type"><option value="">All Categories / Types</option>${categories.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('')}</select><select data-accessory-sort aria-label="Sort accessories"><option value="name">Sort: Accessory Name</option><option value="productCode">Sort: Product Code</option><option value="quantity">Sort: Quantity</option></select></div><small data-accessory-count>${accessoriesList.itemCount} item(s)</small><div data-accessory-items></div></div>`);
    accessoryArea.querySelectorAll('[data-accessory-search], [data-accessory-product-search], [data-accessory-category-filter], [data-accessory-sort]').forEach((control) => control.addEventListener('input', renderAccessoriesItems));
    renderAccessoriesItems();
  };
  const renderBoardMaterialItems = () => {
    if (!purchaseListResult || purchaseListResult.status === 'BLOCKED') return;
    const items = purchaseListResult.materialItems || [];
    const search = (materialArea.querySelector('[data-board-material-search]')?.value || '').trim().toLowerCase();
    const productCode = (materialArea.querySelector('[data-board-product-search]')?.value || '').trim().toLowerCase();
    const materialId = materialArea.querySelector('[data-board-material-filter]')?.value || '';
    const thickness = materialArea.querySelector('[data-board-thickness-filter]')?.value || '';
    const sort = materialArea.querySelector('[data-board-material-sort]')?.value || 'materialName';
    const filtered = items.filter((item) => item.category === 'Board Materials' && (!search || `${item.name || ''} ${item.material?.materialId || ''} ${item.specification || ''}`.toLowerCase().includes(search)) && (!productCode || String(item.productCode || '').toLowerCase().includes(productCode)) && (!materialId || item.material?.materialId === materialId) && (!thickness || String(item.thickness ?? '') === thickness));
    const sorted = [...filtered].sort((left, right) => String(left[sort] ?? left.material?.materialId ?? '').localeCompare(String(right[sort] ?? right.material?.materialId ?? ''), undefined, { numeric: true, sensitivity: 'base' }));
    materialCountElement.textContent = `${sorted.length} item(s)`;
    const list = materialArea.querySelector('[data-board-material-items]');
    list.innerHTML = sorted.length ? sorted.map((item) => `<article class="purchase-list-material-item"><div><strong>${escapeHtml(item.name || 'Not Available')}</strong><small>${escapeHtml(item.material?.materialId || 'MATERIAL_REFERENCE_MISSING')} · ${escapeHtml(item.productCode || 'Not Available')}</small></div><dl><div><dt>Specification</dt><dd>${escapeHtml(item.specification || 'SPECIFICATION_UNAVAILABLE')}</dd></div><div><dt>Thickness</dt><dd>${escapeHtml(item.thickness ?? 'Not Available')}</dd></div><div><dt>Quantity / Unit</dt><dd>${escapeHtml(item.quantity)} · ${escapeHtml(item.unit || 'Not Available')}</dd></div><div><dt>Source</dt><dd><code>${escapeHtml(JSON.stringify(item.source))}</code></dd></div><div><dt>Validation</dt><dd>${escapeHtml(item.validation?.status || 'Not Available')} · Read-only</dd></div></dl></article>`).join('') : '<p class="muted">No Board Material items match the current filters.</p>';
  };
  const setupBoardMaterialView = () => {
    const items = purchaseListResult.materialItems || [];
    const materialIds = [...new Set(items.filter((item) => item.category === 'Board Materials').map((item) => item.material?.materialId).filter(Boolean))];
    const thicknesses = [...new Set(items.filter((item) => item.category === 'Board Materials').map((item) => item.thickness).filter((value) => value !== undefined && value !== null))];
    materialArea.querySelector('.purchase-list-placeholder')?.remove();
    materialArea.insertAdjacentHTML('beforeend', `<div class="purchase-list-board-material-view" data-board-material-list><div class="purchase-list-filter-row"><input type="search" data-board-material-search placeholder="Search material" aria-label="Search material"><input type="search" data-board-product-search placeholder="Search product code" aria-label="Search product code"><select data-board-material-filter aria-label="Filter material"><option value="">All Materials</option>${materialIds.map((id) => `<option value="${escapeHtml(id)}">${escapeHtml(id)}</option>`).join('')}</select><select data-board-thickness-filter aria-label="Filter thickness"><option value="">All Thicknesses</option>${thicknesses.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('')}</select><select data-board-material-sort aria-label="Sort board materials"><option value="materialName">Sort: Material Name</option><option value="productCode">Sort: Product Code</option><option value="thickness">Sort: Thickness</option><option value="quantity">Sort: Quantity</option></select></div><div data-board-material-items></div></div>`);
    materialArea.querySelectorAll('[data-board-material-search], [data-board-product-search], [data-board-material-filter], [data-board-thickness-filter], [data-board-material-sort]').forEach((control) => control.addEventListener('input', renderBoardMaterialItems));
    renderBoardMaterialItems();
  };
  const renderPurchaseReports = (reports) => {
    purchaseReports = reports;
    const summary = reports.summary || {};
    const reportLine = (report, label) => `${label}: ${report && report.itemCount !== undefined ? report.itemCount : 'Not Available'} item(s)`;
    reportsArea.querySelector('.purchase-list-placeholder')?.remove();
    reportsArea.insertAdjacentHTML('beforeend', `<div class="purchase-list-report-view" data-purchase-reports><dl><div><dt>Report Status</dt><dd>${escapeHtml(reports.status)}</dd></div><div><dt>Report ID</dt><dd><code>${escapeHtml(reports.reportId)}</code></dd></div><div><dt>Project</dt><dd>${escapeHtml(reports.project?.name || 'Not Available')} (${escapeHtml(reports.project?.projectId || 'Not Available')})</dd></div><div><dt>Purchase List</dt><dd>${escapeHtml(reports.purchaseList?.purchaseListId || 'Not Available')} · ${escapeHtml(reports.purchaseList?.status || 'Not Available')}</dd></div><div><dt>Furniture Object Count</dt><dd>${escapeHtml(reports.furnitureObjects?.length ?? 'Not Available')}</dd></div><div><dt>Report Types</dt><dd>${reportLine(reports.materialReport, 'Board Material')} · ${reportLine(reports.hardwareReport, 'Hardware')} · ${reportLine(reports.accessoryReport, 'Accessories')} · ${escapeHtml(reports.categoryReport?.categoryCount ?? 'Not Available')} categories</dd></div><div><dt>Total Items</dt><dd>${escapeHtml(summary.totalItemCount ?? 'Not Available')}</dd></div><div><dt>Quantity Summary</dt><dd><code>${escapeHtml(JSON.stringify(summary.quantitySummary || {}))}</code></dd></div><div><dt>Category Summary</dt><dd><code>${escapeHtml(JSON.stringify(summary.categorySummary || {}))}</code></dd></div><div><dt>Validation</dt><dd>${escapeHtml(reports.validation?.status || 'Not Available')}</dd></div><div><dt>Source</dt><dd><code>${escapeHtml(JSON.stringify(reports.source || {}))}</code></dd></div><div><dt>Read-only</dt><dd>Yes</dd></div></dl></div>`);
    page.querySelector('[data-purchase-list-reports-status]').textContent = reports.status || 'Report Ready';
  };
  const renderPurchaseResult = async () => {
    const summary = purchaseListResult?.summary || {};
    const blocked = purchaseListResult?.status === 'BLOCKED';
    printButton.disabled = !purchaseListResult || blocked;
    exportPdfButton.disabled = !purchaseListResult || blocked;
    exportExcelButton.disabled = !purchaseListResult || blocked;
    reportsButton.disabled = !purchaseListResult || blocked;
    page.querySelector('[data-purchase-list-pdf-status]').textContent = purchaseListResult ? (blocked ? 'PDF Export Blocked' : 'PDF Ready') : 'Not Available';
    page.querySelector('[data-purchase-list-excel-status]').textContent = purchaseListResult ? (blocked ? 'Excel Export Blocked' : 'Excel Ready') : 'Not Available';
    page.querySelector('[data-purchase-list-reports-status]').textContent = purchaseListResult ? (blocked ? 'Reports Blocked' : 'Loading Reports') : 'Not Available';
    statusElement.textContent = purchaseListResult ? purchaseListResult.status : (approvedObjects.length ? 'Ready for Purchase List Generation' : 'No Approved Furniture Object');
    page.querySelector('[data-purchase-list-generation-status]').textContent = purchaseListResult?.status || 'Not Generated';
    page.querySelector('[data-purchase-list-material-count]').textContent = purchaseListResult ? summary.materialItemCount : 'Not Available';
    page.querySelector('[data-purchase-list-hardware-count]').textContent = purchaseListResult ? summary.hardwareItemCount : 'Not Available';
    page.querySelector('[data-purchase-list-accessory-count]').textContent = purchaseListResult ? summary.accessoryItemCount : 'Not Available';
    page.querySelector('[data-purchase-list-total-count]').textContent = purchaseListResult ? summary.totalItemCount : 'Not Available';
    page.querySelector('[data-purchase-list-validation]').textContent = purchaseListResult?.validation?.status || 'Not Available';
    page.querySelector('[data-purchase-list-blocking-reason]').textContent = blocked ? (purchaseListResult.validation?.issues || []).map((item) => item.code).join(', ') || 'Validation failed' : 'None';
    const areas = [...page.querySelectorAll('.purchase-list-main .purchase-list-card .purchase-list-placeholder')];
    if (purchaseListResult) {
      if (blocked) {
        if (!materialArea.querySelector('.purchase-list-placeholder')) materialArea.insertAdjacentHTML('beforeend', '<div class="purchase-list-placeholder"></div>');
        materialArea.querySelector('.purchase-list-placeholder').innerHTML = `<strong>Board Material List blocked</strong><p>${(purchaseListResult.validation?.issues || []).map((item) => escapeHtml(item.code)).join(', ') || 'Purchase List validation failed'}</p><span>Blocked</span>`;
      } else {
        materialArea.querySelector('.purchase-list-placeholder')?.remove();
        if (!materialArea.querySelector('[data-board-material-list]')) setupBoardMaterialView();
      }
      if (blocked) {
        areas[1].innerHTML = `<strong>Hardware List blocked</strong><p>${(purchaseListResult.validation?.issues || []).map((item) => escapeHtml(item.code)).join(', ') || 'Purchase List validation failed'}</p><span>Blocked</span>`;
      } else {
        try {
          const response = await projectClient.buildHardwareList(projectId, purchaseListResult);
          hardwareList = response.hardwareList || response;
          setupHardwareView();
        } catch (error) {
          areas[1].innerHTML = `<strong>Hardware List blocked</strong><p>${escapeHtml(error.message || 'Hardware List unavailable')}</p><span>Blocked</span>`;
        }
      }
      if (blocked) {
        areas[2].innerHTML = `<strong>Accessories List blocked</strong><p>${(purchaseListResult.validation?.issues || []).map((item) => escapeHtml(item.code)).join(', ') || 'Purchase List validation failed'}</p><span>Blocked</span>`;
      } else {
        try {
          const response = await projectClient.buildAccessoriesList(projectId, purchaseListResult);
          accessoriesList = response.accessoriesList || response;
          setupAccessoriesView();
        } catch (error) {
          areas[2].innerHTML = `<strong>Accessories List blocked</strong><p>${escapeHtml(error.message || 'Accessories List unavailable')}</p><span>Blocked</span>`;
        }
      }
      if (blocked) {
        areas[3].innerHTML = `<strong>Purchase Summary unavailable</strong><p>${(purchaseListResult.validation?.issues || []).map((item) => escapeHtml(item.code)).join(', ') || 'Purchase List validation failed'}</p><span>Blocked</span>`;
      } else {
        try {
          const response = await projectClient.buildPurchaseSummary(projectId, purchaseListResult);
          const purchaseSummary = response.summary || response;
          summaryArea.querySelector('.purchase-list-placeholder')?.remove();
          const quantityLines = (groups) => groups.map((group) => `${group.unit || 'Unit unavailable'}: ${group.quantity} (${group.itemCount} item${group.itemCount === 1 ? '' : 's'})`).join('; ') || 'None';
          const categoryLines = (groups) => groups.map((group) => `${group.category}: ${group.quantity} (${group.itemCount})`).join('; ') || 'None';
          summaryArea.insertAdjacentHTML('beforeend', `<div class="purchase-list-summary-view" data-purchase-summary><dl><div><dt>Summary Status</dt><dd>${escapeHtml(purchaseSummary.status)}</dd></div><div><dt>Total Items</dt><dd>${escapeHtml(purchaseSummary.totalItemCount)}</dd></div><div><dt>Material Items</dt><dd>${escapeHtml(purchaseSummary.materialItemCount)}</dd></div><div><dt>Hardware Items</dt><dd>${escapeHtml(purchaseSummary.hardwareItemCount)}</dd></div><div><dt>Accessories Items</dt><dd>${escapeHtml(purchaseSummary.accessoryItemCount)}</dd></div><div><dt>Furniture Object Count</dt><dd>${escapeHtml(purchaseSummary.furnitureObjectCount)}</dd></div><div><dt>Category Summary</dt><dd>Materials: ${escapeHtml(categoryLines(purchaseSummary.categorySummary.materials))}<br>Hardware: ${escapeHtml(categoryLines(purchaseSummary.categorySummary.hardware))}<br>Accessories: ${escapeHtml(categoryLines(purchaseSummary.categorySummary.accessories))}</dd></div><div><dt>Quantity Summary</dt><dd>Materials: ${escapeHtml(quantityLines(purchaseSummary.quantitySummary.materials))}<br>Hardware: ${escapeHtml(quantityLines(purchaseSummary.quantitySummary.hardware))}<br>Accessories: ${escapeHtml(quantityLines(purchaseSummary.quantitySummary.accessories))}</dd></div><div><dt>Validation</dt><dd>${escapeHtml(purchaseSummary.validation.status)}</dd></div><div><dt>Source</dt><dd><code>${escapeHtml(JSON.stringify(purchaseSummary.source))}</code></dd></div><div><dt>Read-only</dt><dd>Yes</dd></div></dl></div>`);
        } catch (error) {
          summaryArea.querySelector('.purchase-list-placeholder').innerHTML = `<strong>Purchase Summary unavailable</strong><p>${escapeHtml(error.message || 'Purchase Summary unavailable')}</p><span>Unavailable</span>`;
        }
      }
      if (blocked) {
        categoryArea.querySelector('.purchase-list-placeholder').innerHTML = `<strong>Category information unavailable.</strong><p>${(purchaseListResult.validation?.issues || []).map((item) => escapeHtml(item.code)).join(', ') || 'Purchase List validation failed'}</p><span>Blocked</span>`;
      } else {
        try {
          const response = await projectClient.buildCategoryManagement(projectId, purchaseListResult);
          const categories = response.categories || response;
          categoryArea.querySelector('.purchase-list-placeholder')?.remove();
          const groupLines = (groups, label) => groups.length ? groups.map((group) => `${escapeHtml(group[label] || (label === 'category' ? 'CATEGORY_UNAVAILABLE' : 'TYPE_UNAVAILABLE'))}: ${escapeHtml(group.itemCount)} item(s), ${escapeHtml(group.totalQuantity)} quantity`).join('<br>') : 'None';
          categoryArea.insertAdjacentHTML('beforeend', `<div class="purchase-list-category-view" data-category-management><dl><div><dt>Category Management Status</dt><dd>${escapeHtml(categories.status)}</dd></div><div><dt>Category Count</dt><dd>${escapeHtml(categories.categoryCount)}</dd></div><div><dt>Type Count</dt><dd>${escapeHtml(categories.typeCount)}</dd></div><div><dt>Item Count</dt><dd>${escapeHtml(categories.itemCount)}</dd></div><div><dt>Quantity Summary</dt><dd>${escapeHtml(categories.totalQuantity)}</dd></div><div><dt>Category Summary</dt><dd>${groupLines(categories.categories, 'category')}</dd></div><div><dt>Type Summary</dt><dd>${groupLines(categories.types, 'type')}</dd></div><div><dt>Material / Hardware / Accessories</dt><dd>Materials: ${escapeHtml(categories.breakdown.materials.itemCount)} · Hardware: ${escapeHtml(categories.breakdown.hardware.itemCount)} · Accessories: ${escapeHtml(categories.breakdown.accessories.itemCount)}</dd></div><div><dt>Validation</dt><dd>${escapeHtml(categories.validation.status)}</dd></div><div><dt>Source</dt><dd><code>${escapeHtml(JSON.stringify(categories.source))}</code></dd></div><div><dt>Read-only</dt><dd>Yes</dd></div></dl></div>`);
        } catch (error) {
          categoryArea.querySelector('.purchase-list-placeholder').innerHTML = `<strong>Category information unavailable.</strong><p>${escapeHtml(error.message || 'Category Management unavailable')}</p><span>Unavailable</span>`;
        }
      }
      if (blocked) {
        reportsArea.querySelector('.purchase-list-placeholder').innerHTML = `<strong>Report unavailable.</strong><p>${(purchaseListResult.validation?.issues || []).map((item) => escapeHtml(item.code)).join(', ') || 'Purchase List validation failed'}</p><span>Blocked</span>`;
        page.querySelector('[data-purchase-list-reports-status]').textContent = 'Reports Blocked';
      } else {
        try {
          const response = await projectClient.buildPurchaseReports(projectId, purchaseListResult);
          renderPurchaseReports(response.reports || response);
        } catch (error) {
          reportsArea.querySelector('.purchase-list-placeholder').innerHTML = `<strong>Report unavailable.</strong><p>${escapeHtml(error.message || 'Purchase Reports unavailable')}</p><span>Unavailable</span>`;
          page.querySelector('[data-purchase-list-reports-status]').textContent = 'Reports Unavailable';
        }
      }
    }
  };
  generateButton.onclick = async () => {
    generateButton.disabled = true;
    statusElement.textContent = 'Generating Purchase List';
    try {
      const response = await projectClient.generatePurchaseList(projectId);
      purchaseListResult = response.purchaseList || response;
      renderPurchaseResult();
    } catch (error) {
      statusElement.textContent = 'BLOCKED';
      page.querySelector('[data-purchase-list-blocking-reason]').textContent = error.message || 'Purchase List generation failed';
    } finally {
      generateButton.disabled = approvedObjects.length === 0;
    }
  };
  reportsButton.onclick = async () => {
    if (!purchaseListResult || purchaseListResult.status === 'BLOCKED') return;
    reportsButton.disabled = true;
    try {
      const response = await projectClient.buildPurchaseReports(projectId, purchaseListResult);
      renderPurchaseReports(response.reports || response);
    } catch (error) {
      reportsArea.querySelector('.purchase-list-placeholder')?.remove();
      reportsArea.insertAdjacentHTML('beforeend', `<div class="purchase-list-placeholder"><strong>Report unavailable.</strong><p>${escapeHtml(error.message || 'Purchase Reports unavailable')}</p><span>Unavailable</span></div>`);
      page.querySelector('[data-purchase-list-reports-status]').textContent = 'Reports Unavailable';
    } finally {
      reportsButton.disabled = !purchaseListResult || purchaseListResult.status === 'BLOCKED';
    }
  };
  printButton.onclick = async () => {
    if (!purchaseListResult || purchaseListResult.status === 'BLOCKED') return;
    printButton.disabled = true;
    try {
      const response = await projectClient.preparePurchaseListPrint(projectId, purchaseListResult);
      const printModel = response.printModel || response;
      renderPrintArea(printModel);
      window.print();
      printArea.hidden = true;
    } catch (error) {
      statusElement.textContent = 'Print Blocked';
      page.querySelector('[data-purchase-list-blocking-reason]').textContent = error.message || 'Purchase List is not printable';
    } finally {
      printButton.disabled = false;
    }
  };
  exportPdfButton.onclick = async () => {
    if (!purchaseListResult || purchaseListResult.status === 'BLOCKED') return;
    exportPdfButton.disabled = true;
    page.querySelector('[data-purchase-list-pdf-status]').textContent = 'Exporting PDF';
    try {
      const exported = await projectClient.exportPurchaseListPdf(projectId, purchaseListResult);
      const url = URL.createObjectURL(exported.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exported.filename;
      link.click();
      URL.revokeObjectURL(url);
      page.querySelector('[data-purchase-list-pdf-status]').textContent = 'PDF Exported';
    } catch (error) {
      page.querySelector('[data-purchase-list-pdf-status]').textContent = 'PDF Export Blocked';
      page.querySelector('[data-purchase-list-blocking-reason]').textContent = error.message || 'PDF export failed';
    } finally {
      exportPdfButton.disabled = false;
    }
  };
  exportExcelButton.onclick = async () => {
    if (!purchaseListResult || purchaseListResult.status === 'BLOCKED') return;
    exportExcelButton.disabled = true;
    page.querySelector('[data-purchase-list-excel-status]').textContent = 'Exporting Excel';
    try {
      const exported = await projectClient.exportPurchaseListExcel(projectId, purchaseListResult);
      const url = URL.createObjectURL(exported.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exported.filename;
      link.click();
      URL.revokeObjectURL(url);
      page.querySelector('[data-purchase-list-excel-status]').textContent = 'Excel Exported';
    } catch (error) {
      page.querySelector('[data-purchase-list-excel-status]').textContent = 'Excel Export Blocked';
      page.querySelector('[data-purchase-list-blocking-reason]').textContent = error.message || 'Excel export failed';
    } finally {
      exportExcelButton.disabled = false;
    }
  };
  page.querySelector('[data-purchase-list-back]').onclick = () => router.navigate(`/dashboard/${encodeURIComponent(projectId)}`);
  return page;
}

export default PurchaseListWorkspace;
