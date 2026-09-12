const { clone } = require('./production-drawing-data-contract');

const CONTRACT = 'purchase-list-pdf-result';

function fail(message, code, details = {}) {
  throw Object.assign(new Error(message), { code, details });
}

function pdfEscape(value) {
  return String(value ?? 'Not Available').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/[\r\n]+/g, ' ');
}

function safeFilePart(value) {
  return String(value || 'Project').replace(/[^a-z0-9-_]+/gi, '_').replace(/^_+|_+$/g, '') || 'Project';
}

function validatePrintModel(printModel, projectId) {
  if (!projectId) fail('Project context is missing', 'PROJECT_MISSING');
  if (!printModel) fail('Print Model is missing', 'PRINT_MODEL_MISSING');
  if (printModel.contract !== 'purchase-list-print-model') fail('Print Model contract is invalid', 'INVALID_PRINT_MODEL');
  if (printModel.readOnly !== true) fail('Print Model must be read-only', 'READ_ONLY_REQUIRED');
  if (printModel.project?.projectId !== projectId) fail('Print Model Project does not match', 'PROJECT_MISMATCH');
  if (!printModel.purchaseList?.purchaseListId || printModel.purchaseList.status !== 'Generated') fail('Print Model Purchase List is invalid', 'INVALID_PRINT_MODEL');
  if (printModel.purchaseList?.projectId && printModel.purchaseList.projectId !== projectId) fail('Print Model Purchase List Project does not match', 'PROJECT_MISMATCH');
  if (printModel.source?.projectId !== projectId) fail('Print Model source does not match', 'SOURCE_MISMATCH');
  if (printModel.validation?.valid !== true || printModel.status !== 'Print Ready') fail('Print Model validation failed', 'INVALID_PRINT_MODEL', { validation: clone(printModel.validation), status: printModel.status });
  if (!Array.isArray(printModel.furnitureObjects) || !Array.isArray(printModel.materialItems) || !Array.isArray(printModel.hardwareItems) || !Array.isArray(printModel.accessoryItems)) fail('Print Model collections are invalid', 'INVALID_PRINT_MODEL');
  if (!printModel.purchaseSummary || !printModel.categorySummary) fail('Print Model summary data is missing', 'INVALID_PRINT_MODEL');
  for (const [key, label] of [['materialItems', 'Material'], ['hardwareItems', 'Hardware'], ['accessoryItems', 'Accessory']]) {
    printModel[key].forEach((item) => {
      if (!item?.sourceObjectId || !printModel.furnitureObjects.some((object) => object.objectId === item.sourceObjectId)) fail(`${label} item Object does not match`, 'OBJECT_MISMATCH', { itemId: item?.itemId || null });
      if (item.validation?.valid === false) fail(`${label} item is invalid`, 'INVALID_ITEM', { itemId: item.itemId });
      if (typeof item.quantity !== 'number' || !Number.isFinite(item.quantity) || item.quantity <= 0) fail(`${label} quantity is missing or invalid`, item.quantity === undefined || item.quantity === null ? 'QUANTITY_MISSING' : 'INVALID_QUANTITY', { itemId: item.itemId });
    });
  }
  return printModel;
}

function itemLines(items, label, idLabel, idKey) {
  const lines = [label];
  if (!items.length) return lines.concat(['Not Available']);
  items.forEach((item) => lines.push(`${item.name || 'Not Available'} | ${idLabel}: ${item[idKey] || 'Not Available'} | Product Code: ${item.productCode || 'Not Available'} | Category: ${item.category || 'Not Available'} | Type: ${item.type || 'Not Available'} | Specification: ${item.specification || 'Not Available'} | Quantity: ${item.quantity} | Unit: ${item.unit || 'Not Available'} | Validation: ${item.validation?.status || 'Not Available'}`));
  return lines;
}

