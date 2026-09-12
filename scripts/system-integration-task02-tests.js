const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { ProjectService } = require('../src/services/project-service');
const { RecognitionService } = require('../src/services/recognition-service');
const { EngineeringReviewService } = require('../src/services/engineering-review-service');
const { ProjectRecognitionService } = require('../src/services/project-recognition-service');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'furniture-go-task02-'));

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function expectCode(action, code) {
  assert.throws(action, (error) => error.code === code || error.message === code || error.message.includes(code), `expected ${code}`);
}

try {
  const projectService = new ProjectService(root);
  const projectA = projectService.createProject('Recognition Project A');
  const projectB = projectService.createProject('Recognition Project B');
  const projectAId = projectA.project.id;
  const projectBId = projectB.project.id;
  const recognitionService = new RecognitionService(projectService);
  const engineeringReviewService = new EngineeringReviewService(projectService);
  const projectRecognition = new ProjectRecognitionService({ projectService, recognitionService, engineeringReviewService });

  const beforeA = clone(projectService.openProject(projectAId));
  const beforeB = clone(projectService.openProject(projectBId));
  const resultA = projectRecognition.recognizeProject(projectAId, {
    records: [{
      id: 'recognition-record-a',
      recognitionSource: 'designer-pdf',
      recognitionConfidence: 0.98,
      geometry: { source: 'fixture-a' },
      dimensions: [{ name: 'width', value: 800, unit: 'mm' }],
      materialReferences: [],
      hardwareReferences: [],
    }],
  });

  assert.equal(resultA.projectId, projectAId);
  assert.equal(resultA.engineeringRecords.length, 1);
  assert.equal(resultA.engineeringRecords[0].projectId, projectAId);
  assert.equal(resultA.status, 'Engineering Records Generated');
  assert.equal(projectRecognition.getStatus(projectAId).projectId, projectAId);
  assert.equal(projectRecognition.getSummary(projectAId).projectId, projectAId);
  assert.equal(projectRecognition.listEngineeringRecords(projectBId).length, 0);
  assert.equal(projectRecognition.listEngineeringIssues(projectBId).length, 0);

  const dashboardA = projectRecognition.getDashboard(projectAId);
  assert.equal(dashboardA.projectId, projectAId);
  assert.equal(dashboardA.project.id, projectAId);
  assert.equal(dashboardA.project.name, 'Recognition Project A');
  assert.equal(dashboardA.recognition.engineeringRecordCount, 1);
  assert.deepEqual(projectRecognition.listEngineeringRecords(projectAId).map((record) => record.projectId), [projectAId]);
  assert.deepEqual(projectService.openProject(projectBId), beforeB, 'Project B is unchanged by Project A recognition');
  assert.notEqual(JSON.stringify(projectService.openProject(projectAId)), JSON.stringify(beforeA), 'Project A canonical recognition state is persisted');

  // Invalid and cross-project reads stop safely without fallback or fabricated results.
  expectCode(() => projectRecognition.getStatus('unknown-project'), 'Project not found');
  expectCode(() => projectRecognition.getSummary('unknown-project'), 'Project not found');
  expectCode(() => projectRecognition.recognizeProject('', {}), 'Project not found');
  assert.equal(projectRecognition.getEngineeringRecord(projectBId, 'recognition-record-a'), null);
  assert.deepEqual(projectRecognition.listIssuesByEngineeringRecord(projectBId, 'recognition-record-a'), []);

  const foreignRecord = clone(projectRecognition.listEngineeringRecords(projectAId)[0]);
  foreignRecord.projectId = projectBId;
  assert.notEqual(foreignRecord.projectId, projectAId);
  assert.equal(projectRecognition.listEngineeringRecords(projectAId).some((record) => record.projectId === projectBId), false);

  // Recognition hands off Engineering Records only; it does not create a second Furniture Object source.
  const recognitionSource = fs.readFileSync('src/services/recognition-service.js', 'utf8');
  const workspaceSource = fs.readFileSync('src/components/RecognitionWorkspace.js', 'utf8');
  const dashboardSource = fs.readFileSync('src/components/ProjectDashboard.js', 'utf8');
  const shellSource = fs.readFileSync('src/components/AppShell.js', 'utf8');
  const clientSource = fs.readFileSync('src/services/project-client.js', 'utf8');
  assert.match(recognitionSource, /this\.projectService\.openProject/);
  assert.match(recognitionSource, /saveFromRecognitionService/);
  assert.doesNotMatch(recognitionSource, /createFurnitureObject|FurnitureObjectStorageService|localStorage/i);
  assert.match(workspaceSource, /projectClient\.getProject\(\s*projectId/);
  assert.match(workspaceSource, /saveRecognitionReview/);
  assert.match(workspaceSource, /\/dashboard\/\$\{encodeURIComponent\(\s*projectId/);
  assert.match(dashboardSource, /\/recognition\/\$\{encodeURIComponent\(projectId\)/);
  assert.match(shellSource, /currentPath\.startsWith\(\s*'\/recognition\/'/);
  assert.match(clientSource, /recognition-summary/);
  assert.match(clientSource, /saveRecognitionReview/);
  assert.doesNotMatch([recognitionSource, workspaceSource].join('\n'), /RecognitionProjectStore|RecognitionProjectDatabase|duplicateRecognition|workspaceProjectJson/i);
  assert.doesNotMatch([recognitionSource, workspaceSource].join('\n'), /firebase|supabase|axios|fetch\(['"]https?:/i);

  console.log('Sprint 10 Task 02 tests passed: canonical Recognition source, Project context, isolation, result integrity, handoff boundary, navigation, error recovery, immutability, single-source and offline audits.');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
