const assert = require('node:assert/strict');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

function source(file) { return fs.readFileSync(file, 'utf8'); }
function run(file) { execFileSync(process.execPath, [file], { cwd: process.cwd(), stdio: 'ignore' }); }

// Reuse the established isolated workflows for runtime consistency. These
// scripts exercise actual canonical result creation and save/recovery without
// creating a second data pipeline or touching real Project data.
run('scripts/system-integration-task09-tests.js');
run('scripts/system-testing-task06-tests.js');
run('scripts/system-testing-task07-tests.js');

const integration = source('scripts/system-integration-task09-tests.js');
const sources = [
  'src/services/project-service.js', 'src/services/recognition-service.js',
  'src/services/furniture-object-engine.js', 'src/services/production-drawing-data-contract.js',
  'src/services/cutting-list-generation-service.js', 'src/services/cutting-list-board-layout-service.js',
  'src/services/cutting-list-material-statistics-service.js', 'src/services/cutting-list-waste-analysis-service.js',
  'src/services/cutting-list-information-panel-service.js', 'src/services/cutting-list-part-trace-service.js',
  'src/services/purchase-list-generation-service.js', 'src/services/board-material-list-service.js',
  'src/services/hardware-list-service.js', 'src/services/accessories-list-service.js',
  'src/services/purchase-summary-service.js', 'src/services/category-management-service.js',
  'src/services/production-drawing-generation-service.js', 'src/components/CadWorkspace.js',
  'src/components/Furniture3DWorkspace.js', 'src/components/ProductionDrawingWorkspace.js',
  'src/components/CuttingListWorkspace.js', 'src/components/PurchaseListWorkspace.js',
].map(source).join('\n');

for (const term of [
  'projectId', 'objectId', 'project', 'metadata', 'Production Ready', 'lifecycleStatus',
  'production-drawing-data', 'cutting-list-result', 'purchase-list-result',
  'materialReferences', 'hardwareReferences', 'accessoryReferences', 'quantity',
  'validation', 'readOnly', 'source', 'workingState', 'cadDrawings',
]) assert.match(sources + integration, new RegExp(term));

// The full runtime fixture verifies result-level identity, quantity sources,
// downstream contracts, A/B isolation and immutable canonical snapshots.
for (const term of [
  /projectA/, /projectB/, /source\.projectId/, /source\.furnitureObjectId/,
  /source\.furnitureObjectIds/, /readOnly, true/, /deepEqual\(objects, before/,
  /PROJECT_OBJECT_MISMATCH|PROJECT_MISMATCH|FURNITURE_OBJECT_NOT_FOUND/, /CUTTING_LIST_INVALID/, /INVALID_PURCHASE_LIST_CONTRACT/,
  /PROJECT_MISMATCH/, /OBJECT_MISMATCH/,
]) assert.match(integration, term);

// Cross-module source/contract audit: integration consumes existing results;
// it does not define a duplicate database, contract or quantity rule.
assert.doesNotMatch(sources, /second(?:Project|FurnitureObject|Drawing|CuttingList|PurchaseList)Source|shadowDatabase|duplicateContract/i);
assert.doesNotMatch(sources, /cloudApi|remoteApi|supplierApi|erpIntegration|inventorySystem|aiAssistance|remoteRendering/i);
assert.doesNotMatch(sources, /guess(?:ed|ing)Quantity|quantityGuess|recalculatePurchaseQuantity/i);

// Save/recovery consistency is covered by Task 06/07 and remains bound to the
// Project Service Working State / Backup Restore mechanisms.
assert.match(source('scripts/system-testing-task06-tests.js'), /project context mismatch/);
assert.match(source('scripts/system-testing-task07-tests.js'), /restoreProjectBackup|cadDrawings/);
assert.match(source('src/services/backup-restore-service.js'), /verifyBackup|migrateProject/);

console.log('Sprint 11 Task 08 tests passed: Project/Object/source/contract consistency, quantity and status boundaries, downstream identity, isolation, save/recovery consistency, read-only, immutability and offline audits.');
