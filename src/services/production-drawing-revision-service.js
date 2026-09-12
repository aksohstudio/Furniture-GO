const { clone } = require('./production-drawing-data-contract');

const histories = new Map();
const VALID_STATUSES = new Set(['Generated', 'Approved', 'Ready']);

function fail(message, code, details = {}) {
  throw Object.assign(new Error(message), { code, details });
}

function contextKey(projectId, objectId, drawingId) {
  return `${projectId}::${objectId}::${drawingId}`;
}

function revisionNumber(index) {
  return `REV-${String(index).padStart(3, '0')}`;
}

function validateDrawing(drawing, projectId, objectId) {
  if (!drawing || typeof drawing !== 'object') fail('Drawing data is required', 'DRAWING_MISSING');
  if (drawing.contract !== 'production-drawing-data') fail('Unsupported Drawing Contract', 'DRAWING_CONTRACT_INVALID');
  if (drawing.project?.projectId !== projectId) fail('Drawing Project does not match the current Project', 'DRAWING_PROJECT_MISMATCH');
  if (drawing.objectId !== objectId || drawing.furnitureObject?.objectId !== objectId) fail('Drawing Object does not match the current Object', 'DRAWING_OBJECT_MISMATCH');
  if (!drawing.drawingId || !drawing.drawingType) fail('Drawing identity is required', 'DRAWING_INVALID');
  if (!VALID_STATUSES.has(drawing.status)) fail('Drawing status is invalid for revision', 'DRAWING_INVALID');
  if (drawing.validation?.valid !== true) fail('Drawing validation failed', 'DRAWING_VALIDATION_FAILED');
  if (drawing.readOnly !== true) fail('Revision source must be readOnly', 'READ_ONLY_REQUIRED');
}

function metadata(drawing) {
  return {
    drawingId: drawing.drawingId,
    drawingType: drawing.drawingType,
    viewCount: Array.isArray(drawing.views) ? drawing.views.length : null,
    componentCount: Array.isArray(drawing.components) ? drawing.components.length : null,
    hardwareReferenceCount: Array.isArray(drawing.hardware?.references) ? drawing.hardware.references.length : null,
    materialReferenceCount: Array.isArray(drawing.material?.references) ? drawing.material.references.length : null,
    annotationCount: Array.isArray(drawing.annotations) ? drawing.annotations.length : null,
  };
}

function compareDrawings(current, previous) {
  if (!current || !previous) return { comparisonAvailable: false, status: 'COMPARISON_UNAVAILABLE', changes: [] };
  const currentMetadata = metadata(current);
  const previousMetadata = metadata(previous);
  const fields = ['drawingId', 'drawingType', 'viewCount', 'componentCount', 'hardwareReferenceCount', 'materialReferenceCount', 'annotationCount'];
  const changes = fields.filter((field) => currentMetadata[field] !== previousMetadata[field]).map((field) => ({ field, previous: previousMetadata[field], current: currentMetadata[field] }));
  return { comparisonAvailable: true, status: 'COMPARISON_AVAILABLE', changes, current: currentMetadata, previous: previousMetadata };
}

function createRevision(drawing, projectId, objectId, changeSummary = 'Drawing regenerated') {
  validateDrawing(drawing, projectId, objectId);
  const key = contextKey(projectId, objectId, drawing.drawingId);
  const history = histories.get(key) || [];
  const previous = history[history.length - 1] || null;
  const revisionNumberValue = revisionNumber(history.length + 1);
  const revisionId = `${drawing.drawingId}:revision:${revisionNumberValue}`;
  const now = new Date().toISOString();
  const record = {
    schemaVersion: 1,
    contract: 'production-drawing-revision',
    revisionId,
    drawingId: drawing.drawingId,
    projectId,
    objectId,
    drawingType: drawing.drawingType,
    revisionNumber: revisionNumberValue,
    revisionLabel: revisionNumberValue,
    createdAt: now,
    source: clone(drawing.source || { sourceType: 'production-drawing-data', drawingId: drawing.drawingId }),
    status: 'Created',
    readOnly: true,
    changeSummary: typeof changeSummary === 'string' && changeSummary.trim() ? changeSummary.trim().slice(0, 240) : 'Drawing regenerated',
    previousRevisionId: previous?.revisionId || null,
    comparison: compareDrawings(drawing, previous?._drawing || null),
    _drawing: clone(drawing),
  };
  history.push(record);
  histories.set(key, history);
  return clone({ ...record, _drawing: undefined });
}

function listRevisions(projectId, objectId, drawingId) {
  const history = histories.get(contextKey(projectId, objectId, drawingId)) || [];
  return clone(history.map((record) => ({ ...record, _drawing: undefined })));
}

function getRevision(projectId, objectId, drawingId, revisionId) {
  const record = (histories.get(contextKey(projectId, objectId, drawingId)) || []).find((item) => item.revisionId === revisionId);
  if (!record) fail('Revision not found', 'REVISION_NOT_FOUND');
  return clone({ ...record, _drawing: undefined });
}

function compareRevision(projectId, objectId, drawingId, revisionId, drawing) {
  validateDrawing(drawing, projectId, objectId);
  const record = (histories.get(contextKey(projectId, objectId, drawingId)) || []).find((item) => item.revisionId === revisionId);
  if (!record) fail('Revision not found', 'REVISION_NOT_FOUND');
  if (drawing.drawingId !== drawingId) fail('Drawing does not match the revision', 'DRAWING_MISMATCH');
  return clone(compareDrawings(drawing, record._drawing));
}

module.exports = { createRevision, listRevisions, getRevision, compareRevision, validateDrawing, compareDrawings };
