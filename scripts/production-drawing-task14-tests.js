const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');
const { ProductionDrawingGenerationService } = require('../src/services/production-drawing-generation-service');
const { exportProductionDrawingPdf } = require('../src/services/production-drawing-pdf-service');
const { exportProductionDrawingDwg } = require('../src/services/production-drawing-dwg-service');
const { createRevision, listRevisions } = require('../src/services/production-drawing-revision-service');

const project = { projectId: 'project-1', name: 'Workflow Test Project' };
const furnitureObject = {
  objectId: 'object-1', name: 'Approved Cabinet', objectType: 'Cabinet', productionStatus: 'Production Ready',
  dimensions: { width: 900, height: 720, depth: 560, unit: 'mm' }, components: [], hardwareReferences: [], materialReferences: [], relationshipReferences: [],
};
const projectService = { readProject: (projectId) => projectId === 'project-1' ? project : null };
const furnitureObjectEngine = {
  getObject: (projectId, objectId) => {
    if (projectId !== 'project-1' || objectId !== 'object-1') throw Object.assign(new Error('Furniture Object not found'), { statusCode: 404 });
    return furnitureObject;
  },
  validateObject: () => ({ isValid: true, errors: [] }),
};

function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
function variant(basic, drawingType, suffix) {
  return {
    ...clone(basic), drawingId: `production-drawing:${suffix}:object-1`, drawingType,
    source: { ...clone(basic.source), sourceType: `approved-furniture-object-${suffix}` },
    components: drawingType === 'Assembly Drawing' ? [{ objectId: 'object-1', parentObjectId: null }] : clone(basic.components),
    hardware: drawingType === 'Hardware Layout' ? { references: [{ hardwareId: 'hardware-1', productCode: 'HW-001', specification: 'Reference only' }] } : clone(basic.hardware),
    annotations: drawingType === 'Hardware Layout' ? [{ type: 'hardware-label', hardwareId: 'hardware-1' }] : clone(basic.annotations),
  };
}

function packageFor(drawings) {
  return {
    schemaVersion: 1, contract: 'production-package', packageId: 'production-package:project-1:object-1', projectId: 'project-1', project,
    furnitureObjects: [{ objectId: 'object-1', name: furnitureObject.name, productionStatus: furnitureObject.productionStatus }],
    drawings: drawings.map((drawing) => ({ drawingId: drawing.drawingId, drawingType: drawing.drawingType, objectId: drawing.objectId, status: 'Generated', validation: { valid: true, status: 'validated' }, readOnly: true })),
    drawingCount: drawings.length, drawingTypes: drawings.map((drawing) => drawing.drawingType), validation: { valid: true, status: 'validated' }, status: 'Generated', readOnly: true,
  };
}

function loadEsmService(file, exportName, exportLine) {
  const source = fs.readFileSync(file, 'utf8');
  const context = { module: { exports: {} }, JSON, Set };
  vm.runInNewContext(source.replace(`export function ${exportName}`, `function ${exportName}`).replace(exportLine, `module.exports = { ${exportName} };`), context, { filename: file });
  return context.module.exports[exportName];
}

const prepareDrawingPreview = loadEsmService('src/services/production-drawing-preview-service.js', 'prepareDrawingPreview', 'export { VALID_STATUSES };');
const preparePrintDocument = loadEsmService('src/services/production-drawing-print-service.js', 'preparePrintDocument', 'export { VALID_DRAWING_STATUSES };');

