import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SyncStatus } from '../../../../core/navigation/navigation.types';

/** Aviso de sincronización: solo se muestra cuando hay algo que informar. */
@Component({
  selector: 'app-nav-sync-status',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (status().state !== 'synced') {
      <button
        type="button"
        class="sync"
        [class.sync--offline]="status().state === 'offline'"
        [attr.aria-label]="fullText()"
        (click)="activate.emit()"
      >
        <i class="bi" [class.bi-arrow-repeat]="status().state !== 'offline'" [class.bi-wifi-off]="status().state === 'offline'"
           [class.spin]="status().state === 'syncing'" aria-hidden="true"></i>
        <span class="sync-full">{{ fullText() }}</span>
        @if (status().pendingCount > 0) {
          <span class="sync-count" aria-hidden="true">{{ status().pendingCount }}</span>
        }
      </button>
    }
  `,
  styleUrl: './nav-sync-status.component.css'
})
export class NavSyncStatusComponent {
  readonly status = input.required<SyncStatus>();
  /** Se emite al tocar el aviso (la barra abre el menú de usuario). */
  readonly activate = output<void>();

  readonly fullText = computed(() => {
    const { state, pendingCount } = this.status();
    if (state === 'offline') {
      return 'Sin conexión';
    }
    if (state === 'syncing') {
      return 'Sincronizando…';
    }
    return pendingCount === 1 ? '1 sin sincronizar' : `${pendingCount} sin sincronizar`;
  });
}
