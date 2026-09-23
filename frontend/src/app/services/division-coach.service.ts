import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  DivisionCoach,
  DivisionCoachCreationRequest
} from '../features/division-coach/types/division-coach.types';

@Injectable({
  providedIn: 'root'
})
export class DivisionCoachService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/coaches`;

  getByDivisionId(divisionId: string): Observable<DivisionCoach[]> {
    const params = new HttpParams().set('divisionId', divisionId);
    return this.http.get<DivisionCoach[]>(this.apiUrl, { params });
  }

  getById(divisionCoachId: string): Observable<DivisionCoach> {
    return this.http.get<DivisionCoach>(`${this.apiUrl}/${divisionCoachId}`);
  }

  create(request: DivisionCoachCreationRequest): Observable<DivisionCoach> {
    return this.http.post<DivisionCoach>(this.apiUrl, request);
  }

  remove(divisionCoachId: string): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${divisionCoachId}`, {
      responseType: 'text' as 'json'
    });
  }
}