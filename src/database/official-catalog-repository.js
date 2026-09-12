const { initializeOfficialDatabase } = require('./official-database-initializer');

function cloneReadOnly(record) {
  return Object.freeze(JSON.parse(JSON.stringify(record)));
}

class OfficialCatalogRepository {
  #materials;
  #hardware;
  #engineeringRecords;

  constructor() {
    const { materials, hardware, engineeringRecords } = initializeOfficialDatabase();
    this.#materials = new Map(materials.map((record) => [record.id, cloneReadOnly(record)]));
    this.#hardware = new Map(hardware.map((record) => [record.id, cloneReadOnly(record)]));
    this.#engineeringRecords = new Map(engineeringRecords.map((record) => [record.id, cloneReadOnly(record)]));
  }

  getMaterialById(id) { return this.#materials.get(id) || null; }
  listMaterials() { return [...this.#materials.values()].map((record) => JSON.parse(JSON.stringify(record))); }
  listHardware() { return [...this.#hardware.values()].map((record) => JSON.parse(JSON.stringify(record))); }
  getHardwareById(id) { return this.#hardware.get(id) || null; }
  getEngineeringRecordById(id) { return this.#engineeringRecords.get(id) || null; }
  listEngineeringRecords() { return [...this.#engineeringRecords.values()].map((record) => JSON.parse(JSON.stringify(record))); }
  findEngineeringRecords(category) { return this.listEngineeringRecords().filter((record) => !category || record.category === category); }
  validate() { initializeOfficialDatabase(); return true; }
}

module.exports = { OfficialCatalogRepository };
