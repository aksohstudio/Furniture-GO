const assert = require('node:assert/strict');
const fs = require('node:fs');
const { prepareCuttingListPrintDocument } = require('../src/services/cutting-list-print-service');

const base = (contract, extra = {}) => ({ contract, project: { projectId: 'p1', name: 'Project' }, furnitureObject: { objectId: 'o1', name: 'Cabinet' }, cuttingListId: 'cut:p1:o1', status: 'Generated', validation: { valid: true, status: 'Validated' }, readOnly: true, ...extra });
const sources = { cuttingList: base('cutting-list-result', { parts: [{ partId: 'part-1' }] }), boardLayout: base('board-layout-result', { boardLayoutId: 'layout:p1:o1', layout: { boards: [] } }), materialStatistics: base('material-statistics-result', { statisticsId: 'stats:p1:o1', materials: [] }), wasteAnalysis: base('waste-analysis-result', { wasteAnalysisId: 'waste:p1:o1', materials: [], totals: {} }), informationPanel: base('information-panel-result', { informationPanelId: 'info:p1:o1' }), partTrace: base('part-trace-result', { partTraceId: 'trace:p1:o1', cuttingPart: { partId: 'part-1' } }) };

for (const type of ['current-view', 'cutting-list', 'board-layout', 'material-statistics', 'waste-analysis', 'information-panel', 'part-trace']) {
  const result = prepareCuttingListPrintDocument(sources, 'p1', 'o1', type);
  assert.equal(result.contract, 'cutting-list-print-document');
  assert.equal(result.printType, type);
  assert.equal(result.readOnly, true);
  assert.equal(result.validation.valid, true);
}
assert.ok(prepareCuttingListPrintDocument(sources, 'p1', 'o1', 'current-view').sections.cuttingList);
assert.equal(prepareCuttingListPrintDocument(sources, 'p1', 'o1', 'part-trace').selectedSection, 'partTrace');

assert.throws(() => prepareCuttingListPrintDocument(sources, 'p2', 'o1'), (error) => error.code === 'PRINT_SOURCE_MISMATCH');
assert.throws(() => prepareCuttingListPrintDocument(sources, 'p1', 'o2'), (error) => error.code === 'PRINT_SOURCE_MISMATCH');
assert.throws(() => prepareCuttingListPrintDocument({ ...sources, cuttingList: { ...sources.cuttingList, readOnly: false } }, 'p1', 'o1'), (error) => error.code === 'PRINT_RESULT_INVALID');
assert.throws(() => prepareCuttingListPrintDocument({ ...sources, boardLayout: { ...sources.boardLayout, cuttingListId: 'other' } }, 'p1', 'o1', 'board-layout'), (error) => error.code === 'PRINT_SOURCE_MISMATCH');
assert.throws(() => prepareCuttingListPrintDocument({ ...sources, wasteAnalysis: null }, 'p1', 'o1', 'waste-analysis'), (error) => error.code === 'PRINT_RESULT_NOT_AVAILABLE');
assert.throws(() => prepareCuttingListPrintDocument({ ...sources, boardLayout: { ...sources.boardLayout, status: 'INCOMPLETE', validation: { valid: false } } }, 'p1', 'o1', 'board-layout'), (error) => error.code === 'PRINT_VALIDATION_FAILED');
assert.throws(() => prepareCuttingListPrintDocument({ ...sources, cuttingList: { ...sources.cuttingList, contract: 'wrong' } }, 'p1', 'o1'), (error) => error.code === 'PRINT_RESULT_INVALID');
assert.throws(() => prepareCuttingListPrintDocument(sources, 'p1', 'o1', 'unsupported'), (error) => error.code === 'PRINT_TYPE_INVALID');

const snapshot = JSON.stringify(sources);
prepareCuttingListPrintDocument(sources, 'p1', 'o1', 'current-view');
assert.equal(JSON.stringify(sources), snapshot);

const source = fs.readFileSync(require.resolve('../src/services/cutting-list-print-service'), 'utf8');
assert.doesNotMatch(source, /recalculate|optimization|purchase|cnc|pdf|excel|kerf|saw|nesting|binPacking/i);
assert.match(source, /cutting-list-print-document/);
assert.match(source, /readOnly: true/);
const workspace = fs.readFileSync(require.resolve('../src/components/CuttingListWorkspace.js'), 'utf8');
assert.match(workspace, /data-cutting-list-print-area/);
assert.match(workspace, /window\.print\(\)/);
assert.match(workspace, /data-cutting-list-print=/);
assert.match(fs.readFileSync(require.resolve('../server.js'), 'utf8'), /prepareCuttingListPrintDocument/);
assert.match(fs.readFileSync(require.resolve('../src/services/project-client.js'), 'utf8'), /cutting-list\/print/);

console.log('Sprint 08 Task 09 tests passed');
