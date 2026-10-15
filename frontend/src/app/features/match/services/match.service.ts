import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, from, map, of, switchMap, throwError, firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BackendMatchResponse, LiveMatchStateRequest, Match, MatchStatus, NewMatchDraft, PendingMatchAction, PendingMatchMutation } from '../types/match.types';
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

  constructor() {
  }

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
      opponent: draft.opponentId.trim()
    };

    return this.http.post<BackendMatchResponse>(this.apiUrl, payload).pipe(
      map(match => this.normalizeMatch(match)),
      switchMap(match => from(this.cache.saveMatches([match])).pipe(
        map(() => match)
      ))
    );
  }

  closeFirstHalf(matchId: string): Observable<Match> {
    return this.transitionMatch(
      matchId,
      'close-first-half',
      () => this.http.put<BackendMatchResponse>(`${this.apiUrl}/${matchId}/close-first-half`, {}),
      'halftime',
    );
  }

  startSecondHalf(matchId: string): Observable<Match> {
    return this.transitionMatch(
      matchId,
      'start-second-half',
      () => this.http.put<BackendMatchResponse>(`${this.apiUrl}/${matchId}/start-second-half`, {}),
      'in_progress',
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
    return this.transitionMatch(matchId, 'start', () => this.http.put<BackendMatchResponse>(`${this.apiUrl}/${matchId}/start`, {}), 'in_progress');
  }

  finishMatch(matchId: string): Observable<Match> {
    return this.transitionMatch(matchId, 'finish', () => this.http.put<BackendMatchResponse>(`${this.apiUrl}/${matchId}/finish`, {}), 'finished');
  }

  private transitionMatch(
    matchId: string,
    action: PendingMatchAction,
    request: () => Observable<BackendMatchResponse>,
    nextLocalStatus: MatchStatus,
  ): Observable<Match> {
    return request().pipe(
      map(match => this.normalizeMatch(match)),
      switchMap(normalizedMatch => from(this.cache.saveMatches([normalizedMatch])).pipe(map(() => normalizedMatch))),
      catchError((error: HttpErrorResponse) => {
        if (error.status !== 0) {
          return throwError(() => error);
        }

        return from(this.queueOfflineTransition(matchId, action, nextLocalStatus));
      })
    );
  }

  private async queueOfflineTransition(
    matchId: string,
    action: PendingMatchAction,
    nextLocalStatus: MatchStatus,
  ): Promise<Match> {
    const cachedMatch = await this.cache.getMatch(matchId);
    
    let currentPeriod = cachedMatch?.currentPeriod ?? 1;
    let clockPaused = cachedMatch?.clockPaused ?? true;
    let clockElapsedSeconds = cachedMatch?.clockElapsedSeconds ?? 0;

    if (action === 'start-second-half') {
      currentPeriod = 2;
      clockPaused = false;
      clockElapsedSeconds = Math.max(2400, cachedMatch?.clockElapsedSeconds ?? 2400);
    } else if (action === 'close-first-half') {
      clockPaused = true;
    } else if (action === 'start') {
      currentPeriod = 1;
      clockPaused = false;
    } else if (action === 'finish') {
      clockPaused = true;
    }

    const nextMatch: Match = cachedMatch
      ? { 
          ...cachedMatch,
          status: nextLocalStatus, 
          currentPeriod, 
          clockPaused,
          clockElapsedSeconds 
        }
      : {
          id: matchId,
          status: nextLocalStatus,
          opponent: '',
          date: '',
          divisionId: '' as any,
          currentPeriod,
          clockElapsedSeconds: 0,
          clockPaused,
          currentPossession: 'OWN',
          homeScore: 0,
          awayScore: 0,
        } as Match;

    await this.cache.saveMatches([nextMatch]);

    const mutationId = `${matchId}-latest`;
    await this.cache.savePendingMatchMutation({
      id: mutationId,
      matchId,
      action,
      createdAt: Date.now(),
    });

    return nextMatch;
  }

  deleteMatch(matchId: string): Observable<BackendMatchResponse> {
    return this.http.delete<BackendMatchResponse>(`${this.apiUrl}/${matchId}/cancel`);
  }

  getMatchById(matchId: string): Observable<Match> {
    return this.http.get<BackendMatchResponse>(`${this.apiUrl}/${matchId}`).pipe(
      map(match => this.normalizeMatch(match)),
      switchMap(match => from(this.cache.saveMatches([match])).pipe(
        map(() => match)
      )),
      catchError(error => from(this.cache.getMatch(matchId)).pipe(
        switchMap(cachedMatch => {
          if (cachedMatch) {
            return of(cachedMatch);
          }
          return throwError(() => error);
        })
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