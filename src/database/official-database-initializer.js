const materialRecords = require('./data/official-materials.sample.json');
const hardwareRecords = require('./data/official-hardware.sample.json');
const engineeringRecords = require('./data/official-engineering-records.json');

const MATERIAL_ID = /^MAT-\d{4}$/;
const HARDWARE_ID = /^HW-\d{4}$/;

function validateRecords(records, requiredFields, idPattern, label) {
  const errors = [];
  if (!Array.isArray(records) || records.length === 0) return [`${label} records must be a non-empty array`];
  const ids = new Set();
  records.forEach((record, index) => {
    const prefix = `${label} record ${index}`;
    if (!record || typeof record !== 'object') { errors.push(`${prefix} must be an object`); return; }
    requiredFields.forEach((field) => {
      if (typeof record[field] !== 'string' || !record[field].trim()) errors.push(`${prefix} requires ${field}`);
    });
    if (typeof record.id === 'string' && !idPattern.test(record.id)) errors.push(`${prefix} has invalid id ${record.id}`);
    if (ids.has(record.id)) errors.push(`${prefix} has duplicate id ${record.id}`);
    ids.add(record.id);
    if (record.dataClassification !== 'sample/test') errors.push(`${prefix} must be marked sample/test`);
  });
  return errors;
}

function initializeOfficialDatabase() {
  const errors = [
    ...validateRecords(materialRecords, ['id', 'officialName', 'specification', 'thickness'], MATERIAL_ID, 'Material'),
    ...validateRecords(hardwareRecords, ['id', 'officialName', 'category', 'specification', 'unit'], HARDWARE_ID, 'Hardware'),
  ];
  const categories = new Set(hardwareRecords.map((record) => record.category));
  if (!categories.has('Door Hinge')) errors.push('Hardware sample data requires Door Hinge coverage');
  if (!categories.has('Drawer Slide')) errors.push('Hardware sample data requires Drawer Slide coverage');
  if (!Array.isArray(engineeringRecords) || engineeringRecords.length === 0) errors.push('Engineering records must be a non-empty array');
  const engineeringIds = new Set();
  engineeringRecords.forEach((record, index) => {
    if (!record || typeof record !== 'object' || typeof record.id !== 'string' || !record.id) errors.push(`Engineering record ${index} requires id`);
    if (record?.id && engineeringIds.has(record.id)) errors.push(`Engineering record ${index} has duplicate id ${record.id}`);
    if (record?.id) engineeringIds.add(record.id);
    if (typeof record?.officialName !== 'string' || !record.officialName.trim()) errors.push(`Engineering record ${index} requires officialName`);
    if (typeof record?.category !== 'string' || !record.category.trim()) errors.push(`Engineering record ${index} requires category`);
    if (!['verified-official', 'verified-secondary', 'needs-verification', 'deprecated'].includes(record?.verificationStatus)) errors.push(`Engineering record ${index} has invalid verificationStatus`);
  });
  if (errors.length) throw new Error(`Official Database validation failed: ${errors.join('; ')}`);
  return { materials: materialRecords, hardware: hardwareRecords, engineeringRecords };
}

module.exports = { initializeOfficialDatabase, validateRecords, MATERIAL_ID, HARDWARE_ID };
