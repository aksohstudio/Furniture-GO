const crypto = require('node:crypto');

function createObjectId() {
  return crypto.randomUUID();
}

module.exports = { createObjectId };
