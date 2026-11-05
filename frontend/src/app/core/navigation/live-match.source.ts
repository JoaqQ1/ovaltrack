import { Injectable, Signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, from, map, startWith, switchMap } from 'rxjs';
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
 * Lee de Dexie (solo lectura) el partido en curso de las divisiones del usuario.
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
      const matches = await this.cache.getMatchesByStatus(LIVE_STATUSES);
      for (const match of matches) {
        const division = divisions.find(candidate => candidate.id === match.divisionId);
        if (division) {
          return {
            matchId: match.id,
            divisionLabel: division.name,
            homeScore: match.homeScore,
            awayScore: match.awayScore,
          };
        }
      }
    } catch (error) {
      console.error('No se pudo leer el partido en vivo:', error);
    }
    return null;
  }
}
