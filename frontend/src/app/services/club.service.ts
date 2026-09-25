import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Club, ClubCreateRequest, ClubUpdateRequest } from '../features/club/types/club.types';

@Injectable({
  providedIn: 'root'
})
export class ClubService {
  private readonly http = inject(HttpClient);
  
  private readonly apiUrl = `${environment.apiUrl}/club`; 

  getClubs(): Observable<Club[]> {
    return this.http.get<Club[]>(this.apiUrl);
  }

  getClubes(): Observable<Club[]> {
    return this.getClubs();
  }

  getMyClub(): Observable<Club> {
    return this.http.get<Club>(`${this.apiUrl}/my-club`);
  }

  createClub(club: ClubCreateRequest): Observable<Club> {
    return this.http.post<Club>(this.apiUrl, club);
  }

  updateClub(id: string, club: ClubUpdateRequest): Observable<Club> {
    return this.http.put<Club>(`${this.apiUrl}/${id}`, club);
  }

  getUsers(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${environment.apiUrl}/user`);
  }

  getUsuarios(): Observable<unknown[]> {
    return this.getUsers();
  }
}