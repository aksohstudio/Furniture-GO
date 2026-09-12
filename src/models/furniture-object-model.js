const OBJECT_TYPES = Object.freeze([
  'Base Cabinet', 'Wall Cabinet', 'Tall Cabinet', 'Wardrobe',
  'TV Cabinet', 'Shoe Cabinet', 'Vanity Cabinet', 'Display Cabinet',
  'Pantry Cabinet', 'Custom Cabinet',
]);

const PRODUCTION_STATUSES = Object.freeze([
  'Recognized', 'Engineering Matched', 'Object Generated',
  'Validation Required', 'Production Ready', 'User Confirmation Required',
]);

const LIFECYCLE_STATUSES = Object.freeze([
  'Created', 'Modified', 'Archived',
]);

const MODEL_VERSION = 1;

function clone(value) {
  if (value == null) return value;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function defaultDimensions() {
  return {
    width: null,
    height: null,
    depth: null,
    thickness: null,
    unit: null,
  };
}

function normalizeReferenceList(value) {
  return Array.isArray(value) ? value.map((item) => clone(item)) : [];
}

function normalizeFurnitureObject(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const objectId = source.objectId || source.id || null;
  const objectType = source.objectType || source.furnitureType || null;
  const dimensions = source.dimensions && typeof source.dimensions === 'object' && !Array.isArray(source.dimensions)
    ? { ...defaultDimensions(), ...clone(source.dimensions) }
    : defaultDimensions();

  const materialIds = Array.isArray(source.materialIds) ? [...source.materialIds] : [];
  const materialReferences = Array.isArray(source.materialReferences)
    ? normalizeReferenceList(source.materialReferences)
    : materialIds.map((materialId) => ({ materialId }));
  const hardwareIds = Array.isArray(source.hardwareIds) ? [...source.hardwareIds] : [];
  const hardwareReferences = Array.isArray(source.hardwareReferences)
    ? normalizeReferenceList(source.hardwareReferences)
    : hardwareIds.map((hardwareId) => ({ hardwareId }));

  return {
    schemaVersion: Number.isInteger(source.schemaVersion) ? source.schemaVersion : MODEL_VERSION,
    id: objectId,
    objectId,
    projectId: source.projectId || null,
    name: source.name || null,
    objectType,
    furnitureType: objectType,
    lifecycleStatus: source.lifecycleStatus || 'Created',
    productionStatus: source.productionStatus || null,
    createdAt: source.createdAt || null,
    updatedAt: source.updatedAt || null,
    engineeringRecordId: source.engineeringRecordId || null,
    designerCabinetId: source.designerCabinetId || null,
    factoryReferenceId: source.factoryReferenceId || null,
    dimensions,
    materialReferences,
    hardwareReferences,
    components: normalizeReferenceList(source.components),
    relationshipReferences: normalizeReferenceList(source.relationshipReferences),
    cadReferences: normalizeReferenceList(source.cadReferences),
    formulaReferences: normalizeReferenceList(source.formulaReferences),
    engineeringRuleReferences: normalizeReferenceList(source.engineeringRuleReferences),
    materialIds: materialIds.length ? materialIds : materialReferences.map((reference) => reference.materialId),
    hardwareIds: hardwareIds.length ? hardwareIds : hardwareReferences.map((reference) => reference.hardwareId),
    validation: source.validation && typeof source.validation === 'object'
      ? clone(source.validation)
      : { isValid: false, errors: [] },
    floorId: source.floorId || null,
    roomId: source.roomId || null,
    deletedAt: source.deletedAt || null,
  };
}

function validatePositiveDimension(value, field, errors) {
  if (value === null) return;
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    errors.push(`${field} must be a finite number greater than zero or null`);
  }
}

function validateReferenceList(value, field, idField, errors) {
  if (!Array.isArray(value)) {
    errors.push(`${field} must be an array`);
    return;
  }
  value.forEach((reference, index) => {
    if (!reference || typeof reference !== 'object' || Array.isArray(reference) || typeof reference[idField] !== 'string' || !reference[idField].trim()) {
      errors.push(`${field}[${index}].${idField} is required`);
    }
  });
}

function validateFurnitureObjectShape(value) {
  const object = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const errors = [];
  if (typeof object.objectId !== 'string' || !object.objectId.trim()) errors.push('objectId is required');
  if (typeof object.projectId !== 'string' || !object.projectId.trim()) errors.push('projectId is required');
  if (!OBJECT_TYPES.includes(object.objectType)) errors.push('objectType is invalid');
  if (typeof object.name !== 'string' || !object.name.trim()) errors.push('name is required');
  if (!LIFECYCLE_STATUSES.includes(object.lifecycleStatus)) errors.push('lifecycleStatus is invalid');
  if (object.productionStatus !== null && !PRODUCTION_STATUSES.includes(object.productionStatus)) errors.push('productionStatus is invalid');
  if (!object.dimensions || typeof object.dimensions !== 'object' || Array.isArray(object.dimensions)) {
    errors.push('dimensions must be an object');
  } else {
    ['width', 'height', 'depth', 'thickness'].forEach((field) => validatePositiveDimension(object.dimensions[field], `dimensions.${field}`, errors));
    if (object.dimensions.unit !== null && typeof object.dimensions.unit !== 'string') errors.push('dimensions.unit must be a string or null');
  }
  validateReferenceList(object.materialReferences, 'materialReferences', 'materialId', errors);
  validateReferenceList(object.hardwareReferences, 'hardwareReferences', 'hardwareId', errors);
  validateReferenceList(object.cadReferences, 'cadReferences', 'drawingId', errors);
  if (!Array.isArray(object.relationshipReferences)) errors.push('relationshipReferences must be an array');
  else object.relationshipReferences.forEach((reference, index) => {
    if (!reference || typeof reference !== 'object' || Array.isArray(reference)) {
      errors.push(`relationshipReferences[${index}] must be an object`);
    } else if (reference.parentObjectId !== undefined && reference.parentObjectId !== null && (typeof reference.parentObjectId !== 'string' || !reference.parentObjectId.trim())) {
      errors.push(`relationshipReferences[${index}].parentObjectId is invalid`);
    }
  });
  if (!Array.isArray(object.formulaReferences)) errors.push('formulaReferences must be an array');
  else object.formulaReferences.forEach((reference, index) => {
    if (!reference || typeof reference !== 'object' || Array.isArray(reference) || typeof reference.formulaId !== 'string' || !reference.formulaId.trim()) {
      errors.push(`formulaReferences[${index}].formulaId is required`);
    }
  });
  return errors;
}

function createFurnitureObjectModel(value) {
  const normalized = normalizeFurnitureObject(value);
  const errors = validateFurnitureObjectShape(normalized);
  if (errors.length) {
    throw new Error(`Furniture Object model validation failed: ${errors.join(', ')}`);
  }
  return clone(normalized);
}

module.exports = {
  MODEL_VERSION,
  OBJECT_TYPES,
  PRODUCTION_STATUSES,
  LIFECYCLE_STATUSES,
  cloneFurnitureObject: clone,
  normalizeFurnitureObject,
  validateFurnitureObjectShape,
  createFurnitureObjectModel,
};
