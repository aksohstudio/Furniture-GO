import { projectClient } from '../services/project-client.js';

const workspaceModules = [
  ['CAD Workspace', 'Professional graphical drawing environment', 'cad-workspace', 'cad'],
  ['Furniture Object Editor', 'Project-scoped furniture object data and hierarchy', 'furniture-objects', 'cabinet'],
  ['Furniture 3D Workspace', 'Visualization of confirmed Furniture Objects', 'furniture-3d', 'cube'],
  ['Production Drawing', 'Read-only production documentation workspace', 'production-drawing', 'drawing'],
  ['Cutting List', 'Cutting List Workspace foundation', 'cutting-list', 'cut'],
  ['Original PDF', '查看 / 导入设计师 PDF', 'original-pdf', 'pdf'],
  ['Backup PDF', '可编辑工程工作副本', 'backup-pdf', 'edit'],
  ['Production Review', '检查与确认生产信息', 'production-review', 'review'],
  ['Purchase List', '板材与五金', 'purchase-list', 'cart'],
  ['Cutting Summary', '板材开料汇总', 'cutting-summary', 'cut'],
  ['Cabinet Production', '给组装工人的柜体生产清单', 'cabinet-production', 'cabinet'],
  ['Production Requirements', '生产要求总览', 'production-requirements', 'bolt'],
  ['Project Documents', '项目文件 / 导出 / 打印', 'project-documents', 'folder'],
];

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
  if (!value) return '未提供';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '未提供';
  }

  return date.toLocaleString('zh-CN');
}

function collectEntities(project, type) {
  const result = [];

  const visit = (node) => {
    if (node?.type === type) {
      result.push(node);
    }

    (node?.children || []).forEach(visit);
  };

  (project.hierarchy?.floors || []).forEach(visit);

  return result;
}

function getProjectStatusClass(project) {
  const status = String(
    project?.project?.status ||
    project?.project?.workflowStatus ||
    ''
  ).toLowerCase();

  if (status.includes('archive')) {
    return 'project-status-dot--archived';
  }

  if (status.includes('trash')) {
    return 'project-status-dot--trash';
  }

  return 'project-status-dot--active';
}

/* -------------------------------------------------------
   图标
------------------------------------------------------- */

function renderIcon(type) {
  const icons = {
    pdf: `
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M13 5h17l9 9v29H13z" fill="none" stroke="currentColor" stroke-width="2.5"/>
        <path d="M30 5v10h9" fill="none" stroke="currentColor" stroke-width="2.5"/>
        <path d="M18 29h4c3 0 4-2 4-4s-1-4-4-4h-4v12m0-6h4" fill="none" stroke="currentColor" stroke-width="2.5"/>
      </svg>
    `,

    edit: `
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="9" y="7" width="27" height="34" rx="3"
          fill="none" stroke="currentColor" stroke-width="2.5"/>
        <path d="M17 16h11M17 22h11" fill="none"
          stroke="currentColor" stroke-width="2.5"/>
        <path d="M28 29l7-7 4 4-7 7-6 2z"
          fill="none" stroke="currentColor" stroke-width="2.5"/>
      </svg>
    `,

    review: `
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M24 6l17 31H7z"
          fill="none" stroke="currentColor" stroke-width="2.5"
          stroke-linejoin="round"/>
        <path d="M24 17v10M24 32v1"
          fill="none" stroke="currentColor" stroke-width="3"
          stroke-linecap="round"/>
      </svg>
    `,

    cart: `
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M7 10h5l4 21h20l5-15H14"
          fill="none" stroke="currentColor" stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="20" cy="38" r="2.5" fill="currentColor"/>
        <circle cx="34" cy="38" r="2.5" fill="currentColor"/>
      </svg>
    `,

    cut: `
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M10 34l13-13M25 23l13-13"
          fill="none" stroke="currentColor" stroke-width="3"
          stroke-linecap="round"/>
        <path d="M12 13l7 7M29 30l7 7"
          fill="none" stroke="currentColor" stroke-width="2.5"
          stroke-linecap="round"/>
        <path d="M8 38h32"
          fill="none" stroke="currentColor" stroke-width="2"/>
      </svg>
    `,

    cabinet: `
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="9" y="6" width="30" height="36" rx="2"
          fill="none" stroke="currentColor" stroke-width="2.5"/>
        <path d="M24 6v36"
          fill="none" stroke="currentColor" stroke-width="2"/>
        <circle cx="19" cy="24" r="1.5" fill="currentColor"/>
        <circle cx="29" cy="24" r="1.5" fill="currentColor"/>
      </svg>
    `,

    bolt: `
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M28 5L13 27h10l-3 16 15-22H25z"
          fill="none" stroke="currentColor" stroke-width="2.5"
          stroke-linejoin="round"/>
      </svg>
    `,

    folder: `
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M5 12a4 4 0 014-4h12l5 5h13a4 4 0 014 4v19a4 4 0 01-4 4H9a4 4 0 01-4-4z"
          fill="none" stroke="currentColor" stroke-width="2.5"
          stroke-linejoin="round"/>
      </svg>
    `,
  };

  return icons[type] || icons.folder;
}

