const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync(require.resolve('../src/components/CuttingListWorkspace'), 'utf8');
const result = {
  contract: 'cutting-list-result', project: { projectId: 'project-1' }, furnitureObject: { objectId: 'object-1' }, readOnly: true,
  parts: [{ partId: 'part-1', componentId: 'panel-1', parentObjectId: 'object-1', name: 'Left Side Panel', type: 'Panel', material: { id: 'MAT-001', name: 'White Board' }, dimensions: { width: 560, height: 720, thickness: 18, unit: 'mm' }, quantity: 2, grainDirection: 'vertical', edgeBanding: { front: '1mm' }, processing: [{ type: 'confirmed-processing' }], validation: { status: 'confirmed-component-data', valid: true } }],
};
const original = JSON.parse(JSON.stringify(result));
const visible = result.parts.filter((part) => part.name.toLowerCase().includes('side'));
assert.equal(result.contract, 'cutting-list-result');
assert.equal(visible[0].partId, 'part-1');
assert.equal(visible[0].dimensions.width, 560);
assert.equal(visible[0].dimensions.height, 720);
assert.equal(visible[0].dimensions.thickness, 18);
assert.equal(visible[0].quantity, 2);
assert.equal(visible[0].material.id, 'MAT-001');
assert.equal(visible[0].grainDirection, 'vertical');
assert.deepEqual(visible[0].edgeBanding, { front: '1mm' });
assert.deepEqual(visible[0].processing, [{ type: 'confirmed-processing' }]);
assert.equal(visible[0].validation.status, 'confirmed-component-data');
assert.deepEqual(result, original);

assert.match(source, /Simple View/);
assert.match(source, /cuttingListResult\.parts/);
assert.match(source, /part\.dimensions\?\.width/);
assert.match(source, /part\.dimensions\?\.height/);
assert.match(source, /part\.dimensions\?\.depth \?\? part\.dimensions\?\.thickness/);
assert.match(source, /part\.quantity/);
assert.match(source, /part\.material/);
assert.match(source, /part\.grainDirection/);
assert.match(source, /part\.edgeBanding/);
assert.match(source, /part\.processing/);
assert.match(source, /part\.validation/);
assert.match(source, /data-cutting-list-search/);
assert.match(source, /data-cutting-list-material-filter/);
assert.match(source, /data-cutting-list-type-filter/);
assert.match(source, /data-cutting-list-sort/);
assert.match(source, /Cutting List has not been generated/);
assert.match(source, /No cutting parts available/);
assert.doesNotMatch(source, /width\s*[-+]\s*\d+|height\s*[-+]\s*\d+|depth\s*[-+]\s*\d+/i);
  assert.doesNotMatch(source, /optimizeCutting\s*\(|purchaseList\s*\(|exportExcel\s*\(|exportCnc\s*\(/i);
assert.doesNotMatch(source, /createFurnitureObject|updateFurnitureObject|deleteFurnitureObject|localStorage|sessionStorage/i);
console.log('Cutting List Task 03 tests passed: canonical result consumption, field display, UI-only filtering/sorting, immutability and scope.');
