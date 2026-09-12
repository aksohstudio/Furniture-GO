const VALID_STATUSES = new Set(['Generated', 'Approved', 'Ready']);

function previewError(message, code, details = {}) {
  return Object.assign(new Error(message), { code, details });
}

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

export function prepareDrawingPreview(drawing, projectId, objectId, viewId = null) {
  if (!drawing || typeof drawing !== 'object') throw previewError('Drawing data is required', 'DRAWING_DATA_MISSING');
  if (drawing.contract !== 'production-drawing-data') throw previewError('Unsupported drawing data contract', 'DRAWING_DATA_INVALID');
  if (drawing.project?.projectId !== projectId || drawing.furnitureObject?.objectId !== objectId || drawing.objectId !== objectId) {
    throw previewError('Drawing Project or Furniture Object does not match the current context', 'DRAWING_CONTEXT_MISMATCH');
  }
  if (drawing.readOnly !== true) throw previewError('Drawing Preview requires readOnly=true', 'DRAWING_NOT_READ_ONLY');
  if (!VALID_STATUSES.has(drawing.status)) throw previewError('Drawing status is not valid for Preview', 'DRAWING_STATUS_INVALID', { status: drawing.status });
  if (drawing.validation?.valid !== true) throw previewError('Drawing validation failed', 'DRAWING_VALIDATION_FAILED', { validation: clone(drawing.validation) });
  if (!Array.isArray(drawing.views) || drawing.views.length === 0) throw previewError('Drawing views are missing', 'DRAWING_VIEWS_MISSING');
  const view = viewId ? drawing.views.find((candidate) => candidate.id === viewId) : drawing.views[0];
  if (!view) throw previewError('Requested drawing view is not available', 'DRAWING_VIEW_NOT_FOUND', { viewId });
  return {
    drawingId: drawing.drawingId,
    project: clone(drawing.project),
    furnitureObject: clone(drawing.furnitureObject),
    drawingType: drawing.drawingType,
    status: drawing.status,
    validation: clone(drawing.validation),
    source: clone(drawing.source),
    view: clone(view),
    views: drawing.views.map((candidate) => ({ id: candidate.id, label: candidate.label, type: candidate.type })),
    dimensions: clone(drawing.dimensions),
    annotations: clone(drawing.annotations || []),
    components: clone(drawing.components || []),
    hardware: clone(drawing.hardware || { references: [] }),
    material: clone(drawing.material || { references: [] }),
    processing: clone(drawing.processing || []),
    readOnly: true,
  };
}

export { VALID_STATUSES };
