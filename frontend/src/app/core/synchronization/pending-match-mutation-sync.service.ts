import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MatchService } from 'src/app/features/match/services/match.service';
import { LocalDatabaseService } from 'src/app/features/local-database/services/local-database.service';
import { MatchStatus, PendingMatchAction, PendingMatchMutation } from 'src/app/features/match/types/match.types';
import { ToastService } from '../services/toast.service';
import { classifySyncError, readSyncErrorMessage } from './sync-errors';

const TARGET_STATUS: Record<PendingMatchAction, MatchStatus> = {
  'start': 'in_progress',
  'close-first-half': 'halftime',
  'start-second-half': 'in_progress',
  'finish': 'finished',
};

@Injectable({ providedIn: 'root' })
export class PendingMatchMutationSyncService {
  private readonly cache = inject(LocalDatabaseService);
  private readonly matchService = inject(MatchService);
  private readonly toastService = inject(ToastService);

  private inFlightFlush: Promise<void> | null = null;

  flush(): Promise<void> {
    this.inFlightFlush ??= this.flushNow().finally(() => {
      this.inFlightFlush = null;
    });
    return this.inFlightFlush;
  }

  private async flushNow(): Promise<void> {
    const pendingMutations = await this.cache.getPendingMatchMutations();

    for (const mutation of pendingMutations) {
      try {
        const serverMatch = await firstValueFrom(
          this.matchService.sendTransition(mutation.matchId, mutation.action, this.occurredAt(mutation)),
        );
        await this.cache.completePendingMatchMutation(mutation, serverMatch);
      } catch (error) {
        if (classifySyncError(error) !== 'rejected') {
          break;
        }

        if (await this.cache.discardPendingMatchMutation(mutation)) {
          await this.realignRejectedMutation(mutation, error);
        }
      }
    }
  }

  private occurredAt(mutation: PendingMatchMutation): string | undefined {
    return mutation.action === 'start' || mutation.action === 'finish'
      ? new Date(mutation.createdAt).toISOString()
      : undefined;
  }

  private async realignRejectedMutation(mutation: PendingMatchMutation, error: unknown): Promise<void> {
    let serverStatus: MatchStatus | null = null;
    try {
      const serverMatch = await firstValueFrom(this.matchService.getLiveMatchState(mutation.matchId));
      await this.cache.saveMatches([serverMatch]);
      serverStatus = serverMatch.status;
    } catch (realignError) {
      console.warn(`Could not realign match ${mutation.matchId} after a rejected mutation.`, realignError);
    }

    if (serverStatus === TARGET_STATUS[mutation.action]) {
      return;
    }

    const reason = readSyncErrorMessage(error) ?? 'El servidor rechazó el cambio.';
    this.toastService.warning(
      `No se pudo sincronizar el cambio de estado del partido: ${reason}`,
      'Sincronización',
    );
  }
}
