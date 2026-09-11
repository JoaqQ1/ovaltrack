import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DivisionService {
  private http = inject(HttpClient);
  
  private apiUrl = `${environment.apiUrl}/division`; 

  constructor() { }

  getDivisiones(clubId: string): Observable<any> {
    const params = new HttpParams().set('clubId', clubId);
    return this.http.get<any>(this.apiUrl, { params });
  }

  getDivisionById(id: number | string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createDivision(division: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, division);
  }

  updateDivision(id: number | string, division: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, division);
  }

  deleteDivision(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}