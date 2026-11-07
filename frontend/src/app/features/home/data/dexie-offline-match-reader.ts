import { Injectable, inject } from '@angular/core';
import { LocalDatabaseService } from '../../local-database/services/local-database.service';
import { LocalMatchEvent } from '../../match/types/event.types';
import { Match } from '../../match/types/match.types';
import { CaptureProgress, OfflineMatchReader } from './offline-match-reader';

/** Implementación sobre Dexie: usa solo los métodos de lectura de `LocalDatabaseService`. */
@Injectable()
export class DexieOfflineMatchReader extends OfflineMatchReader {
  private readonly cache = inject(LocalDatabaseService);

  async isReadyOffline(match: Pick<Match, 'id' | 'divisionId'>): Promise<boolean> {
    try {
      const [cachedMatch, roster, eventTypes, players] = await Promise.all([
        this.cache.getMatch(match.id),
        this.cache.getRoster(match.id),
        this.cache.getActiveEventTypes(),
        this.cache.getPersonsByDivisionId(match.divisionId)
      ]);
      return Boolean(cachedMatch)
        && (roster?.startingPlayers.length ?? 0) > 0
        && eventTypes.length > 0
        && players.length > 0;
    } catch {
      return false;
    }
  }

  async recentEvents(matchId: string, limit: number): Promise<LocalMatchEvent[]> {
    try {
      const events = await this.cache.getEventsByMatch(matchId);
      return events.slice(-limit).reverse();
    } catch {
      return [];
    }
  }

  async captureProgress(matchId: string): Promise<CaptureProgress | null> {
    try {
      const { state } = await this.cache.getStatusData(matchId);
      return state
        ? {
            periodLabel: state.periodLabel,
            gameClock: state.gameClock,
            homeScore: state.scoreboard?.home ?? null,
            awayScore: state.scoreboard?.away ?? null
          }
        : null;
    } catch {
      return null;
    }
  }

  async eventTypeNames(): Promise<Record<string, string>> {
    try {
      const eventTypes = await this.cache.getActiveEventTypes();
      return Object.fromEntries(eventTypes.map(eventType => [eventType.id, eventType.name]));
    } catch {
      return {};
    }
  }
}
