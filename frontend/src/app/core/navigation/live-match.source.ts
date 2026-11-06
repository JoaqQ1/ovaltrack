import { Injectable, Signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, from, startWith, switchMap, tap } from 'rxjs';
import { LocalDatabaseService } from '../../features/local-database/services/local-database.service';
import { MatchStatus } from '../../features/match/types/match.types';
import { UserContextService } from '../services/user-context.service';
import { LiveMatchSummary } from './navigation.types';

/** Origen del partido en vivo que muestra la barra; permite cambiar la fuente sin tocar la UI. */
export abstract class LiveMatchSource {
  abstract readonly liveMatch: Signal<LiveMatchSummary | null>;
}

const LIVE_STATUSES: readonly MatchStatus[] = ['in_progress', 'halftime'];
const VISITS_KEY = 'ovaltrack.live-match-visits';
const LIVE_URL = /^\/live-capture\/([^/?#]+)(?:\/halftime)?(?:[?#].*)?$/;

/**
 * Lee de Dexie (solo lectura) el partido que este dispositivo está capturando: el último que abrió en
 * la captura o en el entretiempo (estado de captura guardado o visita registrada aquí) y que sigue en
 * curso. Los partidos en vivo que cargan otros dispositivos no se muestran, para no abrir una segunda
 * captura del mismo partido.
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
      tap(event => this.recordVisit(event.urlAfterRedirects)),
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
      const states = await this.cache.getCaptureStates();
      const openedAt = new Map(Object.entries(this.readVisits()));
      for (const state of states) {
        openedAt.set(state.matchId, Math.max(state.savedAt, openedAt.get(state.matchId) ?? 0));
      }
      const scoreboards = new Map(states.map(state => [state.matchId, state.scoreboard]));
      const recent = [...openedAt.entries()].sort((a, b) => b[1] - a[1]);
      for (const [matchId] of recent) {
        const match = await this.cache.getMatch(matchId);
        if (!match || !LIVE_STATUSES.includes(match.status)) {
          continue;
        }
        const division = divisions.find(candidate => candidate.id === match.divisionId);
        if (division) {
          return {
            matchId: match.id,
            status: match.status as LiveMatchSummary['status'],
            divisionLabel: division.name,
            homeScore: scoreboards.get(matchId)?.home ?? match.homeScore,
            awayScore: scoreboards.get(matchId)?.away ?? match.awayScore,
          };
        }
      }
    } catch (error) {
      console.error('No se pudo leer el partido en vivo:', error);
    }
    return null;
  }

  private recordVisit(url: string): void {
    const matchId = LIVE_URL.exec(url)?.[1];
    if (!matchId) {
      return;
    }
    try {
      localStorage.setItem(VISITS_KEY, JSON.stringify({ ...this.readVisits(), [matchId]: Date.now() }));
    } catch {
      // Sin almacenamiento solo se pierde el recuerdo de la visita.
    }
  }

  private readVisits(): Record<string, number> {
    try {
      return JSON.parse(localStorage.getItem(VISITS_KEY) ?? '{}') as Record<string, number>;
    } catch {
      return {};
    }
  }
}
