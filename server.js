const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { ProjectService } = require('./src/services/project-service');
const { canPerform, ACCOUNT_ROLE } = require('./src/services/access-policy');
const { AccountService } = require('./src/services/account-service');

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};
const projectService = new ProjectService(path.join(root, '.runtime-data'));
const accountService = new AccountService(path.join(root, '.runtime-data'));

function json(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
  response.end(JSON.stringify(value));
}

function body(request) {
  return new Promise((resolve, reject) => { let data = ''; request.on('data', (chunk) => { data += chunk; }); request.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (error) { reject(error); } }); request.on('error', reject); });
}

function authorize(action, project, payload = {}) {
  const accountRole = payload.accountRole || accountService.getContext().accountRole || ACCOUNT_ROLE.OWNER;
  if (!canPerform(action, { accountRole, archiveStatus: project?.project.archiveStatus, lockStatus: project?.project.lockStatus })) throw Object.assign(new Error(`Account role cannot perform ${action}`), { statusCode: 403 });
}

async function handleApi(request, response, pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'api' && parts[1] === 'account' && parts.length === 3 && parts[2] === 'context') {
    try { if (request.method === 'GET') return json(response, 200, accountService.getContext()); if (request.method === 'PUT') return json(response, 200, accountService.saveContext(await body(request))); return json(response, 405, { error: 'Method not allowed' }); } catch (error) { return json(response, 400, { error: error.message }); }
  }
  if (parts[0] !== 'api' || parts[1] !== 'projects') return false;
  try {
    if (request.method === 'GET' && parts.length === 2) {
      const index = projectService.index.projectIds.map((id) => projectService.readProject(id)).filter(Boolean);
      return json(response, 200, index);
    }
    if (request.method === 'POST' && parts.length === 2) {
      const payload = await body(request);
      authorize('create', null, payload);
      if (typeof payload.name !== 'string' || !payload.name.trim()) return json(response, 400, { error: 'Project name is required' });
      return json(response, 201, projectService.createProject(payload.name.trim()));
    }
    if (parts.length === 3) {
      const id = parts[2];
      const project = projectService.readProject(id);
      if (request.method === 'GET') return json(response, 200, projectService.openProject(id));
      if (request.method === 'PATCH') { const payload = await body(request); authorize('edit', project, payload); const { accountRole, ...changes } = payload; return json(response, 200, projectService.saveWorkingState(id, changes)); }
      if (request.method === 'POST') {
        const payload = await body(request); const action = payload.action;
        authorize(action === 'archive' ? 'archive' : action === 'restore' ? 'restore' : 'delete', project, payload);
        if (action === 'archive') return json(response, 200, projectService.archiveProject(id));
        if (action === 'trash') return json(response, 200, projectService.moveToTrash(id));
        if (action === 'restore') return json(response, 200, projectService.restoreProject(id));
      }
    }
    if (parts.length === 4 && request.method === 'POST') {
      const id = parts[2]; const action = parts[3];
      const project = projectService.readProject(id); const payload = request.headers['content-type']?.includes('application/json') ? await body(request) : {};
      authorize(action === 'archive' ? 'archive' : action === 'restore' ? 'restore' : 'delete', project, payload);
      if (action === 'archive') return json(response, 200, projectService.archiveProject(id));
      if (action === 'trash') return json(response, 200, projectService.moveToTrash(id));
      if (action === 'restore') return json(response, 200, projectService.restoreProject(id));
    }
    return json(response, 404, { error: 'API route not found' });
  } catch (error) {
    const status = error.statusCode || (error instanceof SyntaxError ? 400 : 500);
    return json(response, status, { error: error.message || 'Project API error' });
  }
}

function safePath(urlPath) {
  const requested = urlPath === '/' ? '/index.html' : urlPath;
  const normalized = path.normalize(decodeURIComponent(requested));
  const absolute = path.resolve(root, `.${normalized}`);
  const rootPrefix = `${root}${path.sep}`;
  return absolute === root || absolute.startsWith(rootPrefix) ? absolute : null;
}

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, `http://${request.headers.host || 'localhost'}`).pathname;
  if (pathname === '/api/projects' || pathname.startsWith('/api/projects/') || pathname === '/api/account/context') { handleApi(request, response, pathname); return; }
  if (pathname.startsWith('/api/')) { json(response, 404, { error: 'API route not found' }); return; }
  const filePath = safePath(request.url.split('?')[0]);
  if (!filePath) {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Bad request');
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(error.code === 'ENOENT' ? 'Not found' : 'Server error');
      return;
    }
    response.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream' });
    response.end(data);
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Furniture GO foundation running at http://127.0.0.1:${port}`);
});
