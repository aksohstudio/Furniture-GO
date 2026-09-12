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

function resolveEngineeringRecord(material, officialCatalog) {
  if (!officialCatalog?.listEngineeringRecords) return null;
  const records = officialCatalog.listEngineeringRecords();
  return records.find((record) => record.id === material?.engineeringRecordId)
    || records.find((record) => record.id === material?.id)
    || records.find((record) => record.category === 'Material Engineering' && record.productCode && record.productCode === material?.productCode)
    || null;
}

function resolveBoardSpec(material, officialCatalog, parts) {
  const record = resolveEngineeringRecord(material, officialCatalog);
  const source = record || material;
  const boardSize = source?.boardSize;
  if (!positive(boardSize?.width) || !positive(boardSize?.height)) {
    fail('Official material board size is missing', 422, 'BOARD_SIZE_MISSING', { materialId: material.id });
  }
  const thickness = source?.thickness ?? material?.thickness;
  const partThicknesses = [...new Set(parts.map((part) => part.dimensions?.thickness).filter((value) => positive(value)).map(Number))];
  let resolvedThickness = positive(thickness) ? Number(thickness) : null;
  if (!resolvedThickness && partThicknesses.length === 1) resolvedThickness = partThicknesses[0];
  if (!resolvedThickness && Array.isArray(source?.availableThickness) && partThicknesses.length === 1 && source.availableThickness.map(Number).includes(partThicknesses[0])) resolvedThickness = partThicknesses[0];
  if (!resolvedThickness) fail('Official material thickness does not resolve for this layout', 422, 'MATERIAL_BOARD_MISMATCH', { materialId: material.id });
  if (Array.isArray(source?.availableThickness) && !source.availableThickness.map(Number).includes(resolvedThickness)) fail('Material thickness is not supported by the official specification', 422, 'MATERIAL_BOARD_MISMATCH', { materialId: material.id, thickness: resolvedThickness });
  if (source?.availableThickness?.minimum !== undefined && (resolvedThickness < Number(source.availableThickness.minimum) || resolvedThickness > Number(source.availableThickness.maximum))) fail('Material thickness is outside the official range', 422, 'MATERIAL_BOARD_MISMATCH', { materialId: material.id, thickness: resolvedThickness });
  return { width: Number(boardSize.width), height: Number(boardSize.height), unit: boardSize.unit || 'mm', thickness: resolvedThickness, materialId: material.id, materialName: materialName(material), source: record ? { engineeringRecordId: record.id, source: record.source, sourceUrl: record.sourceUrl, verificationStatus: record.verificationStatus } : null };
}

function validateCuttingList(result) {
  if (!result || result.contract !== 'cutting-list-result' || !Array.isArray(result.parts)) fail('Cutting List Result is invalid', 422, 'CUTTING_LIST_INVALID');
  if (result.readOnly !== true) fail('Cutting List Result must be read-only', 422, 'CUTTING_LIST_INVALID');
  if (!result.project?.projectId || !result.furnitureObject?.objectId) fail('Cutting List Project/Object context is missing', 422, 'CUTTING_LIST_INVALID');
}

function placePart(part, spec, boards, unplacedParts) {
  const quantity = Number(part.quantity);
  if (!Number.isInteger(quantity) || quantity <= 0) fail('Part quantity is invalid', 422, 'QUANTITY_MISSING', { partId: part.partId });
  const width = Number(part.dimensions?.width);
  const height = Number(part.dimensions?.height);
  if (!positive(width) || !positive(height)) { unplacedParts.push({ partId: part.partId, reason: 'DIMENSIONS_INVALID' }); return; }
  const allowRotation = part.allowRotation === true;
  const candidates = [{ width, height, rotation: 0 }];
  if (allowRotation && width !== height) candidates.push({ width: height, height: width, rotation: 90 });
  for (let index = 0; index < quantity; index += 1) {
    let placed = false;
    for (const candidate of candidates) {
      if (candidate.width > spec.width || candidate.height > spec.height) continue;
      for (const board of boards) {
        if (board.cursorX + candidate.width > spec.width) { board.cursorX = 0; board.cursorY += board.rowHeight; board.rowHeight = 0; }
        if (board.cursorY + candidate.height > spec.height) continue;
        board.parts.push({ partId: part.partId, componentId: part.componentId, name: part.name, x: board.cursorX, y: board.cursorY, width: candidate.width, height: candidate.height, rotation: candidate.rotation, quantity: 1, grainDirection: part.grainDirection ?? 'unspecified' });
        board.cursorX += candidate.width;
        board.rowHeight = Math.max(board.rowHeight, candidate.height);
        placed = true;
        break;
      }
      if (placed) break;
      const board = { boardId: `board:${boards.length + 1}`, board: clone(spec), parts: [], cursorX: 0, cursorY: 0, rowHeight: 0 };
      boards.push(board);
      board.parts.push({ partId: part.partId, componentId: part.componentId, name: part.name, x: 0, y: 0, width: candidate.width, height: candidate.height, rotation: candidate.rotation, quantity: 1, grainDirection: part.grainDirection ?? 'unspecified' });
      board.cursorX = candidate.width;
      board.rowHeight = candidate.height;
      placed = true;
      break;
    }
    if (!placed) unplacedParts.push({ partId: part.partId, reason: candidates.every((candidate) => candidate.width > spec.width || candidate.height > spec.height) ? 'PART_TOO_LARGE_FOR_BOARD' : 'UNPLACED_PART' });
  }
}