(async () => {
  const generationService = new ProductionDrawingGenerationService(projectService, furnitureObjectEngine);
  const originalObject = clone(furnitureObject);
  const basic = generationService.generate('project-1', 'object-1');
  const drawings = [
    basic,
    variant(basic, 'Assembly Drawing', 'assembly'),
    variant(basic, 'Panel Drawing', 'panel'),
    variant(basic, 'Door Drawing', 'door'),
    variant(basic, 'Drawer Drawing', 'drawer'),
    variant(basic, 'Hardware Layout', 'hardware'),
  ];
  const contract = basic.contract;
  for (const drawing of drawings) {
    assert.equal(drawing.project.projectId, 'project-1');
    assert.equal(drawing.objectId, 'object-1');
    assert.equal(drawing.furnitureObject.objectId, 'object-1');
    assert.equal(drawing.contract, contract);
    assert.equal(drawing.validation.valid, true);
    assert.equal(drawing.readOnly, true);
    const preview = prepareDrawingPreview(drawing, 'project-1', 'object-1', drawing.views[0].id);
    assert.equal(preview.readOnly, true);
    assert.equal(preview.drawingId, drawing.drawingId);
  }

  assert.equal(preparePrintDocument(basic, 'project-1', 'object-1').kind, 'drawing');
  const packageData = packageFor(drawings);
  assert.equal(preparePrintDocument(packageData, 'project-1', 'object-1').kind, 'package');
  const pdf = exportProductionDrawingPdf(basic, 'project-1', 'object-1');
  const packagePdf = exportProductionDrawingPdf(packageData, 'project-1', 'object-1');
  for (const output of [pdf, packagePdf]) {
    assert.equal(output.buffer.subarray(0, 5).toString('ascii'), '%PDF-');
    assert.match(output.buffer.toString('latin1'), /xref/);
    assert.match(output.buffer.toString('latin1'), /%%EOF/);
  }
  const dwg = await exportProductionDrawingDwg(basic, 'project-1', 'object-1');
  assert.equal(dwg.buffer.subarray(0, 6).toString('ascii'), 'AC1032');
  assert.ok(dwg.report.exportedCount > 0);
  await assert.rejects(() => exportProductionDrawingDwg(packageData, 'project-1', 'object-1'), (error) => error.code === 'DWG_EXPORT_UNAVAILABLE');

  const revisionOne = createRevision(basic, 'project-1', 'object-1', 'Drawing regenerated');
  const revisionTwo = createRevision({ ...basic, views: [...basic.views, { id: 'section', type: 'Section', dimensions: basic.dimensions }] }, 'project-1', 'object-1', 'Drawing view changed');
  assert.deepEqual([revisionOne.revisionNumber, revisionTwo.revisionNumber], ['REV-001', 'REV-002']);
  assert.equal(revisionTwo.previousRevisionId, revisionOne.revisionId);
  assert.equal(listRevisions('project-1', 'object-1', basic.drawingId).length, 2);
  assert.equal(revisionTwo.readOnly, true);
  assert.deepEqual(furnitureObject, originalObject);

  assert.throws(() => generationService.generate('unknown-project', 'object-1'), (error) => error.code === 'PROJECT_NOT_FOUND');
  assert.throws(() => generationService.generate('project-1', 'unknown-object'), (error) => error.code === 'FURNITURE_OBJECT_NOT_FOUND');
  assert.throws(() => generationService.generate('project-2', 'object-1'), (error) => error.code === 'PROJECT_NOT_FOUND');
  furnitureObject.productionStatus = 'Draft';
  assert.throws(() => generationService.generate('project-1', 'object-1'), (error) => error.code === 'FURNITURE_OBJECT_NOT_APPROVED');
  furnitureObject.productionStatus = 'Production Ready';
  furnitureObject.dimensions.width = 0;
  assert.throws(() => generationService.generate('project-1', 'object-1'), (error) => error.code === 'DIMENSIONS_INVALID');
  furnitureObject.dimensions.width = originalObject.dimensions.width;
  assert.throws(() => exportProductionDrawingPdf({ ...basic, contract: 'invalid' }, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_CONTRACT_INVALID');
  assert.throws(() => exportProductionDrawingPdf({ ...basic, validation: { valid: false } }, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_VALIDATION_FAILED');
  assert.throws(() => exportProductionDrawingPdf({ ...basic, project: { projectId: 'project-2' } }, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_PROJECT_MISMATCH');
  assert.throws(() => exportProductionDrawingPdf({ ...basic, readOnly: false }, 'project-1', 'object-1'), (error) => error.code === 'READ_ONLY_REQUIRED');
  assert.throws(() => exportProductionDrawingPdf({ ...basic, views: [] }, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_INVALID');
  assert.throws(() => exportProductionDrawingPdf({ ...basic, objectId: 'object-2', furnitureObject: { objectId: 'object-2' } }, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_OBJECT_MISMATCH');

  const files = [
    'src/services/production-drawing-data-contract.js', 'src/services/production-drawing-generation-service.js', 'src/services/production-drawing-preview-service.js',
    'src/services/production-drawing-print-service.js', 'src/services/production-drawing-pdf-service.js', 'src/services/production-drawing-dwg-service.js',
    'src/services/production-drawing-revision-service.js', 'src/components/ProductionDrawingWorkspace.js', 'src/services/project-client.js', 'server.js',
  ];
  const source = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
  assert.match(source, /production-drawing-data/);
  assert.doesNotMatch(source, /drawingDataV2|fakeDrawingData|secondFurnitureObjectSource/i);
  assert.doesNotMatch(source, /width\s*-\s*\d+|height\s*-\s*\d+|depth\s*-\s*\d+/i);
  assert.doesNotMatch(source, /cuttingList|purchaseList|cncMachine|cadEditing|qrLabel|barcodeLabel|cloudRevisionSync/i);
  assert.match(fs.readFileSync('src/components/ProductionDrawingWorkspace.js', 'utf8'), /Revision Management/);
  console.log('Production Drawing Task 14 tests passed: end-to-end workflow, failure safety, immutability, single-source, offline and scope audits.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
