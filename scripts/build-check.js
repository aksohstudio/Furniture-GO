const fs = require('node:fs');
const path = require('node:path');

const required = [
  '.editorconfig',
  '.gitignore',
  'index.html',
  'server.js',
  'src/main.js',
  'src/router/router.js',
  'src/styles/theme.css',
  'src/styles/layout.css',
  'src/components/AppShell.js',
  'src/components/StatusBar.js',
  'src/assets/asset-manifest.js',
  'src/utils/logger.js',
  'src/utils/error-handler.js',
  'src/database/constants.js',
  'src/database/id.js',
  'src/database/local-storage.js',
  'src/database/repositories.js',
  'src/database/schema.js',
  'src/database/migrations.js',
  'src/services/project-service.js',
  'src/services/access-policy.js',
];

const requiredDirectories = [
  'src/assets',
  'src/components',
  'src/constants',
  'src/database',
  'src/hooks',
  'src/modules',
  'src/pages',
  'src/router',
  'src/services',
  'src/styles',
  'src/types',
  'src/utils',
];

const missing = required.filter((file) => !fs.existsSync(path.join(__dirname, '..', file)));
const missingDirectories = requiredDirectories.filter((directory) => !fs.existsSync(path.join(__dirname, '..', directory)));
if (missing.length || missingDirectories.length) {
  console.error(`Foundation check failed. Missing files: ${missing.join(', ')}. Missing directories: ${missingDirectories.join(', ')}`);
  process.exit(1);
}
console.log(`Foundation check passed (${required.length} files and ${requiredDirectories.length} directories present).`);
