function normalizePath(pathname) {
  if (!pathname) {
    return '/';
  }

  let value = String(pathname);

  if (!value.startsWith('/')) {
    value = `/${value}`;
  }

  if (value.length > 1) {
    value = value.replace(/\/+$/, '');
  }

  return value || '/';
}

function parseLocation() {
  const hash =
    window.location.hash || '';

  if (hash.startsWith('#/')) {
    return hash.slice(1);
  }

  if (hash === '#') {
    return '/';
  }

  return window.location.pathname || '/';
}

export function createRouter() {
  let currentPath =
    normalizePath(
      parseLocation()
    );

  const listeners = new Set();

  const notify = () => {
    currentPath =
      normalizePath(
        parseLocation()
      );

    listeners.forEach(
      (listener) => listener(currentPath)
    );
  };

  window.addEventListener(
    'hashchange',
    notify
  );

  window.addEventListener(
    'popstate',
    notify
  );

  return {
    current() {
      return currentPath;
    },

    navigate(pathname) {
      const target =
        normalizePath(pathname);

      if (
        window.location.hash ===
        `#${target}`
      ) {
        notify();
        return;
      }

      window.location.hash =
        target;

      currentPath =
        target;
    },

    replace(pathname) {
      const target =
        normalizePath(pathname);

      const url =
        `${window.location.pathname}` +
        `${window.location.search}` +
        `#${target}`;

      window.history.replaceState(
        {},
        '',
        url
      );

      currentPath =
        target;

      notify();
    },

    subscribe(listener) {
      if (
        typeof listener !==
        'function'
      ) {
        return () => {};
      }

      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },

    destroy() {
      window.removeEventListener(
        'hashchange',
        notify
      );

      window.removeEventListener(
        'popstate',
        notify
      );

      listeners.clear();
    },
  };
}

export const router =
  createRouter();