import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MatchService } from 'src/app/features/match/services/match.service';
import { EventService } from 'src/app/features/match/services/event.service';
import { LocalDatabaseService } from 'src/app/features/local-database/services/local-database.service';
import { MatchStatus } from 'src/app/features/match/types/match.types';
import { classifySyncError } from './sync-errors';

/** Partidos cuyo estado puede seguir cambiando en el servidor (otro dispositivo, marcador recalculado). */
const ACTIVE_STATUSES: readonly MatchStatus[] = ['in_progress', 'halftime'];

@Injectable({ providedIn: 'root' })
export class ActiveMatchPullService {
  private readonly cache = inject(LocalDatabaseService);
  private readonly matchService = inject(MatchService);
  private readonly eventService = inject(EventService);

  async pull(): Promise<void> {
    const [activeMatches, pendingMutations] = await Promise.all([
      this.cache.getMatchesByStatus(ACTIVE_STATUSES),
      this.cache.getPendingMatchMutations(),
    ]);
    const matchesWithPendingTransition = new Set(pendingMutations.map(mutation => mutation.matchId));

    for (const match of activeMatches) {
      if (matchesWithPendingTransition.has(match.id)) {
        continue;
      }

      try {
        const serverMatch = await firstValueFrom(this.matchService.getLiveMatchState(match.id));
        await this.cache.saveMatches([serverMatch]);
        const remoteEvents = await firstValueFrom(this.eventService.getByMatch(match.id));
        await this.cache.mergeRemoteEvents(match.id, remoteEvents);
      } catch (error) {
        if (classifySyncError(error) !== 'rejected') {
          break;
        }
      }
    }
  }
}
