import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  DivisionCoachResponse,
  DivisionCoachCreationRequest
} from '../features/division-coach/types/division-coach.types';

@Injectable({
  providedIn: 'root'
})
export class DivisionCoachService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/coaches`;

  getByDivisionId(divisionId: string): Observable<DivisionCoachResponse[]> {
    const params = new HttpParams().set('divisionId', divisionId);
    return this.http.get<DivisionCoachResponse[]>(this.apiUrl, { params });
  }

  getById(divisionCoachId: string): Observable<DivisionCoachResponse> {
    return this.http.get<DivisionCoachResponse>(`${this.apiUrl}/${divisionCoachId}`);
  }

  create(request: DivisionCoachCreationRequest): Observable<DivisionCoachResponse> {
    return this.http.post<DivisionCoachResponse>(this.apiUrl, request);
  }

  remove(divisionCoachId: string): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${divisionCoachId}`, {
      responseType: 'text' as 'json'
    });
  }
}