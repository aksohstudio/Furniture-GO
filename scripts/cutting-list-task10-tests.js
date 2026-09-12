const assert = require('node:assert/strict');
const fs = require('node:fs');
const { prepareCuttingListPrintDocument } = require('../src/services/cutting-list-print-service');
const { exportCuttingListPdf, validateCuttingListPdfDocument } = require('../src/services/cutting-list-pdf-service');

const projectId = 'project-1';
const objectId = 'object-1';
const base = (contract, extra = {}) => ({ contract, project: { projectId, name: 'Kitchen' }, furnitureObject: { objectId, name: 'Cabinet' }, cuttingListId: 'cutting-list:project-1:object-1', status: 'Generated', validation: { valid: true, status: 'VALIDATED' }, readOnly: true, ...extra });
const sources = {
  cuttingList: base('cutting-list-result', { parts: Array.from({ length: 120 }, (_, index) => ({ partId: `part-${index}`, dimensions: { width: 100, height: 200, thickness: 18 }, quantity: 1, material: { id: 'MAT-001', name: 'Board' } })) }),
  boardLayout: base('board-layout-result', { boardLayoutId: 'layout:project-1:object-1', layout: { boards: [{ boardId: 'board-1', board: { width: 2440, height: 1220, thickness: 18 }, parts: [] }] } }),
  materialStatistics: base('material-statistics-result', { statisticsId: 'stats:project-1:object-1', materials: [{ materialId: 'MAT-001', materialName: 'Board', thickness: 18, totalPartArea: 24000 }] }),
  wasteAnalysis: base('waste-analysis-result', { wasteAnalysisId: 'waste:project-1:object-1', materials: [{ materialId: 'MAT-001', boardArea: 2976800, usedPartArea: 24000, wasteArea: 2952800, wastePercentage: 99.19 }], totals: { totalBoardArea: 2976800, totalUsedPartArea: 24000, totalWasteArea: 2952800, totalWastePercentage: 99.19 } }),
  informationPanel: base('information-panel-result', { informationPanelId: 'info:project-1:object-1' }),
  partTrace: base('part-trace-result', { partTraceId: 'trace:project-1:object-1', cuttingPart: { partId: 'part-0' } }),
};

for (const type of ['current-view', 'cutting-list', 'board-layout', 'material-statistics', 'waste-analysis', 'information-panel', 'part-trace']) {
  const documentModel = prepareCuttingListPrintDocument(sources, projectId, objectId, type);
  const snapshot = JSON.stringify(documentModel);
  const pdf = exportCuttingListPdf(documentModel, projectId, objectId);
  assert.equal(documentModel.readOnly, true);
  assert.equal(documentModel.validation.valid, true);
  assert.equal(pdf.contentType, 'application/pdf');
  assert.match(pdf.buffer.toString('binary', 0, 8), /^%PDF-/);
  assert.match(pdf.buffer.toString('binary'), /%%EOF/);
  assert.equal(JSON.stringify(documentModel), snapshot);
}

const multiPage = exportCuttingListPdf(prepareCuttingListPrintDocument(sources, projectId, objectId, 'cutting-list'), projectId, objectId).buffer.toString('binary');
assert.ok((multiPage.match(/\/Type \/Page /g) || []).length > 1, 'long Cutting List must create multiple PDF pages');
assert.match(multiPage, /xref/);
assert.match(multiPage, /Project: Kitchen/);
assert.match(multiPage, /cutting-list:project-1:object-1/);

assert.throws(() => exportCuttingListPdf(null, projectId, objectId), (error) => error.code === 'RESULT_CONTRACT_INVALID');
assert.throws(() => validateCuttingListPdfDocument({ ...prepareCuttingListPrintDocument(sources, projectId, objectId), project: { projectId: 'project-2' } }, projectId, objectId), (error) => error.code === 'PROJECT_MISMATCH');
assert.throws(() => exportCuttingListPdf({ ...prepareCuttingListPrintDocument(sources, projectId, objectId), readOnly: false }, projectId, objectId), (error) => error.code === 'READ_ONLY_REQUIRED');
assert.throws(() => exportCuttingListPdf({ ...prepareCuttingListPrintDocument(sources, projectId, objectId), sections: {} }, projectId, objectId), (error) => error.code === 'DRAWING_OR_RESULT_MISSING');

const serviceSource = fs.readFileSync(require.resolve('../src/services/cutting-list-pdf-service'), 'utf8');
assert.match(serviceSource, /cutting-list-print-document/);
assert.match(serviceSource, /readOnly/);
assert.doesNotMatch(serviceSource, /recalculate|optimiz|nesting|binPacking|kerf|saw\s*cut|purchase|excel|cnc/i);
const workspaceSource = fs.readFileSync(require.resolve('../src/components/CuttingListWorkspace'), 'utf8');
assert.match(workspaceSource, /data-cutting-list-pdf/);
assert.match(workspaceSource, /exportCuttingListPdf/);
assert.match(fs.readFileSync(require.resolve('../src/services/project-client.js'), 'utf8'), /cutting-list\/export-pdf/);
assert.match(fs.readFileSync(require.resolve('../server'), 'utf8'), /cutting-list.*export-pdf/s);

console.log('Sprint 08 Task 10 tests passed: offline PDF generation, validation, multi-page output, result identity, immutability and scope.');
