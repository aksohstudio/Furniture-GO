const assert = require('node:assert/strict');
const fs = require('node:fs');
const { ProductionDrawingGenerationService } = require('../src/services/production-drawing-generation-service');

const root = {
  objectId: 'root', projectId: 'project-1', name: 'Base Cabinet', objectType: 'Base Cabinet',
  productionStatus: 'Production Ready', lifecycleStatus: 'Created',
  dimensions: { width: 900, height: 720, depth: 560, unit: 'mm' },
  relationshipReferences: [], hardwareReferences: [{ hardwareId: 'HW-0001' }],
};
const child = {
  objectId: 'child', projectId: 'project-1', name: 'Internal Divider', objectType: 'Custom Cabinet',
  productionStatus: 'Production Ready', lifecycleStatus: 'Created',
  dimensions: { width: 864, height: 680, depth: 540, unit: 'mm' },
  relationshipReferences: [{ parentObjectId: 'root' }], hardwareReferences: [],
};
const objects = { root, child };
const cloneObjects = () => Object.fromEntries(Object.entries(objects).map(([id, object]) => [id, structuredClone(object)]));
const projectService = {
  readProject: (projectId) => projectId === 'project-1' ? { project: { id: projectId, name: 'Assembly Test Project' } } : null,
  data: { official: { getHardwareById: (id) => id === 'HW-0001' ? { id, officialName: 'Confirmed Hardware' } : null } },
};
const furnitureObjectEngine = {
  getRoot: (projectId, objectId) => {
    if (projectId !== 'project-1' || objectId !== 'root') throw Object.assign(new Error('Furniture Object not found'), { statusCode: 404 });
    return structuredClone(root);
  },
  getDescendants: () => [structuredClone(child)],
  validateObject: () => ({ isValid: true, errors: [] }),
};

const service = new ProductionDrawingGenerationService(projectService, furnitureObjectEngine);
const original = cloneObjects();
const drawing = service.generateAssembly('project-1', 'root');
assert.equal(drawing.contract, 'production-drawing-data');
assert.equal(drawing.schemaVersion, 2);
assert.equal(drawing.drawingType, 'Assembly Drawing');
assert.equal(drawing.readOnly, true);
assert.deepEqual(drawing.project, { projectId: 'project-1', name: 'Assembly Test Project' });
assert.equal(drawing.assembly.rootObjectId, 'root');
assert.equal(drawing.assembly.metadata.objectCount, 2);
assert.deepEqual(drawing.source.componentObjectIds, ['root', 'child']);
assert.deepEqual(drawing.views[0].components, ['root', 'child']);
assert.deepEqual(drawing.components.map((item) => item.objectId), ['root', 'child']);
assert.deepEqual(drawing.components[1].dimensions, child.dimensions);
assert.deepEqual(drawing.hardware.references, [{ objectId: 'root', hardwareId: 'HW-0001' }]);
assert.equal(drawing.annotations.length, 2);
assert.equal(drawing.validation.valid, true);
assert.deepEqual(objects, original);

assert.throws(() => service.generateAssembly('project-2', 'root'), (error) => error.code === 'PROJECT_NOT_FOUND');
assert.throws(() => service.generateAssembly('project-1', 'missing'), (error) => error.code === 'FURNITURE_OBJECT_NOT_FOUND');

const invalidDimensionService = new ProductionDrawingGenerationService(projectService, {
  ...furnitureObjectEngine,
  getRoot: () => structuredClone({ ...root, dimensions: { ...root.dimensions, depth: null } }),
});
assert.throws(() => invalidDimensionService.generateAssembly('project-1', 'root'), (error) => error.code === 'ASSEMBLY_INVALID' && error.details.objects.some((item) => item.errors.some((entry) => entry.code === 'DIMENSIONS_INVALID')));

const invalidHardwareService = new ProductionDrawingGenerationService(projectService, {
  ...furnitureObjectEngine,
  getRoot: () => structuredClone({ ...root, hardwareReferences: [{ hardwareId: 'UNKNOWN-HARDWARE' }] }),
});
assert.throws(() => invalidHardwareService.generateAssembly('project-1', 'root'), (error) => error.code === 'ASSEMBLY_INVALID' && error.details.objects.some((item) => item.errors.some((entry) => entry.code === 'HARDWARE_REFERENCE_INVALID')));

for (const code of ['MISSING_OFFICIAL_RULE', 'ENGINEERING_RULE_MISSING']) {
  const blockedService = new ProductionDrawingGenerationService(projectService, {
    ...furnitureObjectEngine,
    validateObject: () => ({ isValid: false, errors: [{ code }] }),
  });
  assert.throws(() => blockedService.generateAssembly('project-1', 'root'), (error) => error.code === 'BLOCKED_BY_MISSING_OFFICIAL_RULE');
}
for (const code of ['UNVERIFIED_RULE', 'ENGINEERING_RULE_UNVERIFIED']) {
  const blockedService = new ProductionDrawingGenerationService(projectService, {
    ...furnitureObjectEngine,
    validateObject: () => ({ isValid: false, errors: [{ code }] }),
  });
  assert.throws(() => blockedService.generateAssembly('project-1', 'root'), (error) => error.code === 'BLOCKED_BY_UNVERIFIED_RULE');
}

const source = fs.readFileSync(require.resolve('../src/services/production-drawing-generation-service'), 'utf8');
assert.match(source, /createProductionDrawingData/);
assert.doesNotMatch(source, /Cutting List|Purchase List|CNC/);

console.log('Production Drawing Task 03 tests passed: assembly generation, unified contract, isolation, components, hardware, blocking, immutability and scope.');
