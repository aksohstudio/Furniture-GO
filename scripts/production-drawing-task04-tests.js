const assert = require('node:assert/strict');
const fs = require('node:fs');
const { ProductionDrawingGenerationService } = require('../src/services/production-drawing-generation-service');

const panel = {
  componentId: 'panel-left', componentType: 'Left Side Panel', name: 'Left Side Panel',
  dimensions: { width: 560, height: 720, depth: 18, unit: 'mm' },
  materialReferences: [{ materialId: 'MAT-0001' }], grainDirection: 'Lengthwise',
  edgeBanding: { edges: ['front'] }, processing: [{ type: 'edge-banding', status: 'confirmed' }],
};
const object = {
  objectId: 'object-1', projectId: 'project-1', name: 'Base Cabinet', objectType: 'Base Cabinet',
  productionStatus: 'Production Ready', lifecycleStatus: 'Created',
  dimensions: { width: 900, height: 720, depth: 560, unit: 'mm' },
  materialReferences: [{ materialId: 'MAT-0001' }], components: [panel],
};
const projectService = {
  readProject: (projectId) => projectId === 'project-1' ? { project: { id: projectId, name: 'Panel Test Project' } } : null,
  data: { official: { getMaterialById: (id) => id === 'MAT-0001' ? { id, officialName: 'Confirmed Board' } : null } },
};
const furnitureObjectEngine = {
  getObject: (projectId, objectId) => {
    if (projectId !== 'project-1' || objectId !== 'object-1') throw Object.assign(new Error('Furniture Object not found'), { statusCode: 404 });
    return structuredClone(object);
  },
  validateObject: () => ({ isValid: true, errors: [] }),
};
const service = new ProductionDrawingGenerationService(projectService, furnitureObjectEngine);
const drawing = service.generatePanel('project-1', 'object-1');
assert.equal(drawing.contract, 'production-drawing-data');
assert.equal(drawing.drawingType, 'Panel Drawing');
assert.equal(drawing.readOnly, true);
assert.deepEqual(drawing.panel.panels.map((item) => item.panelId), ['panel-left']);
assert.equal(drawing.components[0].name, 'Left Side Panel');
assert.equal(drawing.components[0].parentObjectId, 'object-1');
assert.deepEqual(drawing.components[0].material, { references: ['MAT-0001'] });
assert.deepEqual(drawing.material, { references: ['MAT-0001'] });
assert.deepEqual(drawing.components[0].dimensions, panel.dimensions);
assert.equal(drawing.components[0].grainDirection, 'Lengthwise');
assert.deepEqual(drawing.components[0].edgeBanding, panel.edgeBanding);
assert.deepEqual(drawing.components[0].processing, panel.processing);
assert.deepEqual(drawing.views[0].dimensions, panel.dimensions);
assert.equal(drawing.validation.valid, true);
assert.equal(drawing.source.furnitureObjectId, 'object-1');
assert.deepEqual(object.components, [panel]);

assert.throws(() => service.generatePanel('project-2', 'object-1'), (error) => error.code === 'PROJECT_NOT_FOUND');
assert.throws(() => service.generatePanel('project-1', 'missing'), (error) => error.code === 'FURNITURE_OBJECT_NOT_FOUND');

const invalidDimensions = new ProductionDrawingGenerationService(projectService, { ...furnitureObjectEngine, getObject: () => structuredClone({ ...object, components: [{ ...panel, dimensions: { width: 560, height: null, depth: 18 } }] }) });
assert.throws(() => invalidDimensions.generatePanel('project-1', 'object-1'), (error) => error.code === 'PANEL_DIMENSIONS_INVALID');
const noPanels = new ProductionDrawingGenerationService(projectService, { ...furnitureObjectEngine, getObject: () => structuredClone({ ...object, components: [] }) });
assert.throws(() => noPanels.generatePanel('project-1', 'object-1'), (error) => error.code === 'BLOCKED_BY_MISSING_OFFICIAL_RULE');
const unknownMaterial = new ProductionDrawingGenerationService(projectService, { ...furnitureObjectEngine, getObject: () => structuredClone({ ...object, components: [{ ...panel, materialReferences: [{ materialId: 'UNKNOWN' }] }] }) });
assert.throws(() => unknownMaterial.generatePanel('project-1', 'object-1'), (error) => error.code === 'UNKNOWN_MATERIAL');
const missingMaterial = new ProductionDrawingGenerationService(projectService, { ...furnitureObjectEngine, getObject: () => structuredClone({ ...object, materialReferences: [], components: [{ ...panel, materialReferences: [] }] }) });
assert.throws(() => missingMaterial.generatePanel('project-1', 'object-1'), (error) => error.code === 'PANEL_MATERIAL_MISSING');
const blockedRule = new ProductionDrawingGenerationService(projectService, { ...furnitureObjectEngine, validateObject: () => ({ isValid: false, errors: [{ code: 'UNVERIFIED_RULE' }] }) });
assert.throws(() => blockedRule.generatePanel('project-1', 'object-1'), (error) => error.code === 'BLOCKED_BY_UNVERIFIED_RULE');

const source = fs.readFileSync(require.resolve('../src/services/production-drawing-generation-service'), 'utf8');
const serverSource = fs.readFileSync(require.resolve('../server'), 'utf8');
assert.match(source, /generatePanel/);
assert.match(source, /createProductionDrawingData/);
assert.match(serverSource, /drawingType === 'panel'/);
assert.doesNotMatch(source, /width\s*[-+]\s*\d+|height\s*[-+]\s*\d+|depth\s*[-+]\s*\d+/);
assert.doesNotMatch(source, /Cutting List|Purchase List|CNC/);

console.log('Production Drawing Task 04 tests passed: panel generation, identification, material, dimensions, blocking, contract, immutability and scope.');
