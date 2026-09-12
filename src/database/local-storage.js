const fs = require('node:fs');
const path = require('node:path');

class JsonLocalStorage {
  constructor(rootDirectory) {
    this.rootDirectory = path.resolve(rootDirectory);

    fs.mkdirSync(this.rootDirectory, {
      recursive: true,
    });
  }

  resolve(key) {
    const normalized = path.normalize(key);
    const target = path.resolve(
      this.rootDirectory,
      normalized
    );

    const prefix = `${this.rootDirectory}${path.sep}`;

    if (
      target !== this.rootDirectory &&
      !target.startsWith(prefix)
    ) {
      throw new Error(
        'Storage path escapes local storage boundary'
      );
    }

    return target;
  }

  readJson(key, fallback = null) {
    const target = this.resolve(key);

    try {
      return JSON.parse(
        fs.readFileSync(target, 'utf8')
      );
    } catch (error) {
      if (error.code === 'ENOENT') {
        return fallback;
      }

      throw error;
    }
  }

  writeJson(key, value) {
    const target = this.resolve(key);

    fs.mkdirSync(
      path.dirname(target),
      {
        recursive: true,
      }
    );

    const temporary = `${target}.${process.pid}.tmp`;

    fs.writeFileSync(
      temporary,
      `${JSON.stringify(value, null, 2)}\n`,
      'utf8'
    );

    fs.renameSync(
      temporary,
      target
    );
  }

  readBuffer(key, fallback = null) {
    const target = this.resolve(key);

    try {
      return fs.readFileSync(target);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return fallback;
      }

      throw error;
    }
  }

  writeBuffer(key, value) {
    const target = this.resolve(key);

    if (!Buffer.isBuffer(value)) {
      throw new Error(
        'Storage value must be a Buffer'
      );
    }

    fs.mkdirSync(
      path.dirname(target),
      {
        recursive: true,
      }
    );

    const temporary = `${target}.${process.pid}.tmp`;

    fs.writeFileSync(
      temporary,
      value
    );

    fs.renameSync(
      temporary,
      target
    );
  }

  exists(key) {
    const target = this.resolve(key);

    try {
      fs.accessSync(
        target,
        fs.constants.F_OK
      );

      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false;
      }

      throw error;
    }
  }

  remove(key) {
    const target = this.resolve(key);

    try {
      fs.unlinkSync(target);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}

module.exports = {
  JsonLocalStorage,
};