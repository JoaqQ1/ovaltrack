import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Division, DivisionCreationRequest, DivisionUpdateRequest } from '../features/division/types/division.types';

@Injectable({
  providedIn: 'root'
})
export class DivisionService {
  private readonly http = inject(HttpClient);
  
  private readonly apiUrl = `${environment.apiUrl}/division`; 

  getDivisiones(clubId: string): Observable<Division[]> {
    const params = new HttpParams().set('clubId', clubId);
    return this.http.get<Division[]>(this.apiUrl, { params });
  }

  getDivisionById(id: string): Observable<Division> {
    return this.http.get<Division>(`${this.apiUrl}/${id}`);
  }

  createDivision(division: DivisionCreationRequest): Observable<Division> {
    return this.http.post<Division>(this.apiUrl, division);
  }

  updateDivision(id: string, division: DivisionUpdateRequest): Observable<Division> {
    return this.http.put<Division>(`${this.apiUrl}/${id}`, division);
  }

  deleteDivision(id: string): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${id}`, { responseType: 'text' as 'json' });
  }
}