const assert = require('node:assert/strict');
const fs = require('node:fs');
const { buildCategoryManagement, filterCategoryManagement } = require('../src/services/category-management-service');

const projectId = 'project-purchase-1';
const objectId = 'object-purchase-1';
const item = (itemId, kind, quantity, unit, category, type) => ({ itemId, sourceObjectId: objectId, category, type, quantity, unit, ...(kind === 'material' ? { material: { materialId: `MAT-${itemId}` } } : kind === 'hardware' ? { hardware: { hardwareId: `HW-${itemId}` } } : { accessory: { accessoryId: `ACC-${itemId}` } }), source: { sourceType: 'canonical-reference', projectId, objectId, ...(kind === 'material' ? { materialId: `MAT-${itemId}` } : kind === 'hardware' ? { hardwareId: `HW-${itemId}` } : { accessoryId: `ACC-${itemId}` }) }, validation: { valid: true, status: 'REFERENCE_VALIDATED', issues: [] } });
const material = item('1', 'material', 4, 'sheets', 'Board Materials', undefined);
const hardware = item('2', 'hardware', 8, 'pcs', 'Hardware', 'Hinge');
const accessory = item('3', 'accessory', 12, 'pcs', 'Fastener', 'Connector');
const source = { schemaVersion: 1, contract: 'purchase-list-result', purchaseListId: `purchase-list:${projectId}`, project: { projectId, name: 'Purchase Project' }, furnitureObjects: [{ objectId, name: 'Cabinet' }], materialItems: [material], hardwareItems: [hardware], accessoryItems: [accessory], summary: { materialItemCount: 1, hardwareItemCount: 1, accessoryItemCount: 1, totalItemCount: 3 }, source: { sourceType: 'canonical-project-and-approved-furniture-objects', projectId }, validation: { valid: true, status: 'VALIDATED', issues: [] }, status: 'Generated', readOnly: true };

const snapshot = JSON.stringify(source);
const view = buildCategoryManagement(source, projectId);
assert.equal(view.contract, 'category-management-view-model');
assert.equal(view.readOnly, true);
assert.equal(view.categoryCount, 3);
assert.equal(view.typeCount, 2);
assert.equal(view.itemCount, 3);
assert.equal(view.totalQuantity, 24);
assert.deepEqual(view.breakdown.materials.units, ['sheets']);
assert.equal(view.breakdown.hardware.totalQuantity, 8);
assert.equal(view.breakdown.accessories.itemCount, 1);
assert.ok(view.categories.some((group) => group.category === 'Hardware' && group.itemCount === 1 && group.totalQuantity === 8));
assert.ok(view.types.some((group) => group.status === 'TYPE_UNAVAILABLE'));
assert.equal(JSON.stringify(source), snapshot, 'Purchase List Result remains immutable');
const filtered = filterCategoryManagement(view, { group: 'hardware', search: '2', type: 'Hinge', sort: 'quantity' });
assert.deepEqual(filtered.filteredItems.map((entry) => entry.itemId), ['2']);
assert.equal(view.breakdown.hardware.items.length, 1, 'filtering does not mutate View Model');

const missingCategory = { ...source, materialItems: [{ ...material, category: undefined, type: undefined }] };
const missingCategoryView = buildCategoryManagement(missingCategory, projectId);
assert.ok(missingCategoryView.categories.some((group) => group.status === 'CATEGORY_UNAVAILABLE'));
assert.ok(missingCategoryView.types.some((group) => group.status === 'TYPE_UNAVAILABLE'));

for (const [label, input, project, code] of [
  ['invalid project', source, '', 'PROJECT_MISSING'],
  ['project missing', { ...source, project: undefined }, projectId, 'PROJECT_MISSING'],
  ['project mismatch', { ...source, project: { projectId: 'other' } }, projectId, 'PROJECT_MISMATCH'],
  ['missing purchase list', null, projectId, 'PURCHASE_LIST_MISSING'],
  ['invalid contract', { ...source, contract: 'wrong' }, projectId, 'INVALID_PURCHASE_LIST_CONTRACT'],
  ['source mismatch', { ...source, source: { ...source.source, projectId: 'other' } }, projectId, 'SOURCE_MISMATCH'],
  ['blocked result', { ...source, status: 'BLOCKED', validation: { valid: false, issues: [{ code: 'INVALID_QUANTITY' }] } }, projectId, 'PURCHASE_LIST_BLOCKED'],
  ['invalid status', { ...source, status: 'Draft' }, projectId, 'PURCHASE_LIST_STATUS_INVALID'],
  ['read only', { ...source, readOnly: false }, projectId, 'READ_ONLY_REQUIRED'],
  ['object mismatch', { ...source, hardwareItems: [{ ...hardware, sourceObjectId: 'other', source: { ...hardware.source, objectId: 'other' } }] }, projectId, 'OBJECT_MISMATCH'],
  ['missing quantity', { ...source, accessoryItems: [{ ...accessory, quantity: undefined }] }, projectId, 'QUANTITY_MISSING'],
  ['invalid quantity', { ...source, accessoryItems: [{ ...accessory, quantity: 0 }] }, projectId, 'INVALID_QUANTITY'],
  ['invalid item', { ...source, materialItems: [{ ...material, validation: { valid: false, issues: [] } }] }, projectId, 'INVALID_ITEM'],
]) assert.throws(() => buildCategoryManagement(input, project), (error) => error.code === code, label);

const serviceSource = fs.readFileSync(require.resolve('../src/services/category-management-service'), 'utf8');
assert.match(serviceSource, /purchase-list-result/);
assert.match(serviceSource, /CATEGORY_UNAVAILABLE/);
assert.match(serviceSource, /readOnly: true/);
assert.doesNotMatch(serviceSource, /generatePurchaseList|OfficialCatalogRepository|getMaterialById|getHardwareById|Catalog|supplier|inventory|erp|purchaseOrder|quotation|accounting|cloud|aiPurchasing|multiplier|waste|optimization|Task 08|Printing|PDF|Excel|Reports/i);
console.log('Sprint 09 Task 07 tests passed: category/type grouping, source separation, item/quantity summaries, unavailable states, isolation, validation, read-only, immutability and scope boundaries.');
