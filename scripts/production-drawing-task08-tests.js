const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(require.resolve('../src/services/production-drawing-preview-service'), 'utf8');
const transformed = source
  .replace('export function prepareDrawingPreview', 'function prepareDrawingPreview')
  .replace('export { VALID_STATUSES };', 'module.exports = { prepareDrawingPreview, VALID_STATUSES };');
const context = { module: { exports: {} }, JSON, Set };
vm.runInNewContext(transformed, context, { filename: 'production-drawing-preview-service.js' });
const { prepareDrawingPreview } = context.module.exports;

const views = [
  { id: 'front', type: 'Elevation', label: 'Front / Elevation', dimensions: { width: 900, height: 720, unit: 'mm' } },
  { id: 'side', type: 'Profile', label: 'Side / Profile', dimensions: { width: 560, height: 720, unit: 'mm' } },
  { id: 'top', type: 'Plan', label: 'Top / Plan', dimensions: { width: 900, depth: 560, unit: 'mm' } },
];

function makeDrawing(drawingType, extra = {}) {
  return {
    schemaVersion: 2,
    contract: 'production-drawing-data',
    drawingId: `drawing:${drawingType.toLowerCase().replace(/ /g, '-')}`,
    objectId: 'object-1',
    drawingType,
    project: { projectId: 'project-1', name: 'Preview Project' },
    furnitureObject: { objectId: 'object-1', name: 'Base Cabinet', objectType: 'Cabinet', productionStatus: 'Production Ready' },
    source: { sourceType: 'approved-furniture-object' },
    dimensions: { width: 900, height: 720, depth: 560, unit: 'mm' },
    views,
    annotations: [{ type: 'label', text: 'Confirmed' }],
    components: [{ id: 'component-1', dimensions: { width: 100, height: 100, depth: 100 } }],
    hardware: { references: [{ hardwareId: 'HW-0001' }] },
    material: { references: ['MAT-0001'] },
    processing: [{ type: 'confirmed-processing' }],
    validation: { status: 'approved-furniture-object', valid: true, issues: [] },
    status: 'Generated',
    readOnly: true,
    ...extra,
  };
}

for (const drawingType of ['Automatic Furniture Object Drawing', 'Assembly Drawing', 'Panel Drawing', 'Door Drawing', 'Drawer Drawing', 'Hardware Layout']) {
  const drawing = makeDrawing(drawingType);
  const original = JSON.parse(JSON.stringify(drawing));
  const preview = prepareDrawingPreview(drawing, 'project-1', 'object-1');
  assert.equal(preview.drawingType, drawingType);
  assert.equal(preview.view.id, 'front');
  assert.equal(preview.readOnly, true);
  assert.equal(preview.project.projectId, 'project-1');
  assert.deepEqual(drawing, original);
  assert.deepEqual(prepareDrawingPreview(drawing, 'project-1', 'object-1', 'side').view, views[1]);
  assert.deepEqual(prepareDrawingPreview(drawing, 'project-1', 'object-1', 'top').view, views[2]);
}

assert.throws(() => prepareDrawingPreview(null, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_DATA_MISSING');
assert.throws(() => prepareDrawingPreview(makeDrawing('Panel Drawing'), 'project-2', 'object-1'), (error) => error.code === 'DRAWING_CONTEXT_MISMATCH');
assert.throws(() => prepareDrawingPreview(makeDrawing('Panel Drawing', { objectId: 'object-2' }), 'project-1', 'object-1'), (error) => error.code === 'DRAWING_CONTEXT_MISMATCH');
assert.throws(() => prepareDrawingPreview(makeDrawing('Panel Drawing', { readOnly: false }), 'project-1', 'object-1'), (error) => error.code === 'DRAWING_NOT_READ_ONLY');
assert.throws(() => prepareDrawingPreview(makeDrawing('Panel Drawing', { status: 'Draft' }), 'project-1', 'object-1'), (error) => error.code === 'DRAWING_STATUS_INVALID');
assert.throws(() => prepareDrawingPreview(makeDrawing('Panel Drawing', { validation: { valid: false, status: 'blocked' } }), 'project-1', 'object-1'), (error) => error.code === 'DRAWING_VALIDATION_FAILED');
assert.throws(() => prepareDrawingPreview(makeDrawing('Panel Drawing', { views: [] }), 'project-1', 'object-1'), (error) => error.code === 'DRAWING_VIEWS_MISSING');
assert.throws(() => prepareDrawingPreview(makeDrawing('Panel Drawing'), 'project-1', 'object-1', 'missing'), (error) => error.code === 'DRAWING_VIEW_NOT_FOUND');

assert.doesNotMatch(source, /calculate|productionFormula|formulaEngine|width\s*[-+]\s*\d+|height\s*[-+]\s*\d+|depth\s*[-+]\s*\d+/i);
assert.doesNotMatch(source, /Cutting List|Purchase List|CNC|QR|Barcode|PDF Export|DWG Export|Revision Management/);
const workspaceSource = fs.readFileSync(require.resolve('../src/components/ProductionDrawingWorkspace'), 'utf8');
assert.match(workspaceSource, /prepareDrawingPreview/);
assert.match(workspaceSource, /data-production-preview/);

console.log('Production Drawing Task 08 tests passed: drawing types, views, isolation, validation, read-only protection, immutability and scope.');
