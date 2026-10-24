import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom, timeout } from 'rxjs';
import { EventService } from 'src/app/features/match/services/event.service';
import { LocalDatabaseService } from 'src/app/features/local-database/services/local-database.service';
import { BackendEventResponse, LocalMatchEvent } from 'src/app/features/match/types/event.types';
import { ToastService } from '../services/toast.service';
import { classifySyncError, readSyncErrorMessage } from './sync-errors';

/** Pasado este tiempo el envío se da por fallido y el evento queda pendiente para el próximo flush. */
const EVENT_SYNC_TIMEOUT_MS = 15_000;

/** Único punto de envío de eventos pendientes (captura en vivo y sincronización en segundo plano). */
@Injectable({ providedIn: 'root' })
export class PendingEventSyncService {
  private readonly cache = inject(LocalDatabaseService);
  private readonly eventService = inject(EventService);
  private readonly toastService = inject(ToastService);

  private flushQueue: Promise<unknown> = Promise.resolve();

  /**
   * Envía los eventos pendientes en orden de captura. Las llamadas se serializan para que dos
   * flushes simultáneos no envíen el mismo evento ni pisen la escritura del otro.
   * @returns los eventos que quedaron sincronizados en esta pasada.
   */
  flush(matchId?: string): Promise<LocalMatchEvent[]> {
    const run = this.flushQueue.then(() => this.flushNow(matchId));
    this.flushQueue = run.catch(() => undefined);
    return run;
  }

  private async flushNow(matchId?: string): Promise<LocalMatchEvent[]> {
    const pendingEvents = await this.cache.getPendingEvents(matchId);
    const synchronizedEvents: LocalMatchEvent[] = [];
    const rejectionMessages: string[] = [];

    for (const event of pendingEvents) {
      try {
        const response = await firstValueFrom(this.send(event));
        const synchronizedEvent = await this.cache.markEventSynchronized(event, response);
        if (synchronizedEvent) {
          synchronizedEvents.push(synchronizedEvent);
        }
      } catch (error) {
        if (classifySyncError(error) === 'rejected') {
          // Un rechazo no se resuelve reintentando: se aparta el evento para no bloquear al resto.
          const message = readSyncErrorMessage(error) ?? 'El servidor rechazó el evento.';
          if (await this.cache.markEventSyncFailed(event, message)) {
            rejectionMessages.push(message);
          }
          continue;
        }

        // Sin red, timeout, 5xx o sesión vencida: los siguientes fallarían igual.
        await this.cache.recordEventSyncAttempt(event.id);
        break;
      }
    }

    if (rejectionMessages.length > 0) {
      this.notifyRejectedEvents(rejectionMessages);
    }

    return synchronizedEvents;
  }

  private send(event: LocalMatchEvent): Observable<BackendEventResponse> {
    const request$ = !event.active && event.backendEventId != null
      ? this.eventService.delete(event.backendEventId)
      : this.eventService.createFromLocal(event);

    return request$.pipe(timeout(EVENT_SYNC_TIMEOUT_MS));
  }

  private notifyRejectedEvents(messages: string[]): void {
    const summary = messages.length === 1
      ? 'Un evento no se pudo sincronizar'
      : `${messages.length} eventos no se pudieron sincronizar`;

    this.toastService.error(
      `${summary}: ${messages[0]} Quedan guardados en este dispositivo.`,
      'Sincronización',
    );
  }
}
