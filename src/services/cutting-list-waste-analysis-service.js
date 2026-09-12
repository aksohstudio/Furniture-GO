const { clone } = require('./production-drawing-data-contract');

function fail(message, statusCode, code, details = {}) {
  throw Object.assign(new Error(message), { statusCode, code, details });
}

function positive(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

function blockedResult(cuttingList, boardLayout, code, message, materialStatisticsId = null) {
  return {
    schemaVersion: 1,
    contract: 'waste-analysis-result',
    wasteAnalysisId: `waste-analysis:${cuttingList.project.projectId}:${cuttingList.furnitureObject.objectId}:${cuttingList.cuttingListId}`,
    project: clone(cuttingList.project),
    furnitureObject: clone(cuttingList.furnitureObject),
    cuttingListId: cuttingList.cuttingListId,
    boardLayoutId: boardLayout?.boardLayoutId || null,
    materialStatisticsId,
    materials: [],
    totals: { totalBoardArea: null, totalUsedPartArea: null, totalWasteArea: null, totalWastePercentage: null, unit: null },
    validation: { valid: false, status: code, issues: [{ code, message }] },
    status: 'BLOCKED',
    readOnly: true,
  };
}

function validateCuttingList(cuttingList, expectedProjectId, expectedObjectId, expectedCuttingListId) {
  if (!cuttingList || cuttingList.contract !== 'cutting-list-result' || !Array.isArray(cuttingList.parts)) fail('Cutting List Result is invalid', 422, 'CUTTING_LIST_INVALID');
  if (!cuttingList.project?.projectId || !cuttingList.furnitureObject?.objectId || cuttingList.readOnly !== true) fail('Cutting List context is invalid', 422, 'CUTTING_LIST_INVALID');
  if (expectedProjectId && cuttingList.project.projectId !== expectedProjectId) fail('Cutting List Project does not match', 422, 'CUTTING_LIST_PROJECT_MISMATCH');
  if (expectedObjectId && cuttingList.furnitureObject.objectId !== expectedObjectId) fail('Cutting List Furniture Object does not match', 422, 'PROJECT_OBJECT_MISMATCH');
  if (expectedCuttingListId && cuttingList.cuttingListId !== expectedCuttingListId) fail('Cutting List was not found', 422, 'CUTTING_LIST_NOT_FOUND');
}

function validateBoardLayout(boardLayout, cuttingList, expectedProjectId, expectedObjectId, expectedBoardLayoutId) {
  if (!boardLayout || boardLayout.contract !== 'board-layout-result' || boardLayout.readOnly !== true || !Array.isArray(boardLayout.layout?.boards)) fail('Board Layout Result is not available', 422, 'BOARD_LAYOUT_NOT_AVAILABLE');
  if (expectedProjectId && boardLayout.project?.projectId !== expectedProjectId) fail('Board Layout Project does not match', 422, 'PROJECT_OBJECT_MISMATCH');
  if (expectedObjectId && boardLayout.furnitureObject?.objectId !== expectedObjectId) fail('Board Layout Furniture Object does not match', 422, 'PROJECT_OBJECT_MISMATCH');
  if (boardLayout.cuttingListId !== cuttingList.cuttingListId) fail('Board Layout does not belong to this Cutting List', 422, 'CUTTING_LIST_NOT_FOUND');
  if (expectedBoardLayoutId && boardLayout.boardLayoutId !== expectedBoardLayoutId) fail('Board Layout was not found', 422, 'BOARD_LAYOUT_NOT_AVAILABLE');
  if (boardLayout.status === 'INCOMPLETE' || boardLayout.validation?.valid === false) return { blocked: true, code: 'BOARD_LAYOUT_INCOMPLETE', message: 'Board Layout is incomplete' };
  return boardLayout;
}

function generateWasteAnalysis(cuttingList, boardLayout, officialCatalog, materialStatisticsId = null, expectedProjectId = null, expectedObjectId = null, expectedCuttingListId = null, expectedBoardLayoutId = null) {
  validateCuttingList(cuttingList, expectedProjectId, expectedObjectId, expectedCuttingListId);
  const input = clone(cuttingList);
  if (!boardLayout) return blockedResult(input, null, 'BOARD_LAYOUT_NOT_AVAILABLE', 'Board Layout must exist before Waste Analysis can be calculated', materialStatisticsId);
  const layout = validateBoardLayout(boardLayout, input, expectedProjectId, expectedObjectId, expectedBoardLayoutId);
  if (layout.blocked) return blockedResult(input, boardLayout, layout.code, layout.message, materialStatisticsId);
  for (const board of layout.layout.boards) {
    if (!positive(board.board?.width) || !positive(board.board?.height)) return blockedResult(input, boardLayout, 'BOARD_DIMENSIONS_MISSING', 'Board dimensions are missing or invalid', materialStatisticsId);
  }
  const groups = new Map();
  for (const part of input.parts) {
    const materialId = part.material?.id;
    if (!materialId) return blockedResult(input, boardLayout, 'MATERIAL_REFERENCE_MISSING', 'Part material reference is missing', materialStatisticsId);
    const material = officialCatalog?.getMaterialById?.(materialId);
    if (!material) return blockedResult(input, boardLayout, 'UNKNOWN_MATERIAL', 'Material was not found in the Official Material Catalog', materialStatisticsId);
    const quantity = Number(part.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) return blockedResult(input, boardLayout, 'QUANTITY_MISSING', 'Part quantity is missing or invalid', materialStatisticsId);
    const width = Number(part.dimensions?.width);
    const height = Number(part.dimensions?.height);
    if (!positive(width) || !positive(height)) return blockedResult(input, boardLayout, 'DIMENSIONS_INVALID', 'Part dimensions are missing or invalid', materialStatisticsId);
    const thickness = part.dimensions?.thickness ?? material.thickness ?? null;
    const key = `${materialId}::${String(thickness ?? 'unavailable')}`;
    if (!groups.has(key)) groups.set(key, { material, thickness, partCount: 0, totalQuantity: 0, usedPartArea: 0 });
    const group = groups.get(key);
    group.partCount += 1;
    group.totalQuantity += quantity;
    group.usedPartArea += width * height * quantity;
  }
  const records = [];
  for (const group of groups.values()) {
    const boards = layout.layout.boards.filter((board) => board.material?.id === group.material.id && (group.thickness === null || String(board.board?.thickness) === String(group.thickness)));
    if (!boards.length) return blockedResult(input, boardLayout, 'MATERIAL_LAYOUT_MISMATCH', 'Board Layout does not provide matching board records', materialStatisticsId);
    let boardArea = 0;
    for (const board of boards) {
      if (!positive(board.board?.width) || !positive(board.board?.height)) return blockedResult(input, boardLayout, 'BOARD_DIMENSIONS_MISSING', 'Board dimensions are missing or invalid', materialStatisticsId);
      boardArea += Number(board.board.width) * Number(board.board.height);
    }
    const wasteArea = boardArea - group.usedPartArea;
    records.push({ materialId: group.material.id, materialName: group.material.name || group.material.officialName || null, productCode: group.material.productCode ?? null, thickness: group.thickness, boardCount: boards.length, boardArea, usedPartArea: group.usedPartArea, wasteArea, wastePercentage: boardArea > 0 ? (wasteArea / boardArea) * 100 : null, unit: 'mm²', validation: { valid: true, status: 'CALCULATED_FROM_EXISTING_BOARD_LAYOUT', issues: [] } });
  }
  const totals = records.reduce((total, record) => ({ totalBoardArea: total.totalBoardArea + record.boardArea, totalUsedPartArea: total.totalUsedPartArea + record.usedPartArea, totalWasteArea: total.totalWasteArea + record.wasteArea }), { totalBoardArea: 0, totalUsedPartArea: 0, totalWasteArea: 0 });
  return { schemaVersion: 1, contract: 'waste-analysis-result', wasteAnalysisId: `waste-analysis:${input.project.projectId}:${input.furnitureObject.objectId}:${input.cuttingListId}`, project: clone(input.project), furnitureObject: clone(input.furnitureObject), cuttingListId: input.cuttingListId, boardLayoutId: layout.boardLayoutId, materialStatisticsId, materials: records, totals: { ...totals, totalWastePercentage: totals.totalBoardArea > 0 ? (totals.totalWasteArea / totals.totalBoardArea) * 100 : null, unit: records[0]?.unit || 'mm²' }, validation: { valid: true, status: 'VALIDATED', issues: [] }, status: 'Generated', readOnly: true };
}

module.exports = { generateWasteAnalysis, positive };
