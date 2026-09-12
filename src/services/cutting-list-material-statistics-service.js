const { clone } = require('./production-drawing-data-contract');

function fail(message, statusCode, code, details = {}) {
  throw Object.assign(new Error(message), { statusCode, code, details });
}

function positive(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

function materialName(material) {
  return material?.name || material?.officialName || null;
}

function validateContext(cuttingList, expectedProjectId, expectedObjectId, expectedCuttingListId) {
  if (!cuttingList || cuttingList.contract !== 'cutting-list-result' || !Array.isArray(cuttingList.parts)) fail('Cutting List Result is invalid', 422, 'CUTTING_LIST_INVALID');
  if (cuttingList.readOnly !== true || !cuttingList.project?.projectId || !cuttingList.furnitureObject?.objectId) fail('Cutting List context is invalid', 422, 'CUTTING_LIST_INVALID');
  if (expectedProjectId && cuttingList.project.projectId !== expectedProjectId) fail('Cutting List does not belong to this Project', 422, 'CUTTING_LIST_PROJECT_MISMATCH');
  if (expectedObjectId && cuttingList.furnitureObject.objectId !== expectedObjectId) fail('Cutting List does not belong to this Furniture Object', 422, 'PROJECT_OBJECT_MISMATCH');
  if (expectedCuttingListId && cuttingList.cuttingListId !== expectedCuttingListId) fail('Cutting List ID does not match', 422, 'CUTTING_LIST_NOT_FOUND');
}

function validateBoardLayout(boardLayout, cuttingList, expectedProjectId, expectedObjectId, expectedBoardLayoutId) {
  if (!boardLayout) return null;
  if (boardLayout.contract !== 'board-layout-result' || boardLayout.readOnly !== true || !Array.isArray(boardLayout.layout?.boards)) fail('Board Layout Result is invalid', 422, 'CUTTING_LIST_INVALID');
  if (expectedProjectId && boardLayout.project?.projectId !== expectedProjectId) fail('Board Layout does not belong to this Project', 422, 'PROJECT_OBJECT_MISMATCH');
  if (expectedObjectId && boardLayout.furnitureObject?.objectId !== expectedObjectId) fail('Board Layout does not belong to this Furniture Object', 422, 'PROJECT_OBJECT_MISMATCH');
  if (boardLayout.cuttingListId !== cuttingList.cuttingListId) fail('Board Layout does not belong to this Cutting List', 422, 'CUTTING_LIST_NOT_FOUND');
  if (expectedBoardLayoutId && boardLayout.boardLayoutId !== expectedBoardLayoutId) fail('Board Layout was not found', 422, 'BOARD_LAYOUT_NOT_AVAILABLE');
  return boardLayout;
}

function areaFor(part) {
  const width = Number(part.dimensions?.width);
  const height = Number(part.dimensions?.height);
  const quantity = Number(part.quantity);
  if (!positive(width) || !positive(height)) return null;
  if (!Number.isInteger(quantity) || quantity <= 0) fail('Part quantity is missing or invalid', 422, 'QUANTITY_MISSING', { partId: part.partId });
  return width * height * quantity;
}

function generateMaterialStatistics(cuttingList, officialCatalog, boardLayout = null, expectedProjectId = null, expectedObjectId = null, expectedCuttingListId = null, expectedBoardLayoutId = null) {
  validateContext(cuttingList, expectedProjectId, expectedObjectId, expectedCuttingListId);
  const input = clone(cuttingList);
  const layout = validateBoardLayout(boardLayout, input, expectedProjectId, expectedObjectId, expectedBoardLayoutId);
  const groups = new Map();
  for (const part of input.parts) {
    const materialId = part.material?.id;
    if (!materialId) fail('Part material reference is missing', 422, 'MATERIAL_REFERENCE_MISSING', { partId: part.partId });
    const material = officialCatalog?.getMaterialById?.(materialId);
    if (!material) fail('Material was not found in the Official Material Catalog', 422, 'UNKNOWN_MATERIAL', { materialId, partId: part.partId });
    if (part.quantity === undefined || !Number.isInteger(Number(part.quantity)) || Number(part.quantity) <= 0) fail('Part quantity is missing or invalid', 422, 'QUANTITY_MISSING', { partId: part.partId });
    const thickness = part.dimensions?.thickness ?? material.thickness ?? null;
    const key = `${materialId}::${String(thickness ?? 'unavailable')}`;
    if (!groups.has(key)) groups.set(key, { material, thickness, partCount: 0, totalQuantity: 0, totalPartArea: 0, areaAvailable: true, parts: [] });
    const group = groups.get(key);
    group.partCount += 1;
    group.totalQuantity += Number(part.quantity);
    group.parts.push(part);
    const area = areaFor(part);
    if (area === null) group.areaAvailable = false;
    else group.totalPartArea += area;
  }
  const materials = [...groups.values()].map((group) => {
    const materialId = group.material.id;
    const matchingBoards = layout?.layout.boards.filter((board) => board.material?.id === materialId && (group.thickness === null || String(board.board?.thickness) === String(group.thickness))) || [];
    const boardSize = matchingBoards[0]?.board ? { width: matchingBoards[0].board.width, height: matchingBoards[0].board.height, unit: matchingBoards[0].board.unit || 'mm' } : null;
    return {
      materialId,
      materialName: materialName(group.material),
      productCode: group.material.productCode ?? null,
      thickness: group.thickness,
      partCount: group.partCount,
      totalQuantity: group.totalQuantity,
      boardCount: layout ? matchingBoards.length : null,
      boardSize,
      totalPartArea: group.areaAvailable ? group.totalPartArea : null,
      unit: group.parts.every((part) => part.dimensions?.unit) ? group.parts[0].dimensions.unit : (group.areaAvailable ? 'mm²' : null),
      validation: { status: group.areaAvailable ? 'AREA_CALCULATED_FROM_CONFIRMED_PART_DIMENSIONS' : 'AREA_UNAVAILABLE', valid: true, issues: group.areaAvailable ? [] : [{ code: 'AREA_UNAVAILABLE' }] },
    };
  });
  const allAreasAvailable = materials.every((item) => item.totalPartArea !== null);
  return {
    schemaVersion: 1,
    contract: 'material-statistics-result',
    statisticsId: `material-statistics:${input.project.projectId}:${input.furnitureObject.objectId}:${input.cuttingListId}`,
    project: clone(input.project),
    furnitureObject: clone(input.furnitureObject),
    cuttingListId: input.cuttingListId,
    boardLayoutId: layout?.boardLayoutId || null,
    materials,
    totals: { totalMaterialTypes: materials.length, totalParts: materials.reduce((sum, item) => sum + item.partCount, 0), totalQuantity: materials.reduce((sum, item) => sum + item.totalQuantity, 0), totalPartArea: allAreasAvailable ? materials.reduce((sum, item) => sum + item.totalPartArea, 0) : null, areaStatus: allAreasAvailable ? 'AVAILABLE' : 'AREA_UNAVAILABLE', boardStatus: layout ? 'AVAILABLE' : 'BOARD_LAYOUT_NOT_AVAILABLE', unit: allAreasAvailable ? 'mm²' : null },
    validation: { status: allAreasAvailable ? 'VALIDATED' : 'VALIDATED_WITH_LIMITATIONS', valid: true, issues: allAreasAvailable ? [] : [{ code: 'AREA_UNAVAILABLE' }] },
    status: 'Generated',
    readOnly: true,
  };
}

module.exports = { generateMaterialStatistics, areaFor, positive };
