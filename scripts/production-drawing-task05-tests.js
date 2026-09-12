const assert = require('node:assert/strict');
const fs = require('node:fs');
const { ProductionDrawingGenerationService } = require('../src/services/production-drawing-generation-service');

const door = {
  componentId: 'door-left', componentType: 'Swing Door', name: 'Left Door',
  dimensions: { width: 447, height: 716, thickness: 19, unit: 'mm' },
  materialReferences: [{ materialId: 'MAT-0001' }],
  hardwareReferences: [{ hardwareId: 'HW-0001' }],
  grainDirection: 'Vertical', edgeBanding: { edges: ['top', 'bottom', 'left', 'right'] },
  processing: [{ type: 'hinge-cup', status: 'confirmed' }],
};
const object = {
  objectId: 'object-1', projectId: 'project-1', name: 'Base Cabinet', objectType: 'Base Cabinet',
  productionStatus: 'Production Ready', lifecycleStatus: 'Created',
  dimensions: { width: 900, height: 720, depth: 560, unit: 'mm' },
  materialReferences: [{ materialId: 'MAT-0001' }], components: [door],
};
const projectService = {
  readProject: (projectId) => projectId === 'project-1' ? { project: { id: projectId, name: 'Door Test Project' } } : null,
  data: { official: {
    getMaterialById: (id) => id === 'MAT-0001' ? { id, officialName: 'Confirmed Board' } : null,
    getHardwareById: (id) => id === 'HW-0001' ? { id, officialName: 'Confirmed Hinge' } : null,
  } },
};
const furnitureObjectEngine = {
  getObject: (projectId, objectId) => {
    if (projectId !== 'project-1' || objectId !== 'object-1') throw Object.assign(new Error('Furniture Object not found'), { statusCode: 404 });
    return structuredClone(object);
  },
  validateObject: () => ({ isValid: true, errors: [] }),
};
const service = new ProductionDrawingGenerationService(projectService, furnitureObjectEngine);
const drawing = service.generateDoor('project-1', 'object-1');
assert.equal(drawing.contract, 'production-drawing-data');
assert.equal(drawing.drawingType, 'Door Drawing');
assert.equal(drawing.readOnly, true);
assert.deepEqual(drawing.door.doors.map((item) => item.doorId), ['door-left']);
assert.equal(drawing.components[0].name, 'Left Door');
assert.equal(drawing.components[0].parentObjectId, 'object-1');
assert.deepEqual(drawing.components[0].dimensions, door.dimensions);
assert.deepEqual(drawing.material, { references: ['MAT-0001'] });
assert.deepEqual(drawing.hardware, { references: [{ doorId: 'door-left', hardwareId: 'HW-0001' }] });
assert.equal(drawing.components[0].grainDirection, 'Vertical');
assert.deepEqual(drawing.components[0].edgeBanding, door.edgeBanding);
assert.deepEqual(drawing.components[0].processing, door.processing);
assert.deepEqual(drawing.views[0].dimensions, door.dimensions);
assert.equal(drawing.validation.valid, true);
assert.deepEqual(object.components, [door]);

assert.throws(() => service.generateDoor('project-2', 'object-1'), (error) => error.code === 'PROJECT_NOT_FOUND');
assert.throws(() => service.generateDoor('project-1', 'missing'), (error) => error.code === 'FURNITURE_OBJECT_NOT_FOUND');
const invalidDimensions = new ProductionDrawingGenerationService(projectService, { ...furnitureObjectEngine, getObject: () => structuredClone({ ...object, components: [{ ...door, dimensions: { width: null, height: 716 } }] }) });
assert.throws(() => invalidDimensions.generateDoor('project-1', 'object-1'), (error) => error.code === 'DOOR_DIMENSIONS_INVALID');
const noDoors = new ProductionDrawingGenerationService(projectService, { ...furnitureObjectEngine, getObject: () => structuredClone({ ...object, components: [] }) });
assert.throws(() => noDoors.generateDoor('project-1', 'object-1'), (error) => error.code === 'BLOCKED_BY_MISSING_OFFICIAL_RULE');
const unknownMaterial = new ProductionDrawingGenerationService(projectService, { ...furnitureObjectEngine, getObject: () => structuredClone({ ...object, components: [{ ...door, materialReferences: [{ materialId: 'UNKNOWN' }] }] }) });
assert.throws(() => unknownMaterial.generateDoor('project-1', 'object-1'), (error) => error.code === 'UNKNOWN_MATERIAL');
const unknownHardware = new ProductionDrawingGenerationService(projectService, { ...furnitureObjectEngine, getObject: () => structuredClone({ ...object, components: [{ ...door, hardwareReferences: [{ hardwareId: 'UNKNOWN' }] }] }) });
assert.throws(() => unknownHardware.generateDoor('project-1', 'object-1'), (error) => error.code === 'HARDWARE_REFERENCE_INVALID');
for (const code of ['MISSING_OFFICIAL_RULE', 'ENGINEERING_RULE_MISSING']) {
  const blocked = new ProductionDrawingGenerationService(projectService, { ...furnitureObjectEngine, validateObject: () => ({ isValid: false, errors: [{ code }] }) });
  assert.throws(() => blocked.generateDoor('project-1', 'object-1'), (error) => error.code === 'BLOCKED_BY_MISSING_OFFICIAL_RULE');
}
for (const code of ['UNVERIFIED_RULE', 'ENGINEERING_RULE_UNVERIFIED']) {
  const blocked = new ProductionDrawingGenerationService(projectService, { ...furnitureObjectEngine, validateObject: () => ({ isValid: false, errors: [{ code }] }) });
  assert.throws(() => blocked.generateDoor('project-1', 'object-1'), (error) => error.code === 'BLOCKED_BY_UNVERIFIED_RULE');
}

const source = fs.readFileSync(require.resolve('../src/services/production-drawing-generation-service'), 'utf8');
const serverSource = fs.readFileSync(require.resolve('../server'), 'utf8');
assert.match(source, /generateDoor/);
assert.match(source, /createProductionDrawingData/);
assert.match(serverSource, /drawingType === 'door'/);
assert.doesNotMatch(source, /width\s*[-+]\s*\d+|height\s*[-+]\s*\d+|depth\s*[-+]\s*\d+/);
assert.doesNotMatch(source, /Cutting List|Purchase List|CNC/);

console.log('Production Drawing Task 05 tests passed: door identification, dimensions, material, hardware, blocking, contract, immutability and scope.');
