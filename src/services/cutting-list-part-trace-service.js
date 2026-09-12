const { clone } = require('./production-drawing-data-contract');

function fail(message, statusCode, code, details = {}) {
  throw Object.assign(new Error(message), { statusCode, code, details });
}

function findComponent(object, componentId) {
  return (object?.components || []).find((component) => [component.componentId, component.panelId, component.partId, component.id].includes(componentId)) || null;
}

function validateSource(result, contract, expectedProjectId, expectedObjectId, expectedCuttingListId, expectedId, idField, mismatchCode) {
  if (!result) return null;
  if (result.contract !== contract || result.readOnly !== true) fail('Trace source contract is invalid', 422, 'CONTRACT_MISMATCH');
  if (expectedProjectId && result.project?.projectId !== expectedProjectId) fail('Trace source Project does not match', 422, 'PROJECT_OBJECT_MISMATCH');
  if (expectedObjectId && result.furnitureObject?.objectId !== expectedObjectId) fail('Trace source Furniture Object does not match', 422, 'PROJECT_OBJECT_MISMATCH');
  if (expectedCuttingListId && result.cuttingListId !== expectedCuttingListId) fail('Trace source Cutting List does not match', 422, mismatchCode);
  if (expectedId && result[idField] !== expectedId) fail('Trace source ID does not match', 422, mismatchCode);
  return result;
}

function generatePartTrace(cuttingList, furnitureObject, officialCatalog, boardLayout = null, materialStatistics = null, wasteAnalysis = null, expectedProjectId = null, expectedObjectId = null, expectedCuttingListId = null, partId = null, expectedBoardLayoutId = null, expectedMaterialStatisticsId = null, expectedWasteAnalysisId = null) {
  if (!cuttingList || cuttingList.contract !== 'cutting-list-result' || !Array.isArray(cuttingList.parts) || cuttingList.readOnly !== true) fail('Cutting List Result is invalid', 422, 'CONTRACT_MISMATCH');
  if (!furnitureObject || furnitureObject.projectId !== expectedProjectId || furnitureObject.objectId !== expectedObjectId) fail('Furniture Object does not match the requested Project', 422, 'PROJECT_OBJECT_MISMATCH');
  if (cuttingList.project?.projectId !== expectedProjectId || cuttingList.furnitureObject?.objectId !== expectedObjectId) fail('Cutting List does not match the requested source', 422, 'CUTTING_LIST_MISMATCH');
  if (expectedCuttingListId && cuttingList.cuttingListId !== expectedCuttingListId) fail('Cutting List ID does not match', 422, 'CUTTING_LIST_MISMATCH');
  if (!partId) fail('Part ID is required', 400, 'PART_NOT_FOUND');
  const part = cuttingList.parts.find((item) => item.partId === partId);
  if (!part) fail('Part was not found in the Cutting List', 404, 'PART_NOT_FOUND', { partId });
  const component = findComponent(furnitureObject, part.componentId);
  if (!component) fail('Component was not found in the Furniture Object', 422, 'COMPONENT_NOT_FOUND', { componentId: part.componentId });
  if (!part.dimensions || ['width', 'height'].some((field) => !Number.isFinite(Number(part.dimensions[field])) || Number(part.dimensions[field]) <= 0)) fail('Part dimensions are invalid', 422, 'DIMENSIONS_INVALID', { partId });
  const materialId = part.material?.id || component.materialId;
  if (!materialId) fail('Part material reference is missing', 422, 'MATERIAL_REFERENCE_MISSING', { partId });
  const material = officialCatalog?.getMaterialById?.(materialId);
  if (!material) fail('Material was not found in the Official Material Catalog', 422, 'UNKNOWN_MATERIAL', { materialId });
  const layout = validateSource(boardLayout, 'board-layout-result', expectedProjectId, expectedObjectId, expectedCuttingListId, expectedBoardLayoutId, 'boardLayoutId', 'BOARD_LAYOUT_MISMATCH');
  const statistics = validateSource(materialStatistics, 'material-statistics-result', expectedProjectId, expectedObjectId, expectedCuttingListId, expectedMaterialStatisticsId, 'statisticsId', 'SOURCE_MISMATCH');
  const waste = validateSource(wasteAnalysis, 'waste-analysis-result', expectedProjectId, expectedObjectId, expectedCuttingListId, expectedWasteAnalysisId, 'wasteAnalysisId', 'SOURCE_MISMATCH');
  let placement = { status: 'unavailable', code: 'BOARD_LAYOUT_NOT_AVAILABLE', value: null };
  if (layout) {
    const board = layout.layout?.boards?.find((item) => item.parts?.some((placed) => placed.partId === partId));
    const placed = board?.parts?.find((item) => item.partId === partId);
    placement = board && placed ? { status: 'placed', boardId: board.boardId, board: clone(board.board), position: clone(placed) } : { status: 'unavailable', code: 'PART_NOT_PLACED', value: null };
  }
  const statistic = statistics ? clone((statistics.materials || []).find((item) => item.materialId === materialId) || { status: 'unavailable', code: 'MATERIAL_STATISTICS_NOT_AVAILABLE', value: null }) : { status: 'unavailable', code: 'MATERIAL_STATISTICS_NOT_AVAILABLE', value: null };
  const wasteRecord = waste ? clone((waste.materials || []).find((item) => item.materialId === materialId) || { status: 'unavailable', code: 'WASTE_ANALYSIS_NOT_AVAILABLE', value: null }) : { status: 'unavailable', code: 'WASTE_ANALYSIS_NOT_AVAILABLE', value: null };
  return { schemaVersion: 1, contract: 'part-trace-result', partTraceId: `part-trace:${expectedProjectId}:${expectedObjectId}:${cuttingList.cuttingListId}:${partId}`, project: { projectId: expectedProjectId, name: cuttingList.project.name || null }, furnitureObject: clone({ objectId: furnitureObject.objectId, name: furnitureObject.name || null, objectType: furnitureObject.objectType || furnitureObject.furnitureType || null, productionStatus: furnitureObject.productionStatus, dimensions: furnitureObject.dimensions || null }), cuttingListId: cuttingList.cuttingListId, component: clone({ componentId: part.componentId, name: component.name || component.componentName || null, type: component.componentType || component.type || null, parentObjectId: furnitureObject.objectId }), cuttingPart: clone(part), material: { materialId: material.id, materialName: material.name || material.officialName || null, productCode: material.productCode ?? null, thickness: part.dimensions?.thickness ?? material.thickness ?? null, source: { sourceType: 'official-material-catalog', materialId: material.id } }, boardPlacement: placement, statistics: { statisticsId: statistics?.statisticsId || null, material: statistic }, waste: { wasteAnalysisId: waste?.wasteAnalysisId || null, material: wasteRecord }, sourceChain: ['Project', 'Furniture Object', 'Component', 'Cutting List Part', 'Material', 'Board Layout', 'Material Statistics', 'Waste Analysis'], validation: { valid: true, status: 'TRACE_VALIDATED', issues: [] }, status: 'Generated', readOnly: true };
}

module.exports = { generatePartTrace, findComponent };