/* -------------------------------------------------------
   左侧项目栏
------------------------------------------------------- */

function renderProjectSidebar(project) {
  return `
    <aside class="project-home-sidebar">

      <div class="project-home-sidebar__brand">
        <span class="project-brand-mark">
          GO
        </span>

        <div>
          <strong>家具 GO</strong>
          <small>项目主页</small>
        </div>
      </div>

      <div class="project-home-sidebar__toolbar">

        <button
          class="project-home-filter"
          type="button"
          data-route="/projects"
        >
          <span>全部项目</span>
          <strong>9</strong>
        </button>

        <button
          class="home-new-button"
          type="button"
          data-new-project
        >
          ＋ 新建项目
        </button>

      </div>

      <nav class="project-home-nav">

        <button
          class="project-home-nav__item is-active"
          type="button"
          data-route="/projects"
        >
          <span>全部项目</span>
        </button>

        <button
          class="project-home-nav__item"
          type="button"
        >
          <span>已归档</span>
          <strong>0</strong>
        </button>

        <button
          class="project-home-nav__item"
          type="button"
        >
          <span>回收站</span>
          <strong>0</strong>
        </button>

      </nav>

      <div class="project-home-sidebar__project">

        <button
          class="home-project-row is-selected"
          type="button"
        >
          <div class="home-project-row__title">

            <span class="home-project-folder">
              ${renderIcon('folder')}
            </span>

            <div>
              <h3>
                ${escapeHtml(project.project.name)}
              </h3>

              <p>
                <span class="project-status-dot project-status-dot--active"></span>
                ${escapeHtml(project.project.status || '可生产')}
              </p>
            </div>

            <span class="home-project-row__chevron">
              ›
            </span>

          </div>

          <p class="home-project-row__summary">
            房间 · 柜体 · 项目资料
          </p>

          <p class="home-project-row__date">
            ${formatDate(project.project.updatedAt)}
          </p>

        </button>

      </div>

      <div class="project-home-sidebar__links">

        <button
          class="button"
          type="button"
          data-route="/database"
        >
          官方数据库
        </button>

        <button
          class="button"
          type="button"
          data-route="/settings"
        >
          设置
        </button>

      </div>

    </aside>
  `;
}

/* -------------------------------------------------------
   项目顶部
------------------------------------------------------- */

function renderProjectHeader(project) {
  const statusClass = getProjectStatusClass(project);

  return `
    <div class="home-overview-header">

      <div class="home-project-heading">

        <div class="home-folder-large">
          ${renderIcon('folder')}
        </div>

        <div>

          <div class="home-project-title-line">
            <h2>
              ${escapeHtml(project.project.name)}
            </h2>

            <button
              class="home-edit-project"
              type="button"
              aria-label="编辑项目名称"
            >
              ✎
            </button>
          </div>

          <p class="home-project-date">
            创建：${formatDate(project.project.createdAt)}
            · 最后打开：${formatDate(project.project.updatedAt)}
          </p>

        </div>

      </div>

      <div class="home-overview-actions">

        <button
          class="button primary home-import-pdf-button"
          type="button"
          data-import-pdf
        >
          Import Designer PDF
        </button>

        <button
          class="button"
          type="button"
          data-settings
        >
          ⚙ 项目设置
        </button>

      </div>

    </div>
  `;
}

/* -------------------------------------------------------
   8 个功能模块
------------------------------------------------------- */

function renderWorkspaceModules() {
  return workspaceModules.map(
    ([title, description, action, icon]) => `
      <button
        class="home-module-card home-module-card--${escapeHtml(icon)}"
        type="button"
        data-action="${escapeHtml(action)}"
      >

        <span class="home-module-icon" aria-hidden="true">
          ${renderIcon(icon)}
        </span>

        <strong>
          ${escapeHtml(title)}
        </strong>

        <small>
          ${escapeHtml(description)}
        </small>

        <em>
          ${
            action === 'original-pdf' ||
            action === 'backup-pdf' ||
            action === 'cutting-list'
              ? '可用'
              : '即将推出'
          }
        </em>

      </button>
    `
  ).join('');
}

