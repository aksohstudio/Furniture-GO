const assert = require('node:assert/strict');
const fs = require('node:fs');
const { OfficialCatalogRepository } = require('../src/database/official-catalog-repository');
const { ProductionFormulaEngine } = require('../src/services/production-formula-engine');

const catalog = new OfficialCatalogRepository();
const records = catalog.listEngineeringRecords();
assert.equal(records.length, 37);
assert.equal(catalog.findEngineeringRecords('Material Engineering').length, 5);
assert.equal(catalog.findEngineeringRecords('Hardware Engineering').length, 10);
assert.equal(catalog.findEngineeringRecords('Shelf Support Rules').length, 1);
assert.equal(catalog.findEngineeringRecords('Cabinet Connector Rules').length, 1);
assert.equal(catalog.findEngineeringRecords('Drawer Installation Rules').length, 2);
assert.equal(catalog.findEngineeringRecords('Door System Engineering').length, 5);
assert.equal(catalog.findEngineeringRecords('Hardware Engineering').filter((record) => record.model?.includes('AVENTOS')).length, 2);
assert.equal(catalog.getEngineeringRecordById('ENG-HW-BLUM-71B3550').verificationStatus, 'verified-official');

const object = {
  projectId: 'test-project',
  objectId: 'test-object',
  lifecycleStatus: 'Created',
  validation: { isValid: true },
  dimensions: { width: 600, height: 720, depth: 560, unit: 'mm' },
};
const engine = new ProductionFormulaEngine({
  getEngineeringRecordById: () => ({
    id: 'TEST-RULE',
    category: 'Calculation Rules',
    operation: 'offset',
    offsets: { width: 18, height: 18, depth: 18 },
    verificationStatus: 'verified-official',
    source: 'TEST FIXTURE (in-memory only)',
    sourceUrl: 'https://example.invalid/test-fixture-source',
  }),
});
const result = engine.calculateFurnitureObject('test-project', object, 'TEST-RULE');
assert.deepEqual(result.productionDimensions, { width: 582, height: 702, depth: 542, unit: 'mm' });
assert.equal(result.trace.engineeringRecordId, 'TEST-RULE');
const drawerResult = new ProductionFormulaEngine(catalog).calculateFurnitureObject('test-project', object, 'ENG-RULE-BLUM-TANDEM-560H-INTERNAL-WIDTH');
assert.deepEqual(drawerResult.productionDimensions, { width: 558, height: 720, depth: 560, unit: 'mm' });
const hingeEngine = new ProductionFormulaEngine(catalog);
const drawerLength = hingeEngine.executeRule('test-project', object, 'ENG-RULE-BLUM-TANDEM-560H-DRAWER-LENGTH', { length: 500, nominalLength: 500, drawerPanelThickness: 11, componentType: 'Drawer' });
assert.deepEqual(drawerLength.productionResult, { length: 490 });
const aventosX = hingeEngine.executeRule('test-project', object, 'ENG-RULE-BLUM-AVENTOS-HF-TOP-MAX-X', { cabinetHeight: 500, frontHeight: 500, frontThickness: 19, componentType: 'Lift-Up Door' });
assert.deepEqual(aventosX.productionResult, { maximumX: 513.5, unit: 'mm' });
const aventosY = hingeEngine.executeRule('test-project', object, 'ENG-RULE-BLUM-AVENTOS-HK-TOP-SPACE-Y', { frontHeight: 400, frontThickness: 19, topPanelThickness: 16, componentType: 'Lift-Up Door' });
assert.deepEqual(aventosY.productionResult, { spaceRequirementY: 119, unit: 'mm' });
assert.throws(() => new ProductionFormulaEngine(catalog).calculateFurnitureObject('test-project', object, 'ENG-RULE-PANEL-DESIGN-SIZE-PASSTHROUGH'), (error) => error.code === 'MISSING_CALCULATION_RULE');
assert.throws(() => engine.calculateFurnitureObject('other-project', object, 'TEST-RULE'), (error) => error.code === 'PROJECT_ISOLATION');
assert.equal(object.dimensions.width, 600);
const hingePosition = hingeEngine.executeRule('test-project', object, 'ENG-RULE-BLUM-CLIPTOP-110-FRONT-THICKNESS', { frontThickness: 19, componentType: 'Swing Door' });
assert.deepEqual(hingePosition.productionResult, { x: 34, unit: 'mm' });
assert.equal(hingePosition.trace.sourceUrl, 'https://publications.blum.com/2024/catalogue/en/64/');
const factoryOverlay = hingeEngine.executeRule('test-project', object, 'ENG-RULE-BLUM-CLIPTOP-BLUMOTION-FACTORY-OVERLAY', { application: 'overlay', factorySetting: true, componentType: 'Swing Door' });
assert.deepEqual(factoryOverlay.productionResult, { bossOverlay: 11, unit: 'mm' });
const factoryGap = hingeEngine.executeRule('test-project', object, 'ENG-RULE-BLUM-CLIPTOP-BLUMOTION-FACTORY-FRONT-GAP', { application: 'inset', factorySetting: true, componentType: 'Swing Door' });
assert.deepEqual(factoryGap.productionResult, { frontGap: 1.5, unit: 'mm' });
const minimumGap = hingeEngine.executeRule('test-project', object, 'ENG-RULE-BLUM-CLIPTOP-110-MINIMUM-GAP-TB3', { application: 'standard', factorySetting: true, frontThickness: 19, drillingDistance: 3, componentType: 'Swing Door' });
assert.deepEqual(minimumGap.productionResult, { minimumGap: 1, unit: 'mm' });
assert.throws(() => hingeEngine.executeRule('test-project', object, 'ENG-RULE-BLUM-CLIPTOP-110-MINIMUM-GAP-TB3', { application: 'standard', factorySetting: true, frontThickness: 19, drillingDistance: 5 }), (error) => error.code === 'UNSUPPORTED_CONFIGURATION');
assert.equal(catalog.getEngineeringRecordById('ENG-MAT-KRONOSPAN-MF-PB-12-38').verificationStatus, 'verified-official');
assert.equal(catalog.getEngineeringRecordById('ENG-MAT-SWISSKRONO-SWISSCDF-WB03').availableThickness.length, 6);
const hingeCount = hingeEngine.executeRule('test-project', object, 'ENG-RULE-BLUM-CLIPTOP-HKXS-HINGE-COUNT', { cabinetWidth: 1200, powerFactor: 2700 });
assert.deepEqual(hingeCount.productionResult, { hingeCount: 4, unit: 'pcs' });
const tandem561FWidth = hingeEngine.executeRule('test-project', object, 'ENG-RULE-BLUM-TANDEM-561F-INTERNAL-WIDTH', { dimensions: { width: 800 }, runner: 'TANDEM 561F', drawerPanelThickness: 19, componentType: 'Drawer' });
assert.deepEqual(tandem561FWidth.productionResult, { width: 751 });
const tandem561FLength = hingeEngine.executeRule('test-project', object, 'ENG-RULE-BLUM-TANDEM-561F-INNER-LENGTH', { nominalLength: 500, frontThickness: 19, runner: 'TANDEM 561F', drawerPanelThickness: 19, componentType: 'Drawer' });
assert.deepEqual(tandem561FLength.productionResult, { innerDrawerLength: 512, unit: 'mm' });
assert.throws(() => hingeEngine.executeRule('test-project', object, 'ENG-RULE-BLUM-CLIPTOP-110-FRONT-THICKNESS', { frontThickness: 17 }), (error) => error.code === 'UNSUPPORTED_CONFIGURATION');
assert.throws(() => hingeEngine.executeRule('test-project', object, 'ENG-DOOR-SWING-SYSTEM-SCHEMA', {}), (error) => error.code === 'BLOCKED_BY_UNVERIFIED_RULE');
const shelfRule = hingeEngine.executeRule('test-project', object, 'ENG-RULE-HETTICH-UNIVERSAL-D-5MM-HOLE', { shelfMaterial: 'chipboard', componentType: 'Adjustable Shelf' });
assert.deepEqual(shelfRule.productionResult, { drillingDiameter: 5, unit: 'mm', system: 'System 32' });
const minifixRule = hingeEngine.executeRule('test-project', object, 'ENG-RULE-HAFELE-MINIFIX-15-DRILL', { connectorSystem: 'Minifix 15', componentType: 'Cabinet Connector' });
assert.deepEqual(minifixRule.productionResult, { housingDrillDiameter: 15, unit: 'mm', minimumWoodThickness: 12, boltDrillDiameters: [5, 7, 8] });
const serverSource = fs.readFileSync(require.resolve('../server'), 'utf8');
assert.match(serverSource, /production-formula/);
assert.match(serverSource, /calculateFurnitureObject/);

