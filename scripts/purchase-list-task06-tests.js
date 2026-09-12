const assert = require('node:assert/strict');
const fs = require('node:fs');
const { buildPurchaseSummary } = require('../src/services/purchase-summary-service');

const projectId = 'project-purchase-1';
const objectId = 'object-purchase-1';
const material = { itemId: 'material-item-1', sourceObjectId: objectId, material: { materialId: 'MAT-0001' }, category: 'Board Materials', quantity: 4, unit: 'sheets', source: { sourceType: 'canonical-reference', projectId, objectId, materialId: 'MAT-0001' }, validation: { valid: true, status: 'REFERENCE_VALIDATED', issues: [] } };
const hardware = { itemId: 'hardware-item-1', sourceObjectId: objectId, hardware: { hardwareId: 'HW-0001' }, category: 'Hardware', type: 'Hinge', quantity: 8, unit: 'pcs', source: { sourceType: 'canonical-reference', projectId, objectId, hardwareId: 'HW-0001' }, validation: { valid: true, status: 'REFERENCE_VALIDATED', issues: [] } };
const accessory = { itemId: 'accessory-item-1', sourceObjectId: objectId, accessory: { accessoryId: 'ACC-0001' }, category: 'Fastener', type: 'Connector', quantity: 12, unit: 'pcs', source: { sourceType: 'canonical-reference', projectId, objectId, accessoryId: 'ACC-0001' }, validation: { valid: true, status: 'REFERENCE_VALIDATED', issues: [] } };
const source = { schemaVersion: 1, contract: 'purchase-list-result', purchaseListId: `purchase-list:${projectId}`, project: { projectId, name: 'Purchase Project' }, furnitureObjects: [{ objectId, name: 'Cabinet' }], materialItems: [material], hardwareItems: [hardware], accessoryItems: [accessory], summary: { materialItemCount: 1, hardwareItemCount: 1, accessoryItemCount: 1, totalItemCount: 3 }, source: { sourceType: 'canonical-project-and-approved-furniture-objects', projectId }, validation: { valid: true, status: 'VALIDATED', issues: [] }, status: 'Generated', readOnly: true };

const snapshot = JSON.stringify(source);
const summary = buildPurchaseSummary(source, projectId);
assert.equal(summary.contract, 'purchase-summary-view-model');
assert.equal(summary.project.projectId, projectId);
assert.equal(summary.purchaseList.purchaseListId, source.purchaseListId);
assert.equal(summary.furnitureObjectCount, 1);
assert.equal(summary.materialItemCount, 1);
assert.equal(summary.hardwareItemCount, 1);
assert.equal(summary.accessoryItemCount, 1);
assert.equal(summary.totalItemCount, 3);
assert.deepEqual(summary.quantitySummary.materials, [{ unit: 'sheets', quantity: 4, itemCount: 1 }]);
assert.deepEqual(summary.quantitySummary.hardware, [{ unit: 'pcs', quantity: 8, itemCount: 1 }]);
assert.deepEqual(summary.quantitySummary.accessories, [{ unit: 'pcs', quantity: 12, itemCount: 1 }]);
assert.deepEqual(summary.categorySummary.hardware, [{ category: 'Hardware', itemCount: 1, quantity: 8 }]);
assert.deepEqual(summary.categorySummary.accessories, [{ category: 'Fastener', itemCount: 1, quantity: 12 }]);
assert.equal(summary.readOnly, true);
assert.equal(summary.validation.status, 'VALIDATED');
assert.equal(summary.source.sourceType, 'purchase-list-result');
assert.equal(JSON.stringify(source), snapshot, 'Purchase List Result remains immutable');

for (const [label, input, project, code] of [
  ['invalid project', source, '', 'PROJECT_MISSING'],
  ['project missing', { ...source, project: undefined }, projectId, 'PROJECT_MISSING'],
  ['project mismatch', { ...source, project: { projectId: 'other' } }, projectId, 'PROJECT_MISMATCH'],
  ['invalid contract', { ...source, contract: 'wrong' }, projectId, 'INVALID_PURCHASE_LIST_CONTRACT'],
  ['source mismatch', { ...source, source: { ...source.source, projectId: 'other' } }, projectId, 'SOURCE_MISMATCH'],
  ['read only', { ...source, readOnly: false }, projectId, 'READ_ONLY_REQUIRED'],
  ['blocked purchase list', { ...source, status: 'BLOCKED', validation: { valid: false, issues: [{ code: 'QUANTITY_MISSING' }] } }, projectId, 'PURCHASE_LIST_BLOCKED'],
  ['object missing', { ...source, materialItems: [{ ...material, sourceObjectId: undefined, source: { ...material.source, objectId: undefined } }] }, projectId, 'FURNITURE_OBJECT_MISSING'],
  ['object mismatch', { ...source, hardwareItems: [{ ...hardware, sourceObjectId: 'other', source: { ...hardware.source, objectId: 'other' } }] }, projectId, 'OBJECT_MISMATCH'],
  ['missing quantity', { ...source, accessoryItems: [{ ...accessory, quantity: undefined }] }, projectId, 'QUANTITY_MISSING'],
  ['invalid quantity', { ...source, accessoryItems: [{ ...accessory, quantity: 0 }] }, projectId, 'INVALID_QUANTITY'],
  ['invalid item', { ...source, materialItems: [{ ...material, validation: { valid: false, issues: [{ code: 'INVALID_QUANTITY' }] } }] }, projectId, 'INVALID_ITEM'],
]) assert.throws(() => buildPurchaseSummary(input, project), (error) => error.code === code, label);

const serviceSource = fs.readFileSync(require.resolve('../src/services/purchase-summary-service'), 'utf8');
assert.match(serviceSource, /purchase-list-result/);
assert.match(serviceSource, /readOnly: true/);
assert.doesNotMatch(serviceSource, /generatePurchaseList|OfficialCatalogRepository|getMaterialById|getHardwareById|Catalog|cutting|supplier|inventory|erp|purchaseOrder|quotation|accounting|cloud|aiPurchasing|multiplier|waste|optimization/i);
assert.doesNotMatch(serviceSource, /Task 07|Category Management|PDF|Excel|Printing|Reports/i);
console.log('Sprint 09 Task 06 tests passed: summary generation, isolation, contract/source validation, material/hardware/accessory summaries, quantity handling, blocking, read-only, immutability and scope boundaries.');
