import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, from, map, switchMap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BackendMatchResponse, LiveMatchStateRequest, Match, MatchStatus, NewMatchDraft } from '../types/match.types';
import { RosterPayload } from '../types/roster.types';
import { PeriodStatisticDTO } from '../types/statistic.types';
import { LiveCaptureBootstrapResponse } from '../types/live-capture.types';
import { LiveCaptureCacheService } from './live-capture-cache.service';
import { StatisticApiService } from './statistic-api.service';

@Injectable({ providedIn: 'root' })
export class MatchService {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(LiveCaptureCacheService);
  private readonly statisticApiService = inject(StatisticApiService);
  private readonly apiUrl = `${environment.apiUrl}/matches`;

  getAllMatchesByDivisionId(divisionId: string): Observable<Match[]> {
    return this.http.get<BackendMatchResponse[]>(`${this.apiUrl}/division?divisionId=${divisionId}`).pipe(
      map(matches => matches.map(match => this.normalizeMatch(match))),
      switchMap(matches => from(this.cache.saveMatches(matches)).pipe(map(() => matches))),
      catchError(() => from(this.cache.getMatchesByDivision(divisionId)).pipe(
        switchMap(matches => matches.length > 0
          ? from([matches])
          : throwError(() => new Error(`No hay partidos almacenados para la división ${divisionId}`)))
      ))
    );
  }

  createMatch(draft: NewMatchDraft, divisionId: string): Observable<Match> {
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

  closeFirstHalf(matchId: string): Observable<Match> {
    return this.http.put<BackendMatchResponse>(`${this.apiUrl}/${matchId}/close-first-half`, {}).pipe(
      map(match => this.normalizeMatch(match))
    );
  }

  startSecondHalf(matchId: string): Observable<Match> {
    return this.http.put<BackendMatchResponse>(`${this.apiUrl}/${matchId}/start-second-half`, {}).pipe(
      map(match => this.normalizeMatch(match))
    );
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

  startMatch(matchId: string): Observable<Match> {
    return this.http.put<BackendMatchResponse>(`${this.apiUrl}/${matchId}/start`, {}).pipe(
      map(match => this.normalizeMatch(match))
    );
  }

  finishMatch(matchId: string): Observable<Match> {
    return this.http.put<BackendMatchResponse>(`${this.apiUrl}/${matchId}/finish`, {}).pipe(
      map(match => this.normalizeMatch(match))
    );
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

  saveRoster(payload: RosterPayload): Observable<void> {
    const dtoParaJava = {
      titularesIds: payload.startingPlayers,
      suplentesIds: payload.substitutePlayers
    };
    return this.http.post<void>(`${this.apiUrl}/${payload.matchId}/roster`, dtoParaJava);
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

  updateLiveMatchState(matchId: string, state: LiveMatchStateRequest): Observable<Match> {
    return this.http.put<BackendMatchResponse>(`${this.apiUrl}/${matchId}/live-state`, state).pipe(
      map(match => this.normalizeMatch(match))
    );
  }

}