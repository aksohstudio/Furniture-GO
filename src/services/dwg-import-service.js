const path = require('node:path');
const { pathToFileURL } = require('node:url');

const { Dwg_File_Type, LibreDwg } = require('@mlightcad/libredwg-web');

const wasmDirectory = path.join(
  process.cwd(),
  'node_modules',
  '@mlightcad',
  'libredwg-web',
  'wasm'
);

let parserPromise;

function point(value) {
  if (!value || typeof value !== 'object') return null;
  const x = Number(value.x);
  const y = Number(value.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

function points(values) {
  return Array.isArray(values) ? values.map(point).filter(Boolean) : [];
}

function cleanText(value) {
  return typeof value === 'string' ? value : '';
}

function normalizeEntity(entity) {
  const common = {
    type: entity.type,
    handle: entity.handle || null,
    layer: entity.layer || null,
    color: Number.isFinite(entity.color) ? entity.color : null,
  };

  switch (entity.type) {
    case 'LINE':
      return { ...common, start: point(entity.startPoint), end: point(entity.endPoint) };
    case 'LWPOLYLINE':
      return { ...common, closed: Boolean(entity.flag & 1), points: points(entity.vertices) };
    case 'POLYLINE2D':
    case 'POLYLINE3D':
      return { ...common, closed: Boolean(entity.flag & 1), points: points(entity.vertices?.map((item) => item.point || item)) };
    case 'CIRCLE':
      return { ...common, center: point(entity.center), radius: Number(entity.radius) || 0 };
    case 'ARC':
      return {
        ...common,
        center: point(entity.center),
        radius: Number(entity.radius) || 0,
        startAngle: Number(entity.startAngle) || 0,
        endAngle: Number(entity.endAngle) || 0,
      };
    case 'TEXT':
    case 'MTEXT':
      return {
        ...common,
        text: cleanText(entity.text),
        position: point(entity.startPoint || entity.insertionPoint),
        height: Number(entity.textHeight) || 0,
        rotation: Number(entity.rotation) || 0,
      };
    case 'DIMENSION':
      return { ...common, name: entity.name || null, text: cleanText(entity.text) };
    case 'INSERT':
      return {
        ...common,
        name: entity.name || null,
        position: point(entity.insertionPoint),
        rotation: Number(entity.rotation) || 0,
      };
    default:
      return null;
  }
}

function getBounds(entities) {
  const values = [];
  entities.forEach((entity) => {
    if (entity.start) values.push(entity.start);
    if (entity.end) values.push(entity.end);
    if (entity.center) values.push(entity.center);
    if (entity.position) values.push(entity.position);
    if (entity.points) values.push(...entity.points);
  });
  if (!values.length) return null;
  return values.reduce((bounds, value) => ({
    minX: Math.min(bounds.minX, value.x),
    minY: Math.min(bounds.minY, value.y),
    maxX: Math.max(bounds.maxX, value.x),
    maxY: Math.max(bounds.maxY, value.y),
  }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
}

async function getParser() {
  if (!parserPromise) {
    parserPromise = import(pathToFileURL(path.join(wasmDirectory, 'libredwg-web.js')).href)
      .then(({ default: createModule }) => createModule({
        locateFile: (filename) => path.join(wasmDirectory, filename),
      }))
      .then((wasmInstance) => LibreDwg.createByWasmInstance(wasmInstance));
  }
  return parserPromise;
}

async function parseDwg(buffer) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw new Error('DWG file data is required');
  if (buffer.length < 1024 || buffer.subarray(0, 2).toString('ascii') !== 'AC') {
    throw new Error('Selected file is not a valid DWG document');
  }
  const parser = await getParser();
  const source = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  let data;
  try {
    data = parser.dwg_read_data(source, Dwg_File_Type.DWG);
    if (!data) throw new Error('LibreDWG could not read the DWG file');
    const database = parser.convert(data);
    const rawEntities = Array.isArray(database.entities) ? database.entities : [];
    const entities = [];
    const unsupportedTypes = {};
    rawEntities.forEach((entity) => {
      const normalized = normalizeEntity(entity);
      if (normalized) entities.push(normalized);
      else unsupportedTypes[entity.type || 'UNKNOWN'] = (unsupportedTypes[entity.type || 'UNKNOWN'] || 0) + 1;
    });
    const layers = database.tables?.LAYER?.entries || database.tables?.LAYER?.records || [];
    return {
      entities,
      bounds: getBounds(entities),
      entityCount: rawEntities.length,
      supportedEntityCount: entities.length,
      unsupportedEntityCount: rawEntities.length - entities.length,
      unsupportedEntities: unsupportedTypes,
      layers: Array.isArray(layers) ? layers.map((layer) => ({
        name: layer.name,
        color: Number.isFinite(layer.color) ? layer.color : null,
        off: Boolean(layer.off),
        frozen: Boolean(layer.frozen),
        locked: Boolean(layer.locked),
      })) : [],
      units: null,
    };
  } finally {
    if (data) parser.dwg_free(data);
  }
}

module.exports = { parseDwg };