/* -------------------------------------------------------
   房间 / 柜体
------------------------------------------------------- */

function renderRooms(project) {
  const rooms = collectEntities(project, 'Room');

  if (!rooms.length) {
    return `
      <div class="home-panel-empty">
        暂无房间数据
      </div>
    `;
  }

  return rooms.map((room) => {

    const furniture = (room.children || []).filter(
      (item) => item.type === 'Furniture'
    );

    const cabinets = furniture.flatMap((item) =>
      (item.children || []).filter(
        (child) => ['Cabinet', 'Module'].includes(child.type)
      )
    );

    return `
      <button
        class="home-room-row"
        type="button"
      >

        <span class="room-icon" aria-hidden="true">
          ${renderIcon('cabinet')}
        </span>

        <div>
          <strong>
            ${escapeHtml(room.name || '未命名房间')}
          </strong>

          <small>
            ${cabinets.length} 个柜体
          </small>
        </div>

        <span class="home-room-count">
          ${cabinets.length} 个柜体
        </span>

        <span class="home-room-arrow">
          ›
        </span>

      </button>
    `;
  }).join('');
}

/* -------------------------------------------------------
   项目汇总
------------------------------------------------------- */

function renderProjectSummary(
  rooms,
  cabinets,
  furnitureObjects,
  project
) {
  const revision = project.project.activeRevisionId
    ? '已创建'
    : '未创建';

  const snapshot = project.project.activeSnapshotId
    ? '可用'
    : '未创建';

  return `
    <div class="home-summary-list">

      <div>
        <span>柜体总数</span>
        <strong>${cabinets.length}</strong>
      </div>

      <div>
        <span>家具对象</span>
        <strong>${furnitureObjects.length}</strong>
      </div>

      <div>
        <span>房间数量</span>
        <strong>${rooms.length}</strong>
      </div>

      <div>
        <span>材料种类</span>
        <strong>—</strong>
      </div>

      <div>
        <span>生产要求</span>
        <strong>—</strong>
      </div>

      <div>
        <span>采购品项</span>
        <strong>—</strong>
      </div>

      <div>
        <span>Revision</span>
        <strong>${revision}</strong>
      </div>

      <div>
        <span>Snapshot</span>
        <strong>${snapshot}</strong>
      </div>

      <div class="home-summary-status">
        <span>状态</span>

        <strong>
          <span class="project-status-dot project-status-dot--active"></span>
          ${escapeHtml(project.project.status || '可生产')}
        </strong>
      </div>

    </div>
  `;
}

/* -------------------------------------------------------
   最近活动
------------------------------------------------------- */

function renderActivity(project) {
  const history = Array.isArray(project.history)
    ? project.history.slice().reverse().slice(0, 5)
    : [];

  if (!history.length) {
    return `
      <div class="home-panel-empty">
        暂无最近活动
      </div>
    `;
  }

  return history.map((item) => `
    <div class="home-activity-row">

      <span class="home-activity-icon">
        ${renderIcon('folder')}
      </span>

      <strong>
        ${escapeHtml(item.type || '项目活动')}
      </strong>

      <time>
        ${formatDate(item.createdAt)}
      </time>

      <span class="home-activity-user">
        您
      </span>

    </div>
  `).join('');
}

/* -------------------------------------------------------
   Dashboard
------------------------------------------------------- */