const invalidSourceCatalog = {
  getEngineeringRecordById: (id) => id === 'INVALID-SOURCE-RULE' ? {
    id, category: 'Calculation Rules', operation: 'specification', result: { ok: true },
    verificationStatus: 'verified-official', source: 'Invalid source test', sourceUrl: 'not-a-url',
  } : null,
};
assert.throws(() => new ProductionFormulaEngine(invalidSourceCatalog).executeRule('test-project', object, 'INVALID-SOURCE-RULE'), (error) => error.code === 'MISSING_SOURCE_URL');

const orphanRuleCatalog = {
  getEngineeringRecordById: (id) => id === 'ORPHAN-RULE' ? {
    id, engineeringRecordId: 'MISSING-PARENT', category: 'Calculation Rules', operation: 'specification', result: { ok: true },
    verificationStatus: 'verified-official', source: 'Orphan rule test', sourceUrl: 'https://example.com/orphan-rule',
  } : null,
};
assert.throws(() => new ProductionFormulaEngine(orphanRuleCatalog).executeRule('test-project', object, 'ORPHAN-RULE'), (error) => error.code === 'ENGINEERING_RULE_CONFLICT');

assert.throws(() => hingeEngine.executeRule('test-project', { ...object, materialReferences: [{ materialId: 'UNKNOWN-MATERIAL' }] }, 'ENG-RULE-HAFELE-MINIFIX-15-DRILL', { connectorSystem: 'Minifix 15' }), (error) => error.code === 'UNKNOWN_MATERIAL');
assert.throws(() => hingeEngine.executeRule('test-project', { ...object, lifecycleStatus: 'Archived' }, 'ENG-RULE-HAFELE-MINIFIX-15-DRILL', { connectorSystem: 'Minifix 15' }), (error) => error.code === 'OBJECT_ARCHIVED');
assert.throws(() => hingeEngine.executeRule('test-project', { ...object, validation: { isValid: false } }, 'ENG-RULE-HAFELE-MINIFIX-15-DRILL', { connectorSystem: 'Minifix 15' }), (error) => error.code === 'INVALID_OBJECT');
assert.throws(() => hingeEngine.executeRule('test-project', object, 'ENG-RULE-BLUM-AVENTOS-HF-TOP-MAX-X', { frontHeight: 500, frontThickness: 19 }), (error) => error.code === 'UNSUPPORTED_CONFIGURATION');
console.log('Engineering knowledge tests passed: catalog, traceability, verified-rule execution, blocked unverified rule, isolation and immutability.');
