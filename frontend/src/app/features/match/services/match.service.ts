import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BackendMatchResponse, Match, MatchStatus, NewMatchDraft } from '../types/match.types';
import { TEMPORARY_DIVISION_ID } from '../data/match.constants';

@Injectable({ providedIn: 'root' })
export class MatchService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/matches`;

  getMatches(): Observable<Match[]> {
    return this.http.get<BackendMatchResponse[]>(`${this.apiUrl}/division?divisionId=${TEMPORARY_DIVISION_ID}`).pipe(
      map(matches => matches.map(match => ({
          ...match,
          status: this.normalizeStatus(match.status),
          opponent: match.opponent ?? '',
          date: match.date ?? ''
        })))
    );
  }

  createMatch(draft: NewMatchDraft): Observable<Match> {
    const formattedDate = draft.date.includes('T')
      ? draft.date
      : `${draft.date}T00:00:00`;

    const payload = {
      date: formattedDate,
      divisionId: TEMPORARY_DIVISION_ID,
      opponent: draft.opponent.trim()
    };

    return this.http.post<BackendMatchResponse>(this.apiUrl, payload).pipe(
      map(match => ({
        ...match,
        status: this.normalizeStatus(match.status),
        opponent: match.opponent ?? '',
        date: match.date ?? ''
      }))
    );
  }

  private normalizeStatus(status: BackendMatchResponse['status']): MatchStatus {
    return status.toLowerCase() as MatchStatus;
  }

  deleteMatch(matchId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${matchId}/cancel`);
  }

  getMatchById(matchId: string): Observable<Match>{
    return this.http.get<Match>(`${environment.apiUrl}/matches/${matchId}`);
  }

}