const assert = require('node:assert/strict');
const fs = require('node:fs');
const { ProductionDrawingGenerationService } = require('../src/services/production-drawing-generation-service');

const rules = [
  { id: 'ENG-RULE-BLUM-TANDEM-560H-INTERNAL-WIDTH', engineeringRecordId: 'ENG-HW-BLUM-TANDEM-560H', verificationStatus: 'verified-official', source: 'Blum', sourceUrl: 'https://example.invalid/560h-width' },
  { id: 'ENG-RULE-BLUM-TANDEM-560H-DRAWER-LENGTH', engineeringRecordId: 'ENG-HW-BLUM-TANDEM-560H', verificationStatus: 'verified-official', source: 'Blum', sourceUrl: 'https://example.invalid/560h-length' },
];
const hardware = {
  'HW-0001': { id: 'HW-0001', officialName: 'Confirmed Hinge', category: 'Door Hinge', specification: 'Confirmed hinge', unit: 'pcs' },
  'ENG-HW-BLUM-TANDEM-560H': { id: 'ENG-HW-BLUM-TANDEM-560H', officialName: 'TANDEM 560H', category: 'Drawer Slide', model: 'TANDEM 560H', specification: 'Confirmed drawer runner', unit: 'pair' },
};
const panel = { componentId: 'panel-1', componentType: 'Panel', name: 'Side Panel', dimensions: { width: 560, height: 720, depth: 18, unit: 'mm' }, materialReferences: [{ materialId: 'MAT-0001' }] };
const door = { componentId: 'door-1', componentType: 'Door', name: 'Door', dimensions: { width: 447, height: 716, thickness: 18, unit: 'mm' }, materialReferences: [{ materialId: 'MAT-0001' }], hardwareReferences: [{ hardwareId: 'HW-0001' }] };
const drawer = { componentId: 'drawer-1', componentType: 'Drawer', name: 'Drawer', dimensions: { width: 558, height: 140, depth: 490, unit: 'mm' }, materialReferences: [{ materialId: 'MAT-0001' }], hardwareReferences: [{ hardwareId: 'ENG-HW-BLUM-TANDEM-560H' }] };
const object = {
  objectId: 'object-1', projectId: 'project-1', name: 'Base Cabinet', objectType: 'Cabinet', productionStatus: 'Production Ready', lifecycleStatus: 'Created',
  dimensions: { width: 900, height: 720, depth: 560, unit: 'mm' }, materialReferences: [{ materialId: 'MAT-0001' }], hardwareReferences: [{ hardwareId: 'HW-0001' }], components: [panel, door, drawer],
};

function createService(sourceObject = object) {
  const projectService = {
    readProject: (projectId) => projectId === 'project-1' || projectId === 'project-2' ? { project: { id: projectId, name: 'Package Project' } } : null,
    data: { official: {
      getMaterialById: (id) => id === 'MAT-0001' ? { id, officialName: 'Confirmed Board' } : null,
      getHardwareById: (id) => hardware[id] || null,
      listEngineeringRecords: () => rules.map((rule) => ({ ...rule })),
    } },
  };
  const furnitureObjectEngine = {
    getObject: (projectId, objectId) => {
      if (projectId !== 'project-1' || objectId !== 'object-1' || sourceObject.lifecycleStatus === 'Archived') throw Object.assign(new Error('Furniture Object not found'), { statusCode: 404 });
      return structuredClone(sourceObject);
    },
    getRoot: (projectId, objectId) => {
      if (projectId !== 'project-1' || objectId !== 'object-1') throw Object.assign(new Error('Furniture Object not found'), { statusCode: 404 });
      return structuredClone(sourceObject);
    },
    getDescendants: () => [],
    validateObject: () => ({ isValid: true, errors: [] }),
  };
  return new ProductionDrawingGenerationService(projectService, furnitureObjectEngine);
}

const original = structuredClone(object);
const service = createService();
const pack = service.generatePackage('project-1', 'object-1');
assert.equal(pack.contract, 'production-package');
assert.equal(pack.packageId, 'production-package:project-1:object-1');
assert.equal(pack.projectId, 'project-1');
assert.equal(pack.furnitureObjects[0].objectId, 'object-1');
assert.equal(pack.drawingCount, 6);
assert.deepEqual(pack.drawingTypes, ['Automatic Furniture Object Drawing', 'Assembly Drawing', 'Panel Drawing', 'Door Drawing', 'Drawer Drawing', 'Hardware Layout']);
assert.equal(pack.drawings.length, 6);
assert.ok(pack.drawings.every((drawing) => drawing.drawingId && drawing.objectId === 'object-1' && drawing.status === 'Generated' && drawing.validation.valid === true && drawing.readOnly === true));
assert.equal(pack.validation.valid, true);
assert.equal(pack.status, 'Generated');
assert.equal(pack.readOnly, true);
assert.deepEqual(object, original);

