import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BackendEventCreationRequest, BackendEventResponse } from '../types/event.types';

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/event`;

  getByMatch(matchId: string): Observable<BackendEventResponse[]> {
    return this.http.get<BackendEventResponse[]>(`${this.apiUrl}/match?matchId=${matchId}`);
  }

  create(request: BackendEventCreationRequest): Observable<BackendEventResponse> {
    return this.http.post<BackendEventResponse>(this.apiUrl, request);
  }

  delete(eventId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${eventId}`);
  }
}