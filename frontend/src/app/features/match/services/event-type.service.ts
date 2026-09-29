import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BackendEventTypeResponse } from '../types/event-type.types';

@Injectable({ providedIn: 'root' })
export class EventTypeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/eventType`;

  getAll(): Observable<BackendEventTypeResponse[]> {
    return this.http.get<BackendEventTypeResponse[]>(this.apiUrl);
  }
}