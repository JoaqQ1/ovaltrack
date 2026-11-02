/** Duración máxima de las microinteracciones de la pantalla de zonas. */
export const ZONE_MOTION_MS = 250;

/** Interpolación de un conteo: de `from` a `to` según el avance `progress` (0–1), con desaceleración final. */
export function tweenValue(from: number, to: number, progress: number): number {
  const t = Math.min(Math.max(progress, 0), 1);
  const eased = 1 - Math.pow(1 - t, 3);
  return Math.round(from + (to - from) * eased);
}

/** Respeta `prefers-reduced-motion`: con true no se anima nada. Sin `matchMedia` (SSR o tests) se asume sin animación. */
export function prefersReducedMotion(): boolean {
  return typeof matchMedia !== 'function' || matchMedia('(prefers-reduced-motion: reduce)').matches;
}
