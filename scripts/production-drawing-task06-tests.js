const assert = require('node:assert/strict');
const fs = require('node:fs');
const { ProductionDrawingGenerationService } = require('../src/services/production-drawing-generation-service');

const baseRules = [
  { id: 'ENG-RULE-BLUM-TANDEM-560H-INTERNAL-WIDTH', engineeringRecordId: 'ENG-HW-BLUM-TANDEM-560H', verificationStatus: 'verified-official', source: 'Blum TANDEM catalogue', sourceUrl: 'https://publications.blum.com/2024/catalogue/en/434/' },
  { id: 'ENG-RULE-BLUM-TANDEM-560H-DRAWER-LENGTH', engineeringRecordId: 'ENG-HW-BLUM-TANDEM-560H', verificationStatus: 'verified-official', source: 'Blum TANDEM planning data', sourceUrl: 'https://publications.blum.com/2024/catalogue/en/513/' },
  { id: 'ENG-RULE-BLUM-TANDEM-561F-INTERNAL-WIDTH', engineeringRecordId: 'ENG-HW-BLUM-TANDEM-561F', verificationStatus: 'verified-official', source: 'Blum TANDEM 561F catalogue', sourceUrl: 'https://publications.blum.com/2024/catalogue/en/434/' },
  { id: 'ENG-RULE-BLUM-TANDEM-561F-INNER-LENGTH', engineeringRecordId: 'ENG-HW-BLUM-TANDEM-561F', verificationStatus: 'verified-official', source: 'Blum TANDEM 561F planning data', sourceUrl: 'https://publications.blum.com/2024/catalogue/en/513/' },
];

const hardware = {
  'ENG-HW-BLUM-TANDEM-560H': { id: 'ENG-HW-BLUM-TANDEM-560H', model: 'TANDEM 560H', officialName: 'Blum TANDEM 560H' },
  'ENG-HW-BLUM-TANDEM-561F': { id: 'ENG-HW-BLUM-TANDEM-561F', model: 'TANDEM 561F', officialName: 'Blum TANDEM 561F' },
  'HW-UNSUPPORTED': { id: 'HW-UNSUPPORTED', model: 'Other Drawer Runner', officialName: 'Other Drawer Runner' },
};

function makeDrawer(id, hardwareId, dimensions = { width: 558, height: 140, depth: 490, unit: 'mm' }) {
  return {
    componentId: id,
    componentType: 'Drawer',
    name: 'Main Drawer',
    dimensions,
    materialReferences: [{ materialId: 'MAT-0001' }],
    hardwareReferences: [{ hardwareId }],
    grainDirection: 'Horizontal',
    edgeBanding: { edges: ['front'] },
    processing: [{ type: 'drawer-front-fixing', status: 'confirmed' }],
  };
}

function makeObject(drawer) {
  return {
    objectId: 'object-1', projectId: 'project-1', name: 'Base Cabinet', objectType: 'Base Cabinet',
    productionStatus: 'Production Ready', lifecycleStatus: 'Created',
    dimensions: { width: 900, height: 720, depth: 560, unit: 'mm' },
    materialReferences: [{ materialId: 'MAT-0001' }], components: [drawer],
  };
}

function createService(object, rules = baseRules, hardwareCatalog = hardware) {
  const projects = new Map([
    ['project-1', { project: { id: 'project-1', name: 'Drawer Test Project' } }],
    ['project-2', { project: { id: 'project-2', name: 'Other Project' } }],
  ]);
  const projectService = {
    readProject: (projectId) => projects.get(projectId) || null,
    data: { official: {
      getMaterialById: (id) => id === 'MAT-0001' ? { id, officialName: 'Confirmed Board' } : null,
      getHardwareById: (id) => hardwareCatalog[id] || null,
      listEngineeringRecords: () => rules.map((rule) => ({ ...rule, category: 'Drawer Installation Rules' })),
    } },
  };
  const furnitureObjectEngine = {
    getObject: (projectId, objectId) => {
      if (projectId !== 'project-1' || objectId !== 'object-1') throw Object.assign(new Error('Furniture Object not found'), { statusCode: 404 });
      return structuredClone(object);
    },
    validateObject: () => ({ isValid: true, errors: [] }),
  };
  return new ProductionDrawingGenerationService(projectService, furnitureObjectEngine);
}