function generateBoardLayout(cuttingListResult, officialCatalog, expectedProjectId = null, expectedObjectId = null, expectedCuttingListId = null) {
  validateCuttingList(cuttingListResult);
  if (expectedProjectId && cuttingListResult.project.projectId !== expectedProjectId) fail('Cutting List does not belong to this Project', 422, 'PROJECT_ISOLATION_VIOLATION');
  if (expectedObjectId && cuttingListResult.furnitureObject.objectId !== expectedObjectId) fail('Cutting List does not belong to this Furniture Object', 422, 'OBJECT_ISOLATION_VIOLATION');
  if (expectedCuttingListId && cuttingListResult.cuttingListId !== expectedCuttingListId) fail('Cutting List ID does not match the requested result', 422, 'CUTTING_LIST_MISMATCH');
  const input = clone(cuttingListResult);
  const groups = new Map();
  for (const part of input.parts) {
    const materialId = part.material?.id;
    if (!materialId) fail('Part material reference is missing', 422, 'MATERIAL_REFERENCE_MISSING', { partId: part.partId });
    const material = officialCatalog?.getMaterialById?.(materialId);
    if (!material) fail('Material was not found in the Official Material Catalog', 422, 'UNKNOWN_MATERIAL', { materialId, partId: part.partId });
    const spec = resolveBoardSpec(material, officialCatalog, [part]);
    const key = `${materialId}:${spec.width}:${spec.height}:${spec.thickness}`;
    if (!groups.has(key)) groups.set(key, { material: { id: material.id, name: materialName(material) }, spec, parts: [] });
    groups.get(key).parts.push(part);
  }
  const allBoards = [];
  const unplacedParts = [];
  for (const group of groups.values()) {
    const boards = [];
    for (const part of group.parts) placePart(part, group.spec, boards, unplacedParts);
    boards.forEach((board) => { board.material = clone(group.material); board.board = clone(group.spec); delete board.cursorX; delete board.cursorY; delete board.rowHeight; allBoards.push(board); });
  }
  const issues = unplacedParts.length ? [{ code: 'BOARD_LAYOUT_INCOMPLETE', parts: clone(unplacedParts) }] : [];
  return {
    schemaVersion: 1,
    contract: 'board-layout-result',
    boardLayoutId: `board-layout:${input.project.projectId}:${input.furnitureObject.objectId}:${input.cuttingListId}`,
    project: clone(input.project),
    furnitureObject: clone(input.furnitureObject),
    cuttingListId: input.cuttingListId,
    material: groups.size === 1 ? clone([...groups.values()][0].material) : null,
    board: groups.size === 1 ? clone([...groups.values()][0].spec) : null,
    parts: allBoards.flatMap((board) => board.parts.map((part) => ({ ...part, boardId: board.boardId, materialId: board.material.id }))),
    layout: { algorithm: 'deterministic-sequential-no-optimization', boards: clone(allBoards), unplacedParts: clone(unplacedParts), kerf: 'not-defined' },
    validation: { valid: unplacedParts.length === 0, status: unplacedParts.length ? 'BOARD_LAYOUT_INCOMPLETE' : 'VALIDATED', issues },
    status: unplacedParts.length ? 'INCOMPLETE' : 'Generated',
    readOnly: true,
  };
}

module.exports = { generateBoardLayout, resolveBoardSpec, positive };
