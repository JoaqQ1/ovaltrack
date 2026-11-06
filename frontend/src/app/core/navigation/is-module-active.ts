import { NavModule } from './navigation.types';

function pathOf(url: string): string {
  return url.split(/[?#]/)[0] || '/';
}

function matchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

/** Indica si la URL actual corresponde al módulo (ruta propia o prefijos de `activeAlso`). */
export function isModuleActive(module: NavModule, url: string): boolean {
  const route = module.route;
  if (route === null) {
    return false;
  }
  const path = pathOf(url);
  if (module.exact) {
    return path === route || (route === '/home' && path === '/');
  }
  return matchesPrefix(path, route) || (module.activeAlso ?? []).some(prefix => matchesPrefix(path, prefix));
}
