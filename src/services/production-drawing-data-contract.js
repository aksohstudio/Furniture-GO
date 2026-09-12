function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createProductionDrawingData(projectId, project, object, overrides = {}) {
  const dimensions = {
    width: object.dimensions.width,
    height: object.dimensions.height,
    depth: object.dimensions.depth,
    unit: object.dimensions.unit || null,
  };
  const source = {
    sourceType: 'approved-furniture-object',
    projectId,
    furnitureObjectId: object.objectId,
    productionFormulaResultIds: [],
  };

  const base = {
    schemaVersion: 2,
    contract: 'production-drawing-data',
    drawingId: `production-drawing:${object.objectId}`,
    objectId: object.objectId,
    drawingType: 'Automatic Furniture Object Drawing',
    project: {
      projectId,
      name: project?.project?.name || project?.name || null,
    },
    furnitureObject: {
      objectId: object.objectId,
      name: object.name || null,
      objectType: object.objectType || object.furnitureType || null,
      productionStatus: object.productionStatus,
    },
    source,
    dimensions,
    views: [
      { id: 'front', type: 'Elevation', label: 'Front / Elevation', dimensions: { width: dimensions.width, height: dimensions.height, unit: dimensions.unit } },
      { id: 'side', type: 'Profile', label: 'Side / Profile', dimensions: { width: dimensions.depth, height: dimensions.height, unit: dimensions.unit } },
      { id: 'top', type: 'Plan', label: 'Top / Plan', dimensions: { width: dimensions.width, depth: dimensions.depth, unit: dimensions.unit } },
    ],
    annotations: [],
    processing: [],
    validation: {
      status: 'approved-furniture-object',
      valid: true,
      issues: [],
    },
    status: 'Generated',
    readOnly: true,
    generatedAt: new Date().toISOString(),
  };

  return {
    ...base,
    ...overrides,
    source: { ...base.source, ...(overrides.source || {}) },
    validation: { ...base.validation, ...(overrides.validation || {}) },
  };
}

module.exports = { createProductionDrawingData, clone };