function linesFor(printModel) {
  const summary = printModel.purchaseSummary || {};
  const categories = printModel.categorySummary || {};
  return [
    'Furniture GO',
    `Project: ${printModel.project?.name || 'Not Available'} (${printModel.project?.projectId || 'Not Available'})`,
    `Purchase List ID: ${printModel.purchaseList?.purchaseListId || 'Not Available'}`,
    `Status: ${printModel.purchaseList?.status || 'Not Available'}`,
    `Validation: ${printModel.purchaseList?.validation?.status || 'Not Available'}`,
    'Read-only: Yes',
    `Furniture Objects: ${printModel.furnitureObjects.length}`,
    ...printModel.furnitureObjects.map((object) => `Object: ${object.name || 'Not Available'} | ${object.objectId || 'Not Available'} | ${object.objectType || 'Not Available'}`),
    '',
    ...itemLines(printModel.materialItems, 'Board Material List', 'Material ID', 'materialId'),
    '',
    ...itemLines(printModel.hardwareItems, 'Hardware List', 'Hardware ID', 'hardwareId'),
    '',
    ...itemLines(printModel.accessoryItems, 'Accessories List', 'Accessory ID', 'accessoryId'),
    '',
    'Purchase Summary',
    `Material Item Count: ${summary.materialItemCount ?? 'Not Available'}`,
    `Hardware Item Count: ${summary.hardwareItemCount ?? 'Not Available'}`,
    `Accessories Item Count: ${summary.accessoryItemCount ?? 'Not Available'}`,
    `Total Item Count: ${summary.totalItemCount ?? 'Not Available'}`,
    `Quantity Summary: ${JSON.stringify(summary.quantitySummary || 'Not Available')}`,
    `Category Summary: ${JSON.stringify(summary.categorySummary || 'Not Available')}`,
    `Unit Summary: ${JSON.stringify(summary.unitSummary || 'Not Available')}`,
    '',
    'Category Management',
    `Category Count: ${categories.categoryCount ?? 'Not Available'}`,
    `Type Count: ${categories.typeCount ?? 'Not Available'}`,
    `Category Summary: ${JSON.stringify(categories.categories || 'Not Available')}`,
    `Type Summary: ${JSON.stringify(categories.types || 'Not Available')}`,
    `Breakdown: ${JSON.stringify(categories.breakdown || 'Not Available')}`,
    '',
    `Source: ${JSON.stringify(printModel.source)}`,
    `Validation: ${printModel.validation?.status || 'Not Available'}`,
    `Status: ${printModel.status || 'Not Available'}`,
    'Read-only: Yes',
  ];
}

function buildPdf(lines) {
  const linesPerPage = 48;
  const pages = [];
  for (let index = 0; index < lines.length; index += linesPerPage) pages.push(lines.slice(index, index + linesPerPage));
  if (!pages.length) pages.push(['Furniture GO', 'Not Available']);
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', `<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`];
  pages.forEach((pageLines, pageIndex) => {
    const pageObjectId = 3 + pageIndex * 2;
    const contentObjectId = pageObjectId + 1;
    const content = ['BT', '/F1 9 Tf', '45 790 Td', ...pageLines.map((line, index) => `${index ? '0 -15 Td' : ''} (${pdfEscape(line)}) Tj`), 'ET'].join('\n');
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R >> >> /Contents ${contentObjectId} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`);
  });
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf, 'binary')); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xrefOffset = Buffer.byteLength(pdf, 'binary');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'binary');
}

function exportPurchaseListPdf(printModel, projectId) {
  const source = validatePrintModel(printModel, projectId);
  return { contract: CONTRACT, pdfId: `purchase-list-pdf:${projectId}:${source.purchaseList.purchaseListId}`, project: clone(source.project), furnitureObjects: clone(source.furnitureObjects), purchaseList: clone(source.purchaseList), materialItems: clone(source.materialItems), hardwareItems: clone(source.hardwareItems), accessoryItems: clone(source.accessoryItems), purchaseSummary: clone(source.purchaseSummary), categorySummary: clone(source.categorySummary), source: clone(source.source), validation: { valid: true, status: 'PDF_READY', issues: [] }, status: 'PDF Ready', readOnly: true, buffer: buildPdf(linesFor(source)), filename: `FurnitureGO_${safeFilePart(source.project?.name || projectId)}_Purchase_List.pdf`, contentType: 'application/pdf' };
}

module.exports = { CONTRACT, exportPurchaseListPdf, validatePrintModel, buildPdf, linesFor };
