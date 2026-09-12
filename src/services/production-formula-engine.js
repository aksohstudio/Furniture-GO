function fail(message, statusCode, code, details) {
  throw Object.assign(new Error(message), { statusCode, code, details });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function validDimension(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function validSourceUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateDeclaredConditions(rule, input) {
  const conditions = rule.conditions || {};
  const mismatches = [];
  for (const [field, expected] of Object.entries(conditions)) {
    if (field === 'scope' || field === 'runner' || (typeof expected === 'string' && expected.includes('input'))) continue;
    if (!(field in input)) {
      if (Array.isArray(expected) || (expected && typeof expected === 'object' && (Number.isFinite(expected.minimum) || Number.isFinite(expected.maximum))) || typeof expected === 'boolean') mismatches.push(field);
      continue;
    }
    const actual = input[field];
    if (Array.isArray(expected) && !expected.includes(actual)) mismatches.push(field);
    else if (expected && typeof expected === 'object' && Number.isFinite(expected.minimum) && Number.isFinite(expected.maximum)) {
      if (!Number.isFinite(actual) || actual < expected.minimum || actual > expected.maximum) mismatches.push(field);
    } else if (typeof expected === 'boolean' && actual !== expected) mismatches.push(field);
  }
  if (mismatches.length) fail('Input does not match the official rule conditions', 422, 'UNSUPPORTED_CONFIGURATION', { ruleId: rule.id, fields: mismatches });
}

function validateObjectForExecution(officialCatalog, projectId, object) {
  if (!object || object.projectId !== projectId) fail('Furniture Object does not belong to this Project', 404, 'PROJECT_ISOLATION');
  if (object.lifecycleStatus === 'Archived') fail('Archived Furniture Object cannot be calculated', 422, 'OBJECT_ARCHIVED');
  if (object.validation && object.validation.isValid !== true) fail('Furniture Object validation failed', 422, 'INVALID_OBJECT');
  const engineeringRecords = typeof officialCatalog.listEngineeringRecords === 'function'
    ? officialCatalog.listEngineeringRecords()
    : [];
  const engineeringById = new Map(engineeringRecords.map((record) => [record.id, record]));
  const materialIds = (object.materialReferences || []).map((reference) => reference?.materialId).filter(Boolean);
  const hardwareIds = (object.hardwareReferences || []).map((reference) => reference?.hardwareId).filter(Boolean);
  const officialMaterial = (id) => typeof officialCatalog.getMaterialById === 'function' && officialCatalog.getMaterialById(id);
  const officialHardware = (id) => typeof officialCatalog.getHardwareById === 'function' && officialCatalog.getHardwareById(id);
  const unknownMaterial = materialIds.find((id) => !officialMaterial(id) && engineeringById.get(id)?.category !== 'Material Engineering');
  if (unknownMaterial) fail('Material was not found in the Official Knowledge Base', 422, 'UNKNOWN_MATERIAL', { materialId: unknownMaterial });
  const unknownHardware = hardwareIds.find((id) => !officialHardware(id) && engineeringById.get(id)?.category !== 'Hardware Engineering');
  if (unknownHardware) fail('Hardware was not found in the Official Knowledge Base', 422, 'UNKNOWN_HARDWARE', { hardwareId: unknownHardware });
  return { materialIds, hardwareIds };
}

class ProductionFormulaEngine {
  constructor(officialCatalog) {
    this.officialCatalog = officialCatalog;
  }

  calculateFurnitureObject(projectId, object, ruleId) {
    const references = validateObjectForExecution(this.officialCatalog, projectId, object);
    const dimensions = object.dimensions || {};
    const invalidFields = ['width', 'height', 'depth'].filter((field) => !validDimension(dimensions[field]));
    if (invalidFields.length) fail('Furniture Object dimensions are invalid', 422, 'INVALID_CABINET_DIMENSIONS', { fields: invalidFields });
    const { materialIds, hardwareIds } = references;
    if (typeof ruleId !== 'string' || !ruleId.trim()) fail('Calculation rule is required', 422, 'MISSING_CALCULATION_RULE');
    const rule = this.officialCatalog.getEngineeringRecordById(ruleId);
    if (!rule) fail('Engineering rule was not found', 422, 'MISSING_ENGINEERING_RULE', { ruleId });
    if (rule.category !== 'Calculation Rules' && rule.ruleType !== 'dimension-transform') fail('Referenced record is not a calculation rule', 422, 'ENGINEERING_RULE_CONFLICT', { ruleId });
    if (rule.verificationStatus !== 'verified-official') fail('Engineering rule is not verified for production use', 422, 'MISSING_CALCULATION_RULE', { ruleId, verificationStatus: rule.verificationStatus });
    const parentRule = rule.engineeringRecordId ? this.officialCatalog.getEngineeringRecordById(rule.engineeringRecordId) : rule;
    if (!parentRule || parentRule.verificationStatus !== 'verified-official') fail('Engineering rule parent is not verified for production use', 422, 'ENGINEERING_RULE_CONFLICT', { ruleId, engineeringRecordId: rule.engineeringRecordId || rule.id });
    if (!validSourceUrl(rule.sourceUrl)) fail('Verified engineering rule has no valid source URL', 422, 'MISSING_SOURCE_URL', { ruleId });

    let finalDimensions;
    if (rule.operation === 'identity') {
      finalDimensions = { width: dimensions.width, height: dimensions.height, depth: dimensions.depth, unit: dimensions.unit || null };
    } else if (rule.operation === 'offset') {
      const offsets = rule.offsets || {};
      const declaredFields = Object.keys(offsets);
      const missing = declaredFields.filter((field) => !['width', 'height', 'depth'].includes(field) || !Number.isFinite(offsets[field]));
      if (missing.length) fail('Calculation rule is missing offsets', 422, 'MISSING_CALCULATION_RULE', { ruleId, fields: missing });
      finalDimensions = {
        width: dimensions.width - (offsets.width || 0),
        height: dimensions.height - (offsets.height || 0),
        depth: dimensions.depth - (offsets.depth || 0),
        unit: dimensions.unit || null,
      };
      if (['width', 'height', 'depth'].some((field) => !validDimension(finalDimensions[field]))) fail('Calculation rule produces invalid dimensions', 422, 'FORMULA_CONFLICT', { ruleId });
    } else {
      fail('Calculation operation is unsupported', 422, 'UNSUPPORTED_CALCULATION_RULE', { ruleId, operation: rule.operation });
    }

    return {
      schemaVersion: 1,
      resultId: `production-result:${projectId}:${object.objectId}:${rule.id}`,
      projectId,
      objectId: object.objectId,
      component: { componentType: object.objectType || null },
      material: { references: materialIds },
      hardware: { references: hardwareIds },
      status: 'Calculated',
      productionDimensions: finalDimensions,
      processing: [],
      formula: { ruleId: rule.id },
      rule: { engineeringRecordId: rule.engineeringRecordId || rule.id },
      source: { source: rule.source, sourceUrl: rule.sourceUrl || null },
      validation: { valid: true, issues: [] },
      trace: {
        ruleId: rule.id,
        engineeringRecordId: rule.engineeringRecordId || rule.id,
        source: rule.source,
        sourceUrl: rule.sourceUrl || null,
        verificationStatus: rule.verificationStatus,
        operation: rule.operation,
      },
    };
  }

  executeRule(projectId, object, ruleId, input = {}) {
    const references = validateObjectForExecution(this.officialCatalog, projectId, object);
    const rule = this.officialCatalog.getEngineeringRecordById(ruleId);
    if (!rule) fail('Engineering rule was not found', 422, 'MISSING_ENGINEERING_RULE', { ruleId });
    if (rule.verificationStatus !== 'verified-official') fail('Engineering rule is not verified for production use', 422, 'BLOCKED_BY_UNVERIFIED_RULE', { ruleId, verificationStatus: rule.verificationStatus });
    if (!validSourceUrl(rule.sourceUrl)) fail('Verified engineering rule has no valid source URL', 422, 'MISSING_SOURCE_URL', { ruleId });
    if (rule.engineeringRecordId && typeof this.officialCatalog.getEngineeringRecordById === 'function' && !this.officialCatalog.getEngineeringRecordById(rule.engineeringRecordId)) fail('Engineering rule parent record was not found', 422, 'ENGINEERING_RULE_CONFLICT', { ruleId, engineeringRecordId: rule.engineeringRecordId });
    validateDeclaredConditions(rule, input);
    let output;
    if (rule.operation === 'lookup') {
      if (Array.isArray(rule.lookupTable) && Array.isArray(rule.lookupInputs) && typeof rule.lookupOutput === 'string') {
        const match = rule.lookupTable.find((row) => rule.lookupInputs.every((field) => row[field] === input[field]));
        if (!match) fail('Input does not match the official rule conditions', 422, 'UNSUPPORTED_CONFIGURATION', { ruleId, fields: rule.lookupInputs });
        output = { [rule.lookupOutput]: match[rule.lookupOutput], unit: rule.parameters?.unit || 'mm' };
      } else {
      const candidates = rule.conditions?.frontThickness || [];
      const index = candidates.indexOf(input.frontThickness);
      if (index === -1) fail('Input does not match the official rule conditions', 422, 'UNSUPPORTED_CONFIGURATION', { ruleId, field: 'frontThickness' });
      output = { x: rule.result.x[index], unit: rule.parameters?.xUnit || 'mm' };
      }
    } else if (rule.operation === 'threshold') {
      const width = input.cabinetWidth;
      const powerFactor = input.powerFactor;
      const match = (rule.thresholds || []).find((threshold) => width >= threshold.minimumCabinetWidth && powerFactor >= threshold.minimumPowerFactor);
      if (!match) fail('Input is outside the official rule scope', 422, 'UNSUPPORTED_CONFIGURATION', { ruleId });
      output = { hingeCount: match.value, unit: 'pcs' };
    } else if (rule.operation === 'offset') {
      const offsets = rule.offsets || {};
      const fields = Object.keys(offsets);
      const source = input.dimensions || (fields.every((field) => Number.isFinite(input[field]))
        ? fields.reduce((values, field) => ({ ...values, [field]: input[field] }), {})
        : object.dimensions || {});
      if (!fields.length || fields.some((field) => !Number.isFinite(offsets[field]) || !Number.isFinite(source[field]))) fail('Calculation rule input is incomplete', 422, 'MISSING_CALCULATION_RULE', { ruleId });
      output = { ...source };
      fields.forEach((field) => { output[field] = source[field] - offsets[field]; });
      if (['width', 'height', 'depth'].some((field) => output[field] !== undefined && !validDimension(output[field]))) fail('Calculation rule produces invalid dimensions', 422, 'DIMENSION_CONFLICT', { ruleId });
    } else if (rule.operation === 'linear') {
      const coefficients = rule.coefficients || {};
      const inputValues = input || {};
      const missing = Object.keys(coefficients).filter((field) => !Number.isFinite(coefficients[field]) || !Number.isFinite(inputValues[field]));
      if (missing.length) fail('Calculation rule input is incomplete', 422, 'MISSING_CALCULATION_RULE', { ruleId, fields: missing });
      const outputKey = rule.outputKey;
      if (typeof outputKey !== 'string' || !outputKey.trim()) fail('Calculation rule output is missing', 422, 'MISSING_CALCULATION_RULE', { ruleId });
      const constant = Number.isFinite(rule.constant) ? rule.constant : 0;
      output = { [outputKey]: constant + Object.keys(coefficients).reduce((sum, field) => sum + (coefficients[field] * inputValues[field]), 0), unit: rule.parameters?.unit || 'mm' };
      if (!validDimension(output[outputKey])) fail('Calculation rule produces invalid dimensions', 422, 'DIMENSION_CONFLICT', { ruleId });
    } else if (rule.operation === 'specification') {
      output = clone(rule.result || {});
      if (!Object.keys(output).length) fail('Specification rule output is missing', 422, 'MISSING_CALCULATION_RULE', { ruleId });
    } else {
      fail('Calculation operation is unsupported', 422, 'UNSUPPORTED_CALCULATION_RULE', { ruleId, operation: rule.operation });
    }
    return {
      schemaVersion: 1,
      resultId: `production-result:${projectId}:${object.objectId}:${rule.id}`,
      projectId,
      objectId: object.objectId,
      component: { componentType: input.componentType || object.objectType || null },
      material: { references: input.materialIds || references.materialIds },
      hardware: { references: input.hardwareIds || references.hardwareIds },
      dimensions: { input: clone(input.dimensions || object.dimensions || {}), output: clone(output) },
      processing: input.processing || [],
      formula: { ruleId: rule.id, operation: rule.operation },
      rule: { engineeringRecordId: rule.engineeringRecordId || rule.id },
      source: { source: rule.source, sourceUrl: rule.sourceUrl || null },
      trace: { input: clone(input), ruleId: rule.id, engineeringRecordId: rule.engineeringRecordId || rule.id, operation: rule.operation, parameters: clone(rule.parameters || rule.offsets || rule.conditions || {}), output: clone(output), source: rule.source, sourceUrl: rule.sourceUrl || null, verificationStatus: rule.verificationStatus },
      validation: { valid: true, issues: [] },
      status: 'Calculated',
      productionResult: clone(output),
    };
  }
}

module.exports = { ProductionFormulaEngine };
