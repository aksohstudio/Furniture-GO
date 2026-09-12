const writerPromise = import('@node-projects/acad-ts');

const SUPPORTED_TYPES = new Set([
  'LINE', 'LWPOLYLINE', 'POLYLINE2D', 'POLYLINE3D', 'CIRCLE', 'ARC', 'TEXT', 'MTEXT',
]);
const CRITICAL_TYPES = new Set(['DIMENSION', 'INSERT']);

function xy(value, XYZ) {
  if (!value || !Number.isFinite(Number(value.x)) || !Number.isFinite(Number(value.y))) return null;
  return new XYZ(Number(value.x), Number(value.y), Number(value.z) || 0);
}

function reportUnsupported(entities) {
  return entities.reduce((result, entity) => {
    if (!SUPPORTED_TYPES.has(entity.type)) result[entity.type || 'UNKNOWN'] = (result[entity.type || 'UNKNOWN'] || 0) + 1;
    return result;
  }, {});
}

async function exportDwg(drawing) {
  if (!drawing || !Array.isArray(drawing.entities)) throw new Error('CAD drawing data is invalid');
  if (!drawing.entities.length) throw new Error('No drawing entities to export');
  const unsupportedEntities = reportUnsupported(drawing.entities);
  const critical = Object.keys(unsupportedEntities).filter((type) => CRITICAL_TYPES.has(type));
  if (critical.length) throw new Error(`DWG export cannot safely preserve: ${critical.join(', ')}`);

  const {
    ACadVersion, Arc, CadDocument, Circle, DwgWriter, Layer, Line, LwPolyline, LwPolylineVertex,
    MText, TextEntity, XY, XYZ,
  } = await writerPromise;
  const document = new CadDocument(ACadVersion.AC1032);
  const layers = new Map();
  (drawing.layers || []).forEach((sourceLayer) => {
    if (!sourceLayer?.name) return;
    const layer = document.layers.tryGetValue(sourceLayer.name) || new Layer(sourceLayer.name);
    if (!document.layers.tryGetValue(sourceLayer.name)) document.layers.add(layer);
    layers.set(sourceLayer.name, layer);
  });
  const getLayer = (name) => {
    if (!name) return document.layers.tryGetValue('0');
    if (layers.has(name)) return layers.get(name);
    const layer = document.layers.tryGetValue(name) || new Layer(name);
    if (!document.layers.tryGetValue(name)) document.layers.add(layer);
    layers.set(name, layer);
    return layer;
  };
  const exported = [];
  drawing.entities.forEach((source) => {
    let entity = null;
    if (source.type === 'LINE' && xy(source.start, XYZ) && xy(source.end, XYZ)) {
      entity = new Line(xy(source.start, XYZ), xy(source.end, XYZ));
    } else if (['LWPOLYLINE', 'POLYLINE2D', 'POLYLINE3D'].includes(source.type) && source.points?.length > 1) {
      const vertices = source.points.map((item) => new LwPolylineVertex(new XY(Number(item.x), Number(item.y))));
      entity = new LwPolyline(vertices); entity.isClosed = Boolean(source.closed);
    } else if (source.type === 'CIRCLE' && xy(source.center, XYZ)) {
      entity = new Circle(); entity.center = xy(source.center, XYZ); entity.radius = Number(source.radius);
    } else if (source.type === 'ARC' && xy(source.center, XYZ)) {
      entity = new Arc(xy(source.center, XYZ), Number(source.radius), Number(source.startAngle), Number(source.endAngle));
    } else if ((source.type === 'TEXT' || source.type === 'MTEXT') && xy(source.position, XYZ)) {
      entity = source.type === 'TEXT' ? new TextEntity() : new MText(); entity.insertPoint = xy(source.position, XYZ); entity.value = String(source.text || ''); entity.height = Number(source.height) || 1; entity.rotation = Number(source.rotation) || 0;
    }
    if (!entity) return;
    entity.layer = getLayer(source.layer); document.modelSpace.entities.add(entity); exported.push(source);
  });
  if (!exported.length) throw new Error('No supported drawing entities to export');
  const capacity = Math.min(Math.max(4 * 1024 * 1024, exported.length * 4096), 64 * 1024 * 1024);
  const output = new ArrayBuffer(capacity);
  const writer = new DwgWriter(output, document);
  writer.write();
  const buffer = Buffer.from(output).subarray(0, writer.bytesWritten);
  if (buffer.length <= 6 || buffer.subarray(0, 6).toString('ascii') !== 'AC1032') throw new Error('DWG writer produced an invalid DWG header');
  return { buffer, report: { entityCount: drawing.entities.length, exportedCount: exported.length, unsupportedEntities, unsupportedCount: drawing.entities.length - exported.length, layerCount: layers.size, units: drawing.units || 'unknown' } };
}

module.exports = { exportDwg };
