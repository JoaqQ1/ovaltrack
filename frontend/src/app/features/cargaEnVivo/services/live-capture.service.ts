import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import {
  LiveCaptureBackendResponse,
  LiveCaptureBackendQuery,
} from '../types/live-capture.types';
import { LIVE_CAPTURE_MOCK_RESPONSE } from '../data/live-capture.mock';

export const LIVE_CAPTURE_BACKEND_CONTRACT = [
  'Match identification with clubId, divisionId, and matchId.',
  'Initial state with scoreboard, game clock, period, possession, synchronization, and paused clock.',
  'Active event catalog grouped by visual category.',
  'Recent history with minute and interface-readable description.',
  'Event metadata to distinguish scoring, possession, and player requirements.',
] as const;

@Injectable({
  providedIn: 'root',
})
export class LiveCaptureService {
  getLiveCaptureBootstrap(query: LiveCaptureBackendQuery): Observable<LiveCaptureBackendResponse> {
    return of(this.resolveResponse(query)).pipe(delay(250));
  }

  private resolveResponse(query: LiveCaptureBackendQuery) {
    return {
      ...LIVE_CAPTURE_MOCK_RESPONSE,
      query,
    };
  }
}
