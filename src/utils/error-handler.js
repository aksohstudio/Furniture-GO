import { logger } from './logger.js';

export function installErrorHandler() {
  window.addEventListener('error', (event) => {
    logger.error('Unhandled application error', { message: event.message });
  });
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', { reason: String(event.reason) });
  });
}
