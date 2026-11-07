import { InjectionToken } from '@angular/core';

/** Limpieza de datos propios de una feature que no debe sobrevivir al cierre de sesión. */
export type SessionCleanup = () => void;

/**
 * Token multi: cada feature registra su limpieza sin que `auth` la conozca (DIP).
 * Se ejecuta al cerrar sesión y cuando el backend responde 401.
 */
export const SESSION_CLEANUP = new InjectionToken<readonly SessionCleanup[]>('SESSION_CLEANUP');

/** Ejecuta todas las limpiezas; si una falla, las demás se ejecutan igual. */
export function runSessionCleanups(cleanups: readonly SessionCleanup[]): void {
  for (const cleanup of cleanups) {
    try {
      cleanup();
    } catch (error) {
      console.error('Falló una limpieza de sesión:', error);
    }
  }
}
