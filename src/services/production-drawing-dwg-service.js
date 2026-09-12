const { exportDwg } = require('./dwg-export-service');
const { validateExportData } = require('./production-drawing-pdf-service');

function fail(message, code, details = {}) {
  throw Object.assign(new Error(message), { code, details });
}

function safeFilePart(value) {
  return String(value || 'Project').replace(/[^a-z0-9-_]+/gi, '_').replace(/^_+|_+$/g, '') || 'Project';
}

function viewEntities(view, index) {
  const dimensions = view?.dimensions || {};
  const width = Number(dimensions.width);
  const height = Number(dimensions.height ?? dimensions.depth);
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) fail('DWG Export requires valid existing view dimensions', 'DWG_EXPORT_UNAVAILABLE', { viewId: view?.id || null });
  const offsetX = index * (width + 100);
  const layer = `VIEW_${index + 1}`;
  return [
    { type: 'LINE', layer, start: { x: offsetX, y: 0 }, end: { x: offsetX + width, y: 0 } },
    { type: 'LINE', layer, start: { x: offsetX + width, y: 0 }, end: { x: offsetX + width, y: height } },
    { type: 'LINE', layer, start: { x: offsetX + width, y: height }, end: { x: offsetX, y: height } },
    { type: 'LINE', layer, start: { x: offsetX, y: height }, end: { x: offsetX, y: 0 } },
    { type: 'TEXT', layer, position: { x: offsetX, y: height + 20 }, text: String(view.label || view.type || view.id || 'Drawing View'), height: 10 },
  ];
}

async function exportProductionDrawingDwg(data, projectId, objectId) {
  validateExportData(data, projectId, objectId);
  if (data.contract === 'production-package') fail('Production Package DWG composition is not safely supported', 'DWG_EXPORT_UNAVAILABLE');
  const entities = data.views.flatMap((view, index) => viewEntities(view, index));
  const result = await exportDwg({ entities, units: data.dimensions?.unit || 'unknown' });
  const filename = `FurnitureGO_${safeFilePart(data.project?.name || projectId)}_${safeFilePart(data.drawingType)}.dwg`;
  return { ...result, filename, contentType: 'application/acad', sourceDrawingId: data.drawingId };
}

module.exports = { exportProductionDrawingDwg, viewEntities };
