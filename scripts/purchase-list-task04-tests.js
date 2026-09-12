const assert = require('node:assert/strict');
const fs = require('node:fs');
const { buildHardwareList, filterHardwareList } = require('../src/services/hardware-list-service');

const projectId = 'project-purchase-1';
const objectId = 'object-purchase-1';
const hardwareItem = { itemId: 'hardware-item-1', sourceObjectId: objectId, sourceComponentId: 'component-1', category: 'Hardware', hardware: { hardwareId: 'HW-0001', reference: { hardwareId: 'HW-0001' } }, name: 'Sample Hinge', productCode: 'HINGE-110', type: 'Hinge', specification: '110 degree', quantity: 8, unit: 'pcs', source: { sourceType: 'canonical-reference', projectId, objectId, hardwareId: 'HW-0001' }, validation: { valid: true, status: 'REFERENCE_VALIDATED', issues: [] } };
const source = { schemaVersion: 1, contract: 'purchase-list-result', purchaseListId: `purchase-list:${projectId}`, project: { projectId, name: 'Purchase Project' }, furnitureObjects: [{ objectId, name: 'Cabinet', productionStatus: 'Production Ready' }], materialItems: [], hardwareItems: [hardwareItem], accessoryItems: [], summary: { hardwareItemCount: 1 }, source: { sourceType: 'canonical-project-and-approved-furniture-objects', projectId }, validation: { valid: true, status: 'VALIDATED', issues: [] }, status: 'Generated', readOnly: true };

const snapshot = JSON.stringify(source);
const view = buildHardwareList(source, projectId);
assert.equal(view.contract, 'hardware-list-view-model');
assert.equal(view.readOnly, true);
assert.equal(view.itemCount, 1);
assert.deepEqual(view.items[0], { itemId: 'hardware-item-1', sourceObjectId: objectId, sourceComponentId: 'component-1', hardwareId: 'HW-0001', name: 'Sample Hinge', productCode: 'HINGE-110', type: 'Hinge', category: 'Hardware', specification: '110 degree', quantity: 8, unit: 'pcs', source: hardwareItem.source, validation: hardwareItem.validation });
assert.equal(view.items[0].quantity, 8);
assert.equal(view.items[0].source.hardwareId, 'HW-0001');
assert.equal(JSON.stringify(source), snapshot, 'Purchase List Result remains immutable');

const filtered = filterHardwareList(view, { search: 'sample hinge', productCode: '110', type: 'Hinge', category: 'Hardware' });
assert.deepEqual(filtered.items.map((item) => item.hardwareId), ['HW-0001']);
assert.deepEqual(filterHardwareList(view, { sort: 'quantity' }).items.map((item) => item.quantity), [8]);
assert.equal(view.items.length, 1, 'filtering does not mutate the View Model');

for (const [label, input, code] of [
  ['missing purchase list', null, 'PURCHASE_LIST_MISSING'],
  ['invalid contract', { ...source, contract: 'wrong' }, 'INVALID_PURCHASE_LIST_CONTRACT'],
  ['project mismatch', { ...source, project: { projectId: 'other' } }, 'PROJECT_MISMATCH'],
  ['not read only', { ...source, readOnly: false }, 'READ_ONLY_REQUIRED'],
  ['blocked result', { ...source, status: 'BLOCKED', validation: { valid: false, issues: [{ code: 'QUANTITY_MISSING' }] } }, 'PURCHASE_LIST_BLOCKED'],
  ['unknown hardware', { ...source, hardwareItems: [{ ...hardwareItem, validation: { valid: false, issues: [{ code: 'UNKNOWN_HARDWARE' }] } }] }, 'UNKNOWN_HARDWARE'],
  ['missing hardware', { ...source, hardwareItems: [{ ...hardwareItem, hardware: null, hardwareId: null, sourceReference: null }] }, 'HARDWARE_REFERENCE_MISSING'],
  ['invalid hardware reference', { ...source, hardwareItems: [{ ...hardwareItem, validation: { valid: false, issues: [{ code: 'HARDWARE_REFERENCE_INVALID' }] } }] }, 'HARDWARE_REFERENCE_INVALID'],
  ['missing quantity', { ...source, hardwareItems: [{ ...hardwareItem, quantity: undefined }] }, 'QUANTITY_MISSING'],
  ['invalid quantity', { ...source, hardwareItems: [{ ...hardwareItem, quantity: 0 }] }, 'INVALID_QUANTITY'],
  ['object mismatch', { ...source, hardwareItems: [{ ...hardwareItem, sourceObjectId: 'other-object', source: { ...hardwareItem.source, objectId: 'other-object' } }] }, 'OBJECT_MISMATCH'],
  ['source mismatch', { ...source, hardwareItems: [{ ...hardwareItem, source: { ...hardwareItem.source, projectId: 'other' } }] }, 'SOURCE_MISMATCH'],
]) assert.throws(() => buildHardwareList(input, projectId), (error) => error.code === code, label);
assert.throws(() => buildHardwareList(source, projectId, 'other-object'), (error) => error.code === 'OBJECT_MISMATCH');

const serviceSource = fs.readFileSync(require.resolve('../src/services/hardware-list-service'), 'utf8');
assert.match(serviceSource, /purchase-list-result/);
assert.match(serviceSource, /readOnly: true/);
assert.doesNotMatch(serviceSource, /generatePurchaseList|OfficialCatalogRepository|getHardwareById|MaterialCatalog|calculate|inference|CNC|engineering|Math\.|Number\(item\.quantity\)|quantity\s*\+|quantity\s*\*/i);
console.log('Sprint 09 Task 04 tests passed: hardware identification, references, product code, specification, type/category, canonical quantity, isolation, validation, traceability, read-only, immutability and no duplicate sources/inference.');
