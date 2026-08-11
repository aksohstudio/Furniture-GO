const ACCOUNT_ROLE = Object.freeze({ OWNER: 'Owner', ADMIN: 'Admin', DESIGNER: 'Designer', WORKER: 'Worker' });
const ACTION = Object.freeze({ CREATE: 'create', OPEN: 'open', EDIT: 'edit', CONFIRM: 'confirm', LOCK: 'lock', UNLOCK: 'unlock', GENERATE: 'generate', EXPORT: 'export', PRINT: 'print', ARCHIVE: 'archive', DELETE: 'delete', RESTORE: 'restore', PERMANENT_DELETE: 'permanent-delete' });

const roleMatrix = {
  create: [ACCOUNT_ROLE.OWNER, ACCOUNT_ROLE.ADMIN, ACCOUNT_ROLE.DESIGNER],
  edit: [ACCOUNT_ROLE.OWNER, ACCOUNT_ROLE.ADMIN, ACCOUNT_ROLE.DESIGNER],
  confirm: [ACCOUNT_ROLE.OWNER, ACCOUNT_ROLE.ADMIN],
  lock: [ACCOUNT_ROLE.OWNER, ACCOUNT_ROLE.ADMIN],
  unlock: [ACCOUNT_ROLE.OWNER, ACCOUNT_ROLE.ADMIN],
  generate: [ACCOUNT_ROLE.OWNER, ACCOUNT_ROLE.ADMIN, ACCOUNT_ROLE.WORKER],
  export: [ACCOUNT_ROLE.OWNER, ACCOUNT_ROLE.ADMIN, ACCOUNT_ROLE.DESIGNER, ACCOUNT_ROLE.WORKER],
  print: [ACCOUNT_ROLE.OWNER, ACCOUNT_ROLE.ADMIN, ACCOUNT_ROLE.WORKER],
  archive: [ACCOUNT_ROLE.OWNER, ACCOUNT_ROLE.ADMIN],
  delete: [ACCOUNT_ROLE.OWNER, ACCOUNT_ROLE.ADMIN],
  restore: [ACCOUNT_ROLE.OWNER, ACCOUNT_ROLE.ADMIN],
  'permanent-delete': [ACCOUNT_ROLE.OWNER],
};

function canPerform(action, context = {}) {
  const roles = roleMatrix[action];
  if (!roles || !roles.includes(context.accountRole)) return false;
  if (context.archiveStatus === 'Trash' && ['open', 'edit', 'generate', 'confirm'].includes(action)) return false;
  if (context.archiveStatus === 'Archived' && ['edit', 'generate', 'confirm', 'lock', 'unlock'].includes(action)) return false;
  if (context.lockStatus === 'Locked' && ['edit', 'confirm'].includes(action)) return false;
  return true;
}

module.exports = { ACCOUNT_ROLE, ACTION, canPerform, roleMatrix };
