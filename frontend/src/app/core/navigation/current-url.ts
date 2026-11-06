import { Signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

/** URL actual (después de redirecciones) como señal. Se llama en un contexto de inyección. */
export function injectCurrentUrl(): Signal<string> {
  const router = inject(Router);
  return toSignal(
    router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects),
    ),
    { initialValue: router.url },
  );
}
