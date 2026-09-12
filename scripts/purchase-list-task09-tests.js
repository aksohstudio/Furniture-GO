const assert = require('node:assert/strict');
const fs = require('node:fs');
const { exportPurchaseListPdf } = require('../src/services/purchase-list-pdf-service');

const projectId = 'project-purchase-1';
const objectId = 'object-purchase-1';
const purchaseListId = `purchase-list:${projectId}`;
const item = (itemId, name = 'Sample Item') => ({ itemId, sourceObjectId: objectId, name, materialId: `MAT-${itemId}`, hardwareId: `HW-${itemId}`, accessoryId: `ACC-${itemId}`, category: 'Sample Category', type: 'Sample Type', quantity: 4, unit: 'pcs', source: { sourceType: 'canonical-reference', projectId, objectId }, validation: { valid: true, status: 'REFERENCE_VALIDATED', issues: [] } });
const materialItems = Array.from({ length: 55 }, (_, index) => ({ ...item(`M-${index}`), materialId: `MAT-${index}`, hardwareId: undefined, accessoryId: undefined }));
const hardwareItems = [{ ...item('H-1'), materialId: undefined, hardwareId: 'HW-1', accessoryId: undefined }];
const accessoryItems = [{ ...item('A-1'), materialId: undefined, hardwareId: undefined, accessoryId: 'ACC-1' }];
const source = { contract: 'purchase-list-result', purchaseListId, project: { projectId, name: 'PDF Project' }, furnitureObjects: [{ objectId, name: 'Cabinet', objectType: 'Base Cabinet' }], materialItems, hardwareItems, accessoryItems, source: { sourceType: 'canonical-project-and-approved-furniture-objects', projectId }, validation: { valid: true, status: 'VALIDATED', issues: [] }, status: 'Generated', readOnly: true };
const model = (contract, items) => ({ contract, project: { projectId }, items, source: { sourceType: 'purchase-list-result', projectId, purchaseListId }, validation: { valid: true, status: 'VALIDATED', issues: [] }, status: 'Ready', readOnly: true });
const printModel = { contract: 'purchase-list-print-model', printId: 'print-1', project: source.project, furnitureObjects: source.furnitureObjects, purchaseList: { purchaseListId, status: 'Generated', validation: source.validation, readOnly: true }, materialItems: materialItems.map((entry) => ({ ...entry, materialId: entry.materialId })), hardwareItems: hardwareItems.map((entry) => ({ ...entry, hardwareId: entry.hardwareId })), accessoryItems: accessoryItems.map((entry) => ({ ...entry, accessoryId: entry.accessoryId })), purchaseSummary: model('purchase-summary-view-model', []), categorySummary: model('category-management-view-model', []), source: { sourceType: 'purchase-list-result-and-view-models', projectId, purchaseListId }, validation: { valid: true, status: 'PRINT_READY', issues: [] }, status: 'Print Ready', readOnly: true };

const snapshot = JSON.stringify(printModel);
const exported = exportPurchaseListPdf(printModel, projectId);
const text = exported.buffer.toString('latin1');
assert.equal(exported.contentType, 'application/pdf');
assert.equal(exported.contract, 'purchase-list-pdf-result');
assert.equal(exported.pdfId, `purchase-list-pdf:${projectId}:${purchaseListId}`);
assert.equal(exported.readOnly, true);
assert.equal(exported.validation.status, 'PDF_READY');
assert.match(text, /^%PDF-1\.4/);
assert.match(text, /xref/);
assert.match(text, /trailer/);
assert.match(text, /%%EOF/);
assert.ok((text.match(/\/Type \/Page /g) || []).length >= 2, 'PDF is multi-page');
assert.match(text, /Furniture GO/);
assert.match(text, /Purchase List ID/);
assert.match(text, /Board Material List/);
assert.match(text, /Hardware List/);
assert.match(text, /Accessories List/);
assert.match(text, /Purchase Summary/);
assert.match(text, /Category Management/);
assert.equal(exported.filename, 'FurnitureGO_PDF_Project_Purchase_List.pdf');
assert.equal(JSON.stringify(printModel), snapshot, 'Print Model remains immutable');

for (const [label, input, project, code] of [
  ['missing print model', null, projectId, 'PRINT_MODEL_MISSING'],
  ['invalid project', printModel, '', 'PROJECT_MISSING'],
  ['project mismatch', { ...printModel, project: { projectId: 'other' } }, projectId, 'PROJECT_MISMATCH'],
  ['invalid contract', { ...printModel, contract: 'wrong' }, projectId, 'INVALID_PRINT_MODEL'],
  ['source mismatch', { ...printModel, source: { ...printModel.source, projectId: 'other' } }, projectId, 'SOURCE_MISMATCH'],
  ['blocked purchase list', { ...printModel, purchaseList: { ...printModel.purchaseList, status: 'BLOCKED' } }, projectId, 'INVALID_PRINT_MODEL'],
  ['read only false', { ...printModel, readOnly: false }, projectId, 'READ_ONLY_REQUIRED'],
  ['object mismatch', { ...printModel, materialItems: [{ ...printModel.materialItems[0], sourceObjectId: 'other' }] }, projectId, 'OBJECT_MISMATCH'],
  ['missing quantity', { ...printModel, materialItems: [{ ...printModel.materialItems[0], quantity: undefined }] }, projectId, 'QUANTITY_MISSING'],
  ['invalid quantity', { ...printModel, materialItems: [{ ...printModel.materialItems[0], quantity: 0 }] }, projectId, 'INVALID_QUANTITY'],
  ['invalid item', { ...printModel, materialItems: [{ ...printModel.materialItems[0], validation: { valid: false } }] }, projectId, 'INVALID_ITEM'],
  ['invalid Print Model', { ...printModel, status: 'Draft' }, projectId, 'INVALID_PRINT_MODEL'],
]) assert.throws(() => exportPurchaseListPdf(input, project), (error) => error.code === code, label);

const serviceSource = fs.readFileSync(require.resolve('../src/services/purchase-list-pdf-service'), 'utf8');
assert.match(serviceSource, /purchase-list-print-model/);
assert.match(serviceSource, /readOnly: true/);
assert.doesNotMatch(serviceSource, /generatePurchaseList|supplier|inventory|\bERP\b|purchaseOrder|quotation|accounting|cloud|aiPurchasing|multiplier|waste|optimization|Excel|Reports|remote|server.?side/i);
console.log('Sprint 09 Task 09 tests passed: PDF generation, header/EOF/xref, multi-page content, Print Model compatibility, validation, isolation, immutability and scope boundaries.');
