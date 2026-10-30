import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatchTimelineEventResponse } from '../../../types/event.types';
import { formatTimeSeconds } from '../../utils/match-review.utils';

/** Eventos de una zona (o de "Sin zona"): tipo, minuto de juego, tiempo y jugador. Presentacional. */
@Component({
  selector: 'app-zone-events-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './zone-events-list.component.html',
  styleUrl: './zone-events-list.component.css'
})
export class ZoneEventsListComponent {
  readonly title = input<string>('Eventos');
  readonly subtitle = input<string>('');
  readonly events = input<MatchTimelineEventResponse[]>([]);
  /** Texto cuando todavía no se eligió qué listar. */
  readonly hint = input<string | null>(null);
  readonly emptyText = input<string>('No hay eventos.');

  time(event: MatchTimelineEventResponse): string {
    return formatTimeSeconds(event.matchTime);
  }

  player(event: MatchTimelineEventResponse): string {
    return event.playerName?.trim() || 'Sin jugador';
  }
}
