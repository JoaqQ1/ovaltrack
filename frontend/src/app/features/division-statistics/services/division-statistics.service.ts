import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DivisionStatisticsResponse } from '../types/division-statistics.types';

@Injectable({ providedIn: 'root' })
export class DivisionStatisticsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/statistics/division`;

  /** `from` y `to` en formato `YYYY-MM-DD`, ambos inclusive. */
  getDivisionStatistics(divisionId: string, from: string, to: string): Observable<DivisionStatisticsResponse> {
    const id = divisionId?.trim();
    if (!id) {
      throw new Error('divisionId es requerido para consultar estadísticas de división');
    }
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<DivisionStatisticsResponse>(`${this.baseUrl}/${encodeURIComponent(id)}`, { params });
  }
}
