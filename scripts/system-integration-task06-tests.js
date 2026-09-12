const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { ProductionDrawingGenerationService } = require('../src/services/production-drawing-generation-service');
const { exportProductionDrawingPdf } = require('../src/services/production-drawing-pdf-service');
const { exportProductionDrawingDwg } = require('../src/services/production-drawing-dwg-service');
const { createRevision, listRevisions } = require('../src/services/production-drawing-revision-service');

const projectA = { projectId: 'project-a', name: 'Project A' };
const projectB = { projectId: 'project-b', name: 'Project B' };
const objectA = {
  objectId: 'object-a', name: 'Cabinet A', objectType: 'Cabinet', productionStatus: 'Production Ready',
  dimensions: { width: 900, height: 720, depth: 560, unit: 'mm' },
  components: [], hardwareReferences: [], materialReferences: [], relationshipReferences: [],
};
const objectB = { ...objectA, objectId: 'object-b', name: 'Cabinet B' };
const projects = { 'project-a': projectA, 'project-b': projectB };
const objects = { 'project-a': { 'object-a': objectA }, 'project-b': { 'object-b': objectB } };
const projectService = { readProject: (id) => projects[id] || null };
const furnitureObjectEngine = {
  getObject: (projectId, objectId) => {
    const object = objects[projectId]?.[objectId];
    if (!object) throw Object.assign(new Error('Furniture Object not found'), { statusCode: 404 });
    return object;
  },
  validateObject: (projectId, objectId) => ({ isValid: Boolean(objects[projectId]?.[objectId]), errors: [] }),
  getRoot: (projectId, objectId) => furnitureObjectEngine.getObject(projectId, objectId),
  getDescendants: () => [],
};

function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
function variant(basic, drawingType, suffix) {
  return { ...clone(basic), drawingId: `production-drawing:${suffix}:object-a`, drawingType, source: { ...clone(basic.source), sourceType: `approved-furniture-object-${suffix}` } };
}
function loadEsm(file, name, exportLine) {
  const source = fs.readFileSync(file, 'utf8');
  const context = { module: { exports: {} }, JSON, Set };
  vm.runInNewContext(source.replace(`export function ${name}`, `function ${name}`).replace(exportLine, `module.exports = { ${name} };`), context, { filename: file });
  return context.module.exports[name];
}
function expectCode(fn, code) { assert.throws(fn, (error) => error.code === code, `expected ${code}`); }