export async function ProjectDashboard({ projectId, router }) {
  const project = await projectClient.getProject(projectId);

  const section = document.createElement('section');

  section.className = 'page project-workspace-page';

  const rooms = collectEntities(project, 'Room');

  const cabinets = [
    ...collectEntities(project, 'Cabinet'),
    ...collectEntities(project, 'Module'),
  ];

  const furnitureObjects = Array.isArray(project.furnitureObjects)
    ? project.furnitureObjects
    : [];

  section.innerHTML = `
    <div class="project-home-shell">

      ${renderProjectSidebar(project)}

      <main class="project-home-main">

        ${renderProjectHeader(project)}

        <section class="home-module-grid">
          ${renderWorkspaceModules()}
        </section>

        <section class="home-overview-grid">

          <div class="home-panel">

            <div class="home-panel-heading">

              <div>
                <p class="eyebrow">
                  项目结构
                </p>

                <h3>
                  房间 / 柜体列表
                </h3>
              </div>

              <span class="muted">
                ${rooms.length} 个房间
              </span>

            </div>

            <div class="home-room-list">
              ${renderRooms(project)}
            </div>

            <button
              class="home-add-room"
              type="button"
            >
              ＋ 添加房间 / 柜体
            </button>

          </div>

          <div class="home-panel">

            <div class="home-panel-heading">

              <div>
                <p class="eyebrow">
                  项目汇总
                </p>

                <h3>
                  项目统计
                </h3>
              </div>

            </div>

            ${renderProjectSummary(
              rooms,
              cabinets,
              furnitureObjects,
              project
            )}

          </div>

        </section>

        <section class="home-panel home-activity-panel">

          <div class="home-panel-heading">

            <div>
              <p class="eyebrow">
                最近活动
              </p>

              <h3>
                项目历史
              </h3>
            </div>

            <button
              class="button"
              type="button"
              data-back
            >
              查看全部活动 ›
            </button>

          </div>

          <div class="home-activity-list">
            ${renderActivity(project)}
          </div>

        </section>

        <section class="home-panel home-working-panel">

          <div class="home-panel-heading">

            <div>
              <p class="eyebrow">
                当前状态
              </p>

              <h3>
                Working State
              </h3>
            </div>

            <span class="status-pill">
              ${escapeHtml(project.workingState?.status || 'Working')}
            </span>

          </div>

          <textarea
            data-working-state
            rows="5"
            placeholder="添加工作备注..."
          >${escapeHtml(project.workingState?.note || '')}</textarea>

          <button
            class="button primary"
            type="button"
            data-save
          >
            保存当前状态
          </button>

          <p
            class="muted"
            data-save-status
          >
            保存后仍处于 Working State。
          </p>

        </section>

      </main>

    </div>
  `;

  /* ---------------------------------------------------
     导航
  --------------------------------------------------- */

  section
    .querySelectorAll('[data-route]')
    .forEach((button) => {
      button.addEventListener('click', () => {
        router.navigate(button.dataset.route);
      });
    });

  section
    .querySelector('[data-back]')
    .addEventListener('click', () => {
      router.navigate('/projects');
    });

  section
    .querySelector('[data-settings]')
    .addEventListener('click', () => {
      router.navigate(
        `/settings?project=${encodeURIComponent(projectId)}`
      );
    });

  section
    .querySelector('[data-import-pdf]')
    .addEventListener('click', () => {
      router.navigate(
        `/designer-pdf-import/${encodeURIComponent(projectId)}`
      );
    });

  section
    .querySelector('[data-new-project]')
    .addEventListener('click', () => {
      router.navigate('/projects');
    });

  /* ---------------------------------------------------
     功能模块
  --------------------------------------------------- */

  section
    .querySelectorAll('[data-action]')
    .forEach((button) => {

      button.addEventListener('click', () => {

        const action = button.dataset.action;

        if (action === 'original-pdf') {
          router.navigate(
            `/recognition/${encodeURIComponent(projectId)}`
          );
          return;
        }

        if (action === 'backup-pdf') {
          router.navigate(
            `/backup-pdf/${encodeURIComponent(projectId)}`
          );
          return;
        }

        if (action === 'cad-workspace') {
          router.navigate(
            `/cad/${encodeURIComponent(projectId)}`
          );
          return;
        }

        if (action === 'furniture-objects') {
          router.navigate(
            `/furniture-objects/${encodeURIComponent(projectId)}`
          );
          return;
        }

        if (action === 'furniture-3d') {
          router.navigate(
            `/furniture-3d/${encodeURIComponent(projectId)}`
          );
          return;
        }

        if (action === 'production-drawing') {
          router.navigate(
            `/production-drawing/${encodeURIComponent(projectId)}`
          );
          return;
        }

        if (action === 'cutting-list') {
          router.navigate(
            `/cutting-list/${encodeURIComponent(projectId)}`
          );
          return;
        }

        if (action === 'purchase-list') {
          router.navigate(
            `/purchase-list/${encodeURIComponent(projectId)}`
          );
          return;
        }

        window.alert(
          `${button.querySelector('strong')?.textContent || '此功能'} 暂未开放。`
        );
      });

    });

  /* ---------------------------------------------------
     Working State
  --------------------------------------------------- */

  section
    .querySelector('[data-save]')
    .addEventListener('click', async () => {

      const status = section.querySelector('[data-save-status]');

      const note = section
        .querySelector('[data-working-state]')
        .value;

      try {

        await projectClient.saveWorkingState(projectId, {
          note,
          productionSettings:
            project.workingState?.productionSettings || {},
        });

        status.textContent = '已保存。';

      } catch (error) {

        status.textContent =
          error.message || '保存失败。';

      }

    });

  return section;
}
