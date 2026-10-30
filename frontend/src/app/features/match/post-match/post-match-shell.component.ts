import { Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { PostMatchHeaderComponent } from './components/post-match-header/post-match-header.component';
import { PostMatchShellStore } from './store/post-match-shell.store';

/**
 * Contenedor de las vistas de análisis post-partido (Eventos, Zonas y Estadísticas):
 * carga el partido una sola vez, pinta el encabezado común y muestra la vista hija cuando está listo.
 * Las vistas con `data.lockViewport` (Eventos) ocupan exactamente el alto de la ventana.
 */
@Component({
  selector: 'app-post-match-shell',
  standalone: true,
  imports: [RouterOutlet, PostMatchHeaderComponent],
  providers: [PostMatchShellStore],
  templateUrl: './post-match-shell.component.html',
  styleUrl: './post-match-shell.component.css'
})
export class PostMatchShellComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userContext = inject(UserContextService);
  readonly store = inject(PostMatchShellStore);

  readonly ownClubName = computed(() => this.userContext.currentClub()?.name || 'Mi Club');

  readonly lockViewport = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.activeViewLocksViewport())
    ),
    { initialValue: false }
  );

  constructor() {
    this.route.paramMap.pipe(
      map(params => params.get('id') ?? ''),
      takeUntilDestroyed()
    ).subscribe(id => this.store.load(id));
  }

  goBack(): void {
    this.router.navigate(['/match-history']);
  }

  private activeViewLocksViewport(): boolean {
    let active = this.router.routerState.snapshot.root;
    while (active.firstChild) {
      active = active.firstChild;
    }
    return active.data['lockViewport'] === true;
  }
}
