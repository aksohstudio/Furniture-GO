const fs = require('node:fs');
const path = require('node:path');

class JsonLocalStorage {
  constructor(rootDirectory) {
    this.rootDirectory = path.resolve(rootDirectory);
    fs.mkdirSync(this.rootDirectory, { recursive: true });
  }

  resolve(key) {
    const normalized = path.normalize(key);
    const target = path.resolve(this.rootDirectory, normalized);
    const prefix = `${this.rootDirectory}${path.sep}`;
    if (!target.startsWith(prefix)) throw new Error('Storage path escapes local storage boundary');
    return target;
  }

  readJson(key, fallback = null) {
    const target = this.resolve(key);
    try {
      return JSON.parse(fs.readFileSync(target, 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') return fallback;
      throw error;
    }
  }

  writeJson(key, value) {
    const target = this.resolve(key);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const temporary = `${target}.${process.pid}.tmp`;
    fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    fs.renameSync(temporary, target);
  }

  remove(key) {
    const target = this.resolve(key);
    try { fs.unlinkSync(target); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}

module.exports = { JsonLocalStorage };
