const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { ProjectService } = require('../src/services/project-service');
const { ProductionDrawingGenerationService } = require('../src/services/production-drawing-generation-service');
const { generateCuttingList } = require('../src/services/cutting-list-generation-service');
const { generatePurchaseList } = require('../src/services/purchase-list-generation-service');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'furniture-go-task01-'));

function expectCode(action, code) {
  assert.throws(action, (error) => error.code === code || error.message === code, `expected ${code}`);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

try {
  const projectService = new ProjectService(root);
  const projectA = projectService.createProject('Integration Project A', { ownerId: 'task01-owner' });
  const projectB = projectService.createProject('Integration Project B', { ownerId: 'task01-owner' });
  const projectAId = projectA.project.id;
  const projectBId = projectB.project.id;

  // The ProjectService is the canonical source for all project context reads.
  assert.equal(projectService.openProject(projectAId).project.name, 'Integration Project A');
  assert.equal(projectService.openProject(projectBId).project.name, 'Integration Project B');
  assert.equal(projectService.readProject('unknown-project'), null);
  expectCode(() => projectService.openProject('unknown-project'), 'Project not found');

  const objects = new Map([
    [projectAId, [{
      objectId: 'object-a', projectId: projectAId, name: 'Cabinet A', objectType: 'Base Cabinet',
      productionStatus: 'Production Ready', lifecycleStatus: 'Created',
      dimensions: { width: 800, height: 720, depth: 560, unit: 'mm' },
      components: [{ componentId: 'panel-a', componentType: 'Panel', name: 'Side', materialId: 'MAT-0001', quantity: 2,
        dimensions: { width: 720, height: 560, thickness: 18, unit: 'mm' } }],
      materialReferences: [{ materialId: 'MAT-0001', quantity: 2 }], hardwareReferences: [], accessoryReferences: [],
      validation: { isValid: true, errors: [] },
    }]],
    [projectBId, [{
      objectId: 'object-b', projectId: projectBId, name: 'Cabinet B', objectType: 'Base Cabinet',
      productionStatus: 'Production Ready', lifecycleStatus: 'Created',
      dimensions: { width: 900, height: 720, depth: 560, unit: 'mm' }, components: [],
      materialReferences: [{ materialId: 'MAT-0001', quantity: 1 }], hardwareReferences: [], accessoryReferences: [],
      validation: { isValid: true, errors: [] },
    }]],
  ]);

  const furnitureObjectEngine = {
    listObjects(projectId) { return clone(objects.get(projectId) || []); },
    getObject(projectId, objectId) {
      const object = (objects.get(projectId) || []).find((item) => item.objectId === objectId);
      if (!object) throw Object.assign(new Error('Furniture Object not found'), { statusCode: 404 });
      return clone(object);
    },
    validateObject(projectId, objectId) {
      return this.getObject(projectId, objectId).validation;
    },
  };

  const drawingService = new ProductionDrawingGenerationService(projectService, furnitureObjectEngine);
  const originalA = clone(projectService.openProject(projectAId));
  const drawingA = drawingService.generate(projectAId, 'object-a');
  const cuttingA = generateCuttingList(projectService, furnitureObjectEngine, projectAId, 'object-a');
  const purchaseA = generatePurchaseList(projectService, furnitureObjectEngine, projectAId, { objectId: 'object-a', cuttingListResult: cuttingA });

  for (const result of [drawingA, cuttingA, purchaseA]) {
    assert.equal(result.project.projectId, projectAId);
    assert.equal(result.project.name, 'Integration Project A');
    assert.equal(result.readOnly, true);
  }
  assert.equal(drawingA.source.projectId, projectAId);
  assert.equal(cuttingA.project.projectId, projectAId);
  assert.equal(purchaseA.source.projectId, projectAId);
  assert.deepEqual(purchaseA.source.furnitureObjectIds, ['object-a']);
  assert.equal(JSON.stringify(projectService.openProject(projectAId)), JSON.stringify(originalA), 'integration reads do not mutate Project data');

  // Project isolation: A never resolves B, and downstream contracts reject mismatches.
  assert.deepEqual(furnitureObjectEngine.listObjects(projectAId).map((item) => item.projectId), [projectAId]);
  assert.deepEqual(furnitureObjectEngine.listObjects(projectBId).map((item) => item.projectId), [projectBId]);
  expectCode(() => drawingService.generate(projectAId, 'object-b'), 'FURNITURE_OBJECT_NOT_FOUND');
  expectCode(() => generateCuttingList(projectService, furnitureObjectEngine, projectAId, 'object-b'), 'FURNITURE_OBJECT_NOT_FOUND');
  expectCode(() => generatePurchaseList(projectService, furnitureObjectEngine, projectAId, { objectId: 'object-b' }), 'FURNITURE_OBJECT_NOT_FOUND');
  expectCode(() => drawingService.generate('unknown-project', 'object-a'), 'PROJECT_NOT_FOUND');
  expectCode(() => generateCuttingList(projectService, furnitureObjectEngine, 'unknown-project', 'object-a'), 'PROJECT_NOT_FOUND');

  const mismatchedObjectEngine = { ...furnitureObjectEngine, getObject: () => ({ ...objects.get(projectBId)[0] }) };
  expectCode(() => generateCuttingList(projectService, mismatchedObjectEngine, projectAId, 'object-b'), 'PROJECT_OBJECT_MISMATCH');

  // Project navigation remains project-scoped and does not introduce a second navigation system.
  const dashboardSource = fs.readFileSync('src/components/ProjectDashboard.js', 'utf8');
  const shellSource = fs.readFileSync('src/components/AppShell.js', 'utf8');
  const clientSource = fs.readFileSync('src/services/project-client.js', 'utf8');
  for (const route of ['furniture-objects', 'cad', 'furniture-3d', 'production-drawing', 'cutting-list', 'purchase-list']) {
    assert.ok(dashboardSource.includes(`'${route}'`), `${route} is declared by the Project Dashboard`);
    assert.match(dashboardSource, /encodeURIComponent\(projectId\)/);
    assert.match(shellSource, new RegExp(`/${route}/`));
  }
  assert.match(clientSource, /\/api\/projects\/\$\{encodeURIComponent\(projectId\)\}/);
  assert.doesNotMatch(fs.readFileSync('src/components/ProjectDashboard.js', 'utf8'), /ProjectStore|WorkspaceProject|localStorage/i);
  assert.doesNotMatch(fs.readFileSync('src/components/AppShell.js', 'utf8'), /ProjectStore|WorkspaceProject|localStorage/i);

  // Offline and single-source audit: no cloud/remote project provider or duplicate project source.
  const sourceFiles = ['src/services/project-service.js', 'src/services/project-client.js', 'src/components/AppShell.js', 'src/components/ProjectDashboard.js'];
  const source = sourceFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
  assert.doesNotMatch(source, /ProjectStore|WorkspaceProject|duplicateProject|secondProjectSource/i);
  assert.doesNotMatch(source, /firebase|supabase|axios|fetch\(['"]https?:/i);

  console.log('Sprint 10 Task 01 tests passed: canonical Project source, context propagation, isolation, navigation, error recovery, immutability, single-source and offline audits.');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
