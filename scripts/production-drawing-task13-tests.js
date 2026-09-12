const assert = require('node:assert/strict');
const fs = require('node:fs');
const {
  createRevision,
  listRevisions,
  getRevision,
  compareRevision,
  compareDrawings,
} = require('../src/services/production-drawing-revision-service');

function drawing(overrides = {}) {
  return {
    schemaVersion: 2, contract: 'production-drawing-data', drawingId: 'production-drawing:object-1', objectId: 'object-1', drawingType: 'Panel Drawing',
    project: { projectId: 'project-1', name: 'Revision Test Project' }, furnitureObject: { objectId: 'object-1', name: 'Cabinet' },
    source: { sourceType: 'approved-furniture-object', projectId: 'project-1', furnitureObjectId: 'object-1' },
    status: 'Generated', readOnly: true, validation: { valid: true, status: 'validated' },
    dimensions: { width: 900, height: 720, depth: 560, unit: 'mm' },
    views: [{ id: 'front' }, { id: 'side' }, { id: 'top' }], components: [{ id: 'panel-1' }],
    hardware: { references: [{ hardwareId: 'hardware-1' }] }, material: { references: [{ materialId: 'material-1' }] }, annotations: [], processing: [],
    ...overrides,
  };
}

(async () => {
  const firstDrawing = drawing({ drawingId: 'production-drawing:task13-object-1' });
  const firstOriginal = JSON.parse(JSON.stringify(firstDrawing));
  const first = createRevision(firstDrawing, 'project-1', 'object-1', 'Drawing regenerated');
  const secondDrawing = drawing({ drawingId: firstDrawing.drawingId, views: [...firstDrawing.views, { id: 'section' }], annotations: [{ id: 'annotation-1' }] });
  const second = createRevision(secondDrawing, 'project-1', 'object-1', 'Drawing view changed');

  assert.equal(first.revisionNumber, 'REV-001');
  assert.equal(second.revisionNumber, 'REV-002');
  assert.notEqual(first.revisionId, second.revisionId);
  assert.equal(first.drawingId, firstDrawing.drawingId);
  assert.equal(first.projectId, 'project-1');
  assert.equal(first.objectId, 'object-1');
  assert.equal(first.drawingType, 'Panel Drawing');
  assert.equal(first.previousRevisionId, null);
  assert.equal(second.previousRevisionId, first.revisionId);
  assert.equal(first.readOnly, true);
  assert.equal(second.comparison.comparisonAvailable, true);
  assert.ok(second.comparison.changes.some((change) => change.field === 'viewCount'));
  assert.ok(second.comparison.changes.some((change) => change.field === 'annotationCount'));
  assert.deepEqual(firstDrawing, firstOriginal);

  const history = listRevisions('project-1', 'object-1', firstDrawing.drawingId);
  assert.equal(history.length, 2);
  assert.equal(history[0].revisionNumber, 'REV-001');
  assert.equal(history[1].revisionNumber, 'REV-002');
  assert.equal(getRevision('project-1', 'object-1', firstDrawing.drawingId, first.revisionId).revisionId, first.revisionId);
  assert.equal(compareRevision('project-1', 'object-1', firstDrawing.drawingId, first.revisionId, secondDrawing).comparisonAvailable, true);
  assert.equal(compareDrawings(secondDrawing, null).status, 'COMPARISON_UNAVAILABLE');

  assert.throws(() => createRevision(null, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_MISSING');
  assert.throws(() => createRevision({ ...firstDrawing, contract: 'invalid' }, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_CONTRACT_INVALID');
  assert.throws(() => createRevision({ ...firstDrawing, project: { projectId: 'project-2' } }, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_PROJECT_MISMATCH');
  assert.throws(() => createRevision({ ...firstDrawing, objectId: 'object-2', furnitureObject: { objectId: 'object-2' } }, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_OBJECT_MISMATCH');
  assert.throws(() => createRevision({ ...firstDrawing, validation: { valid: false } }, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_VALIDATION_FAILED');
  assert.throws(() => createRevision({ ...firstDrawing, readOnly: false }, 'project-1', 'object-1'), (error) => error.code === 'READ_ONLY_REQUIRED');
  assert.throws(() => createRevision({ ...firstDrawing, status: 'Draft' }, 'project-1', 'object-1'), (error) => error.code === 'DRAWING_INVALID');
  assert.throws(() => getRevision('project-1', 'object-1', firstDrawing.drawingId, 'missing'), (error) => error.code === 'REVISION_NOT_FOUND');

  const revisionSource = fs.readFileSync(require.resolve('../src/services/production-drawing-revision-service'), 'utf8');
  const serverSource = fs.readFileSync(require.resolve('../server'), 'utf8');
  const clientSource = fs.readFileSync(require.resolve('../src/services/project-client'), 'utf8');
  const workspaceSource = fs.readFileSync(require.resolve('../src/components/ProductionDrawingWorkspace'), 'utf8');
  assert.doesNotMatch(revisionSource, /calculate|productionFormula|width\s*[-+]\s*\d+|height\s*[-+]\s*\d+|depth\s*[-+]\s*\d+|cuttingList|purchaseList|cnc|cad-edit/i);
  assert.match(serverSource, /production-drawings.*revisions|createRevision/);
  assert.match(clientSource, /createProductionDrawingRevision|listProductionDrawingRevisions|compareProductionDrawingRevision/);
  assert.match(workspaceSource, /Revision Management|data-production-create-revision|data-production-view-revisions/);
  assert.doesNotMatch(revisionSource, /writeFile|saveProject|updateProject|persist/i);
  console.log('Production Drawing Task 13 tests passed: revision creation, numbering, history, comparison, immutability, blocking and runtime safety.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
