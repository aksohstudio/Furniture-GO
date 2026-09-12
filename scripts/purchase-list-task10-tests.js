const assert = require('node:assert/strict');
const fs = require('node:fs');
const XLSX = require('xlsx');
const { exportPurchaseListExcel } = require('../src/services/purchase-list-excel-service');

const projectId = 'project-purchase-1';
const objectId = 'object-purchase-1';
const purchaseListId = `purchase-list:${projectId}`;
const item = { itemId: 'item-1', sourceObjectId: objectId, sourceComponentId: 'component-1', name: 'Sample Item', productCode: 'ITEM-1', category: 'Sample Category', type: 'Sample Type', specification: 'Sample specification', thickness: '18mm', quantity: 4, unit: 'pcs', materialId: 'MAT-1', hardwareId: 'HW-1', accessoryId: 'ACC-1', source: { sourceType: 'canonical-reference', projectId, objectId }, validation: { valid: true, status: 'REFERENCE_VALIDATED', issues: [] } };
const source = { contract: 'purchase-list-print-model', printId: 'print-1', project: { projectId, name: 'Excel Project' }, furnitureObjects: [{ objectId, name: 'Cabinet', objectType: 'Base Cabinet' }], purchaseList: { purchaseListId, status: 'Generated', validation: { valid: true, status: 'VALIDATED', issues: [] }, readOnly: true }, materialItems: [{ ...item, material: { materialId: 'MAT-1' } }], hardwareItems: [{ ...item, hardware: { hardwareId: 'HW-1' } }], accessoryItems: [{ ...item, accessory: { accessoryId: 'ACC-1' } }], purchaseSummary: { materialItemCount: 1, hardwareItemCount: 1, accessoryItemCount: 1, totalItemCount: 3, quantitySummary: {}, categorySummary: {}, unitSummary: {} }, categorySummary: { categoryCount: 3, typeCount: 3, categories: [], types: [], breakdown: {} }, source: { sourceType: 'purchase-list-result-and-view-models', projectId, purchaseListId }, validation: { valid: true, status: 'PRINT_READY', issues: [] }, status: 'Print Ready', readOnly: true };

const snapshot = JSON.stringify(source);
const exported = exportPurchaseListExcel(source, projectId);
assert.equal(exported.contract, 'purchase-list-excel-result');
assert.equal(exported.excelId, `purchase-list-excel:${projectId}:${purchaseListId}`);
assert.equal(exported.status, 'Excel Ready');
assert.equal(exported.readOnly, true);
assert.equal(exported.validation.status, 'EXCEL_READY');
assert.equal(exported.contentType, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
assert.match(exported.filename, /\.xlsx$/);
assert.equal(JSON.stringify(source), snapshot, 'Print Model remains immutable');

const parsed = XLSX.read(exported.buffer, { type: 'buffer' });
assert.deepEqual(parsed.SheetNames, ['Purchase Summary', 'Board Materials', 'Hardware', 'Accessories', 'Categories']);
const summaryRows = XLSX.utils.sheet_to_json(parsed.Sheets['Purchase Summary'], { header: 1 });
assert.ok(summaryRows.some((row) => row[0] === 'Project ID' && row[1] === projectId));
assert.ok(summaryRows.some((row) => row[0] === 'Purchase List ID' && row[1] === purchaseListId));
assert.ok(summaryRows.some((row) => row[0] === 'Total Item Count' && row[1] === 3));
const materialRows = XLSX.utils.sheet_to_json(parsed.Sheets['Board Materials'], { header: 1 });
assert.deepEqual(materialRows[0].slice(0, 6), ['Item ID', 'Source Object ID', 'Source Component ID', 'Material ID', 'Material Name', 'Product Code']);
assert.equal(materialRows[1][0], 'item-1');
assert.equal(materialRows[1][8], 4);
assert.equal(XLSX.utils.sheet_to_json(parsed.Sheets.Hardware, { header: 1 })[1][3], 'HW-1');
assert.equal(XLSX.utils.sheet_to_json(parsed.Sheets.Accessories, { header: 1 })[1][3], 'ACC-1');
assert.ok(XLSX.utils.sheet_to_json(parsed.Sheets.Categories, { header: 1 })[0].includes('Total Quantity'));

for (const [label, input, project, code] of [
  ['missing purchase list', null, projectId, 'PURCHASE_LIST_MISSING'],
  ['invalid project', source, '', 'PROJECT_MISSING'],
  ['project mismatch', { ...source, project: { projectId: 'other' } }, projectId, 'PROJECT_MISMATCH'],
  ['invalid contract', { ...source, contract: 'wrong' }, projectId, 'INVALID_PRINT_MODEL'],
  ['source mismatch', { ...source, source: { ...source.source, projectId: 'other' } }, projectId, 'SOURCE_MISMATCH'],
  ['blocked purchase list', { ...source, purchaseList: { ...source.purchaseList, status: 'BLOCKED' } }, projectId, 'INVALID_PRINT_MODEL'],
  ['read only false', { ...source, readOnly: false }, projectId, 'READ_ONLY_REQUIRED'],
  ['object mismatch', { ...source, materialItems: [{ ...source.materialItems[0], sourceObjectId: 'other' }] }, projectId, 'OBJECT_MISMATCH'],
  ['missing quantity', { ...source, materialItems: [{ ...source.materialItems[0], quantity: undefined }] }, projectId, 'QUANTITY_MISSING'],
  ['invalid quantity', { ...source, materialItems: [{ ...source.materialItems[0], quantity: 0 }] }, projectId, 'INVALID_QUANTITY'],
]) assert.throws(() => exportPurchaseListExcel(input, project), (error) => error.code === code, label);

const serviceSource = fs.readFileSync(require.resolve('../src/services/purchase-list-excel-service'), 'utf8');
assert.match(serviceSource, /xlsx/);
assert.match(serviceSource, /readOnly: true/);
assert.doesNotMatch(serviceSource, /generatePurchaseList|supplier|inventory|\bERP\b|purchaseOrder|quotation|accounting|cloud|aiPurchasing|multiplier|waste|optimization|CSV|Reports/i);
console.log('Sprint 09 Task 10 tests passed: XLSX generation/parsing, worksheets, headers, data, source/quantity validation, isolation, read-only, immutability and scope boundaries.');
