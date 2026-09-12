const { createObjectId } = require('../database/id');
const { FURNITURE_OBJECT_STORAGE_AUTHORITY } = require('../database/furniture-object-repository');

function now() { return new Date().toISOString(); }

class FurnitureObjectStorageService {
  constructor(projectService) {
    if (!projectService?.data || typeof projectService.openProject !== 'function') throw new Error('FurnitureObjectStorageService requires ProjectService');
    this.projectService = projectService;
    this.data = projectService.data;
  }

  storeFromConfirmedEngineeringRecord(input) {
    const confirmed = input?.confirmedEngineeringRecord;
    if (!confirmed || confirmed.status !== 'Confirmed' || typeof confirmed.id !== 'string' || !confirmed.id) throw new Error('Furniture Object writes require a confirmed Engineering Record');
    const project = this.projectService.openProject(input.projectId);
    this.projectService.assertWritable(project);
    const timestamp = now();
    const object = {
      id: input.id || createObjectId(),
      projectId: project.project.id,
      floorId: input.floorId,
      roomId: input.roomId,
      designerCabinetId: input.designerCabinetId || null,
      engineeringRecordId: confirmed.id,
      factoryReferenceId: input.factoryReferenceId || null,
      furnitureType: input.furnitureType || null,
      materialIds: [...(input.materialIds || [])],
      hardwareIds: [...(input.hardwareIds || [])],
      productionStatus: input.productionStatus,
      validation: input.validation,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const existingIds = new Set((project.furnitureObjects || []).map((item) => item.id));
    const errors = this.projectService.referenceValidator.validateFurnitureObject(project, object, existingIds);
    if (errors.length) throw new Error(`Furniture Object validation failed: ${errors.map((item) => item.code).join(', ')}`);
    this.data.furnitureObjects.saveFromStorageService(project, object, FURNITURE_OBJECT_STORAGE_AUTHORITY);
    this.projectService.appendHistory(project, 'Furniture Object Stored', { furnitureObjectId: object.id, engineeringRecordId: object.engineeringRecordId });
    project.project.updatedAt = timestamp;
    this.projectService.writeProject(project);
    return object;
  }

  getById(projectId, objectId) {
    const project = this.projectService.openProject(projectId);
    return this.data.furnitureObjects.getById(project, objectId);
  }

  listByProjectId(projectId) {
    const project = this.projectService.openProject(projectId);
    return this.data.furnitureObjects.listByProjectId(project);
  }

  update(projectId, objectId, object) {
    const project = this.projectService.openProject(projectId);
    this.projectService.assertWritable(project);
    const saved = this.data.furnitureObjects.replaceFromStorageService(
      project,
      object,
      FURNITURE_OBJECT_STORAGE_AUTHORITY
    );
    if (!saved) return null;
    project.project.updatedAt = object.updatedAt;
    this.projectService.appendHistory(project, 'Furniture Object Updated', { furnitureObjectId: object.id });
    this.projectService.writeProject(project);
    return saved;
  }

  remove(projectId, objectId) {
    const project = this.projectService.openProject(projectId);
    this.projectService.assertWritable(project);
    const removed = this.data.furnitureObjects.removeFromStorageService(
      project,
      objectId,
      FURNITURE_OBJECT_STORAGE_AUTHORITY
    );
    if (!removed) return null;
    project.project.updatedAt = now();
    this.projectService.appendHistory(project, 'Furniture Object Deleted', { furnitureObjectId: objectId });
    this.projectService.writeProject(project);
    return removed;
  }
}

module.exports = { FurnitureObjectStorageService };
