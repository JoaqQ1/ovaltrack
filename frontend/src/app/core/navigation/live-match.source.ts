import { Injectable, Signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, from, startWith, switchMap } from 'rxjs';
import { LocalDatabaseService } from '../../features/local-database/services/local-database.service';
import { MatchStatus } from '../../features/match/types/match.types';
import { UserContextService } from '../services/user-context.service';
import { LiveMatchSummary } from './navigation.types';

/** Origen del partido en vivo que muestra la barra; permite cambiar la fuente sin tocar la UI. */
export abstract class LiveMatchSource {
  abstract readonly liveMatch: Signal<LiveMatchSummary | null>;
}

const LIVE_STATUSES: readonly MatchStatus[] = ['in_progress', 'halftime'];

/**
 * Lee de Dexie (solo lectura) el partido que este dispositivo está capturando: el último estado de
 * captura guardado cuyo partido sigue en curso. Los partidos en vivo que cargan otros dispositivos
 * no se muestran, para no abrir una segunda captura del mismo partido.
 * Se refresca en cada navegación: el marcador solo cambia en la captura en vivo, que no muestra barra.
 */
@Injectable()
export class DexieLiveMatchSource extends LiveMatchSource {
  private readonly router = inject(Router);
  private readonly cache = inject(LocalDatabaseService);
  private readonly userContext = inject(UserContextService);

  readonly liveMatch = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
      switchMap(() => from(this.findLiveMatch())),
    ),
    { initialValue: null },
  );

  private async findLiveMatch(): Promise<LiveMatchSummary | null> {
    const divisions = this.userContext.activeDivisions();
    if (divisions.length === 0) {
      return null;
    }
    try {
      const states = (await this.cache.getCaptureStates()).sort((a, b) => b.savedAt - a.savedAt);
      for (const state of states) {
        const match = await this.cache.getMatch(state.matchId);
        if (!match || !LIVE_STATUSES.includes(match.status)) {
          continue;
        }
        const division = divisions.find(candidate => candidate.id === match.divisionId);
        if (division) {
          return {
            matchId: match.id,
            status: match.status as LiveMatchSummary['status'],
            divisionLabel: division.name,
            homeScore: state.scoreboard?.home ?? match.homeScore,
            awayScore: state.scoreboard?.away ?? match.awayScore,
          };
        }
      }
    } catch (error) {
      console.error('No se pudo leer el partido en vivo:', error);
    }
    return null;
  }
}
