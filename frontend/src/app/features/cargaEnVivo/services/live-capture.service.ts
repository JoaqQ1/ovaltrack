import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import {
  LiveCaptureBackendQuery,
  LiveCaptureBackendState,
} from '../types/live-capture.types';
import { LIVE_CAPTURE_MOCK_RESPONSE } from '../data/live-capture.mock';

export const LIVE_CAPTURE_BACKEND_CONTRACT = [
  'Identificación del partido con clubId, divisionId y matchId.',
  'Estado inicial con marcador, reloj, periodo, posesión, sincronización y reloj pausado.',
  'Catálogo de eventos activos agrupados por categoría visual.',
  'Historial reciente con minuto y descripción legible para la interfaz.',
  'Metadatos del evento para distinguir scoring, posesión y necesidad de jugador.',
] as const;

@Injectable({
  providedIn: 'root',
})
export class LiveCaptureService {
  getLiveCaptureBootstrap(query: LiveCaptureBackendQuery): Observable<LiveCaptureBackendState> {
    return of(this.resolveResponse(query).state).pipe(delay(250));
  }

  private resolveResponse(query: LiveCaptureBackendQuery) {
    return {
      ...LIVE_CAPTURE_MOCK_RESPONSE,
      query,
    };
  }
}
