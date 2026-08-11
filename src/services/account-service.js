const { createObjectId } = require('../database/id');
const { JsonLocalStorage } = require('../database/local-storage');

const DEFAULT_CONTEXT = Object.freeze({ id: 'local-owner', displayName: 'Local User', primaryRole: 'Designer', accountRole: 'Owner' });

class AccountService {
  constructor(rootDirectory) { this.storage = new JsonLocalStorage(rootDirectory); }
  getContext() { return this.storage.readJson('account-context.json', { ...DEFAULT_CONTEXT }); }
  saveContext(changes) {
    const current = this.getContext();
    const next = { ...current, ...changes, id: current.id || createObjectId(), updatedAt: new Date().toISOString() };
    if (typeof next.primaryRole !== 'string' || typeof next.accountRole !== 'string') throw new Error('Primary Role and Account Role are required');
    this.storage.writeJson('account-context.json', next); return next;
  }
}

module.exports = { AccountService, DEFAULT_CONTEXT };
