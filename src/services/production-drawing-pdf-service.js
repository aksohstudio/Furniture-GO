const VALID_STATUSES = new Set(['Generated', 'Approved', 'Ready']);

function fail(message, code, details = {}) {
  throw Object.assign(new Error(message), { code, details });
}

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function validateExportData(data, projectId, objectId) {
  if (!data || typeof data !== 'object') fail('Drawing or Production Package data is required', 'DRAWING_MISSING');
  if (data.project?.projectId !== projectId) fail('Drawing Project does not match the current Project', 'DRAWING_PROJECT_MISMATCH');
  if (data.readOnly !== true) fail('PDF Export requires readOnly=true', 'READ_ONLY_REQUIRED');
  if (data.validation?.valid !== true) fail('Drawing validation failed', 'DRAWING_VALIDATION_FAILED', { validation: clone(data.validation) });
  if (data.contract === 'production-package') {
    if (data.projectId !== projectId || !data.furnitureObjects?.some((object) => object.objectId === objectId)) fail('Production Package Object does not match the current Project', 'DRAWING_OBJECT_MISMATCH');
    if (data.status !== 'Generated') fail('Production Package is not ready for PDF Export', 'DRAWING_INVALID', { status: data.status });
    if (!Array.isArray(data.drawings) || data.drawings.length !== data.drawingCount || data.drawings.some((drawing) => drawing.status !== 'Generated' || drawing.readOnly !== true || drawing.validation?.valid !== true)) fail('Production Package contains invalid Drawing references', 'DRAWING_INVALID');
    return;
  }
  if (data.contract !== 'production-drawing-data') fail('Unsupported Drawing Contract', 'DRAWING_CONTRACT_INVALID');
  if (data.objectId !== objectId || data.furnitureObject?.objectId !== objectId) fail('Drawing Object does not match the current Object', 'DRAWING_OBJECT_MISMATCH');
  if (!VALID_STATUSES.has(data.status)) fail('Drawing status is invalid for PDF Export', 'DRAWING_INVALID', { status: data.status });
  if (!Array.isArray(data.views) || data.views.length === 0) fail('Drawing views are missing', 'DRAWING_INVALID');
}

function pdfEscape(value) {
  return String(value ?? 'Not Available').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/[\r\n]+/g, ' ');
}

function linesFor(data) {
  const lines = ['Furniture GO'];
  if (data.contract === 'production-package') {
    lines.push(`Production Package: ${data.packageId}`, `Project: ${data.project.name || 'Not Available'} (${data.projectId})`, `Status: ${data.status}`, 'Validation: PASS', 'Read-only: Yes', `Furniture Objects: ${data.furnitureObjects.length}`, `Drawings: ${data.drawingCount}`);
    data.drawings.forEach((drawing) => lines.push(`Drawing: ${drawing.drawingType || 'Not Available'} | ${drawing.drawingId || 'Not Available'} | ${drawing.status} | Read-only: ${drawing.readOnly === true ? 'Yes' : 'No'}`));
    return lines;
  }
  lines.push(`Project: ${data.project.name || 'Not Available'} (${data.project.projectId})`, `Furniture Object: ${data.furnitureObject.name || 'Not Available'} (${data.objectId})`, `Drawing ID: ${data.drawingId || 'Not Available'}`, `Drawing Type: ${data.drawingType || 'Not Available'}`, `Status: ${data.status}`, 'Validation: PASS', 'Read-only: Yes');
  data.views.forEach((view) => lines.push(`View: ${view.label || view.type || 'Not Available'} | Dimensions: ${Object.entries(view.dimensions || {}).map(([key, value]) => `${key}=${value}`).join(', ') || 'Not Available'}`));
  lines.push(`Components: ${Array.isArray(data.components) ? data.components.length : 0}`, `Hardware: ${data.hardware?.references?.length || 0}`, `Material: ${data.material?.references?.length || 0}`, `Annotations: ${Array.isArray(data.annotations) ? data.annotations.length : 0}`, `Processing: ${Array.isArray(data.processing) ? data.processing.length : 0}`);
  return lines;
}

function buildPdf(lines) {
  const content = ['BT', '/F1 11 Tf', '50 760 Td', ...lines.slice(0, 52).map((line, index) => `${index ? '0 -14 Td' : ''} (${pdfEscape(line)}) Tj`), 'ET'].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf, 'binary')); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xrefOffset = Buffer.byteLength(pdf, 'binary');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'binary');
}

function safeFilePart(value) {
  return String(value || 'Project').replace(/[^a-z0-9-_]+/gi, '_').replace(/^_+|_+$/g, '') || 'Project';
}

function exportProductionDrawingPdf(data, projectId, objectId) {
  validateExportData(data, projectId, objectId);
  const projectName = safeFilePart(data.project?.name || projectId);
  const packageOutput = data.contract === 'production-package';
  const filename = `FurnitureGO_${projectName}_${packageOutput ? 'Production_Package' : safeFilePart(data.drawingType)}.pdf`;
  return { buffer: buildPdf(linesFor(data)), filename, contentType: 'application/pdf', source: clone(data) };
}

module.exports = { exportProductionDrawingPdf, validateExportData, buildPdf };
