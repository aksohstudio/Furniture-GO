const path = require('node:path');
const { JsonLocalStorage } = require('./local-storage');

const WRITE_AUTHORITY = Symbol('project-service-write-authority');

class ReadOnlyRepository {
  constructor(storage, key) { this.storage = storage; this.key = key; }
  get() { return this.storage.readJson(this.key, {}); }
  save() { throw new Error('Official Database is read-only'); }
}

class JsonRepository {
  constructor(storage, key) { this.storage = storage; this.key = key; }
  get(fallback = null) { return this.storage.readJson(this.key, fallback); }
  save(value, authority) {
    if (authority !== WRITE_AUTHORITY) throw new Error('Repository writes require an application service authority');
    this.storage.writeJson(this.key, value);
  }
}

class ProjectDatabaseRepository extends JsonRepository {
  constructor(storage) { super(storage, null); }
  getById(projectId) { return this.storage.readJson(path.join('projects', `${projectId}.json`), null); }
  saveById(project, authority) {
    if (authority !== WRITE_AUTHORITY) throw new Error('Repository writes require an application service authority');
    this.storage.writeJson(path.join('projects', `${project.project.id}.json`), project);
  }
}

function createDataAccess(rootDirectory) {
  const storage = new JsonLocalStorage(rootDirectory);
  const projects = new JsonRepository(storage, path.join('projects', 'index.json'));
  return {
    authority: WRITE_AUTHORITY,
    storage,
    official: new ReadOnlyRepository(storage, 'official-database.json'),
    factory: new JsonRepository(storage, 'factory-database.json'),
    configuration: new JsonRepository(storage, 'factory-configuration.json'),
    projectDatabase: new ProjectDatabaseRepository(storage),
    projects,
  };
}

module.exports = { createDataAccess };
