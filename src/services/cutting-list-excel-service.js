const XLSX = require('xlsx');

const CONTRACTS = {
  cuttingList: 'cutting-list-result',
  boardLayout: 'board-layout-result',
  materialStatistics: 'material-statistics-result',
  wasteAnalysis: 'waste-analysis-result',
  informationPanel: 'information-panel-result',
  partTrace: 'part-trace-result',
};

const CODES = {
  cuttingList: 'CUTTING_LIST_MISSING',
  boardLayout: 'BOARD_LAYOUT_NOT_AVAILABLE',
  materialStatistics: 'MATERIAL_STATISTICS_NOT_AVAILABLE',
  wasteAnalysis: 'WASTE_ANALYSIS_NOT_AVAILABLE',
  informationPanel: 'INFORMATION_PANEL_NOT_AVAILABLE',
  partTrace: 'PART_TRACE_NOT_AVAILABLE',
};

function fail(message, code, details = {}) {
  throw Object.assign(new Error(message), { statusCode: 422, code, details });
}

function value(input) {
  if (input === undefined || input === null || input === '') return 'Not Available';
  if (typeof input === 'object') return JSON.stringify(input);
  return input;
}

function unavailableRow(code) {
  return [code, 'unavailable'];
}

function validateResult(result, name, contract, projectId, objectId, cuttingListId) {
  if (!result) return null;
  if (result.contract !== contract) fail(`${name} Result contract is invalid`, 'RESULT_CONTRACT_INVALID', { name, expected: contract });
  if (result.readOnly !== true) fail(`${name} Result must be read-only`, 'READ_ONLY_REQUIRED', { name });
  if (result.validation?.valid === false || ['BLOCKED', 'INCOMPLETE'].includes(result.status)) {
    fail(`${name} Result validation failed`, 'RESULT_VALIDATION_FAILED', { name });
  }
  if (result.project?.projectId !== projectId) fail(`${name} Project does not match`, 'PROJECT_MISMATCH', { name });
  if (result.furnitureObject?.objectId !== objectId) fail(`${name} Furniture Object does not match`, 'OBJECT_MISMATCH', { name });
  if (cuttingListId && result.cuttingListId !== cuttingListId) fail(`${name} Cutting List does not match`, 'SOURCE_MISMATCH', { name });
  return result;
}

function validateBundle(bundle, projectId, objectId) {
  if (!bundle || typeof bundle !== 'object') fail('Canonical result bundle is required', 'MISSING_REQUIRED_RESULT');
  const cuttingList = bundle.cuttingList;
  if (!cuttingList) fail('Cutting List Result is required', CODES.cuttingList);
  validateResult(cuttingList, 'Cutting List', CONTRACTS.cuttingList, projectId, objectId);
  if (!Array.isArray(cuttingList.parts)) fail('Cutting List parts are invalid', 'INVALID_RESULT');
  const cuttingListId = cuttingList.cuttingListId;
  const results = {
    cuttingList,
    boardLayout: bundle.boardLayout || null,
    materialStatistics: bundle.materialStatistics || null,
    wasteAnalysis: bundle.wasteAnalysis || null,
    informationPanel: bundle.informationPanel || null,
    partTrace: bundle.partTrace || null,
  };
  validateResult(results.boardLayout, 'Board Layout', CONTRACTS.boardLayout, projectId, objectId, cuttingListId);
  validateResult(results.materialStatistics, 'Material Statistics', CONTRACTS.materialStatistics, projectId, objectId, cuttingListId);
  validateResult(results.wasteAnalysis, 'Waste Analysis', CONTRACTS.wasteAnalysis, projectId, objectId, cuttingListId);
  validateResult(results.informationPanel, 'Information Panel', CONTRACTS.informationPanel, projectId, objectId, cuttingListId);
  validateResult(results.partTrace, 'Part Trace', CONTRACTS.partTrace, projectId, objectId, cuttingListId);
  if (results.partTrace && results.partTrace.cuttingPart?.partId === undefined) fail('Part Trace Result is invalid', 'INVALID_RESULT');
  return results;
}

function cuttingListRows(result) {
  const p = result.project || {};
  const o = result.furnitureObject || {};
  return result.parts.map((part) => {
    const d = part.dimensions || {};
    return [p.projectId, p.name, o.objectId, o.name, result.cuttingListId, part.partId, part.componentId, part.name, part.type, part.material?.id, part.material?.name, part.material?.productCode, value(d.thickness), value(d.width), value(d.height), value(d.depth ?? d.thickness), part.quantity, value(part.grainDirection), value(part.edgeBanding), value(part.processing), value(part.validation?.status), value(result.status)];
  });
}

