const { clone } = require('./production-drawing-data-contract');

function fail(message, statusCode, code, details = {}) {
  throw Object.assign(new Error(message), { statusCode, code, details });
}

function unavailable(code) {
  return { status: 'unavailable', code, value: null };
}

function validateResult(result, contract, name, projectId, objectId, expectedId) {
  if (!result) return null;
  if (result.contract !== contract || result.readOnly !== true) fail(`${name} Result is invalid`, 422, 'CONTRACT_MISMATCH');
  if (projectId && result.project?.projectId !== projectId) fail(`${name} does not belong to this Project`, 422, 'PROJECT_ISOLATION_VIOLATION');
  if (objectId && result.furnitureObject?.objectId !== objectId) fail(`${name} does not belong to this Furniture Object`, 422, 'OBJECT_ISOLATION_VIOLATION');
  if (expectedId && result[`${contract === 'board-layout-result' ? 'boardLayout' : contract === 'material-statistics-result' ? 'statistics' : 'wasteAnalysis'}Id`] !== expectedId) fail(`${name} ID does not match`, 422, 'SOURCE_MISMATCH');
  return result;
}

function generateInformationPanel(cuttingList, boardLayout = null, materialStatistics = null, wasteAnalysis = null, expectedProjectId = null, expectedObjectId = null, expectedCuttingListId = null, expectedBoardLayoutId = null, expectedMaterialStatisticsId = null, expectedWasteAnalysisId = null) {
  if (!cuttingList || cuttingList.contract !== 'cutting-list-result' || !Array.isArray(cuttingList.parts) || cuttingList.readOnly !== true) fail('Cutting List Result is invalid', 422, 'CUTTING_LIST_INVALID');
  if (!cuttingList.project?.projectId || !cuttingList.furnitureObject?.objectId) fail('Cutting List context is invalid', 422, 'CUTTING_LIST_INVALID');
  if (expectedProjectId && cuttingList.project.projectId !== expectedProjectId) fail('Cutting List Project does not match', 422, 'PROJECT_ISOLATION_VIOLATION');
  if (expectedObjectId && cuttingList.furnitureObject.objectId !== expectedObjectId) fail('Cutting List Furniture Object does not match', 422, 'OBJECT_ISOLATION_VIOLATION');
  if (expectedCuttingListId && cuttingList.cuttingListId !== expectedCuttingListId) fail('Cutting List ID does not match', 422, 'SOURCE_MISMATCH');
  const input = clone(cuttingList);
  const layout = validateResult(boardLayout, 'board-layout-result', 'Board Layout', expectedProjectId, expectedObjectId, expectedBoardLayoutId);
  const statistics = validateResult(materialStatistics, 'material-statistics-result', 'Material Statistics', expectedProjectId, expectedObjectId, expectedMaterialStatisticsId);
  const waste = validateResult(wasteAnalysis, 'waste-analysis-result', 'Waste Analysis', expectedProjectId, expectedObjectId, expectedWasteAnalysisId);
  for (const result of [layout, statistics, waste]) if (result && result.cuttingListId !== input.cuttingListId) fail('Source result does not belong to this Cutting List', 422, 'SOURCE_MISMATCH');
  const partCount = Number.isInteger(input.partCount) ? input.partCount : input.parts.length;
  const cuttingListSummary = { cuttingListId: input.cuttingListId, partCount, totalQuantity: Number.isInteger(input.totalQuantity) ? input.totalQuantity : null, validationStatus: input.validation?.status || 'Not Available', resultStatus: input.status || 'Not Available' };
  const materialSummary = statistics ? clone(statistics.materials || []) : unavailable('MATERIAL_STATISTICS_NOT_AVAILABLE');
  const boardSummary = layout ? { boardLayoutId: layout.boardLayoutId, boardCount: layout.layout?.boards?.length ?? null, boardSize: layout.board || null, placedPartCount: layout.parts?.length ?? layout.layout?.boards?.reduce((total, board) => total + (board.parts?.length || 0), 0) ?? null, unplacedPartCount: layout.layout?.unplacedParts?.length ?? 0, layoutStatus: layout.status || layout.validation?.status || 'Not Available' } : unavailable('BOARD_LAYOUT_NOT_AVAILABLE');
  const wasteSummary = waste ? { wasteAnalysisId: waste.wasteAnalysisId, totalBoardArea: waste.totals?.totalBoardArea ?? null, usedPartArea: waste.totals?.totalUsedPartArea ?? null, wasteArea: waste.totals?.totalWasteArea ?? null, wastePercentage: waste.totals?.totalWastePercentage ?? null, materialWasteBreakdown: clone(waste.materials || []), status: waste.status || waste.validation?.status || 'Not Available' } : unavailable('WASTE_ANALYSIS_NOT_AVAILABLE');
  const issues = [];
  if (!layout) issues.push('BOARD_LAYOUT_NOT_AVAILABLE');
  if (!statistics) issues.push('MATERIAL_STATISTICS_NOT_AVAILABLE');
  if (!waste) issues.push('WASTE_ANALYSIS_NOT_AVAILABLE');
  return { schemaVersion: 1, contract: 'information-panel-result', informationPanelId: `information-panel:${input.project.projectId}:${input.furnitureObject.objectId}:${input.cuttingListId}`, project: clone(input.project), furnitureObject: clone(input.furnitureObject), cuttingListId: input.cuttingListId, cuttingList: cuttingListSummary, materials: materialSummary, boardLayout: boardSummary, wasteAnalysis: wasteSummary, productionDataStatus: { readOnly: true, source: 'canonical-cutting-list-result-and-derived-read-only-results', validation: input.validation?.status || 'Not Available', status: issues.length ? 'AVAILABLE_WITH_UNAVAILABLE_SECTIONS' : 'AVAILABLE', issues }, validation: { valid: true, status: issues.length ? 'VALIDATED_WITH_LIMITATIONS' : 'VALIDATED', issues }, status: 'Generated', readOnly: true };
}

module.exports = { generateInformationPanel, unavailable };
