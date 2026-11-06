import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { liveQuery } from 'dexie';
import { from } from 'rxjs';
import { LocalDatabaseService } from '../../features/local-database/services/local-database.service';
import { ConnectivityService } from '../services/connectivity.service';
import { SyncManagerService } from '../synchronization/SyncManagerService';
import { SyncRetryResult, SyncStatus } from './navigation.types';

/** Origen del estado de sincronización que muestra la barra. */
export abstract class SyncStatusSource {
  abstract readonly status: Signal<SyncStatus>;
  abstract retry(): Promise<SyncRetryResult>;
}

export interface SyncStatusInputs {
  pendingCount: number;
  online: boolean;
  retrying: boolean;
}

/** Prioridad: sin red → sincronizando → pendientes → todo sincronizado. */
export function resolveSyncStatus({ pendingCount, online, retrying }: SyncStatusInputs): SyncStatus {
  if (!online) {
    return { state: 'offline', pendingCount };
  }
  if (retrying) {
    return { state: 'syncing', pendingCount };
  }
  return { state: pendingCount > 0 ? 'pending' : 'synced', pendingCount };
}

/**
 * Estado real, de solo lectura: cuenta en Dexie los cambios sin enviar (se actualiza solo vía `liveQuery`)
 * y reintenta con el `SyncManagerService` existente. No cambia cómo ni en qué orden se sincroniza.
 */
@Injectable()
export class LocalSyncStatusSource extends SyncStatusSource {
  private readonly cache = inject(LocalDatabaseService);
  private readonly connectivity = inject(ConnectivityService);
  private readonly syncManager = inject(SyncManagerService);

  private readonly pendingCount = toSignal(
    from(liveQuery(() => this.cache.countPendingChanges())),
    { initialValue: 0 },
  );
  private readonly retrying = signal(false);

  readonly status = computed(() => resolveSyncStatus({
    pendingCount: this.pendingCount(),
    online: this.connectivity.online(),
    retrying: this.retrying(),
  }));

  async retry(): Promise<SyncRetryResult> {
    if (this.retrying()) {
      return 'busy';
    }
    if (!this.connectivity.online()) {
      return 'offline';
    }

    this.retrying.set(true);
    try {
      await this.syncManager.synchronizeAll();
    } finally {
      this.retrying.set(false);
    }

    return await this.cache.countPendingChanges() > 0 ? 'incomplete' : 'done';
  }
}
