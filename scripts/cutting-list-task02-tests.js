const assert = require('node:assert/strict');
const fs = require('node:fs');
const { generateCuttingList } = require('../src/services/cutting-list-generation-service');

const material = { id: 'MAT-001', name: 'Official White Board', thickness: 18 };
const project = { projectId: 'project-1', name: 'Cutting Test Project' };
const baseObject = {
  objectId: 'object-1', projectId: 'project-1', name: 'Approved Cabinet', objectType: 'Cabinet', productionStatus: 'Production Ready', lifecycleStatus: 'Active',
  dimensions: { width: 900, height: 720, depth: 560, unit: 'mm' },
  materialReferences: [{ materialId: 'MAT-001' }],
  components: [{ componentId: 'panel-1', name: 'Left Side Panel', componentType: 'Panel', dimensions: { width: 560, height: 720, thickness: 18, unit: 'mm' }, materialId: 'MAT-001', quantity: 2, grainDirection: 'vertical', edgeBanding: { front: '1mm' }, processing: [{ type: 'confirmed-processing' }] }],
};
const official = { getMaterialById: (id) => id === material.id ? material : null };
const projectService = { data: { official }, readProject: (projectId) => projectId === 'project-1' ? project : null };
const furnitureObjectEngine = {
  getObject: (projectId, objectId) => {
    if (projectId !== 'project-1' || objectId !== 'object-1') throw Object.assign(new Error('Not found'), { statusCode: 404 });
    return baseObject;
  },
  validateObject: () => ({ isValid: true, errors: [] }),
};

const original = JSON.parse(JSON.stringify(baseObject));
const result = generateCuttingList(projectService, furnitureObjectEngine, 'project-1', 'object-1');
assert.equal(result.contract, 'cutting-list-result');
assert.equal(result.project.projectId, 'project-1');
assert.equal(result.furnitureObject.objectId, 'object-1');
assert.equal(result.source.furnitureObjectId, 'object-1');
assert.equal(result.parts.length, 1);
assert.equal(result.parts[0].componentId, 'panel-1');
assert.equal(result.parts[0].parentObjectId, 'object-1');
assert.equal(result.parts[0].quantity, 2);
assert.deepEqual(result.parts[0].dimensions, baseObject.components[0].dimensions);
assert.equal(result.parts[0].material.id, 'MAT-001');
assert.equal(result.parts[0].grainDirection, 'vertical');
assert.deepEqual(result.parts[0].processing, [{ type: 'confirmed-processing' }]);
assert.equal(result.readOnly, true);
assert.equal(result.validation.valid, true);
assert.deepEqual(baseObject, original);

function expect(code, object = baseObject, services = { projectService, furnitureObjectEngine }) {
  assert.throws(() => generateCuttingList(services.projectService, services.furnitureObjectEngine, 'project-1', 'object-1'), (error) => error.code === code);
}
expect('PROJECT_NOT_FOUND', baseObject, { projectService: { ...projectService, readProject: () => null }, furnitureObjectEngine });
expect('FURNITURE_OBJECT_NOT_FOUND', baseObject, { projectService, furnitureObjectEngine: { ...furnitureObjectEngine, getObject: () => { throw Object.assign(new Error('Not found'), { statusCode: 404 }); } } });
expect('FURNITURE_OBJECT_NOT_APPROVED', { ...baseObject, productionStatus: 'Draft' }, { projectService, furnitureObjectEngine: { ...furnitureObjectEngine, getObject: () => ({ ...baseObject, productionStatus: 'Draft' }) } });
expect('FURNITURE_OBJECT_ARCHIVED', { ...baseObject, lifecycleStatus: 'Archived' }, { projectService, furnitureObjectEngine: { ...furnitureObjectEngine, getObject: () => ({ ...baseObject, lifecycleStatus: 'Archived' }) } });
expect('DIMENSIONS_INVALID', baseObject, { projectService, furnitureObjectEngine: { ...furnitureObjectEngine, getObject: () => ({ ...baseObject, dimensions: { ...baseObject.dimensions, width: 0 } }) } });
expect('PANEL_NOT_FOUND', baseObject, { projectService, furnitureObjectEngine: { ...furnitureObjectEngine, getObject: () => ({ ...baseObject, components: [] }) } });
expect('MATERIAL_REFERENCE_MISSING', baseObject, { projectService, furnitureObjectEngine: { ...furnitureObjectEngine, getObject: () => ({ ...baseObject, materialReferences: [], components: [{ ...baseObject.components[0], materialId: undefined, materialReferences: [] }] }) } });
expect('UNKNOWN_MATERIAL', baseObject, { projectService, furnitureObjectEngine: { ...furnitureObjectEngine, getObject: () => ({ ...baseObject, components: [{ ...baseObject.components[0], materialId: 'UNKNOWN' }] }) } });
expect('PANEL_DIMENSIONS_INVALID', baseObject, { projectService, furnitureObjectEngine: { ...furnitureObjectEngine, getObject: () => ({ ...baseObject, components: [{ ...baseObject.components[0], dimensions: { width: 0, height: 720 } }] }) } });
expect('QUANTITY_MISSING', baseObject, { projectService, furnitureObjectEngine: { ...furnitureObjectEngine, getObject: () => ({ ...baseObject, components: [{ ...baseObject.components[0], quantity: undefined, isPart: undefined, partId: undefined }] }) } });
expect('BLOCKED_BY_UNVERIFIED_RULE', baseObject, { projectService, furnitureObjectEngine: { ...furnitureObjectEngine, getObject: () => ({ ...baseObject, components: [{ ...baseObject.components[0], engineeringRule: { ruleId: 'rule-1', engineeringRecordId: 'record-1', verificationStatus: 'needs-verification' } }] }) } });
expect('BLOCKED_BY_MISSING_OFFICIAL_RULE', baseObject, { projectService, furnitureObjectEngine: { ...furnitureObjectEngine, getObject: () => ({ ...baseObject, components: [{ ...baseObject.components[0], engineeringRule: { verificationStatus: 'verified-official' } }] }) } });

const serviceSource = fs.readFileSync(require.resolve('../src/services/cutting-list-generation-service'), 'utf8');
const workspaceSource = fs.readFileSync(require.resolve('../src/components/CuttingListWorkspace'), 'utf8');
const serverSource = fs.readFileSync(require.resolve('../server'), 'utf8');
const clientSource = fs.readFileSync(require.resolve('../src/services/project-client'), 'utf8');
assert.doesNotMatch(serviceSource, /width\s*[-+]\s*\d+|height\s*[-+]\s*\d+|depth\s*[-+]\s*\d+|optimi[sz]|nesting|binPacking|waste|purchase|supplier|inventory|erp|cnc|g-code|toolpath|cad/i);
assert.doesNotMatch(workspaceSource, /optimizeCutting|calculateBoard|wasteCalculation|purchaseList|generateCnc|toolpath/i);
assert.doesNotMatch(workspaceSource, /width\s*[-+]\s*\d+|height\s*[-+]\s*\d+|depth\s*[-+]\s*\d+/i);
assert.match(serverSource, /cutting-list.*generate|generateCuttingList/s);
assert.match(clientSource, /generateCuttingList/);
assert.doesNotMatch(clientSource, /generateCuttingOptimization|generatePurchase|generateCnc/i);
console.log('Cutting List Task 02 tests passed: canonical component generation, validation, material/quantity/rule blocking, immutability, read-only contract and scope.');
