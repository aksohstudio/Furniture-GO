const acadPromise = import('@node-projects/acad-ts');

function point(value) {
  if (!value || !Number.isFinite(Number(value.x)) || !Number.isFinite(Number(value.y))) return null;
  return { x: Number(value.x), y: Number(value.y), z: Number(value.z) || 0 };
}

function boundsOf(entities) {
  const values = [];
  entities.forEach((entity) => {
    if (entity.start) values.push(entity.start); if (entity.end) values.push(entity.end); if (entity.center) values.push(entity.center); if (entity.position) values.push(entity.position); if (entity.points) values.push(...entity.points); if (entity.majorAxisEndPoint) values.push(entity.majorAxisEndPoint);
  });
  if (!values.length) return null;
  return values.reduce((result, value) => ({ minX: Math.min(result.minX, value.x), minY: Math.min(result.minY, value.y), maxX: Math.max(result.maxX, value.x), maxY: Math.max(result.maxY, value.y) }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
}

function normalizeEntity(entity) {
  const type = entity.objectName || entity.constructor?.name?.toUpperCase() || 'UNKNOWN';
  const common = { type, handle: entity.handle ?? null, layer: entity.layer?.name || null };
  const entityPoints = () => (typeof entity.getPoints === 'function' ? [...entity.getPoints()].map(point).filter(Boolean) : []);
  if (type === 'LINE') return { ...common, start: point(entity.startPoint), end: point(entity.endPoint) };
  if (type === 'LWPOLYLINE' || type === 'POLYLINE' || type === 'POLYLINE2D' || type === 'POLYLINE3D') return { ...common, type: type === 'POLYLINE' ? 'POLYLINE' : type, points: entityPoints(), closed: Boolean(entity.isClosed) };
  if (type === 'CIRCLE') return { ...common, center: point(entity.center), radius: Number(entity.radius) || 0 };
  if (type === 'ARC') return { ...common, center: point(entity.center), radius: Number(entity.radius) || 0, startAngle: Number(entity.startAngle) || 0, endAngle: Number(entity.endAngle) || 0 };
  if (type === 'TEXT' || type === 'MTEXT') return { ...common, text: String(entity.value || entity.plainText || ''), position: point(entity.insertPoint), height: Number(entity.height) || 0, rotation: Number(entity.rotation) || 0 };
  if (type === 'POINT') return { ...common, position: point(entity.location) };
  if (type === 'ELLIPSE') return { ...common, center: point(entity.center), majorAxisEndPoint: point(entity.majorAxisEndPoint), ratio: Number(entity.radiusRatio) || 0, startParameter: Number(entity.startParameter) || 0, endParameter: Number(entity.endParameter) || Math.PI * 2 };
  if (type === 'SPLINE') return { ...common, points: (entity.controlPoints || []).map(point).filter(Boolean), closed: Boolean(entity.isClosed) };
  if (type === 'DIMENSION') return { ...common, text: String(entity.text || ''), position: point(entity.insertionPoint) };
  if (type === 'INSERT') return { ...common, name: entity.block?.name || null, position: point(entity.insertPoint), rotation: Number(entity.rotation) || 0 };
  return null;
}

async function parseDxf(buffer) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw new Error('DXF file data is required');
  if (buffer.length < 6) throw new Error('Selected file is not a valid DXF document');
  const { DxfReader } = await acadPromise;
  const data = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  let document;
  try { document = DxfReader.readFromStream(data); } catch (error) { throw new Error(error.message || 'DXF parser failed'); }
  const rawEntities = document.modelSpace?.entities ? [...document.modelSpace.entities] : [];
  const entities = []; const unsupportedEntities = {};
  rawEntities.forEach((entity) => { const normalized = normalizeEntity(entity); if (normalized) entities.push(normalized); else { const type = entity.objectName || entity.constructor?.name || 'UNKNOWN'; unsupportedEntities[type] = (unsupportedEntities[type] || 0) + 1; } });
  const layers = document.layers ? [...document.layers].map((layer) => ({ name: layer.name, off: !layer.isOn })) : [];
  const units = document.header?.measurementUnits === 1 ? 'metric' : document.header?.measurementUnits === 0 ? 'english' : 'unknown';
  return { entities, bounds: boundsOf(entities), entityCount: rawEntities.length, supportedEntityCount: entities.length, unsupportedEntityCount: rawEntities.length - entities.length, unsupportedEntities, layers, layerCount: layers.length, units };
}

module.exports = { parseDxf };
