const assert = require('node:assert/strict');
const fs = require('node:fs');
const { exportProductionDrawingPdf } = require('../src/services/production-drawing-pdf-service');

const views = [
  { id: 'front', type: 'Elevation', label: 'Front / Elevation', dimensions: { width: 900, height: 720, unit: 'mm' } },
  { id: 'side', type: 'Profile', label: 'Side / Profile', dimensions: { width: 560, height: 720, unit: 'mm' } },
  { id: 'top', type: 'Plan', label: 'Top / Plan', dimensions: { width: 900, depth: 560, unit: 'mm' } },
];

function drawing(type) {
  return {
    contract: 'production-drawing-data', drawingId: `drawing:${type}`, objectId: 'object-1', drawingType: type,
    project: { projectId: 'project-1', name: 'PDF Test Project' }, furnitureObject: { objectId: 'object-1', name: 'Base Cabinet' },
    status: 'Generated', readOnly: true, validation: { valid: true, status: 'validated' }, source: { sourceType: 'approved-furniture-object' },
    dimensions: { width: 900, height: 720, depth: 560, unit: 'mm' }, views,
    components: [{ id: 'component-1' }], hardware: { references: [{ hardwareId: 'HW-0001' }] }, material: { references: ['MAT-0001'] }, annotations: [], processing: [],
  };
}

function assertPdf(result, expectedText) {
  assert.equal(result.contentType, 'application/pdf');
  assert.match(result.filename, /\.pdf$/);
  assert.ok(Buffer.isBuffer(result.buffer));
  assert.match(result.buffer.toString('latin1'), /^%PDF-1\.4/);
  assert.match(result.buffer.toString('latin1'), /xref/);
  assert.match(result.buffer.toString('latin1'), /%%EOF/);
  assert.match(result.buffer.toString('latin1'), new RegExp(expectedText));
}

for (const type of ['Automatic Furniture Object Drawing', 'Assembly Drawing', 'Panel Drawing', 'Door Drawing', 'Drawer Drawing', 'Hardware Layout']) {
  const input = drawing(type);
  const original = JSON.parse(JSON.stringify(input));
  const result = exportProductionDrawingPdf(input, 'project-1', 'object-1');
  assertPdf(result, type.replace(/[()]/g, '\\$&'));
  assert.deepEqual(input, original);
}

const packageData = {
  contract: 'production-package', packageId: 'production-package:project-1:object-1', projectId: 'project-1',
  project: { projectId: 'project-1', name: 'PDF Test Project' }, furnitureObjects: [{ objectId: 'object-1', name: 'Base Cabinet' }],
  drawings: ['Basic', 'Assembly', 'Panel', 'Door', 'Drawer', 'Hardware'].map((type, index) => ({ drawingId: `drawing-${index}`, drawingType: `${type} Drawing`, objectId: 'object-1', status: 'Generated', validation: { valid: true, status: 'validated' }, readOnly: true })),
  drawingCount: 6, drawingTypes: ['Basic Drawing', 'Assembly Drawing', 'Panel Drawing', 'Door Drawing', 'Drawer Drawing', 'Hardware Layout'], validation: { valid: true, status: 'validated' }, status: 'Generated', readOnly: true,
};
const packageOriginal = JSON.parse(JSON.stringify(packageData));
const packagePdf = exportProductionDrawingPdf(packageData, 'project-1', 'object-1');
assertPdf(packagePdf, 'Production Package');
assert.match(packagePdf.filename, /Production_Package\.pdf$/);
assert.deepEqual(packageData, packageOriginal);

assert.throws(() => exportProductionDrawingPdf(null, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_MISSING');
assert.throws(() => exportProductionDrawingPdf({ ...drawing('Panel Drawing'), project: { projectId: 'project-2' } }, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_PROJECT_MISMATCH');
assert.throws(() => exportProductionDrawingPdf({ ...drawing('Panel Drawing'), objectId: 'object-2', furnitureObject: { objectId: 'object-2' } }, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_OBJECT_MISMATCH');
assert.throws(() => exportProductionDrawingPdf({ ...drawing('Panel Drawing'), contract: 'invalid' }, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_CONTRACT_INVALID');
assert.throws(() => exportProductionDrawingPdf({ ...drawing('Panel Drawing'), validation: { valid: false } }, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_VALIDATION_FAILED');
assert.throws(() => exportProductionDrawingPdf({ ...drawing('Panel Drawing'), readOnly: false }, 'project-1', 'object-1'), (error) => error.code === 'READ_ONLY_REQUIRED');
assert.throws(() => exportProductionDrawingPdf({ ...drawing('Panel Drawing'), views: [] }, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_INVALID');
assert.throws(() => exportProductionDrawingPdf({ ...packageData, drawings: [{ ...packageData.drawings[0], status: 'MISSING' }] }, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_INVALID');

const pdfSource = fs.readFileSync(require.resolve('../src/services/production-drawing-pdf-service'), 'utf8');
const serverSource = fs.readFileSync(require.resolve('../server'), 'utf8');
const clientSource = fs.readFileSync(require.resolve('../src/services/project-client'), 'utf8');
const workspaceSource = fs.readFileSync(require.resolve('../src/components/ProductionDrawingWorkspace'), 'utf8');
assert.doesNotMatch(pdfSource, /calculate|productionFormula|width\s*[-+]\s*\d+|height\s*[-+]\s*\d+|depth\s*[-+]\s*\d+|quantity\s*=|position\s*=/i);
assert.doesNotMatch(pdfSource, /DWG|Revision|Cutting|Purchase|CNC|CAD|QR|Barcode|Cloud|network/i);
assert.match(serverSource, /export-pdf/);
assert.match(clientSource, /exportProductionDrawingPdf/);
assert.match(workspaceSource, /data-production-export-drawing/);
assert.match(workspaceSource, /data-production-export-package/);

(async () => {
  const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
  const document = await pdfjs.getDocument({ data: new Uint8Array(packagePdf.buffer) }).promise;
  assert.equal(document.numPages, 1);
  console.log('Production Drawing Task 11 tests passed: PDF generation, content, validation, immutability and scope.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
