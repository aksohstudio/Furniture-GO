const VALID_DRAWING_STATUSES = new Set(['Generated', 'Approved', 'Ready']);

function printError(message, code, details = {}) {
  return Object.assign(new Error(message), { code, details });
}

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function validateContext(data, projectId, objectId) {
  if (!data || typeof data !== 'object') throw printError('Drawing or Production Package data is required', 'DRAWING_MISSING');
  if (data.project?.projectId !== projectId) throw printError('Drawing Project does not match the current context', 'DRAWING_PROJECT_MISMATCH');
  if (data.objectId && data.objectId !== objectId) throw printError('Drawing Object does not match the current context', 'DRAWING_OBJECT_MISMATCH');
  if (data.readOnly !== true) throw printError('Printing requires readOnly=true', 'READ_ONLY_REQUIRED');
  if (data.validation?.valid !== true) throw printError('Drawing validation failed', 'DRAWING_VALIDATION_FAILED', { validation: clone(data.validation) });
}

export function preparePrintDocument(data, projectId, objectId) {
  validateContext(data, projectId, objectId);
  if (data.contract === 'production-package') {
    if (data.projectId !== projectId || !data.furnitureObjects?.some((object) => object.objectId === objectId)) throw printError('Production Package Project or Object does not match the current context', 'DRAWING_PROJECT_MISMATCH');
    if (data.status !== 'Generated') throw printError('Production Package is not ready for printing', 'DRAWING_INVALID', { status: data.status });
    return { kind: 'package', packageId: data.packageId, project: clone(data.project), projectId: data.projectId, furnitureObjects: clone(data.furnitureObjects), drawings: clone(data.drawings), drawingCount: data.drawingCount, drawingTypes: clone(data.drawingTypes), validation: clone(data.validation), status: data.status, readOnly: true };
  }
  if (data.contract !== 'production-drawing-data') throw printError('Unsupported Drawing Contract', 'DRAWING_CONTRACT_INVALID');
  if (!VALID_DRAWING_STATUSES.has(data.status)) throw printError('Drawing status is invalid for printing', 'DRAWING_INVALID', { status: data.status });
  if (!Array.isArray(data.views) || data.views.length === 0) throw printError('Drawing views are missing', 'DRAWING_INVALID');
  return { kind: 'drawing', drawingId: data.drawingId, project: clone(data.project), furnitureObject: clone(data.furnitureObject), objectId: data.objectId, drawingType: data.drawingType, status: data.status, validation: clone(data.validation), source: clone(data.source), dimensions: clone(data.dimensions), views: clone(data.views), components: clone(data.components || []), hardware: clone(data.hardware || { references: [] }), material: clone(data.material || { references: [] }), annotations: clone(data.annotations || []), processing: clone(data.processing || []), readOnly: true };
}

export { VALID_DRAWING_STATUSES };
