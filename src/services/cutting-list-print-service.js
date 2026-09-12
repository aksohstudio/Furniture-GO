const PRINT_TYPES = new Set(['current-view', 'cutting-list', 'board-layout', 'material-statistics', 'waste-analysis', 'information-panel', 'part-trace']);
const VALID_RESULT_STATUSES = new Set(['Generated', 'Approved', 'Ready']);
const SOURCES = {
  'cutting-list': ['cuttingList', 'cutting-list-result'],
  'board-layout': ['boardLayout', 'board-layout-result'],
  'material-statistics': ['materialStatistics', 'material-statistics-result'],
  'waste-analysis': ['wasteAnalysis', 'waste-analysis-result'],
  'information-panel': ['informationPanel', 'information-panel-result'],
  'part-trace': ['partTrace', 'part-trace-result'],
};

function fail(message, statusCode, code, details = {}) {
  throw Object.assign(new Error(message), { statusCode, code, details });
}

function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }

function sourceContext(result) {
  return { projectId: result.project?.projectId || null, objectId: result.furnitureObject?.objectId || result.furnitureObject?.objectId || null, cuttingListId: result.cuttingListId || result.cuttingList?.cuttingListId || result.cuttingPart?.cuttingListId || null };
}

function validateSource(result, contract, name, projectId, objectId, cuttingListId) {
  if (!result || result.contract !== contract || result.readOnly !== true) fail(`${name} Result is not printable`, 422, 'PRINT_RESULT_INVALID');
  const context = sourceContext(result);
  if (context.projectId !== projectId || (context.objectId && context.objectId !== objectId)) fail(`${name} Project or Object does not match`, 422, 'PRINT_SOURCE_MISMATCH');
  if (cuttingListId && context.cuttingListId && context.cuttingListId !== cuttingListId) fail(`${name} does not belong to this Cutting List`, 422, 'PRINT_SOURCE_MISMATCH');
  if (!VALID_RESULT_STATUSES.has(result.status) || result.validation?.valid === false || result.status === 'BLOCKED' || result.status === 'INCOMPLETE') fail(`${name} validation does not permit printing`, 422, 'PRINT_VALIDATION_FAILED', { validation: clone(result.validation), status: result.status });
  return result;
}

function prepareCuttingListPrintDocument(sources, projectId, objectId, printType = 'current-view') {
  if (!PRINT_TYPES.has(printType)) fail('Unsupported Cutting List print type', 400, 'PRINT_TYPE_INVALID');
  const cuttingList = sources?.cuttingList;
  validateSource(cuttingList, 'cutting-list-result', 'Cutting List', projectId, objectId, null);
  const cuttingListId = cuttingList.cuttingListId;
  const sections = {};
  for (const [key, contract] of Object.values(SOURCES).map(([key, contract]) => [key, contract])) {
    const result = sources?.[key];
    if (result) sections[key] = validateSource(result, contract, key, projectId, objectId, cuttingListId);
  }
  const selectedKey = printType === 'current-view' ? null : SOURCES[printType][0];
  if (selectedKey && !sections[selectedKey]) fail(`${printType} Result is not available`, 422, 'PRINT_RESULT_NOT_AVAILABLE');
  return { schemaVersion: 1, contract: 'cutting-list-print-document', printDocumentId: `cutting-list-print:${projectId}:${objectId}:${cuttingListId}:${printType}`, printType, project: clone(cuttingList.project), furnitureObject: clone(cuttingList.furnitureObject), cuttingListId, sections: clone(sections), selectedSection: selectedKey, validation: { valid: true, status: 'PRINT_READY', issues: [] }, status: 'Ready', readOnly: true };
}

module.exports = { prepareCuttingListPrintDocument, PRINT_TYPES };
