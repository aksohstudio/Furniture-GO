import { ProjectList } from './ProjectList.js';
import { ProjectDashboard } from './ProjectDashboard.js';
import { BoundaryPage } from './BoundaryPage.js';
import { RecognitionWorkspace } from './RecognitionWorkspace.js';
import { EngineeringReviewPanel } from './EngineeringReviewPanel.js';
import { DesignerPdfImport } from './DesignerPdfImport.js';
import { BackupPdfCreation } from './BackupPdfCreation.js';
import { PdfViewer } from './PdfViewer.js';
import { SiteSurvey } from './SiteSurvey.js';
import { CadWorkspace } from './CadWorkspace.js';
import { FurnitureObjectEditor } from './FurnitureObjectEditor.js';
import { Furniture3DWorkspace } from './Furniture3DWorkspace.js';
import { ProductionDrawingWorkspace } from './ProductionDrawingWorkspace.js';
import { CuttingListWorkspace } from './CuttingListWorkspace.js';
import { PurchaseListWorkspace } from './PurchaseListWorkspace.js';

export async function AppShell({ router }) {
  const currentPath =
    router.current().split('?')[0];

  const isProductRoute =
    currentPath === '/' ||
    currentPath === '/projects' ||
    currentPath === '/account' ||
    currentPath === '/settings' ||
    currentPath === '/database' ||
    currentPath.startsWith('/dashboard/') ||
    currentPath.startsWith('/recognition/') ||
    currentPath.startsWith('/engineering-review/') ||
    currentPath.startsWith('/designer-pdf-import/') ||
    currentPath.startsWith('/backup-pdf/') ||
    currentPath.startsWith('/pdf-viewer/') ||
    currentPath.startsWith('/site-survey/') ||
    currentPath.startsWith('/cad/') ||
    currentPath.startsWith('/furniture-3d/') ||
    currentPath.startsWith('/furniture-objects/') ||
    currentPath.startsWith('/production-drawing/') ||
    currentPath.startsWith('/cutting-list/') ||
    currentPath.startsWith('/purchase-list/');

  const shell =
    document.createElement('main');

  shell.className =
    `app-shell ${
      isProductRoute
        ? 'app-shell--product'
        : ''
    }`;

  shell.innerHTML = `
    <header class="topbar">

      <button
        class="brand-mark"
        type="button"
        data-route="/projects"
        aria-label="Furniture GO"
      >
        GO
      </button>

      <div>
        <p class="eyebrow">
          Furniture GO
        </p>

        <h1>
          Workspace
        </h1>
      </div>

      <nav class="topbar-nav">

        <button
          class="nav-button"
          type="button"
          data-route="/projects"
        >
          Project List
        </button>

        <button
          class="nav-button"
          type="button"
          data-route="/database"
        >
          Database
        </button>

        <button
          class="nav-button"
          type="button"
          data-route="/settings"
        >
          Settings
        </button>

      </nav>

    </header>

    <section class="workspace">

      <div class="workspace-card">

        <div id="page-root"></div>

      </div>

    </section>
  `;

  shell
    .querySelectorAll('[data-route]')
    .forEach((button) => {
      button.addEventListener(
        'click',
        () => {
          router.navigate(
            button.dataset.route
          );
        }
      );
    });

  const pageRoot =
    shell.querySelector(
      '#page-root'
    );

  /*
   * =====================================================
   * Project Dashboard
   * =====================================================
   */

  if (
    currentPath.startsWith(
      '/dashboard/'
    )
  ) {
    try {
      const projectId =
        decodeURIComponent(
          currentPath.split('/')[2]
        );

      pageRoot.replaceWith(
        await ProjectDashboard({
          projectId,
          router,
        })
      );
    } catch (error) {
      pageRoot.innerHTML = `
        <div class="empty-state">
          ${escapeError(error)}
        </div>
      `;
    }

    return shell;
  }

  /*
   * =====================================================
   * Recognition Workspace
   * =====================================================
   */

  if (
    currentPath.startsWith(
      '/recognition/'
    )
  ) {
    try {
      const projectId =
        decodeURIComponent(
          currentPath.split('/')[2]
        );

      pageRoot.replaceWith(
        await RecognitionWorkspace({
          projectId,
          router,
        })
      );
    } catch (error) {
      pageRoot.innerHTML = `
        <div class="empty-state">
          ${escapeError(error)}
        </div>
      `;
    }

    return shell;
  }

  /*
   * =====================================================
   * Engineering Review
   * =====================================================
   */

  if (
    currentPath.startsWith(
      '/engineering-review/'
    )
  ) {
    try {
      const projectId =
        decodeURIComponent(
          currentPath.split('/')[2]
        );

      pageRoot.replaceWith(
        await EngineeringReviewPanel({
          projectId,
        })
      );
    } catch (error) {
      pageRoot.innerHTML = `
        <div class="empty-state">
          ${escapeError(error)}
        </div>
      `;
    }

    return shell;
  }

  /*
   * =====================================================
   * Designer PDF Import
   * =====================================================
   */

  if (
    currentPath.startsWith(
      '/designer-pdf-import/'
    )
  ) {
    try {
      const projectId =
        decodeURIComponent(
          currentPath.split('/')[2]
        );

      pageRoot.replaceWith(
        await DesignerPdfImport({
          projectId,
          router,
        })
      );
    } catch (error) {
      pageRoot.innerHTML = `
        <div class="empty-state">
          ${escapeError(error)}
        </div>
      `;
    }

    return shell;
  }

  /*
   * =====================================================
   * Backup PDF
   * =====================================================
   */

  if (
    currentPath.startsWith(
      '/backup-pdf/'
    )
  ) {
    try {
      const projectId =
        decodeURIComponent(
          currentPath.split('/')[2]
        );

      pageRoot.replaceWith(
        await BackupPdfCreation({
          projectId,
          router,
        })
      );
    } catch (error) {
      pageRoot.innerHTML = `
        <div class="empty-state">
          ${escapeError(error)}
        </div>
      `;
    }

    return shell;
  }

  /*
   * =====================================================
   * PDF Viewer
   * =====================================================
   */

  if (
    currentPath.startsWith(
      '/pdf-viewer/'
    )
  ) {
    try {
      const projectId =
        decodeURIComponent(
          currentPath.split('/')[2]
        );

      pageRoot.replaceWith(
        await PdfViewer({
          projectId,
          router,
        })
      );
    } catch (error) {
      pageRoot.innerHTML = `
        <div class="empty-state">
          ${escapeError(error)}
        </div>
      `;
    }

    return shell;
  }

  if (
    currentPath.startsWith(
      '/site-survey/'
    )
  ) {
    try {
      const projectId = decodeURIComponent(
        currentPath.split('/')[2]
      );
      pageRoot.replaceWith(
        await SiteSurvey({ projectId, router })
      );
    } catch (error) {
      pageRoot.innerHTML = `
        <div class="empty-state">
          ${escapeError(error)}
        </div>
      `;
    }
    return shell;
  }

  if (
    currentPath.startsWith(
      '/cad/'
    )
  ) {
    try {
      const projectId = decodeURIComponent(
        currentPath.split('/')[2]
      );
      pageRoot.replaceWith(
        await CadWorkspace({ projectId, router })
      );
    } catch (error) {
      pageRoot.innerHTML = `
        <div class="empty-state">
          ${escapeError(error)}
        </div>
      `;
    }
    return shell;
  }

  if (currentPath.startsWith('/furniture-3d/')) {
    try {
      const projectId = decodeURIComponent(currentPath.split('/')[2]);
      pageRoot.replaceWith(
        await Furniture3DWorkspace({ projectId, router })
      );
    } catch (error) {
      pageRoot.innerHTML = `
        <div class="empty-state">
          ${escapeError(error)}
        </div>
      `;
    }
    return shell;
  }

  if (currentPath.startsWith('/furniture-objects/')) {
    try {
      const projectId = decodeURIComponent(currentPath.split('/')[2]);
      pageRoot.replaceWith(
        await FurnitureObjectEditor({ projectId, router })
      );
    } catch (error) {
      pageRoot.innerHTML = `
        <div class="empty-state">
          ${escapeError(error)}
        </div>
      `;
    }
    return shell;
  }

  if (currentPath.startsWith('/production-drawing/')) {
    try {
      const projectId = decodeURIComponent(currentPath.split('/')[2]);
      pageRoot.replaceWith(
        await ProductionDrawingWorkspace({ projectId, router })
      );
    } catch (error) {
      pageRoot.innerHTML = `
        <div class="empty-state">
          ${escapeError(error)}
        </div>
      `;
    }
    return shell;
  }

  if (currentPath.startsWith('/cutting-list/')) {
    try {
      const projectId = decodeURIComponent(currentPath.split('/')[2]);
      pageRoot.replaceWith(
        await CuttingListWorkspace({ projectId, router })
      );
    } catch (error) {
      pageRoot.innerHTML = `
        <div class="empty-state">
          ${escapeError(error)}
        </div>
      `;
    }
    return shell;
  }

  if (currentPath.startsWith('/purchase-list/')) {
    try {
      const projectId = decodeURIComponent(currentPath.split('/')[2]);
      pageRoot.replaceWith(
        await PurchaseListWorkspace({ projectId, router })
      );
    } catch (error) {
      pageRoot.innerHTML = `
        <div class="empty-state">
          ${escapeError(error)}
        </div>
      `;
    }
    return shell;
  }

  /*
   * =====================================================
   * Settings
   * =====================================================
   */

  if (
    currentPath ===
    '/settings'
  ) {
    pageRoot.replaceWith(
      BoundaryPage({
        router,
        kind: 'settings',
      })
    );

    return shell;
  }

  /*
   * =====================================================
   * Database
   * =====================================================
   */

  if (
    currentPath ===
    '/database'
  ) {
    pageRoot.replaceWith(
      BoundaryPage({
        router,
        kind: 'database',
      })
    );

    return shell;
  }

  /*
   * =====================================================
   * Account
   * =====================================================
   */

  if (
    currentPath ===
    '/account'
  ) {
    pageRoot.replaceWith(
      BoundaryPage({
        router,
        kind: 'account',
      })
    );

    return shell;
  }

  /*
   * =====================================================
   * Default — Project List
   * =====================================================
   */

  pageRoot.replaceWith(
    ProjectList({
      router,

      onOpen: (id) => {
        router.navigate(
          `/dashboard/${encodeURIComponent(id)}`
        );
      },
    })
  );

  return shell;
}

function escapeError(error) {
  return String(
    error?.message ||
    'Unable to load this page.'
  ).replace(
    /[&<>"']/g,
    (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[character])
  );
}
