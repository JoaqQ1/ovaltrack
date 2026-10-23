import { Injectable, effect, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { EventTypeService } from 'src/app/features/match/services/event-type.service';
import { EventService } from 'src/app/features/match/services/event.service';
import { MatchService } from 'src/app/features/match/services/match.service';
import { UserContextService } from '../services/user-context.service';
import { LocalDatabaseService } from 'src/app/features/local-database/services/local-database.service';

@Injectable({ providedIn: 'root' })
export class SyncManagerService {
  private readonly cache = inject(LocalDatabaseService);
  private readonly matchService = inject(MatchService);
  private readonly eventService = inject(EventService);
  private readonly eventTypeService = inject(EventTypeService);
  private readonly userCtxService = inject(UserContextService)

  private isSyncing = false;
  private hasSynced = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.hasSynced = false;
        void this.synchronizeAll();
      });

      effect(() => {
        const context = this.userCtxService.userContext();
        if (context && navigator.onLine && !this.hasSynced) {
          this.hasSynced = true;
          void this.synchronizeAll();
        }
      });
    }
  }

  async synchronizeAll(): Promise<void> {
    if (this.isSyncing || !navigator.onLine || !this.userCtxService.userContext()) {
      return;
    }

    this.isSyncing = true;

    try {
      await this.syncEventTypes();
      await this.flushMatchMutations();
      await this.flushPendingEvents();
    } catch (error) {
      console.error('Background synchronization failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncEventTypes(): Promise<void> {
    try {
      const eventTypes = await firstValueFrom(this.eventTypeService.getAll());
      if (eventTypes && eventTypes.length > 0) {
        await this.cache.saveEventTypes(eventTypes);
      }
    } catch (error) {
      console.warn('Could not sync event types in background:', error);
    }
  }

  private async flushMatchMutations(): Promise<void> {
    const pendingMutations = await this.cache.getPendingMatchMutations();
    if (pendingMutations.length === 0) return;

    for (const mutation of pendingMutations) {
      try {
        let request$;
        switch (mutation.action) {
          case 'start':
            request$ = this.matchService.startMatch(mutation.matchId);
            break;
          case 'close-first-half':
            request$ = this.matchService.closeFirstHalf(mutation.matchId);
            break;
          case 'start-second-half':
            request$ = this.matchService.startSecondHalf(mutation.matchId);
            break;
          case 'finish':
            request$ = this.matchService.finishMatch(mutation.matchId);
            break;
        }

        if (request$) {
          await firstValueFrom(request$);
          await this.cache.deletePendingMatchMutation(mutation.id);
        }
      } catch (error: any) {
        if (error?.status === 409) {
          console.warn(`Match mutation conflict (409) for ${mutation.matchId}. Aligning state...`);
          await this.cache.deletePendingMatchMutation(mutation.id);
          continue;
        }

        if (error?.status >= 400 && error?.status < 500 && error?.status !== 401 && error?.status !== 403) {
          await this.cache.deletePendingMatchMutation(mutation.id);
          continue;
        }
        
        break;
      }
    }
  }

  private async flushPendingEvents(): Promise<void> {
    const pendingEvents = await this.cache.getPendingEvents();
    if (pendingEvents.length === 0) return;

    for (const event of pendingEvents) {
      try {
        if (!event.active && event.backendEventId != null) {
          const res = await firstValueFrom(this.eventService.delete(event.backendEventId));
          await this.cache.saveEvent({ ...event, synchronizedAt: res.synchronizedAt });
        } else {
          const res = await firstValueFrom(this.eventService.createFromLocal(event));
          await this.cache.saveEvent({
            ...event,
            backendEventId: res.id,
            synchronizedAt: res.synchronizedAt,
          });
        }
      } catch (error) {
        break;
      }
    }
  }
}