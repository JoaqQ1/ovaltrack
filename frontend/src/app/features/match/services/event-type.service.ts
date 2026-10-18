import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, catchError, from, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BackendEventTypeResponse, LiveCaptureEventType } from '../types/event-type.types';
import { LiveCaptureCacheService } from './live-capture-cache.service';

@Injectable({ providedIn: 'root' })
export class EventTypeService {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(LiveCaptureCacheService);
  private readonly apiUrl = `${environment.apiUrl}/eventType`;

  getAll(): Observable<LiveCaptureEventType[]> {
    return this.http.get<BackendEventTypeResponse[]>(this.apiUrl).pipe(
      map(eventTypes => eventTypes.map(eventType => ({
        ...eventType,
        groupName: eventType.groupName ?? 'General',
        category: eventType.category ?? 'NEUTRAL',
        points: eventType.points ?? 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      }))),
      switchMap(mappedTypes => from(this.cache.saveEventTypes(mappedTypes)).pipe(
        map(() => mappedTypes)
      )),
      catchError(() => from(this.cache.getEventTypes()))
    );
  }
}