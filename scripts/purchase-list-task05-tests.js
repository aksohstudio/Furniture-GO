const assert = require('node:assert/strict');
const fs = require('node:fs');
const { buildAccessoriesList, filterAccessoriesList } = require('../src/services/accessories-list-service');

const projectId = 'project-purchase-1';
const objectId = 'object-purchase-1';
const accessoryItem = { itemId: 'accessory-item-1', sourceObjectId: objectId, sourceComponentId: 'component-1', category: 'Fastener', type: 'Connector', accessory: { accessoryId: 'ACC-0001', reference: { accessoryId: 'ACC-0001' } }, name: 'Sample Connector', productCode: 'CONN-01', specification: 'Sample specification', quantity: 12, unit: 'pcs', source: { sourceType: 'canonical-reference', projectId, objectId, accessoryId: 'ACC-0001' }, validation: { valid: true, status: 'REFERENCE_VALIDATED', issues: [] } };
const source = { schemaVersion: 1, contract: 'purchase-list-result', purchaseListId: `purchase-list:${projectId}`, project: { projectId, name: 'Purchase Project' }, furnitureObjects: [{ objectId, name: 'Cabinet', productionStatus: 'Production Ready' }], materialItems: [], hardwareItems: [], accessoryItems: [accessoryItem], summary: { accessoryItemCount: 1 }, source: { sourceType: 'canonical-project-and-approved-furniture-objects', projectId }, validation: { valid: true, status: 'VALIDATED', issues: [] }, status: 'Generated', readOnly: true };

const snapshot = JSON.stringify(source);
const view = buildAccessoriesList(source, projectId);
assert.equal(view.contract, 'accessories-list-view-model');
assert.equal(view.readOnly, true);
assert.equal(view.itemCount, 1);
assert.deepEqual(view.items[0], { itemId: 'accessory-item-1', sourceObjectId: objectId, sourceComponentId: 'component-1', accessoryId: 'ACC-0001', name: 'Sample Connector', productCode: 'CONN-01', category: 'Fastener', type: 'Connector', specification: 'Sample specification', quantity: 12, unit: 'pcs', source: accessoryItem.source, validation: accessoryItem.validation });
assert.equal(view.items[0].source.accessoryId, 'ACC-0001');
assert.equal(JSON.stringify(source), snapshot, 'Purchase List Result remains immutable');

const filtered = filterAccessoriesList(view, { search: 'sample connector', productCode: '01', category: 'Fastener', sort: 'quantity' });
assert.deepEqual(filtered.items.map((item) => item.accessoryId), ['ACC-0001']);
assert.equal(view.items.length, 1, 'filtering does not mutate the View Model');

const emptySource = { ...source, accessoryItems: [], summary: { accessoryItemCount: 0 } };
const empty = buildAccessoriesList(emptySource, projectId);
assert.deepEqual(empty.items, []);
assert.equal(empty.itemCount, 0, 'empty accessoryItems remains empty');

for (const [label, input, code] of [
  ['missing purchase list', null, 'PURCHASE_LIST_MISSING'],
  ['project missing', { ...source, project: undefined }, 'PROJECT_MISMATCH'],
  ['invalid contract', { ...source, contract: 'wrong' }, 'INVALID_PURCHASE_LIST_CONTRACT'],
  ['not read only', { ...source, readOnly: false }, 'READ_ONLY_REQUIRED'],
  ['blocked result', { ...source, status: 'BLOCKED', validation: { valid: false, issues: [{ code: 'QUANTITY_MISSING' }] } }, 'PURCHASE_LIST_BLOCKED'],
  ['missing accessory reference', { ...source, accessoryItems: [{ ...accessoryItem, accessory: null, accessoryId: null, sourceReference: null }] }, 'ACCESSORY_REFERENCE_MISSING'],
  ['invalid accessory reference', { ...source, accessoryItems: [{ ...accessoryItem, validation: { valid: false, issues: [{ code: 'ACCESSORY_REFERENCE_INVALID' }] } }] }, 'ACCESSORY_REFERENCE_INVALID'],
  ['unknown accessory', { ...source, accessoryItems: [{ ...accessoryItem, validation: { valid: false, issues: [{ code: 'UNKNOWN_ACCESSORY' }] } }] }, 'UNKNOWN_ACCESSORY'],
  ['unsupported accessory', { ...source, accessoryItems: [{ ...accessoryItem, validation: { valid: false, issues: [{ code: 'UNSUPPORTED_ACCESSORY' }] } }] }, 'UNSUPPORTED_ACCESSORY'],
  ['missing quantity', { ...source, accessoryItems: [{ ...accessoryItem, quantity: undefined }] }, 'QUANTITY_MISSING'],
  ['invalid quantity', { ...source, accessoryItems: [{ ...accessoryItem, quantity: 0 }] }, 'INVALID_QUANTITY'],
  ['object mismatch', { ...source, accessoryItems: [{ ...accessoryItem, sourceObjectId: 'other-object', source: { ...accessoryItem.source, objectId: 'other-object' } }] }, 'OBJECT_MISMATCH'],
  ['source mismatch', { ...source, accessoryItems: [{ ...accessoryItem, source: { ...accessoryItem.source, projectId: 'other' } }] }, 'SOURCE_MISMATCH'],
  ['furniture object missing', { ...source, accessoryItems: [{ ...accessoryItem, sourceObjectId: undefined, source: { ...accessoryItem.source, objectId: undefined } }] }, 'FURNITURE_OBJECT_MISSING'],
]) assert.throws(() => buildAccessoriesList(input, projectId), (error) => error.code === code, label);
assert.throws(() => buildAccessoriesList(source, projectId, 'other-object'), (error) => error.code === 'OBJECT_MISMATCH');

const serviceSource = fs.readFileSync(require.resolve('../src/services/accessories-list-service'), 'utf8');
assert.match(serviceSource, /purchase-list-result/);
assert.match(serviceSource, /readOnly: true/);
assert.doesNotMatch(serviceSource, /generatePurchaseList|OfficialCatalogRepository|getAccessoryById|MaterialCatalog|HardwareCatalog|supplier|inventory|erp|purchaseOrder|quotation|accounting|cloud|aiPurchasing|inference|quantity\s*=\s*(?!=)|quantity\s*[+*]/i);
console.log('Sprint 09 Task 05 tests passed: accessory identification, references, product code, specification, category/type, canonical quantity, isolation, empty state, validation, traceability, read-only, immutability and no inference/duplicate sources.');
