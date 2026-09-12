const FURNITURE_OBJECT_STORAGE_AUTHORITY = Symbol('furniture-object-storage-service-authority');

class FurnitureObjectRepository {
  getById(project, objectId) {
    return (project.furnitureObjects || []).find((item) => item.id === objectId) || null;
  }

  listByProjectId(project) { return [...(project.furnitureObjects || [])]; }

  saveFromStorageService(project, object, authority) {
    if (authority !== FURNITURE_OBJECT_STORAGE_AUTHORITY) throw new Error('Furniture Objects may only be written by FurnitureObjectStorageService');
    project.furnitureObjects.push(object);
    return object;
  }

  replaceFromStorageService(project, object, authority) {
    if (authority !== FURNITURE_OBJECT_STORAGE_AUTHORITY) throw new Error('Furniture Objects may only be written by FurnitureObjectStorageService');
    const index = project.furnitureObjects.findIndex((item) => item.id === object.id);
    if (index === -1) return null;
    project.furnitureObjects[index] = object;
    return object;
  }

  removeFromStorageService(project, objectId, authority) {
    if (authority !== FURNITURE_OBJECT_STORAGE_AUTHORITY) throw new Error('Furniture Objects may only be written by FurnitureObjectStorageService');
    const index = project.furnitureObjects.findIndex((item) => item.id === objectId);
    if (index === -1) return null;
    return project.furnitureObjects.splice(index, 1)[0];
  }
}

module.exports = { FurnitureObjectRepository, FURNITURE_OBJECT_STORAGE_AUTHORITY };
