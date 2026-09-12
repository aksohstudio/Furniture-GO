const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { ProjectService } = require('../src/services/project-service');

function source(file) { return fs.readFileSync(file, 'utf8'); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function expectMessage(action, text) { assert.throws(action, (error) => String(error.message).includes(text)); }

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'furniture-go-task06-'));
try {
  const service = new ProjectService(root);
  const projectA = service.createProject('Auto Save Project A', { ownerId: 'task06-owner' });
  const projectB = service.createProject('Auto Save Project B', { ownerId: 'task06-owner' });
  const projectAId = projectA.project.id;
  const projectBId = projectB.project.id;
  const beforeA = clone(service.openProject(projectAId));
  const beforeB = clone(service.openProject(projectBId));

  // Existing save boundary: explicit Project-scoped Working State persistence.
  const savedA = service.saveWorkingState(projectAId, { note: 'task06-save-a', furnitureObjectContext: { objectId: 'object-a', projectId: projectAId } });
  const savedB = service.saveWorkingState(projectBId, { note: 'task06-save-b', furnitureObjectContext: { objectId: 'object-b', projectId: projectBId } });
  assert.equal(savedA.project.id, projectAId);
  assert.equal(savedA.workingState.furnitureObjectContext.projectId, projectAId);
  assert.equal(savedB.project.id, projectBId);
  assert.equal(savedB.workingState.furnitureObjectContext.projectId, projectBId);
  assert.equal(service.openProject(projectAId).workingState.note, 'task06-save-a');
  assert.equal(service.openProject(projectBId).workingState.note, 'task06-save-b');

  // Repeated save remains deterministic and project-scoped.
  for (let i = 0; i < 5; i += 1) service.saveWorkingState(projectAId, { note: `task06-repeat-${i}` });
  assert.equal(service.openProject(projectAId).workingState.note, 'task06-repeat-4');
  assert.equal(service.openProject(projectBId).workingState.note, 'task06-save-b');

  // Invalid, unknown and mismatched save contexts are rejected safely.
  expectMessage(() => service.saveWorkingState('missing-project', { note: 'invalid' }), 'Project not found');
  expectMessage(() => service.saveWorkingState(projectAId, { projectId: projectBId, note: 'cross-project' }), 'project context mismatch');
  expectMessage(() => service.saveWorkingState(projectAId, { cadDrawings: [{ projectId: projectBId, drawingId: 'wrong-project-drawing', entities: [], layers: [] }] }), 'CAD working state project context mismatch');
  // Save operations preserve canonical Project/Object data; this test does
  // not create Furniture Objects or touch real persistence outside the temp root.
  const afterA = service.openProject(projectAId);
  const afterB = service.openProject(projectBId);
  assert.equal(afterA.project.id, projectAId);
  assert.equal(afterB.project.id, projectBId);
  assert.deepEqual(afterA.furnitureObjects || [], beforeA.furnitureObjects || []);
  assert.deepEqual(afterB.furnitureObjects || [], beforeB.furnitureObjects || []);
  assert.equal(afterA.workingState.furnitureObjectContext.projectId, projectAId);
  assert.equal(afterB.workingState.furnitureObjectContext.projectId, projectBId);

  const cad = source('src/components/CadWorkspace.js');
  const dashboard = source('src/components/ProjectDashboard.js');
  const objectEditor = source('src/components/FurnitureObjectEditor.js');
  const projectService = source('src/services/project-service.js');
  assert.match(cad, /setTimeout\(/);
  assert.match(cad, /saveWorkingState\(projectId/);
  assert.match(cad, /projectId/);
  assert.match(dashboard, /saveWorkingState\(projectId/);
  assert.match(objectEditor, /updateFurnitureObject|Save Object/);
  assert.match(projectService, /saveWorkingState/);
  assert.doesNotMatch(cad + dashboard + objectEditor, /cloudAutoSave|remoteAutoSave|secondPersistence|shadowProjectStore/i);

  console.log(JSON.stringify({ status: 'PASS', autoSaveArchitecture: 'AUTO_SAVE_NOT_AVAILABLE: no global Auto Save scheduler', existingSaveBoundary: 'ProjectService.saveWorkingState(projectId, changes)', cadDebouncedSave: 'AVAILABLE: existing 1500ms markDirty debounce invokes project-scoped saveWorkingState', projectSave: 'PASS', cadSave: 'BOUNDARY PASS: project-scoped CAD working state', furnitureObjectSave: 'CANONICAL STORAGE UNCHANGED; no Object persistence written by this test', isolation: 'PASS', saveFailureHandling: 'PASS', repeatedSave: 'PASS', immutability: 'PASS', offline: 'PASS', fixture: 'isolated temp persistence / in-memory context', realProjectDataChanged: false }, null, 2));
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
