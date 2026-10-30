import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, from, map, of, shareReplay, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PlayerMatchDTO, PlayerMatchSource, PlayerMatchStatistic } from '../types/player-statistics.types';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { LocalDatabaseService } from '../../local-database/services/local-database.service';
import { EventTypeService } from '../../match/services/event-type.service';
import { LiveCaptureService } from '../../match/services/live-capture.service';
import { StatisticCalculationService } from '../../match/statistics/services/statistic-calculation.service';
import { RosterPlayerInfo } from '../../match/statistics/calculators';
import { LocalMatchEvent } from '../../match/types/event.types';

@Injectable({ providedIn: 'root' })
export class PlayerStatisticsService {
  private readonly http = inject(HttpClient);
  private readonly userContext = inject(UserContextService);
  private readonly cache = inject(LocalDatabaseService);
  private readonly eventTypeService = inject(EventTypeService);
  private readonly liveCaptureService = inject(LiveCaptureService);
  private readonly statisticService = inject(StatisticCalculationService);
  private readonly apiUrl = `${environment.apiUrl}/matches`;

  /** Catálogo de tipos activos: se pide una sola vez y lo comparten todos los partidos. */
  private readonly eventTypes$ = this.eventTypeService.getAll().pipe(shareReplay(1));

  /** Partidos finalizados en los que jugó el usuario autenticado, del más reciente al más antiguo. */
  getMyMatches(): Observable<PlayerMatchDTO[]> {
    return this.http.get<PlayerMatchDTO[]>(`${this.apiUrl}/me`);
  }

  /** Estadísticas de todos los partidos jugados, en el mismo orden que `getMyMatches`. */
  loadAllMatchStatistics(): Observable<PlayerMatchStatistic[]> {
    return this.getMyMatches().pipe(
      switchMap(matches => matches.length === 0
        ? of([])
        : forkJoin(matches.map(match => this.loadMatchStatistic(match))))
    );
  }

  /** Un partido jugado por el usuario autenticado; `null` si no estuvo en ese plantel. */
  getMyMatch(matchId: string): Observable<PlayerMatchDTO | null> {
    return this.getMyMatches().pipe(
      map(matches => matches.find(match => match.matchId === matchId) ?? null)
    );
  }

  /** Eventos y catálogo de un partido: se cargan una vez y el cálculo por período se hace en memoria. */
  loadMatchSource(matchId: string): Observable<PlayerMatchSource> {
    return forkJoin({
      events: this.loadEvents(matchId),
      eventTypes: this.eventTypes$,
    });
  }

  /**
   * Estadísticas del usuario autenticado en un partido, con los mismos calculadores del post-partido
   * (vista `full`). Sin período: partido completo.
   */
  loadMatchStatistic(match: PlayerMatchDTO, period?: number): Observable<PlayerMatchStatistic> {
    return this.loadMatchSource(match.matchId).pipe(
      map(source => this.computeMatchStatistic(match, source, period))
    );
  }

  /** Calcula las estadísticas del usuario autenticado sobre datos ya cargados, sin consultas. */
  computeMatchStatistic(match: PlayerMatchDTO, source: PlayerMatchSource, period?: number): PlayerMatchStatistic {
    const personId = this.userContext.personId();
    if (!personId) {
      throw new Error('El usuario autenticado no tiene una persona asociada');
    }

    const me: RosterPlayerInfo = {
      playerId: personId,
      // Slot 0 no existe en la planilla: sin slot solo se atribuyen los eventos por playerId.
      jerseyNumber: match.slotNumber ?? 0,
      playerName: this.userContext.fullName(),
      isStarter: match.role === 'TITULAR',
    };

    const { columns, players } = this.statisticService.computePlayerStatistics(
      source.events, [me], source.eventTypes, 'full', period
    );
    return { match, columns, stat: players[0] };
  }

  /** Trae los eventos del backend a la caché local; si falla, usa lo que ya haya en IndexedDB. */
  private loadEvents(matchId: string): Observable<LocalMatchEvent[]> {
    return this.liveCaptureService.hydrateMatchEvents(matchId).pipe(
      catchError(() => of(null)),
      switchMap(() => from(this.cache.getEventsByMatch(matchId)))
    );
  }
}
