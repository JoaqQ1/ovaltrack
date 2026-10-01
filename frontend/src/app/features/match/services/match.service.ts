import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, map, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BackendMatchResponse, LiveMatchStateRequest, Match, MatchStatus, NewMatchDraft } from '../types/match.types';
import { BackendRosterResponse, RosterPayload, SavedRoster } from '../types/roster.types';
import { PeriodStatisticDTO } from '../types/statistic.types';
import { LiveCaptureBootstrapResponse } from '../types/live-capture.types';
import { TEMPORARY_DIVISION_ID } from '../data/match.constants';
import { LiveCaptureCacheService } from './live-capture-cache.service';
import { StatisticApiService } from './statistic-api.service';

@Injectable({ providedIn: 'root' })
export class MatchService {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(LiveCaptureCacheService);
  private readonly statisticApiService = inject(StatisticApiService);
  private readonly apiUrl = `${environment.apiUrl}/matches`;

  getMatches(divisionId: string = TEMPORARY_DIVISION_ID): Observable<Match[]> {
    return this.http.get<BackendMatchResponse[]>(`${this.apiUrl}/division?divisionId=${divisionId}`).pipe(
      map(matches => matches.map(match => ({
        ...match,
        status: this.normalizeStatus(match.status),
        opponent: match.opponent ?? '',
        date: match.date ?? ''
      })))
    );
  }

  createMatch(draft: NewMatchDraft, divisionId: string = TEMPORARY_DIVISION_ID): Observable<Match> {
    const formattedDate = draft.date.includes('T')
      ? draft.date
      : `${draft.date}T00:00:00`;

    const payload = {
      date: formattedDate,
      divisionId: divisionId,
      opponent: draft.opponent.trim()
    };

    return this.http.post<BackendMatchResponse>(this.apiUrl, payload).pipe(
      map(match => this.normalizeMatch(match)),
      switchMap(match => from(this.cache.saveMatches([match])).pipe(
        map(() => match)
      ))
    );
  }

  closeFirstHalf(matchId: string): Observable<BackendMatchResponse> {
    return this.http.put<BackendMatchResponse>(`${this.apiUrl}/${matchId}/close-first-half`, {});
  }

  startSecondHalf(matchId: string): Observable<BackendMatchResponse> {
    return this.http.put<BackendMatchResponse>(`${this.apiUrl}/${matchId}/start-second-half`, {});
  }

  getPeriodStatistics(matchId: string, period: number = 1): Observable<PeriodStatisticDTO> {
    return this.statisticApiService.getPeriodStatistics(matchId, period);
  }

  private normalizeMatch(match: BackendMatchResponse): Match {
    return {
      ...match,
      status: this.normalizeStatus(match.status),
      opponent: match.opponent ?? '',
      date: match.date ?? ''
    };
  }

  private normalizeStatus(status: BackendMatchResponse['status']): MatchStatus {
    return status.toLowerCase() as MatchStatus;
  }

  startMatch(matchId: string): Observable<BackendMatchResponse> {
    return this.http.put<BackendMatchResponse>(`${this.apiUrl}/${matchId}/start`, {});
  }

  finishMatch(matchId: string): Observable<BackendMatchResponse> {
    return this.http.put<BackendMatchResponse>(`${this.apiUrl}/${matchId}/finish`, {});
  }

  deleteMatch(matchId: string): Observable<BackendMatchResponse> {
    return this.http.delete<BackendMatchResponse>(`${this.apiUrl}/${matchId}/cancel`);
  }

  getMatchById(matchId: string): Observable<Match> {
    return this.http.get<BackendMatchResponse>(`${this.apiUrl}/${matchId}`).pipe(
      map(match => this.normalizeMatch(match)),
      switchMap(match => from(this.cache.saveMatches([match])).pipe(
        map(() => match)
      ))
    );
  }

  getLiveMatchState(matchId: string): Observable<Match> {
    return this.http.get<BackendMatchResponse>(`${this.apiUrl}/${matchId}/live-state`).pipe(
      map(match => this.normalizeMatch(match)),
    );
  }

  getLiveMatchBootstrap(matchId: string): Observable<LiveCaptureBootstrapResponse> {
    return this.http.get<{
      match: BackendMatchResponse;
      events: LiveCaptureBootstrapResponse['events'];
      eventTypes: LiveCaptureBootstrapResponse['eventTypes'];
    }>(`${this.apiUrl}/${matchId}/live-bootstrap`).pipe(
      map(response => ({
        ...response,
        match: this.normalizeMatch(response.match),
      })),
    );
  }

  updateLiveMatchState(matchId: string, state: LiveMatchStateRequest): Observable<BackendMatchResponse> {
    return this.http.put<BackendMatchResponse>(`${this.apiUrl}/${matchId}/live-state`, state);
  }

}