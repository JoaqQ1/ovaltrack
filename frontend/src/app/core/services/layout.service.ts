import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private readonly router = inject(Router);

  readonly isWide = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => {
        let r = this.router.routerState.snapshot.root;
        while (r.firstChild) {
          r = r.firstChild;
        }
        return r.data['layout'] === 'wide';
      })
    ),
    { initialValue: false }
  );
}
