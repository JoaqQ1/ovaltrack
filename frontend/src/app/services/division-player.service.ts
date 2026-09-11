import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DivisionPlayerService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/players`; 

  registerPlayer(playerData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, playerData);
  }
}