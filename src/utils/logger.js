const prefix = '[Furniture GO]';

export const logger = Object.freeze({
  info(message, context = {}) {
    console.info(prefix, message, context);
  },
  warn(message, context = {}) {
    console.warn(prefix, message, context);
  },
  error(message, context = {}) {
    console.error(prefix, message, context);
  },
});