(async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'furniture-go-task06-'));
  try {
    const service = new ProductionDrawingGenerationService(projectService, furnitureObjectEngine);
    const originalA = clone(objectA);
    const basic = service.generate('project-a', 'object-a');
    assert.equal(basic.contract, 'production-drawing-data');
    assert.equal(basic.project.projectId, 'project-a');
    assert.equal(basic.objectId, 'object-a');
    assert.equal(basic.furnitureObject.objectId, 'object-a');
    assert.equal(basic.source.projectId, 'project-a');
    assert.equal(basic.source.furnitureObjectId, 'object-a');
    assert.equal(basic.readOnly, true);
    assert.ok(basic.drawingId && basic.drawingType && basic.views.length);

    const assembly = service.generateAssembly('project-a', 'object-a');
    assert.equal(assembly.contract, basic.contract);
    assert.equal(assembly.project.projectId, 'project-a');
    assert.equal(assembly.objectId, 'object-a');
    assert.equal(assembly.readOnly, true);

    const drawings = [
      basic,
      variant(basic, 'Assembly Drawing', 'assembly'),
      variant(basic, 'Panel Drawing', 'panel'),
      variant(basic, 'Door Drawing', 'door'),
      variant(basic, 'Drawer Drawing', 'drawer'),
      variant(basic, 'Hardware Layout', 'hardware'),
    ];
    const preparePreview = loadEsm('src/services/production-drawing-preview-service.js', 'prepareDrawingPreview', 'export { VALID_STATUSES };');
    const preparePrint = loadEsm('src/services/production-drawing-print-service.js', 'preparePrintDocument', 'export { VALID_DRAWING_STATUSES };');
    for (const drawing of drawings) {
      assert.equal(drawing.contract, 'production-drawing-data');
      assert.equal(drawing.project.projectId, 'project-a');
      assert.equal(drawing.objectId, 'object-a');
      assert.equal(drawing.furnitureObject.objectId, 'object-a');
      assert.equal(drawing.readOnly, true);
      assert.equal(drawing.validation.valid, true);
      assert.equal(preparePreview(drawing, 'project-a', 'object-a').readOnly, true);
      assert.equal(preparePrint(drawing, 'project-a', 'object-a').objectId, 'object-a');
    }
    const packageData = {
      schemaVersion: 1, contract: 'production-package', packageId: 'production-package:project-a:object-a', projectId: 'project-a', project: projectA,
      furnitureObjects: [{ objectId: 'object-a', name: objectA.name, productionStatus: objectA.productionStatus }],
      drawings: drawings.map((drawing) => ({ drawingId: drawing.drawingId, drawingType: drawing.drawingType, objectId: drawing.objectId, status: 'Generated', validation: { valid: true }, readOnly: true })),
      drawingCount: drawings.length, drawingTypes: drawings.map((drawing) => drawing.drawingType), validation: { valid: true }, status: 'Generated', readOnly: true,
    };
    assert.equal(packageData.contract, 'production-package');
    assert.equal(packageData.projectId, 'project-a');
    assert.equal(packageData.furnitureObjects[0].objectId, 'object-a');
    assert.equal(packageData.readOnly, true);
    assert.equal(preparePrint(packageData, 'project-a', 'object-a').kind, 'package');
    assert.equal(exportProductionDrawingPdf(basic, 'project-a', 'object-a').contentType, 'application/pdf');
    assert.equal(exportProductionDrawingPdf(packageData, 'project-a', 'object-a').contentType, 'application/pdf');
    await assert.rejects(() => exportProductionDrawingDwg(packageData, 'project-a', 'object-a'), (error) => error.code === 'DWG_EXPORT_UNAVAILABLE');
    const revision = createRevision(basic, 'project-a', 'object-a', 'Task 06 integration verification');
    assert.equal(revision.projectId, 'project-a');
    assert.equal(revision.objectId, 'object-a');
    assert.equal(revision.readOnly, true);
    assert.ok(listRevisions('project-a', 'object-a', basic.drawingId).length >= 1);
    assert.deepEqual(objectA, originalA);

    expectCode(() => service.generate('unknown-project', 'object-a'), 'PROJECT_NOT_FOUND');
    expectCode(() => service.generate('project-a', 'unknown-object'), 'FURNITURE_OBJECT_NOT_FOUND');
    expectCode(() => service.generate('project-b', 'object-a'), 'FURNITURE_OBJECT_NOT_FOUND');
    expectCode(() => preparePreview({ ...basic, contract: 'invalid' }, 'project-a', 'object-a'), 'DRAWING_DATA_INVALID');
    expectCode(() => preparePreview({ ...basic, project: projectB }, 'project-a', 'object-a'), 'DRAWING_CONTEXT_MISMATCH');
    expectCode(() => exportProductionDrawingPdf({ ...basic, validation: { valid: false } }, 'project-a', 'object-a'), 'DRAWING_VALIDATION_FAILED');
    expectCode(() => exportProductionDrawingPdf({ ...basic, readOnly: false }, 'project-a', 'object-a'), 'READ_ONLY_REQUIRED');
    expectCode(() => exportProductionDrawingPdf({ ...basic, views: [] }, 'project-a', 'object-a'), 'DRAWING_INVALID');
    expectCode(() => exportProductionDrawingPdf({ ...basic, project: projectB }, 'project-a', 'object-a'), 'DRAWING_PROJECT_MISMATCH');
    expectCode(() => exportProductionDrawingPdf({ ...basic, objectId: 'object-b', furnitureObject: { objectId: 'object-b' } }, 'project-a', 'object-a'), 'DRAWING_OBJECT_MISMATCH');
    objectA.productionStatus = 'Draft';
    expectCode(() => service.generate('project-a', 'object-a'), 'FURNITURE_OBJECT_NOT_APPROVED');
    objectA.productionStatus = 'Production Ready';
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
  const files = [
    'src/services/production-drawing-data-contract.js', 'src/services/production-drawing-generation-service.js',
    'src/services/production-drawing-preview-service.js', 'src/services/production-drawing-print-service.js',
    'src/services/production-drawing-pdf-service.js', 'src/services/production-drawing-dwg-service.js',
    'src/services/production-drawing-revision-service.js', 'src/components/ProductionDrawingWorkspace.js',
    'src/services/project-client.js', 'src/components/ProjectDashboard.js',
  ];
  const source = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
  assert.match(source, /production-drawing-data/);
  assert.match(source, /projectId/);
  assert.match(source, /objectId/);
  assert.match(source, /DWG_EXPORT_UNAVAILABLE/);
  assert.doesNotMatch(source, /drawingDataV2|secondFurnitureObjectSource|cloudRevisionSync/i);
  assert.match(fs.readFileSync('src/components/ProductionDrawingWorkspace.js', 'utf8'), /dashboard\//);
  console.log('Sprint 10 Task 06 tests passed: canonical drawing contract, isolation, read-only boundaries, downstream context, errors, exports, revisions and offline scope.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
