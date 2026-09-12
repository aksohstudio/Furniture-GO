const VALID_PRINT_TYPES = new Set(['current-view', 'cutting-list', 'board-layout', 'material-statistics', 'waste-analysis', 'information-panel', 'part-trace']);

function fail(message, code, details = {}) {
  throw Object.assign(new Error(message), { code, details });
}

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function safeFilePart(value) {
  return String(value || 'Project').replace(/[^a-z0-9-_]+/gi, '_').replace(/^_+|_+$/g, '') || 'Project';
}

function pdfEscape(value) {
  return String(value ?? 'Not Available').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/[\r\n]+/g, ' ');
}

function flatten(value, prefix = '') {
  if (value === undefined || value === null || value === '') return [`${prefix || 'Value'}: Not Available`];
  if (Array.isArray(value)) return value.length ? value.flatMap((item, index) => flatten(item, `${prefix}[${index}]`)) : [`${prefix}: Not Available`];
  if (typeof value !== 'object') return [`${prefix}: ${String(value)}`];
  const entries = Object.entries(value);
  return entries.length ? entries.flatMap(([key, item]) => flatten(item, prefix ? `${prefix}.${key}` : key)) : [`${prefix}: Not Available`];
}

function documentLines(documentModel) {
  const lines = [
    'Furniture GO',
    `Project: ${documentModel.project?.name || 'Not Available'} (${documentModel.project?.projectId || 'Not Available'})`,
    `Furniture Object: ${documentModel.furnitureObject?.name || 'Not Available'} (${documentModel.furnitureObject?.objectId || 'Not Available'})`,
    `Cutting List ID: ${documentModel.cuttingListId || 'Not Available'}`,
    `Print Type: ${documentModel.printType || 'Not Available'}`,
    `Status: ${documentModel.status || 'Not Available'}`,
    `Validation: ${documentModel.validation?.status || 'Not Available'}`,
    'Read-only: Yes',
    '',
  ];
  const sections = documentModel.selectedSection
    ? { [documentModel.selectedSection]: documentModel.sections?.[documentModel.selectedSection] }
    : documentModel.sections;
  for (const [name, section] of Object.entries(sections || {})) {
    lines.push(`Section: ${name}`, ...flatten(section), '');
  }
  return lines;
}

function buildPdf(lines) {
  const linesPerPage = 48;
  const pages = [];
  for (let index = 0; index < lines.length; index += linesPerPage) pages.push(lines.slice(index, index + linesPerPage));
  if (!pages.length) pages.push(['Furniture GO', 'Not Available']);

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`,
  ];
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
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'binary'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, 'binary');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'binary');
}

function validateCuttingListPdfDocument(documentModel, projectId, objectId) {
  if (!documentModel || documentModel.contract !== 'cutting-list-print-document') fail('Cutting List Print Model is missing or invalid', 'RESULT_CONTRACT_INVALID');
  if (documentModel.project?.projectId !== projectId) fail('Print Model Project does not match the current Project', 'PROJECT_MISMATCH');
  if (documentModel.furnitureObject?.objectId !== objectId) fail('Print Model Object does not match the current Object', 'OBJECT_MISMATCH');
  if (documentModel.readOnly !== true) fail('PDF Export requires readOnly=true', 'READ_ONLY_REQUIRED');
  if (documentModel.validation?.valid !== true || documentModel.status !== 'Ready') fail('Print Model validation failed', 'RESULT_VALIDATION_FAILED', { validation: clone(documentModel.validation), status: documentModel.status });
  if (!VALID_PRINT_TYPES.has(documentModel.printType)) fail('Print Model type is invalid', 'RESULT_CONTRACT_INVALID');
  if (!documentModel.sections || typeof documentModel.sections !== 'object' || Object.keys(documentModel.sections).length === 0) fail('Print Model has no printable result', 'DRAWING_OR_RESULT_MISSING');
  if (documentModel.selectedSection && !documentModel.sections[documentModel.selectedSection]) fail('Selected printable result is missing', 'DRAWING_OR_RESULT_MISSING');
}

function exportCuttingListPdf(documentModel, projectId, objectId) {
  validateCuttingListPdfDocument(documentModel, projectId, objectId);
  const printType = documentModel.printType || 'current-view';
  return {
    buffer: buildPdf(documentLines(documentModel)),
    filename: `FurnitureGO_${safeFilePart(documentModel.project?.name || projectId)}_${safeFilePart(printType)}.pdf`,
    contentType: 'application/pdf',
    source: clone(documentModel),
  };
}

module.exports = { exportCuttingListPdf, validateCuttingListPdfDocument, buildPdf };
