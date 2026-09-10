import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClubService {
  private http = inject(HttpClient);
  
  private apiUrl = `${environment.apiUrl}/club`; 

  constructor() { }

  getClubes(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  createClub(club : any): Observable<any> {
    return this.http.post<any>(this.apiUrl, club);
  }

  getUsuarios(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/user`);
  }
}