import { ProjectList } from './ProjectList.js';
import { ProjectDashboard } from './ProjectDashboard.js';
import { BoundaryPage } from './BoundaryPage.js';

export async function AppShell({ router }) {
  const shell = document.createElement('main'); shell.className = 'app-shell';
  shell.innerHTML = `<header class="topbar"><div class="brand-mark" aria-label="Furniture GO">GO</div><div><p class="eyebrow">Furniture GO</p><h1>Project System</h1></div><nav class="topbar-nav"><button class="nav-button" type="button" data-route="/projects">Projects</button></nav></header><section class="workspace"><div class="workspace-card"><div id="page-root"></div></div></section>`;
  shell.querySelector('[data-route="/projects"]').addEventListener('click', () => router.navigate('/projects'));
  const pageRoot = shell.querySelector('#page-root');
  if (router.current().startsWith('/dashboard/')) { try { pageRoot.replaceWith(await ProjectDashboard({ projectId: router.current().split('/')[2], router })); } catch (error) { pageRoot.innerHTML = `<div class="empty-state">${error.message}</div>`; } }
  else if (router.current() === '/settings') pageRoot.replaceWith(BoundaryPage({ router, kind: 'settings' }));
  else if (router.current() === '/database') pageRoot.replaceWith(BoundaryPage({ router, kind: 'database' }));
  else if (router.current() === '/account') pageRoot.replaceWith(BoundaryPage({ router, kind: 'account' }));
  else pageRoot.replaceWith(ProjectList({ router, onOpen: (id) => router.navigate(`/dashboard/${id}`) }));
  return shell;
}
