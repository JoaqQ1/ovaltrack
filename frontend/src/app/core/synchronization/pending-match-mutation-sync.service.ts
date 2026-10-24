import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MatchService } from 'src/app/features/match/services/match.service';
import { LocalDatabaseService } from 'src/app/features/local-database/services/local-database.service';
import { MatchStatus, PendingMatchAction, PendingMatchMutation } from 'src/app/features/match/types/match.types';
import { ToastService } from '../services/toast.service';
import { classifySyncError, readSyncErrorMessage } from './sync-errors';

/** Estado en el que queda el partido cuando el servidor acepta cada transición. */
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

  async flush(): Promise<void> {
    const pendingMutations = await this.cache.getPendingMatchMutations();

    for (const mutation of pendingMutations) {
      try {
        // Se usa sendTransition y no startMatch/finishMatch/...: esos métodos vuelven a
        // encolar la mutación ante un fallo de red y la reportan como exitosa.
        const serverMatch = await firstValueFrom(this.matchService.sendTransition(mutation.matchId, mutation.action));
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

  /** Reemplaza el estado optimista local por el del servidor y avisa si la transición no se aplicó. */
  private async realignRejectedMutation(mutation: PendingMatchMutation, error: unknown): Promise<void> {
    let serverStatus: MatchStatus | null = null;
    try {
      const serverMatch = await firstValueFrom(this.matchService.getLiveMatchState(mutation.matchId));
      await this.cache.saveMatches([serverMatch]);
      serverStatus = serverMatch.status;
    } catch (realignError) {
      console.warn(`Could not realign match ${mutation.matchId} after a rejected mutation.`, realignError);
    }

    // Una transición repetida (p. ej. tras un timeout) puede rechazarse aunque ya se haya aplicado.
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
