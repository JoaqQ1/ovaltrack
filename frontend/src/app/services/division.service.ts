import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, catchError, from, map, switchMap, throwError } from 'rxjs';
import { Division, DivisionCreationRequest, DivisionUpdateRequest } from '../features/division/types/division.types';
import { LiveCaptureCacheService } from '../features/match/services/live-capture-cache.service';

@Injectable({
  providedIn: 'root'
})
export class DivisionService {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(LiveCaptureCacheService);
  
  private readonly apiUrl = `${environment.apiUrl}/division`; 

  getDivisiones(clubId: string): Observable<Division[]> {
    const params = new HttpParams().set('clubId', clubId);
    return this.http.get<Division[]>(this.apiUrl, { params }).pipe(
      switchMap(divisions => from(this.cache.saveDivisions(divisions)).pipe(map(() => divisions))),
      catchError(() => from(this.cache.getDivisionsByClub(clubId)).pipe(
        switchMap(divisions => divisions.length > 0
          ? from([divisions])
          : throwError(() => new Error(`No hay divisiones almacenadas para el club ${clubId}`)))
      ))
    );
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