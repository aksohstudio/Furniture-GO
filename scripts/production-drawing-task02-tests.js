const assert = require('node:assert/strict');
const { ProductionDrawingGenerationService } = require('../src/services/production-drawing-generation-service');

const sourceObject = {
  objectId: 'object-1',
  projectId: 'project-1',
  name: 'Base Cabinet',
  objectType: 'Base Cabinet',
  productionStatus: 'Production Ready',
  lifecycleStatus: 'Created',
  dimensions: { width: 900, height: 720, depth: 560, unit: 'mm' },
};

const projectService = {
  readProject: (projectId) => projectId === 'project-1' ? { project: { id: projectId, name: 'Test Project' } } : null,
};
const furnitureObjectEngine = {
  getObject: (projectId, objectId) => {
    if (projectId !== 'project-1' || objectId !== 'object-1') throw Object.assign(new Error('Furniture Object not found'), { statusCode: 404 });
    return structuredClone(sourceObject);
  },
  validateObject: () => ({ isValid: true, errors: [] }),
};

const service = new ProductionDrawingGenerationService(projectService, furnitureObjectEngine);
const drawing = service.generate('project-1', 'object-1');
assert.equal(drawing.contract, 'production-drawing-data');
assert.equal(drawing.schemaVersion, 2);
assert.equal(drawing.readOnly, true);
assert.deepEqual(drawing.project, { projectId: 'project-1', name: 'Test Project' });
assert.deepEqual(drawing.furnitureObject, {
  objectId: 'object-1',
  name: 'Base Cabinet',
  objectType: 'Base Cabinet',
  productionStatus: 'Production Ready',
});
assert.deepEqual(drawing.dimensions, sourceObject.dimensions);
assert.deepEqual(drawing.views.map((view) => view.type), ['Elevation', 'Profile', 'Plan']);
assert.deepEqual(drawing.views[0].dimensions, { width: 900, height: 720, unit: 'mm' });
assert.deepEqual(drawing.views[1].dimensions, { width: 560, height: 720, unit: 'mm' });
assert.deepEqual(drawing.views[2].dimensions, { width: 900, depth: 560, unit: 'mm' });
assert.equal(drawing.source.sourceType, 'approved-furniture-object');
assert.deepEqual(sourceObject.dimensions, { width: 900, height: 720, depth: 560, unit: 'mm' });

assert.throws(() => service.generate('project-2', 'object-1'), (error) => error.code === 'PROJECT_NOT_FOUND');
assert.throws(() => service.generate('project-1', 'missing-object'), (error) => error.code === 'FURNITURE_OBJECT_NOT_FOUND');

const invalidEngine = new ProductionDrawingGenerationService(projectService, {
  getObject: () => structuredClone({ ...sourceObject, dimensions: { width: null, height: 720, depth: 560 } }),
  validateObject: () => ({ isValid: true, errors: [] }),
});
assert.throws(() => invalidEngine.generate('project-1', 'object-1'), (error) => error.code === 'DIMENSIONS_INVALID');

const unapprovedEngine = new ProductionDrawingGenerationService(projectService, {
  getObject: () => structuredClone({ ...sourceObject, productionStatus: 'Object Generated' }),
  validateObject: () => ({ isValid: true, errors: [] }),
});
assert.throws(() => unapprovedEngine.generate('project-1', 'object-1'), (error) => error.code === 'FURNITURE_OBJECT_NOT_APPROVED');

console.log('Production Drawing Task 02 tests passed: contract, approved object source, views, isolation, invalid input, blocking and immutability.');
