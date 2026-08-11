const routes = Object.freeze({
  '/': { name: 'Projects' }, '/projects': { name: 'Projects' }, '/dashboard': { name: 'Project Dashboard' }, '/settings': { name: 'Project Settings' }, '/database': { name: 'Database' }, '/account': { name: 'Account' },
});

export function createRouter() {
  return {
    current() {
      const route = window.location.hash.slice(1) || '/';
      return route.startsWith('/dashboard/') ? '/dashboard' : (routes[route] ? route.split('?')[0] : '/projects');
    },
    resolve() {
      return routes[this.current()];
    },
    navigate(route) {
      window.location.hash = route;
    },
  };
}
