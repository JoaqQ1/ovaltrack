import { Injectable, inject, signal } from '@angular/core';
import { Observable, finalize, map, switchMap, tap } from 'rxjs';
import { ZoneService } from '../../services/zone.service';
import { MatchZonesResponse, ZoneAssignmentRequest, ZoneAssignmentResponse, ZoneSummary } from '../../types/zone.types';

const EMPTY_SUMMARY: ZoneSummary = { cells: [], unzonedEventCount: 0 };

/** Estado de las zonas del partido en revisión. Sin UX: los errores los maneja quien lo consume. */
@Injectable({ providedIn: 'root' })
export class MatchZonesStore {
  private readonly zoneService = inject(ZoneService);

  readonly assignments = signal<ZoneAssignmentResponse[]>([]);
  readonly summary = signal<ZoneSummary>(EMPTY_SUMMARY);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);

  load(matchId: string): Observable<MatchZonesResponse> {
    this.isLoading.set(true);
    return this.zoneService.list(matchId).pipe(
      tap(response => this.applyResponse(response)),
      finalize(() => this.isLoading.set(false))
    );
  }

  /** Crea la zona o, si se indica `zoneId`, la modifica; luego refresca la lista y el resumen. */
  save(matchId: string, request: ZoneAssignmentRequest, zoneId?: string): Observable<void> {
    const write$ = zoneId
      ? this.zoneService.update(matchId, zoneId, request)
      : this.zoneService.create(matchId, request);
    return this.runAndReload(matchId, write$);
  }

  remove(matchId: string, zoneId: string): Observable<void> {
    return this.runAndReload(matchId, this.zoneService.remove(matchId, zoneId));
  }

  reset(): void {
    this.assignments.set([]);
    this.summary.set(EMPTY_SUMMARY);
  }

  private runAndReload(matchId: string, write$: Observable<unknown>): Observable<void> {
    this.isSaving.set(true);
    return write$.pipe(
      switchMap(() => this.zoneService.list(matchId)),
      tap(response => this.applyResponse(response)),
      map(() => undefined),
      finalize(() => this.isSaving.set(false))
    );
  }

  private applyResponse(response: MatchZonesResponse): void {
    this.assignments.set(response.assignments);
    this.summary.set(response.summary ?? EMPTY_SUMMARY);
  }
}
