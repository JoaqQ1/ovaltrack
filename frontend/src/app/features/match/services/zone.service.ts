import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MatchZonesResponse, ZoneAssignmentRequest, ZoneAssignmentResponse } from '../types/zone.types';

@Injectable({ providedIn: 'root' })
export class ZoneService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/matches`;

  list(matchId: string): Observable<MatchZonesResponse> {
    return this.http.get<MatchZonesResponse>(this.zonesUrl(matchId));
  }

  create(matchId: string, request: ZoneAssignmentRequest): Observable<ZoneAssignmentResponse> {
    return this.http.post<ZoneAssignmentResponse>(this.zonesUrl(matchId), request);
  }

  update(matchId: string, zoneId: string, request: ZoneAssignmentRequest): Observable<ZoneAssignmentResponse> {
    return this.http.put<ZoneAssignmentResponse>(`${this.zonesUrl(matchId)}/${zoneId}`, request);
  }

  remove(matchId: string, zoneId: string): Observable<void> {
    return this.http.delete<void>(`${this.zonesUrl(matchId)}/${zoneId}`);
  }

  private zonesUrl(matchId: string): string {
    return `${this.apiUrl}/${matchId}/zones`;
  }
}
