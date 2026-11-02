import { DestroyRef, Signal, signal } from '@angular/core';

/** Ancho máximo de la pantalla angosta: el mismo corte que usa la hoja inferior del formulario (CSS). */
export const ZONE_COMPACT_QUERY = '(max-width: 576px)';

/** Si la pantalla es angosta, siguiendo los cambios (ej. girar el teléfono). Sin `matchMedia` (SSR o tests) es false. */
export function watchCompactLayout(destroyRef: DestroyRef): Signal<boolean> {
  if (typeof matchMedia !== 'function') return signal(false).asReadonly();

  const query = matchMedia(ZONE_COMPACT_QUERY);
  const compact = signal(query.matches);
  const onChange = (event: MediaQueryListEvent): void => compact.set(event.matches);
  query.addEventListener('change', onChange);
  destroyRef.onDestroy(() => query.removeEventListener('change', onChange));
  return compact.asReadonly();
}
