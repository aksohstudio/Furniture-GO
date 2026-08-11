import { createRouter } from './router/router.js';
import { AppShell } from './components/AppShell.js';
import { StatusBar } from './components/StatusBar.js';
import { logger } from './utils/logger.js';
import { installErrorHandler } from './utils/error-handler.js';

const root = document.querySelector('#app');
const router = createRouter();
installErrorHandler();

async function render() {
  root.replaceChildren(await AppShell({ router }), StatusBar());
  logger.info('Foundation shell rendered', { route: router.current() });
}

window.addEventListener('hashchange', render);
render();