function boardRows(result) {
  if (!result) return [unavailableRow(CODES.boardLayout)];
  const rows = [];
  for (const board of result.layout?.boards || []) {
    const parts = board.parts || [null];
    for (const part of parts) {
      rows.push([board.boardId, board.material?.id, board.material?.name, board.board?.thickness, board.board?.width, board.board?.height, (result.layout?.boards || []).filter((item) => item.material?.id === board.material?.id && item.board?.thickness === board.board?.thickness).length, part?.partId ?? 'Not Available', part ? 'Placed' : 'Not Available', part?.x ?? 'Not Available', part?.y ?? 'Not Available', part?.width ?? 'Not Available', part?.height ?? 'Not Available', part?.grainDirection ?? 'Not Available', result.status]);
    }
  }
  for (const part of result.layout?.unplacedParts || []) rows.push(['Not Available', 'Not Available', 'Not Available', 'Not Available', 'Not Available', 'Not Available', 'Not Available', part.partId, 'Unplaced', 'Not Available', 'Not Available', 'Not Available', 'Not Available', 'Not Available', 'INCOMPLETE']);
  return rows.length ? rows : [unavailableRow(CODES.boardLayout)];
}

function statisticsRows(result) {
  if (!result) return [unavailableRow(CODES.materialStatistics)];
  return (result.materials || []).map((item) => [item.materialId, item.materialName, item.productCode, item.thickness, item.partCount, item.totalQuantity, item.totalPartArea ?? 'Not Available', item.boardCount ?? 'Not Available', value(item.boardSize), item.validation?.status, result.status]);
}

function wasteRows(result) {
  if (!result) return [unavailableRow(CODES.wasteAnalysis)];
  return (result.materials || []).map((item) => [item.materialId, item.materialName, item.thickness, item.boardCount ?? 'Not Available', item.boardArea ?? 'Not Available', item.usedPartArea ?? 'Not Available', item.wasteArea ?? 'Not Available', item.wastePercentage ?? 'Not Available', item.validation?.status, result.status]);
}

function informationRows(result) {
  if (!result) return [unavailableRow(CODES.informationPanel)];
  return [['Project', value(result.project?.name || result.project?.projectId)], ['Furniture Object', value(result.furnitureObject?.name || result.furnitureObject?.objectId)], ['Cutting List', value(result.cuttingList?.cuttingListId)], ['Material Summary', value(result.materials)], ['Board Layout Summary', value(result.boardLayout)], ['Waste Summary', value(result.wasteAnalysis)], ['Production Data Status', value(result.productionDataStatus?.status)], ['Source', value(result.productionDataStatus?.source)], ['Validation', value(result.validation?.status)], ['Read-only', result.readOnly === true ? 'Yes' : 'No']];
}

function traceRows(result) {
  if (!result) return [['Part Trace', 'No Part Selected'], ['Read-only', 'Yes']];
  return [['Project', value(result.project?.name || result.project?.projectId)], ['Furniture Object', value(result.furnitureObject?.name || result.furnitureObject?.objectId)], ['Component', value(result.component)], ['Part', value(result.cuttingPart)], ['Material', value(result.material)], ['Board Placement', value(result.boardPlacement)], ['Statistics Reference', value(result.statistics)], ['Waste Reference', value(result.waste)], ['Validation', value(result.validation?.status)], ['Source', value(result.sourceChain)], ['Read-only', result.readOnly === true ? 'Yes' : 'No']];
}

function appendSheet(workbook, name, headers, rows) {
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  sheet['!cols'] = headers.map((header, index) => ({ wch: Math.min(34, Math.max(header.length + 2, ...rows.slice(0, 100).map((row) => String(row[index] ?? '').length + 2), 12)) }));
  XLSX.utils.book_append_sheet(workbook, sheet, name);
}

function exportCuttingListExcel(bundle, projectId, objectId) {
  const results = validateBundle(bundle, projectId, objectId);
  const workbook = XLSX.utils.book_new();
  appendSheet(workbook, 'Cutting List', ['Project ID', 'Project Name', 'Furniture Object ID', 'Furniture Object Name', 'Cutting List ID', 'Part ID', 'Component ID', 'Part Name', 'Part Type', 'Material ID', 'Material Name', 'Product Code', 'Thickness', 'Width', 'Height', 'Depth / Thickness', 'Quantity', 'Grain Direction', 'Edge Banding', 'Processing', 'Validation', 'Status'], cuttingListRows(results.cuttingList));
  appendSheet(workbook, 'Board Layout', ['Board ID', 'Material ID', 'Material Name', 'Thickness', 'Board Width', 'Board Height', 'Board Count', 'Part ID', 'Placement Status', 'Existing X', 'Existing Y', 'Existing Width', 'Existing Height', 'Grain Direction', 'Layout Status'], boardRows(results.boardLayout));
  appendSheet(workbook, 'Material Statistics', ['Material ID', 'Material Name', 'Product Code', 'Thickness', 'Part Count', 'Total Quantity', 'Total Part Area', 'Board Count', 'Board Size', 'Validation', 'Status'], statisticsRows(results.materialStatistics));
  appendSheet(workbook, 'Waste Analysis', ['Material ID', 'Material Name', 'Thickness', 'Board Count', 'Board Area', 'Used Part Area', 'Waste Area', 'Waste Percentage', 'Validation', 'Status'], wasteRows(results.wasteAnalysis));
  appendSheet(workbook, 'Information', ['Field', 'Value'], informationRows(results.informationPanel));
  appendSheet(workbook, 'Part Trace', ['Field', 'Value'], traceRows(results.partTrace));
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer', compression: true });
  return { buffer, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: `FurnitureGO_${projectId}_${objectId}_production.xlsx` };
}

module.exports = { exportCuttingListExcel, validateBundle };
