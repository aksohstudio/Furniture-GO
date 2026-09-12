const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(require.resolve('../src/services/production-drawing-print-service'), 'utf8');
const transformed = source
  .replace('export function preparePrintDocument', 'function preparePrintDocument')
  .replace('export { VALID_DRAWING_STATUSES };', 'module.exports = { preparePrintDocument, VALID_DRAWING_STATUSES };');
const context = { module: { exports: {} }, JSON, Set };
vm.runInNewContext(transformed, context, { filename: 'production-drawing-print-service.js' });
const { preparePrintDocument } = context.module.exports;

const views = [
  { id: 'front', type: 'Elevation', label: 'Front / Elevation', dimensions: { width: 900, height: 720, unit: 'mm' } },
  { id: 'side', type: 'Profile', label: 'Side / Profile', dimensions: { width: 560, height: 720, unit: 'mm' } },
  { id: 'top', type: 'Plan', label: 'Top / Plan', dimensions: { width: 900, depth: 560, unit: 'mm' } },
];

function drawing(type) {
  return {
    contract: 'production-drawing-data', drawingId: `drawing:${type}`, objectId: 'object-1', drawingType: type,
    project: { projectId: 'project-1', name: 'Print Project' }, furnitureObject: { objectId: 'object-1', name: 'Cabinet' },
    status: 'Generated', readOnly: true, validation: { valid: true, status: 'validated' }, source: { sourceType: 'approved-furniture-object' },
    dimensions: { width: 900, height: 720, depth: 560, unit: 'mm' }, views,
    components: [{ id: 'component-1' }], hardware: { references: [{ hardwareId: 'HW-0001' }] }, material: { references: ['MAT-0001'] }, annotations: [], processing: [],
  };
}

for (const type of ['Automatic Furniture Object Drawing', 'Assembly Drawing', 'Panel Drawing', 'Door Drawing', 'Drawer Drawing', 'Hardware Layout']) {
  const original = JSON.parse(JSON.stringify(drawing(type)));
  const input = drawing(type);
  const prepared = preparePrintDocument(input, 'project-1', 'object-1');
  assert.equal(prepared.kind, 'drawing');
  assert.equal(prepared.drawingType, type);
  assert.equal(prepared.readOnly, true);
  assert.equal(prepared.views.length, 3);
  assert.deepEqual(input, original);
  assert.deepEqual(preparePrintDocument(input, 'project-1', 'object-1').dimensions, original.dimensions);
}

const packageData = {
  contract: 'production-package', packageId: 'production-package:project-1:object-1', projectId: 'project-1',
  project: { projectId: 'project-1', name: 'Print Project' }, furnitureObjects: [{ objectId: 'object-1', name: 'Cabinet' }],
  drawings: [{ drawingId: 'drawing:basic', drawingType: 'Automatic Furniture Object Drawing', objectId: 'object-1', status: 'Generated', validation: { valid: true, status: 'validated' }, readOnly: true }],
  drawingCount: 1, drawingTypes: ['Automatic Furniture Object Drawing'], validation: { valid: true, status: 'validated' }, status: 'Generated', readOnly: true,
};
const packageOriginal = JSON.parse(JSON.stringify(packageData));
const preparedPackage = preparePrintDocument(packageData, 'project-1', 'object-1');
assert.equal(preparedPackage.kind, 'package');
assert.equal(preparedPackage.packageId, packageData.packageId);
assert.equal(preparedPackage.readOnly, true);
assert.deepEqual(packageData, packageOriginal);

assert.throws(() => preparePrintDocument(null, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_MISSING');
assert.throws(() => preparePrintDocument(drawing('Panel Drawing'), 'project-2', 'object-1'), (error) => error.code === 'DRAWING_PROJECT_MISMATCH');
assert.throws(() => preparePrintDocument({ ...drawing('Panel Drawing'), objectId: 'object-2', furnitureObject: { objectId: 'object-2' } }, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_OBJECT_MISMATCH');
assert.throws(() => preparePrintDocument({ ...drawing('Panel Drawing'), contract: 'invalid' }, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_CONTRACT_INVALID');
assert.throws(() => preparePrintDocument({ ...drawing('Panel Drawing'), validation: { valid: false } }, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_VALIDATION_FAILED');
assert.throws(() => preparePrintDocument({ ...drawing('Panel Drawing'), readOnly: false }, 'project-1', 'object-1'), (error) => error.code === 'READ_ONLY_REQUIRED');
assert.throws(() => preparePrintDocument({ ...drawing('Panel Drawing'), status: 'Incomplete' }, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_INVALID');
assert.throws(() => preparePrintDocument({ ...packageData, status: 'Incomplete' }, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_INVALID');
assert.throws(() => preparePrintDocument({ ...packageData, furnitureObjects: [] }, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_PROJECT_MISMATCH');

assert.doesNotMatch(source, /calculate|productionFormula|formulaEngine|width\s*[-+]\s*\d+|height\s*[-+]\s*\d+|depth\s*[-+]\s*\d+|quantity\s*=|position\s*=/i);
assert.doesNotMatch(source, /PDF|DWG|Revision|Cutting|Purchase|CNC|CAD|QR|Barcode|Cloud|network/i);
const workspaceSource = fs.readFileSync(require.resolve('../src/components/ProductionDrawingWorkspace'), 'utf8');
assert.match(workspaceSource, /data-production-print-drawing/);
assert.match(workspaceSource, /data-production-print-package/);
assert.match(workspaceSource, /window\.print/);

console.log('Production Drawing Task 10 tests passed: print readiness, drawing/package validation, isolation, immutability and scope.');