assert.throws(() => createService().generatePackage('project-2', 'object-1'), (error) => error.code === 'FURNITURE_OBJECT_NOT_FOUND');
assert.throws(() => createService().generatePackage('project-1', 'missing'), (error) => error.code === 'FURNITURE_OBJECT_NOT_FOUND');
assert.throws(() => createService({ ...object, productionStatus: 'Draft' }).generatePackage('project-1', 'object-1'), (error) => error.code === 'FURNITURE_OBJECT_NOT_APPROVED');
assert.throws(() => createService({ ...object, lifecycleStatus: 'Archived' }).generatePackage('project-1', 'object-1'), (error) => error.code === 'FURNITURE_OBJECT_NOT_FOUND');

const incomplete = createService({ ...object, components: [], hardwareReferences: [] }).generatePackage('project-1', 'object-1');
assert.equal(incomplete.status, 'Incomplete');
assert.equal(incomplete.validation.valid, false);
assert.ok(incomplete.drawings.some((drawing) => drawing.status === 'MISSING'));

const invalidContract = createService();
invalidContract.generate = () => ({ contract: 'wrong-contract' });
assert.throws(() => invalidContract.generatePackage('project-1', 'object-1'), (error) => error.code === 'DRAWING_CONTRACT_INVALID');
const mismatchedProject = createService();
mismatchedProject.generate = () => ({ contract: 'production-drawing-data', project: { projectId: 'project-2' }, objectId: 'object-1', furnitureObject: { objectId: 'object-1' }, readOnly: true, validation: { valid: true }, status: 'Generated' });
assert.throws(() => mismatchedProject.generatePackage('project-1', 'object-1'), (error) => error.code === 'DRAWING_PROJECT_MISMATCH');
const mismatchedObject = createService();
mismatchedObject.generate = () => ({ contract: 'production-drawing-data', project: { projectId: 'project-1' }, objectId: 'object-2', furnitureObject: { objectId: 'object-2' }, readOnly: true, validation: { valid: true }, status: 'Generated' });
assert.throws(() => mismatchedObject.generatePackage('project-1', 'object-1'), (error) => error.code === 'DRAWING_OBJECT_MISMATCH');
const invalidValidation = createService();
invalidValidation.generate = () => ({ contract: 'production-drawing-data', project: { projectId: 'project-1' }, objectId: 'object-1', furnitureObject: { objectId: 'object-1' }, readOnly: true, validation: { valid: false }, status: 'Generated' });
assert.throws(() => invalidValidation.generatePackage('project-1', 'object-1'), (error) => error.code === 'DRAWING_VALIDATION_FAILED');
const notReadOnly = createService();
notReadOnly.generate = () => ({ contract: 'production-drawing-data', project: { projectId: 'project-1' }, objectId: 'object-1', furnitureObject: { objectId: 'object-1' }, readOnly: false, validation: { valid: true }, status: 'Generated' });
assert.throws(() => notReadOnly.generatePackage('project-1', 'object-1'), (error) => error.code === 'DRAWING_INVALID');

const source = fs.readFileSync(require.resolve('../src/services/production-drawing-generation-service'), 'utf8');
const clientSource = fs.readFileSync(require.resolve('../src/services/project-client'), 'utf8');
const serverSource = fs.readFileSync(require.resolve('../server'), 'utf8');
assert.match(source, /generatePackage/);
assert.match(clientSource, /generateProductionPackage/);
assert.match(serverSource, /drawingType === 'package'/);
const packageSource = source.slice(source.indexOf('  generatePackage('), source.indexOf('  generateDrawer('));
assert.doesNotMatch(packageSource, /calculate|productionFormula|width\s*[-+]\s*\d+|height\s*[-+]\s*\d+|depth\s*[-+]\s*\d+|quantity\s*=/i);
assert.doesNotMatch(packageSource, /Printing|PDF|DWG|Revision|Cutting|Purchase|CNC|CAD|QR|Barcode/);

console.log('Production Drawing Task 09 tests passed: package references, validation, missing/invalid drawing handling, isolation, immutability and scope.');
