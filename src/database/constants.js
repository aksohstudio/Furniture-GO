const PROJECT_STATUS = Object.freeze({ IMPORTED: 'Project Imported', ARCHIVED: 'Archived' });
const WORKFLOW_STATUS = Object.freeze({ NOT_STARTED: 'Not Started' });
const LOCK_STATUS = Object.freeze({ UNLOCKED: 'Unlocked', LOCKED: 'Locked' });
const REVISION_STATUS = Object.freeze({ WORKING: 'Working', CONFIRMED: 'Confirmed', SUPERSEDED: 'Superseded' });
const ARCHIVE_STATUS = Object.freeze({ ACTIVE: 'Active', ARCHIVED: 'Archived', TRASH: 'Trash' });

module.exports = { PROJECT_STATUS, WORKFLOW_STATUS, LOCK_STATUS, REVISION_STATUS, ARCHIVE_STATUS };
