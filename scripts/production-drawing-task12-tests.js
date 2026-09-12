const assert = require('node:assert/strict');
const fs = require('node:fs');
const { exportProductionDrawingDwg } = require('../src/services/production-drawing-dwg-service');
const { parseDwg } = require('../src/services/dwg-import-service');

const views = [
  { id: 'front', type: 'Elevation', label: 'Front / Elevation', dimensions: { width: 900, height: 720, unit: 'mm' } },
  { id: 'side', type: 'Profile', label: 'Side / Profile', dimensions: { width: 560, height: 720, unit: 'mm' } },
  { id: 'top', type: 'Plan', label: 'Top / Plan', dimensions: { width: 900, depth: 560, unit: 'mm' } },
];

function drawing(type = 'Panel Drawing') {
  return {
    contract: 'production-drawing-data', drawingId: `drawing:${type}`, objectId: 'object-1', drawingType: type,
    project: { projectId: 'project-1', name: 'DWG Test Project' }, furnitureObject: { objectId: 'object-1', name: 'Base Cabinet' },
    status: 'Generated', readOnly: true, validation: { valid: true, status: 'validated' }, source: { sourceType: 'approved-furniture-object' },
    dimensions: { width: 900, height: 720, depth: 560, unit: 'mm' }, views,
    components: [], hardware: { references: [] }, material: { references: [] }, annotations: [], processing: [],
  };
}

function packageData() {
  return {
    contract: 'production-package', packageId: 'package:project-1:object-1', projectId: 'project-1',
    project: { projectId: 'project-1', name: 'DWG Test Project' }, furnitureObjects: [{ objectId: 'object-1', name: 'Base Cabinet' }],
    drawings: [{ drawingId: 'drawing:panel', drawingType: 'Panel Drawing', objectId: 'object-1', status: 'Generated', validation: { valid: true, status: 'validated' }, readOnly: true }],
    drawingCount: 1, drawingTypes: ['Panel Drawing'], validation: { valid: true, status: 'validated' }, status: 'Generated', readOnly: true,
  };
}

(async () => {
  for (const type of ['Automatic Furniture Object Drawing', 'Assembly Drawing', 'Panel Drawing', 'Door Drawing', 'Drawer Drawing', 'Hardware Layout']) {
    const input = drawing(type);
    const original = JSON.parse(JSON.stringify(input));
    const result = await exportProductionDrawingDwg(input, 'project-1', 'object-1');
    assert.equal(result.contentType, 'application/acad');
    assert.match(result.filename, /\.dwg$/);
    assert.ok(Buffer.isBuffer(result.buffer));
    assert.ok(result.buffer.length > 1024);
    assert.equal(result.buffer.subarray(0, 6).toString('ascii'), 'AC1032');
    assert.ok(result.report.exportedCount >= views.length * 4);
    const parsed = await parseDwg(result.buffer);
    assert.ok(parsed.entityCount > 0);
    assert.ok(parsed.supportedEntityCount > 0);
    assert.deepEqual(input, original);
  }

  await assert.rejects(() => exportProductionDrawingDwg(packageData(), 'project-1', 'object-1'), (error) => error.code === 'DWG_EXPORT_UNAVAILABLE');
  await assert.rejects(() => exportProductionDrawingDwg(null, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_MISSING');
  await assert.rejects(() => exportProductionDrawingDwg({ ...drawing(), project: { projectId: 'project-2' } }, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_PROJECT_MISMATCH');
  await assert.rejects(() => exportProductionDrawingDwg({ ...drawing(), objectId: 'object-2', furnitureObject: { objectId: 'object-2' } }, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_OBJECT_MISMATCH');
  await assert.rejects(() => exportProductionDrawingDwg({ ...drawing(), contract: 'invalid' }, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_CONTRACT_INVALID');
  await assert.rejects(() => exportProductionDrawingDwg({ ...drawing(), validation: { valid: false } }, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_VALIDATION_FAILED');
  await assert.rejects(() => exportProductionDrawingDwg({ ...drawing(), readOnly: false }, 'project-1', 'object-1'), (error) => error.code === 'READ_ONLY_REQUIRED');
  await assert.rejects(() => exportProductionDrawingDwg({ ...drawing(), status: 'Draft' }, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_INVALID');
  await assert.rejects(() => exportProductionDrawingDwg({ ...drawing(), views: [] }, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_INVALID');
  await assert.rejects(() => exportProductionDrawingDwg({ ...drawing(), views: [{ id: 'invalid', label: 'Invalid', dimensions: { width: 0, height: 0 } }] }, 'project-1', 'object-1'), (error) => error.code === 'DWG_EXPORT_UNAVAILABLE');

  const dwgSource = fs.readFileSync(require.resolve('../src/services/production-drawing-dwg-service'), 'utf8');
  const serverSource = fs.readFileSync(require.resolve('../server'), 'utf8');
  const clientSource = fs.readFileSync(require.resolve('../src/services/project-client'), 'utf8');
  const workspaceSource = fs.readFileSync(require.resolve('../src/components/ProductionDrawingWorkspace'), 'utf8');
  assert.doesNotMatch(dwgSource, /productionFormula|width\s*-\s*\d+|height\s*-\s*\d+|depth\s*-\s*\d+|quantity\s*=|hole|drill|cutting/i);
  assert.doesNotMatch(dwgSource, /productionFormula|cuttingList|purchaseList|qrLabel|barcode/i);
  assert.match(serverSource, /production-drawings.*export-dwg|export-dwg/);
  assert.match(clientSource, /exportProductionDrawingDwg/);
  assert.match(workspaceSource, /data-production-export-dwg/);
  assert.match(workspaceSource, /data-production-export-package-dwg/);
  console.log('Production Drawing Task 12 tests passed: real AC1032 DWG generation, parser validation, blocking, immutability and scope.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
