import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PlayerMatchDTO } from '../types/player-statistics.types';

@Injectable({ providedIn: 'root' })
export class PlayerStatisticsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/matches`;

  /** Partidos finalizados en los que jugó el usuario autenticado, del más reciente al más antiguo. */
  getMyMatches(): Observable<PlayerMatchDTO[]> {
    return this.http.get<PlayerMatchDTO[]>(`${this.apiUrl}/me`);
  }
}
