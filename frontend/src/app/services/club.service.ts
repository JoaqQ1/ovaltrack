import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { ClubSummary } from '../features/division/types/division.types';

@Injectable({
  providedIn: 'root'
})
export class ClubService {
  private readonly http = inject(HttpClient);
  
  private readonly apiUrl = `${environment.apiUrl}/club`; 

  getClubes(): Observable<ClubSummary[]> {
    return this.http.get<ClubSummary[]>(this.apiUrl);
  }

  getMyClub(): Observable<ClubSummary> {
    return this.http.get<ClubSummary>(`${this.apiUrl}/my-club`);
  }

  createClub(club : any): Observable<any> {
    return this.http.post<any>(this.apiUrl, club);
  }

  getUsuarios(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/user`);
  }
}