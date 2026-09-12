const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { ProjectService } = require('../src/services/project-service');
const { FurnitureObjectEngine } = require('../src/services/furniture-object-engine');
const { createFurnitureObjectModel } = require('../src/models/furniture-object-model');
const { ProductionDrawingGenerationService } = require('../src/services/production-drawing-generation-service');
const { generateCuttingList } = require('../src/services/cutting-list-generation-service');
const { generatePurchaseList } = require('../src/services/purchase-list-generation-service');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'furniture-go-task04-'));

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function expectCode(action, code) {
  assert.throws(action, (error) => error.code === code || error.message === code || error.message.includes(code), `expected ${code}`);
}

try {
  const projectService = new ProjectService(root);
  const projectA = projectService.createProject('Object Project A');
  const projectB = projectService.createProject('Object Project B');
  const projectAId = projectA.project.id;
  const projectBId = projectB.project.id;
  const floorA = projectService.addEntity(projectAId, 'Floor', 'Ground');
  const roomA = projectService.addEntity(projectAId, 'Room', 'Kitchen', floorA.id);
  const floorB = projectService.addEntity(projectBId, 'Floor', 'Ground');
  const roomB = projectService.addEntity(projectBId, 'Room', 'Kitchen', floorB.id);

  // Confirmed Engineering Records are the existing approved creation prerequisite.
  for (const [id, floorId, roomId] of [['record-a', floorA.id, roomA.id], ['record-b', floorB.id, roomB.id]]) {
    const project = projectService.openProject(id === 'record-a' ? projectAId : projectBId);
    project.engineeringRecords.push({ id, version: 1, projectId: project.project.id, floorId, roomId, status: 'Confirmed', geometry: {}, dimensions: [], features: [], materialReferences: [], hardwareReferences: [], designerNotes: [], relatedDrawings: [], recognitionConfidence: 1, recognitionSource: 'task04-fixture', recognitionMetadata: {}, generatedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), confirmedAt: new Date().toISOString(), confirmedBy: 'task04' });
    projectService.writeProject(project);
  }

  const engine = new FurnitureObjectEngine(projectService);
  const objectA = engine.createObject(projectAId, {
    objectId: 'object-a', floorId: floorA.id, roomId: roomA.id, objectType: 'Base Cabinet', name: 'Cabinet A',
    status: 'Production Ready', confirmedEngineeringRecord: { id: 'record-a', status: 'Confirmed' },
    dimensions: { width: 800, height: 720, depth: 560, unit: 'mm' },
    materialReferences: [{ materialId: 'MAT-0001', quantity: 2 }], hardwareReferences: [], relationshipReferences: [],
    validation: { isValid: true, errors: [] },
  });
  const objectB = engine.createObject(projectBId, {
    objectId: 'object-b', floorId: floorB.id, roomId: roomB.id, objectType: 'Base Cabinet', name: 'Cabinet B',
    status: 'Production Ready', confirmedEngineeringRecord: { id: 'record-b', status: 'Confirmed' },
    dimensions: { width: 900, height: 720, depth: 560, unit: 'mm' },
    materialReferences: [{ materialId: 'MAT-0001', quantity: 1 }], hardwareReferences: [], relationshipReferences: [],
    validation: { isValid: true, errors: [] },
  });
  const canonicalA = createFurnitureObjectModel({ ...objectA, components: [{ componentId: 'panel-a', componentType: 'Panel', name: 'Side', materialId: 'MAT-0001', quantity: 2, dimensions: { width: 720, height: 560, thickness: 18, unit: 'mm' } }] });
  engine.storage.update(projectAId, 'object-a', canonicalA);

  assert.equal(objectA.projectId, projectAId);
  assert.equal(objectA.objectId, 'object-a');
  assert.equal(objectB.projectId, projectBId);
  assert.deepEqual(engine.listObjects(projectAId).map((item) => item.objectId), ['object-a']);
  assert.deepEqual(engine.listObjects(projectBId).map((item) => item.objectId), ['object-b']);
  expectCode(() => engine.getObject(projectAId, 'object-b'), 'Furniture Object not found');

  // CAD is a Project document; the Object Engine stores only the canonical reference.
  const projectWithCad = projectService.openProject(projectAId);
  projectWithCad.projectDocuments.documents.push({ id: 'drawing-a', projectId: projectAId, fileName: 'a.dxf', documentType: 'DXF', sourceFormat: 'DXF', entities: [{ id: 'entity-a', type: 'LINE' }], layers: [] });
  projectService.writeProject(projectWithCad);
  const linkedA = engine.syncCadReference(projectAId, 'object-a', { drawingId: 'drawing-a', entityIds: ['entity-a'] });
  assert.equal(linkedA.cadReferences[0].projectId, projectAId);
  assert.equal(linkedA.cadReferences[0].drawingId, 'drawing-a');
  expectCode(() => engine.syncCadReference(projectAId, 'object-a', { drawingId: 'drawing-b', entityIds: [] }), 'CAD drawing was not found');
  expectCode(() => engine.syncCadReference(projectBId, 'object-b', { drawingId: 'drawing-a', entityIds: [] }), 'CAD drawing was not found');

  const drawingService = new ProductionDrawingGenerationService(projectService, engine);
  const drawing = drawingService.generate(projectAId, 'object-a');
  const cuttingList = generateCuttingList(projectService, engine, projectAId, 'object-a');
  const purchaseList = generatePurchaseList(projectService, engine, projectAId, { objectId: 'object-a', cuttingListResult: cuttingList });
  for (const result of [drawing, cuttingList, purchaseList]) {
    assert.equal(result.project.projectId, projectAId);
    assert.equal(result.project.name, 'Object Project A');
  }
  assert.equal(drawing.source.projectId, projectAId);
  assert.equal(drawing.source.furnitureObjectId, 'object-a');
  assert.equal(cuttingList.furnitureObject.objectId, 'object-a');
  assert.equal(purchaseList.source.projectId, projectAId);
  assert.deepEqual(purchaseList.source.furnitureObjectIds, ['object-a']);
  assert.equal(drawing.readOnly, true);
  assert.equal(cuttingList.readOnly, true);
  assert.equal(purchaseList.readOnly, true);

  const objectSnapshot = clone(engine.getObject(projectAId, 'object-a'));
  JSON.stringify(drawing); JSON.stringify(cuttingList); JSON.stringify(purchaseList);
  assert.deepEqual(engine.getObject(projectAId, 'object-a'), objectSnapshot, 'downstream consumers do not mutate the canonical Object');

  // Missing, unknown, mismatched, invalid and unapproved object paths are blocked safely.
  expectCode(() => engine.getObject('unknown-project', 'object-a'), 'Project not found');
  expectCode(() => engine.getObject(projectAId, 'unknown-object'), 'Furniture Object not found');
  expectCode(() => drawingService.generate('unknown-project', 'object-a'), 'PROJECT_NOT_FOUND');
  expectCode(() => drawingService.generate(projectAId, 'object-b'), 'FURNITURE_OBJECT_NOT_FOUND');
  expectCode(() => generateCuttingList(projectService, engine, projectAId, 'object-b'), 'FURNITURE_OBJECT_NOT_FOUND');
  expectCode(() => generatePurchaseList(projectService, engine, projectAId, { objectId: 'object-b' }), 'FURNITURE_OBJECT_NOT_FOUND');
  engine.updateObject(projectAId, 'object-a', { status: 'Validation Required' });
  expectCode(() => drawingService.generate(projectAId, 'object-a'), 'FURNITURE_OBJECT_NOT_APPROVED');
  engine.updateObject(projectAId, 'object-a', { status: 'Production Ready' });
  expectCode(() => generateCuttingList(projectService, { ...engine, getObject: () => ({ ...objectA, projectId: projectBId }) }, projectAId, 'object-a'), 'PROJECT_OBJECT_MISMATCH');

  // Source audits: no duplicate Object store and downstream modules consume via projectId/objectId.
  const engineSource = fs.readFileSync('src/services/furniture-object-engine.js', 'utf8');
  const storageSource = fs.readFileSync('src/services/furniture-object-storage-service.js', 'utf8');
  const downstream = ['src/services/production-drawing-generation-service.js', 'src/services/cutting-list-generation-service.js', 'src/services/purchase-list-generation-service.js', 'src/components/Furniture3DWorkspace.js', 'src/components/CadWorkspace.js'].map((file) => fs.readFileSync(file, 'utf8')).join('\n');
  const dashboard = fs.readFileSync('src/components/ProjectDashboard.js', 'utf8');
  assert.match(engineSource, /FurnitureObjectStorageService/);
  assert.match(storageSource, /projectId/);
  assert.match(downstream, /projectId/);
  assert.match(downstream, /objectId/);
  assert.doesNotMatch([engineSource, storageSource, downstream].join('\n'), /FurnitureObjectStore|ObjectDatabase|duplicateFurnitureObject|workspaceObjectJson/i);
  assert.doesNotMatch(downstream, /createFurnitureObject|new FurnitureObjectEngine/);
  assert.match(dashboard, /\/furniture-objects\/\$\{encodeURIComponent\(projectId\)/);
  assert.match(dashboard, /\/cad\/\$\{encodeURIComponent\(projectId\)/);
  assert.match(fs.readFileSync('src/components/Furniture3DWorkspace.js', 'utf8'), /getFurnitureObjects|listFurnitureObjects|projectId/);
  assert.doesNotMatch([engineSource, downstream].join('\n'), /firebase|supabase|cloudObject|remoteFurnitureObject|onlineAI|remoteObjectService|cloudObjectStore/i);

  console.log('Sprint 10 Task 04 tests passed: canonical Furniture Object source, Project/Object isolation, CAD/3D/downstream context, read-only consumers, immutability, error safety, single-source and offline audits.');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
