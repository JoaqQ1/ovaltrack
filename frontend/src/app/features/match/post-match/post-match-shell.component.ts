import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { PostMatchShellStore } from './store/post-match-shell.store';

/**
 * Contenedor de las vistas de análisis post-partido (Eventos, Zonas y Estadísticas):
 * carga el partido una sola vez y solo muestra la vista hija cuando está listo.
 */
@Component({
  selector: 'app-post-match-shell',
  standalone: true,
  imports: [RouterOutlet],
  providers: [PostMatchShellStore],
  templateUrl: './post-match-shell.component.html',
  styleUrl: './post-match-shell.component.css'
})
export class PostMatchShellComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly store = inject(PostMatchShellStore);

  constructor() {
    this.route.paramMap.pipe(
      map(params => params.get('id') ?? ''),
      takeUntilDestroyed()
    ).subscribe(id => this.store.load(id));
  }

  goBack(): void {
    this.router.navigate(['/match-history']);
  }
}
