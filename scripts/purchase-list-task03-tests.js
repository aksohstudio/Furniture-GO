const assert = require('node:assert/strict');
const fs = require('node:fs');
const { buildBoardMaterialList, filterBoardMaterialList } = require('../src/services/board-material-list-service');

const projectId = 'project-purchase-1';
const objectId = 'object-purchase-1';
const source = {
  schemaVersion: 1,
  contract: 'purchase-list-result',
  purchaseListId: 'purchase-list:project-purchase-1',
  project: { projectId, name: 'Purchase Project' },
  furnitureObjects: [{ objectId, name: 'Cabinet', productionStatus: 'Production Ready' }],
  materialItems: [
    { itemId: 'material-item-1', sourceObjectId: objectId, sourceComponentId: 'component-1', category: 'Board Materials', material: { materialId: 'MAT-0001', reference: { materialId: 'MAT-0001' } }, name: 'Sample Board', productCode: 'BOARD-18', specification: '18mm Board', thickness: '18mm', quantity: 4, unit: 'sheets', source: { sourceType: 'canonical-reference', projectId, objectId, materialId: 'MAT-0001' }, validation: { valid: true, status: 'REFERENCE_VALIDATED', issues: [] } },
    { itemId: 'material-item-2', sourceObjectId: objectId, sourceComponentId: 'component-2', category: 'Board Materials', material: { materialId: 'MAT-0002', reference: { materialId: 'MAT-0002' } }, name: 'Sample Board B', productCode: 'BOARD-09', specification: '9mm Board', thickness: '9mm', quantity: 2, unit: 'sheets', source: { sourceType: 'canonical-cutting-list-result', projectId, objectId, materialId: 'MAT-0002', cuttingListId: 'cutting-list-1' }, validation: { valid: true, status: 'REFERENCE_VALIDATED', issues: [] } },
  ],
  hardwareItems: [], accessoryItems: [], summary: { materialItemCount: 2 }, source: { sourceType: 'canonical-project-and-approved-furniture-objects', projectId }, validation: { valid: true, status: 'VALIDATED', issues: [] }, status: 'Generated', readOnly: true,
};

const snapshot = JSON.stringify(source);
const view = buildBoardMaterialList(source, projectId);
assert.equal(view.contract, 'board-material-list-view-model');
assert.equal(view.readOnly, true);
assert.equal(view.itemCount, 2);
assert.equal(view.items[0].materialId, 'MAT-0001');
assert.equal(view.items[0].productCode, 'BOARD-18');
assert.equal(view.items[0].specification, '18mm Board');
assert.equal(view.items[0].thickness, '18mm');
assert.equal(view.items[0].quantity, 4);
assert.equal(view.items[0].sourceObjectId, objectId);
assert.equal(view.items[1].source.cuttingListId, 'cutting-list-1');
assert.equal(JSON.stringify(source), snapshot, 'Purchase List Result remains immutable');

const filtered = filterBoardMaterialList(view, { search: 'sample board b', productCode: '09', thickness: '9mm', sort: 'quantity' });
assert.deepEqual(filtered.items.map((item) => item.itemId), ['material-item-2']);
const sorted = filterBoardMaterialList(view, { sort: 'quantity' });
assert.deepEqual(sorted.items.map((item) => item.quantity), [2, 4]);
assert.equal(view.items.length, 2, 'filtering does not mutate the View Model');

assert.throws(() => buildBoardMaterialList(null, projectId), (error) => error.code === 'PURCHASE_LIST_MISSING');
assert.throws(() => buildBoardMaterialList({ ...source, contract: 'wrong' }, projectId), (error) => error.code === 'INVALID_PURCHASE_LIST_CONTRACT');
assert.throws(() => buildBoardMaterialList({ ...source, project: { projectId: 'other' } }, projectId), (error) => error.code === 'PROJECT_MISMATCH');
assert.throws(() => buildBoardMaterialList({ ...source, readOnly: false }, projectId), (error) => error.code === 'READ_ONLY_REQUIRED');
assert.throws(() => buildBoardMaterialList({ ...source, materialItems: [{ ...source.materialItems[0], material: null }] }, projectId), (error) => error.code === 'MATERIAL_REFERENCE_MISSING');
assert.throws(() => buildBoardMaterialList({ ...source, materialItems: [{ ...source.materialItems[0], validation: { valid: false, issues: [{ code: 'UNKNOWN_MATERIAL' }] } }] }, projectId), (error) => error.code === 'UNKNOWN_MATERIAL');
assert.throws(() => buildBoardMaterialList({ ...source, materialItems: [{ ...source.materialItems[0], quantity: null }] }, projectId), (error) => error.code === 'QUANTITY_MISSING');
assert.throws(() => buildBoardMaterialList({ ...source, materialItems: [{ ...source.materialItems[0], sourceObjectId: 'other-object', source: { ...source.materialItems[0].source, objectId: 'other-object' } }] }, projectId), (error) => error.code === 'OBJECT_MISMATCH');
assert.throws(() => buildBoardMaterialList({ ...source, materialItems: [{ ...source.materialItems[0], source: { ...source.materialItems[0].source, materialId: 'other-material' } }] }, projectId), (error) => error.code === 'SOURCE_MISMATCH');
assert.throws(() => buildBoardMaterialList({ ...source, status: 'BLOCKED', validation: { valid: false, issues: [{ code: 'QUANTITY_MISSING' }] } }, projectId), (error) => error.code === 'PURCHASE_LIST_BLOCKED');

const serviceSource = fs.readFileSync(require.resolve('../src/services/board-material-list-service'), 'utf8');
assert.doesNotMatch(serviceSource, /generatePurchaseList|OfficialCatalogRepository|getMaterialById|calculate|optimization|kerf|wasteFactor|supplier|inventory|erp|purchaseOrder|quotation|accounting|cloud|aiPurchasing/i);
assert.doesNotMatch(serviceSource, /Math\.|\*\s*Number\(|Number\(item\.quantity\)/);
assert.match(serviceSource, /purchase-list-result/);
assert.match(serviceSource, /readOnly: true/);
console.log('Sprint 09 Task 03 tests passed: board material identification, canonical field consumption, filtering/sorting, validation, traceability, immutability and no recalculation/source duplication.');
