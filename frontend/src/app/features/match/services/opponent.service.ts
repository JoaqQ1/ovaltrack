import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Opponent {
  id?: string; // Opcional porque al crear no tenemos ID aún
  name: string;
  city: string;
  alias: string;
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

  createOpponent(opponent: Opponent): Observable<Opponent> {
    return this.http.post<Opponent>(this.apiUrl, opponent);
  }

  updateOpponent(id: string, opponent: Opponent): Observable<Opponent> {
    return this.http.put<Opponent>(`${this.apiUrl}/${id}`, opponent);
  }

  deleteOpponent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}