class FactoryReferenceRepository {
  constructor(factoryRepository) { this.factoryRepository = factoryRepository; }

  getByEngineeringRecordId(engineeringRecordId) {
    const source = this.factoryRepository.get({ records: [] });
    const records = Array.isArray(source) ? source : source.records || [];
    return records.find((record) => record.engineeringRecordId === engineeringRecordId) || null;
  }
}

module.exports = { FactoryReferenceRepository };
