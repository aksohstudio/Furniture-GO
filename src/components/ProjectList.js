import { projectClient } from '../services/project-client.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

function formatDate(value) {
  if (!value) return 'Not available';

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not available'
    : date.toLocaleString();
}

function renderFolderIcon() {
  return `
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M5 12a4 4 0 0 1 4-4h11l5 5h15a4 4 0 0 1 4 4v18a5 5 0 0 1-5 5H9a4 4 0 0 1-4-4z"
        fill="none"
        stroke="currentColor"
        stroke-width="2.6"
        stroke-linejoin="round"
      />
    </svg>
  `;
}

function renderArrowIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 12h13m-5-5 5 5-5 5"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `;
}

function getStatus(project) {
  return project?.project?.status || 'Not available';
}

function getStatusClass(project) {
  const status = String(
    project?.project?.status ||
    project?.project?.archiveStatus ||
    ''
  ).toLowerCase();

  if (status.includes('trash') || status.includes('deleted')) {
    return 'global-project-status--trash';
  }

  if (status.includes('archive')) {
    return 'global-project-status--archived';
  }

  return 'global-project-status--active';
}

function getSpaceSummary(project) {
  const floors = Array.isArray(project?.hierarchy?.floors)
    ? project.hierarchy.floors
    : [];

  const rooms = floors.flatMap((floor) =>
    (floor.children || []).filter((item) => item.type === 'Room')
  );

  const furniture = rooms.flatMap((room) =>
    (room.children || []).filter((item) => item.type === 'Furniture')
  );

  const names = [
    ...rooms.map((room) => room.name).filter(Boolean),
    ...furniture.map((item) => item.name).filter(Boolean),
  ];

  return names.length
    ? names.slice(0, 4).join(' · ')
    : 'No spaces recorded';
}

function renderProjectRow(project) {
  const id = project?.project?.id;
  const status = getStatus(project);
  const lastOpened =
    project?.project?.lastOpenedAt ||
    project?.project?.lastOpened ||
    null;

  return `
    <article
      class="global-project-row"
      data-project-id="${escapeHtml(id)}"
      tabindex="0"
      role="button"
      aria-label="Open ${escapeHtml(project?.project?.name)}"
    >
      <span class="global-project-row__folder" aria-hidden="true">
        ${renderFolderIcon()}
      </span>

      <div class="global-project-row__identity">
        <h3>${escapeHtml(project?.project?.name || 'Unnamed project')}</h3>
        <p>${escapeHtml(getSpaceSummary(project))}</p>
      </div>

      <div class="global-project-row__status">
        <span class="global-project-status ${getStatusClass(project)}">
          <span class="global-project-status__dot" aria-hidden="true"></span>
          ${escapeHtml(status)}
        </span>
      </div>

      <div class="global-project-row__last-opened">
        <span>Last Opened</span>
        <strong>${escapeHtml(formatDate(lastOpened))}</strong>
      </div>

      <span class="global-project-row__arrow" aria-hidden="true">
        ${renderArrowIcon()}
      </span>
    </article>
  `;
}

function renderEmptyState(message, actionLabel = '') {
  return `
    <div class="global-home-empty">
      <span class="global-home-empty__icon" aria-hidden="true">
        ${renderFolderIcon()}
      </span>
      <h2>${escapeHtml(message)}</h2>
      ${actionLabel ? `<p>${escapeHtml(actionLabel)}</p>` : ''}
    </div>
  `;
}

export function ProjectList({ router }) {
  const section = document.createElement('section');
  section.className = 'page global-home-page';

  section.innerHTML = `
    <div class="global-home-shell">
      <header class="global-home-header">
        <div class="global-home-brand">
          <span class="global-home-brand__mark">GO</span>
          <div>
            <p class="eyebrow">Furniture GO</p>
            <h1>Project List</h1>
          </div>
        </div>

        <nav class="global-home-nav" aria-label="Global navigation">
          <button class="global-home-nav__item global-home-nav__item--primary" type="button" data-create>
            <span aria-hidden="true">＋</span>
            New Project
          </button>
          <button class="global-home-nav__item" type="button" data-database>
            Database
          </button>
          <button class="global-home-nav__item" type="button" data-settings>
            Settings
          </button>
        </nav>
      </header>

      <main class="global-home-main">
        <div class="global-home-heading">
          <div>
            <p class="eyebrow">Workspace</p>
            <h2>Projects</h2>
            <p class="muted">
              Open a project to enter its Project Dashboard.
            </p>
          </div>
          <span class="global-home-count" data-project-count>0 Projects</span>
        </div>

        <div class="global-home-list-header" aria-hidden="true">
          <span>Project</span>
          <span>Status</span>
          <span>Last Opened</span>
          <span></span>
        </div>

        <section class="global-home-project-list" data-list aria-live="polite">
          ${renderEmptyState('Loading projects…')}
        </section>
      </main>
    </div>
  `;

  const list = section.querySelector('[data-list]');
  const count = section.querySelector('[data-project-count]');
  let projects = [];

  const openProject = (id) => {
    router.navigate(`/dashboard/${encodeURIComponent(id)}`);
  };

  const renderProjects = () => {
    count.textContent = `${projects.length} Project${projects.length === 1 ? '' : 's'}`;

    if (!projects.length) {
      list.innerHTML = renderEmptyState(
        'No projects yet',
        'Create a new project to begin.'
      );
      return;
    }

    list.innerHTML = projects.map(renderProjectRow).join('');

    list.querySelectorAll('[data-project-id]').forEach((row) => {
      const navigate = () => openProject(row.dataset.projectId);
      row.addEventListener('click', navigate);
      row.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate();
        }
      });
    });
  };

  const createProject = async () => {
    const name = window.prompt('Project name');

    if (!name?.trim()) return;

    try {
      const created = await projectClient.createProject(name.trim());
      projects = [created, ...projects];
      renderProjects();
    } catch (error) {
      list.innerHTML = renderEmptyState(
        error.message || 'Unable to create project.'
      );
    }
  };

  section.querySelector('[data-create]').addEventListener('click', createProject);
  section.querySelector('[data-database]').addEventListener('click', () => {
    router.navigate('/database');
  });
  section.querySelector('[data-settings]').addEventListener('click', () => {
    router.navigate('/settings');
  });

  projectClient
    .listProjects()
    .then((data) => {
      projects = Array.isArray(data) ? data : [];
      renderProjects();
    })
    .catch((error) => {
      list.innerHTML = renderEmptyState(
        error.message || 'Unable to load projects.'
      );
    });

  return section;
}
