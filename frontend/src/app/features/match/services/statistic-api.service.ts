import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PeriodStatisticDTO } from '../types/statistic.types';

@Injectable({ providedIn: 'root' })
export class StatisticApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/statistics`;

  getPeriodStatistics(matchId: string, period: number = 1): Observable<PeriodStatisticDTO> {
    return this.http.get<PeriodStatisticDTO>(`${this.baseUrl}/match/${matchId}?period=${period}`);
  }
}
