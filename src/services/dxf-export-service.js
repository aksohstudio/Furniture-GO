const acadPromise = import('@node-projects/acad-ts');

const SUPPORTED_TYPES = new Set(['LINE', 'LWPOLYLINE', 'POLYLINE', 'POLYLINE2D', 'POLYLINE3D', 'CIRCLE', 'ARC', 'TEXT', 'MTEXT', 'POINT', 'ELLIPSE', 'SPLINE']);
const CRITICAL_TYPES = new Set(['DIMENSION', 'INSERT']);

function xyz(value, XYZ) {
  if (!value || !Number.isFinite(Number(value.x)) || !Number.isFinite(Number(value.y))) return null;
  return new XYZ(Number(value.x), Number(value.y), Number(value.z) || 0);
}

function unsupportedByType(entities) {
  return entities.reduce((result, entity) => { if (!SUPPORTED_TYPES.has(entity.type)) result[entity.type || 'UNKNOWN'] = (result[entity.type || 'UNKNOWN'] || 0) + 1; return result; }, {});
}

async function exportDxf(drawing) {
  if (!drawing || !Array.isArray(drawing.entities)) throw new Error('CAD drawing data is invalid');
  if (!drawing.entities.length) throw new Error('No drawing entities to export');
  const unsupportedEntities = unsupportedByType(drawing.entities);
  const critical = Object.keys(unsupportedEntities).filter((type) => CRITICAL_TYPES.has(type));
  if (critical.length) throw new Error(`DXF export cannot safely preserve: ${critical.join(', ')}`);
  const { ACadVersion, Arc, CadDocument, Circle, DxfReader, DxfWriter, Ellipse, Layer, Line, LwPolyline, LwPolylineVertex, MText, Point, Spline, TextEntity, XY, XYZ } = await acadPromise;
  const document = new CadDocument(ACadVersion.AC1032);
  if (drawing.units && drawing.units !== 'unknown') document.header.measurementUnits = drawing.units === 'metric' || drawing.units === 'mm' ? 1 : 0;
  const layers = new Map();
  (drawing.layers || []).forEach((sourceLayer) => { if (!sourceLayer?.name) return; const layer = document.layers.tryGetValue(sourceLayer.name) || new Layer(sourceLayer.name); if (!document.layers.tryGetValue(sourceLayer.name)) document.layers.add(layer); layers.set(sourceLayer.name, layer); });
  const getLayer = (name) => { if (layers.has(name)) return layers.get(name); const layer = document.layers.tryGetValue(name || '0') || new Layer(name || '0'); if (!document.layers.tryGetValue(name || '0')) document.layers.add(layer); layers.set(name || '0', layer); return layer; };
  const exported = [];
  drawing.entities.forEach((source) => {
    let entity = null;
    if (source.type === 'LINE' && xyz(source.start, XYZ) && xyz(source.end, XYZ)) entity = new Line(xyz(source.start, XYZ), xyz(source.end, XYZ));
    else if (['LWPOLYLINE', 'POLYLINE', 'POLYLINE2D', 'POLYLINE3D'].includes(source.type) && source.points?.length > 1) { entity = new LwPolyline(source.points.map((item) => new LwPolylineVertex(new XY(Number(item.x), Number(item.y))))); entity.isClosed = Boolean(source.closed); }
    else if (source.type === 'CIRCLE' && xyz(source.center, XYZ)) { entity = new Circle(); entity.center = xyz(source.center, XYZ); entity.radius = Number(source.radius); }
    else if (source.type === 'ARC' && xyz(source.center, XYZ)) entity = new Arc(xyz(source.center, XYZ), Number(source.radius), Number(source.startAngle), Number(source.endAngle));
    else if ((source.type === 'TEXT' || source.type === 'MTEXT') && xyz(source.position, XYZ)) { entity = source.type === 'TEXT' ? new TextEntity() : new MText(); entity.insertPoint = xyz(source.position, XYZ); entity.value = String(source.text || ''); entity.height = Number(source.height) || 1; entity.rotation = Number(source.rotation) || 0; }
    else if (source.type === 'POINT' && xyz(source.position, XYZ)) entity = new Point(xyz(source.position, XYZ));
    else if (source.type === 'ELLIPSE' && xyz(source.center, XYZ) && xyz(source.majorAxisEndPoint, XYZ)) { entity = new Ellipse(); entity.center = xyz(source.center, XYZ); entity.majorAxisEndPoint = xyz(source.majorAxisEndPoint, XYZ); entity.radiusRatio = Number(source.ratio) || 1; entity.startParameter = Number(source.startParameter) || 0; entity.endParameter = Number(source.endParameter) || Math.PI * 2; }
    else if (source.type === 'SPLINE' && source.points?.length > 1) { entity = new Spline(); entity.controlPoints = source.points.map((item) => xyz(item, XYZ)); entity.isClosed = Boolean(source.closed); }
    if (!entity) return;
    entity.layer = getLayer(source.layer); document.modelSpace.entities.add(entity); exported.push(source);
  });
  if (!exported.length) throw new Error('No supported drawing entities to export');
  let output = ''; DxfWriter.writeToStream({ write: (value) => { output += value; } }, document);
  const buffer = Buffer.from(output, 'utf8');
  if (!buffer.length || /(^|\r?\n)\s*0\r?\nSECTION\r?\n/.test(output) === false || /\r?\n\s*0\r?\nEOF\s*$/.test(output) === false) throw new Error('DXF writer produced an invalid DXF structure');
  const parsed = DxfReader.readFromStream(new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength));
  const parsedCount = parsed.modelSpace?.entities?.count || 0;
  if (!parsedCount) throw new Error('DXF validation found no exported entities');
  return { buffer, report: { entityCount: drawing.entities.length, exportedCount: exported.length, unsupportedEntities, unsupportedCount: drawing.entities.length - exported.length, layerCount: layers.size, units: drawing.units || 'unknown', parsedEntityCount: parsedCount } };
}

module.exports = { exportDxf };
