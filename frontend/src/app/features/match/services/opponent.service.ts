import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Opponent {
  id: string;
  name: string;
  city: string;
}

@Injectable({
  providedIn: 'root'
})
export class OpponentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/opponents`; 

  getAllOpponents(): Observable<Opponent[]> {
    return this.http.get<Opponent[]>(this.apiUrl);
  }
}