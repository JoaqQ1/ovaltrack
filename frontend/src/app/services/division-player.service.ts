import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { DivisionPlayerResponse } from '../features/division-player/type/division-player.types';
import { ResultsPage } from '../features/pagination/results-page';

@Injectable({
  providedIn: 'root'
})
export class DivisionPlayerService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/players`; 

  registerPlayer(playerData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, playerData);
  }

  getByDivisionIdAndPersonId(divisionId: string, personId: string): Observable<DivisionPlayerResponse[]> {
    const params = new HttpParams({
      fromObject: {
        divisionId,
        personId
      }
    });
    return this.http.get<DivisionPlayerResponse[]>(`${this.apiUrl}/history`, { params });
  }

  getActiveByDivisionId(divisionId: string, page: number, size: number): Observable<ResultsPage> {
    const params = new HttpParams()
      .set('divisionId', divisionId)
      .set('page', page - 1)
      .set('size', size);
    return this.http.get<ResultsPage>(this.apiUrl, { params });
  }

  remove(divisionPlayerId: string): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${divisionPlayerId}`, {
      responseType: 'text' as 'json'
    });
  }
}