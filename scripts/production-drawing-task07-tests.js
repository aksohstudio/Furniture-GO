const assert = require('node:assert/strict');
const fs = require('node:fs');
const { ProductionDrawingGenerationService } = require('../src/services/production-drawing-generation-service');

const hardwareCatalog = {
  'HW-0001': { id: 'HW-0001', officialName: 'Confirmed Hinge', category: 'Door Hinge', specification: '110 degree hinge', unit: 'pcs' },
  'HW-0002': { id: 'HW-0002', officialName: 'Confirmed Drawer Slide', category: 'Drawer Slide', specification: 'Full extension slide', unit: 'pair' },
};
const verifiedRule = {
  id: 'ENG-RULE-HW-0002-APPLICATION', engineeringRecordId: 'HW-0002', officialName: 'Drawer slide application rule',
  category: 'Hardware Layout Rules', verificationStatus: 'verified-official', source: 'Official hardware fixture', sourceUrl: 'https://example.invalid/official-hardware-rule',
};
const unverifiedRule = { ...verifiedRule, verificationStatus: 'needs-verification' };

const component = {
  componentId: 'drawer-1', componentType: 'Drawer', name: 'Main Drawer',
  hardwareReferences: [{ hardwareId: 'HW-0002', engineeringRuleId: verifiedRule.id }],
  processing: [{ type: 'runner-locking', status: 'confirmed' }],
};
const object = {
  objectId: 'object-1', projectId: 'project-1', name: 'Base Cabinet', objectType: 'Base Cabinet',
  productionStatus: 'Production Ready', lifecycleStatus: 'Created',
  dimensions: { width: 900, height: 720, depth: 560, unit: 'mm' },
  components: [component],
  hardwareReferences: [{ hardwareId: 'HW-0001' }],
};

function createService(sourceObject = object, rules = [verifiedRule]) {
  const projectService = {
    readProject: (projectId) => projectId === 'project-1' || projectId === 'project-2' ? { project: { id: projectId, name: projectId } } : null,
    data: { official: {
      getHardwareById: (id) => hardwareCatalog[id] || null,
      listEngineeringRecords: () => rules.map((rule) => ({ ...rule })),
    } },
  };
  const furnitureObjectEngine = {
    getObject: (projectId, objectId) => {
      if (projectId !== 'project-1' || objectId !== 'object-1') throw Object.assign(new Error('Furniture Object not found'), { statusCode: 404 });
      if (sourceObject.lifecycleStatus === 'Archived') throw Object.assign(new Error('Furniture Object not found or archived'), { statusCode: 404 });
      return structuredClone(sourceObject);
    },
    validateObject: () => ({ isValid: true, errors: [] }),
  };
  return new ProductionDrawingGenerationService(projectService, furnitureObjectEngine);
}

const original = structuredClone(object);
const drawing = createService().generateHardware('project-1', 'object-1');
assert.equal(drawing.contract, 'production-drawing-data');
assert.equal(drawing.drawingType, 'Hardware Layout');
assert.equal(drawing.readOnly, true);
assert.equal(drawing.furnitureObject.objectId, 'object-1');
assert.deepEqual(drawing.hardware.references.map((item) => item.hardwareId), ['HW-0001', 'HW-0002']);
assert.deepEqual(drawing.hardware.references.map((item) => item.parentComponentId), [null, 'drawer-1']);
assert.equal(drawing.hardware.references[0].name, 'Confirmed Hinge');
assert.equal(drawing.hardware.references[1].productCode, null);
assert.equal(drawing.hardware.references[1].engineeringRule.ruleId, verifiedRule.id);
assert.equal(drawing.hardware.references[1].engineeringRule.verificationStatus, 'verified-official');
assert.deepEqual(drawing.processing, component.processing);
assert.deepEqual(drawing.views[0].hardwareIds, ['HW-0001', 'HW-0002']);
assert.equal(drawing.hardware.references.some((item) => 'coordinates' in item || 'holePositions' in item), false);
assert.deepEqual(object, original);

assert.throws(() => createService().generateHardware('project-2', 'object-1'), (error) => error.code === 'FURNITURE_OBJECT_NOT_FOUND');
assert.throws(() => createService().generateHardware('project-1', 'missing'), (error) => error.code === 'FURNITURE_OBJECT_NOT_FOUND');
assert.throws(() => createService({ ...object, productionStatus: 'Draft' }).generateHardware('project-1', 'object-1'), (error) => error.code === 'FURNITURE_OBJECT_NOT_APPROVED');
assert.throws(() => createService({ ...object, lifecycleStatus: 'Archived' }).generateHardware('project-1', 'object-1'), (error) => error.code === 'FURNITURE_OBJECT_NOT_FOUND');
assert.throws(() => createService({ ...object, hardwareReferences: [], components: [] }).generateHardware('project-1', 'object-1'), (error) => error.code === 'HARDWARE_REFERENCE_MISSING');
assert.throws(() => createService({ ...object, hardwareReferences: [{ hardwareId: 'HW-MISSING' }], components: [] }).generateHardware('project-1', 'object-1'), (error) => error.code === 'UNKNOWN_HARDWARE');
assert.throws(() => createService({ ...object, hardwareReferences: [{ hardwareId: 'HW-0002', engineeringRuleId: 'RULE-MISSING' }], components: [] }).generateHardware('project-1', 'object-1'), (error) => error.code === 'BLOCKED_BY_MISSING_OFFICIAL_RULE');
assert.throws(() => createService(object, [unverifiedRule]).generateHardware('project-1', 'object-1'), (error) => error.code === 'BLOCKED_BY_UNVERIFIED_RULE');
assert.throws(() => createService(object, [{ ...verifiedRule, engineeringRecordId: 'HW-0001' }]).generateHardware('project-1', 'object-1'), (error) => error.code === 'UNSUPPORTED_CONFIGURATION');

const source = fs.readFileSync(require.resolve('../src/services/production-drawing-generation-service'), 'utf8');
const clientSource = fs.readFileSync(require.resolve('../src/services/project-client'), 'utf8');
const serverSource = fs.readFileSync(require.resolve('../server'), 'utf8');
assert.match(source, /generateHardware/);
assert.match(clientSource, /drawingType,.*hardwareId/);
assert.match(serverSource, /drawingType === 'hardware'/);
assert.doesNotMatch(source, /Cutting List|Purchase List|CNC|QR|Barcode|drillingCoordinates|holePositions/);

console.log('Production Drawing Task 07 tests passed: hardware references, catalog validation, rule blocking, processing preservation, contract, immutability and scope.');
