async function request(path, options) {
  const response = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : { error: `Project API returned non-JSON response (${response.status})` };
  if (!response.ok) throw new Error(data.error || 'Request failed'); return data;
}
export const projectClient = {
  listProjects: () => request('/api/projects'),
  createProject: (name) => request('/api/projects', { method: 'POST', body: JSON.stringify({ name }) }),
  getProject: (id) => request(`/api/projects/${encodeURIComponent(id)}`),
  archiveProject: (id) => request(`/api/projects/${encodeURIComponent(id)}/archive`, { method: 'POST' }),
  trashProject: (id) => request(`/api/projects/${encodeURIComponent(id)}/trash`, { method: 'POST' }),
  restoreProject: (id) => request(`/api/projects/${encodeURIComponent(id)}/restore`, { method: 'POST' }),
  saveWorkingState: (id, changes, accountRole) => request(`/api/projects/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(accountRole ? { ...changes, accountRole } : changes) }),
  getUserContext: () => request('/api/account/context'),
  saveUserContext: (context) => request('/api/account/context', { method: 'PUT', body: JSON.stringify(context) }),
};
