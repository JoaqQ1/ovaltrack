import { Injectable, Signal, inject, signal } from '@angular/core';
import { ToastService } from '../services/toast.service';
import { SyncStatus } from './navigation.types';

/** Origen del estado de sincronización que muestra la barra. */
export abstract class SyncStatusSource {
  abstract readonly status: Signal<SyncStatus>;
  abstract retry(): Promise<void>;
}

/**
 * MOCKUP: simula 3 eventos pendientes y un reintento. No toca la sincronización real.
 * TODO: reemplazar por una implementación sobre PendingEventSyncService / LocalDatabaseService.getPendingEvents.
 */
@Injectable()
export class MockSyncStatusSource extends SyncStatusSource {
  private readonly toast = inject(ToastService);
  private readonly pendingCount = 3;
  private readonly state = signal<SyncStatus>({ state: 'pending', pendingCount: this.pendingCount });

  readonly status = this.state.asReadonly();

  async retry(): Promise<void> {
    if (this.state().state === 'syncing') {
      return;
    }
    this.state.set({ state: 'syncing', pendingCount: this.pendingCount });
    this.toast.info('Sincronización simulada: todavía no está conectada.');
    await new Promise(resolve => setTimeout(resolve, 1200));
    this.state.set({ state: 'pending', pendingCount: this.pendingCount });
  }
}
