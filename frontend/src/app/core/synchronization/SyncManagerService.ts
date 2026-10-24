import { Injectable, effect, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { EventTypeService } from 'src/app/features/match/services/event-type.service';
import { UserContextService } from '../services/user-context.service';
import { LocalDatabaseService } from 'src/app/features/local-database/services/local-database.service';
import { PendingMatchMutationSyncService } from './pending-match-mutation-sync.service';
import { PendingEventSyncService } from './pending-event-sync.service';

@Injectable({ providedIn: 'root' })
export class SyncManagerService {
  private readonly cache = inject(LocalDatabaseService);
  private readonly pendingMatchMutationSync = inject(PendingMatchMutationSyncService);
  private readonly pendingEventSync = inject(PendingEventSyncService);
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
      await this.pendingMatchMutationSync.flush();
      await this.pendingEventSync.flush();
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
}
