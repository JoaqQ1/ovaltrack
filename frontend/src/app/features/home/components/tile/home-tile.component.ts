import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { formatLocalClock } from '../../domain/match-time';
import { WidgetState } from '../../types/home.types';

/**
 * Tarjeta del Inicio: rótulo y título fijos, y según `state` muestra skeleton, vacío, error o el contenido.
 * El contenido con datos va como hijo; el estado vacío, en `[tileEmpty]`.
 */
@Component({
  selector: 'app-home-tile',
  standalone: true,
  templateUrl: './home-tile.component.html',
  styleUrl: './home-tile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeTileComponent {
  readonly label = input.required<string>();
  readonly title = input.required<string>();
  readonly state = input.required<WidgetState<unknown>>();
  readonly retry = output<void>();

  /** "Datos de 14:05" si el dato salió del snapshot guardado; `null` si es reciente. */
  readonly staleSeal = computed(() => {
    const state = this.state();
    return state.status === 'ready' && state.stale ? `Datos de ${formatLocalClock(state.fetchedAt)}` : null;
  });

  readonly errorMessage = computed(() => {
    const state = this.state();
    return state.status === 'error' ? state.message : '';
  });
}