const tandem560 = makeObject(makeDrawer('drawer-560', 'ENG-HW-BLUM-TANDEM-560H'));
const drawing560 = createService(tandem560).generateDrawer('project-1', 'object-1');
assert.equal(drawing560.contract, 'production-drawing-data');
assert.equal(drawing560.drawingType, 'Drawer Drawing');
assert.equal(drawing560.readOnly, true);
assert.deepEqual(drawing560.drawer.drawers.map((drawer) => drawer.drawerId), ['drawer-560']);
assert.equal(drawing560.drawer.drawers[0].parentObjectId, 'object-1');
assert.deepEqual(drawing560.drawer.drawers[0].dimensions, tandem560.components[0].dimensions);
assert.deepEqual(drawing560.material, { references: ['MAT-0001'] });
assert.deepEqual(drawing560.hardware, { references: [{ drawerId: 'drawer-560', hardwareId: 'ENG-HW-BLUM-TANDEM-560H' }] });
assert.equal(drawing560.formula.rules.length, 2);
assert.ok(drawing560.formula.rules.every((rule) => rule.verificationStatus === 'verified-official' && rule.sourceUrl));
assert.deepEqual(drawing560.drawer.drawers[0].grainDirection, 'Horizontal');
assert.deepEqual(drawing560.drawer.drawers[0].edgeBanding, tandem560.components[0].edgeBanding);
assert.deepEqual(drawing560.drawer.drawers[0].processing, tandem560.components[0].processing);
assert.deepEqual(drawing560.views[0].dimensions, tandem560.components[0].dimensions);
assert.deepEqual(tandem560.components[0].dimensions, { width: 558, height: 140, depth: 490, unit: 'mm' });

const tandem561 = makeObject(makeDrawer('drawer-561', 'ENG-HW-BLUM-TANDEM-561F', { width: 751, height: 160, depth: 512, unit: 'mm' }));
const drawing561 = createService(tandem561).generateDrawer('project-1', 'object-1', 'drawer-561');
assert.equal(drawing561.drawer.drawers[0].hardware.references[0], 'ENG-HW-BLUM-TANDEM-561F');
assert.deepEqual(drawing561.formula.rules.map((rule) => rule.ruleId), baseRules.slice(2).map((rule) => rule.id));

assert.throws(() => createService(tandem560).generateDrawer('project-2', 'object-1'), (error) => error.code === 'FURNITURE_OBJECT_NOT_FOUND');
assert.throws(() => createService(tandem560).generateDrawer('project-1', 'missing'), (error) => error.code === 'FURNITURE_OBJECT_NOT_FOUND');
assert.throws(() => createService(tandem560).generateDrawer('project-1', 'object-1', 'missing-drawer'), (error) => error.code === 'DRAWER_NOT_FOUND');
assert.throws(() => createService(makeObject({ ...makeDrawer('drawer-other', 'ENG-HW-BLUM-TANDEM-560H'), componentType: 'Panel' })).generateDrawer('project-1', 'object-1'), (error) => error.code === 'BLOCKED_BY_MISSING_OFFICIAL_RULE');
assert.throws(() => createService(makeObject(makeDrawer('drawer-bad', 'ENG-HW-BLUM-TANDEM-560H', { width: 0, height: 140, depth: 490 }))).generateDrawer('project-1', 'object-1'), (error) => error.code === 'DRAWER_DIMENSIONS_INVALID');
assert.throws(() => createService(makeObject({ ...makeDrawer('drawer-material', 'ENG-HW-BLUM-TANDEM-560H'), materialReferences: [{ materialId: 'UNKNOWN' }] })).generateDrawer('project-1', 'object-1'), (error) => error.code === 'UNKNOWN_MATERIAL');
assert.throws(() => createService(makeObject({ ...makeDrawer('drawer-no-material', 'ENG-HW-BLUM-TANDEM-560H'), materialReferences: [] })).generateDrawer('project-1', 'object-1'), (error) => error.code === 'DRAWER_MATERIAL_MISSING');
assert.throws(() => createService(makeObject({ ...makeDrawer('drawer-hardware', 'HW-MISSING'), hardwareReferences: [{ hardwareId: 'HW-MISSING' }] })).generateDrawer('project-1', 'object-1'), (error) => error.code === 'HARDWARE_REFERENCE_INVALID');
assert.throws(() => createService(makeObject(makeDrawer('drawer-unsupported', 'HW-UNSUPPORTED'))).generateDrawer('project-1', 'object-1'), (error) => error.code === 'UNSUPPORTED_CONFIGURATION');
assert.throws(() => createService(tandem560, baseRules.slice(0, 1)).generateDrawer('project-1', 'object-1'), (error) => error.code === 'BLOCKED_BY_MISSING_OFFICIAL_RULE');
assert.throws(() => createService(tandem560, baseRules.map((rule, index) => index === 1 ? { ...rule, verificationStatus: 'needs-verification' } : rule)).generateDrawer('project-1', 'object-1'), (error) => error.code === 'BLOCKED_BY_UNVERIFIED_RULE');

const source = fs.readFileSync(require.resolve('../src/services/production-drawing-generation-service'), 'utf8');
const clientSource = fs.readFileSync(require.resolve('../src/services/project-client'), 'utf8');
const serverSource = fs.readFileSync(require.resolve('../server'), 'utf8');
assert.match(source, /generateDrawer/);
assert.match(source, /createProductionDrawingData/);
assert.match(clientSource, /drawerId/);
assert.match(serverSource, /drawingType === 'drawer'/);
assert.doesNotMatch(source, /width\s*[-+]\s*\d+|height\s*[-+]\s*\d+|depth\s*[-+]\s*\d+/);
assert.doesNotMatch(source, /Cutting List|Purchase List|CNC/);

console.log('Production Drawing Task 06 tests passed: drawer identification, verified 560H/561F rules, references, blocking, contract, immutability and scope.');
