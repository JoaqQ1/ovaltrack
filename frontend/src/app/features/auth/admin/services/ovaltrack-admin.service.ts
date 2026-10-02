import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment.docker';
import { OvalTrackAdminOverview, PendingRegistrationRequest } from '../types/ovaltrack-admin.types';

@Injectable({ providedIn: 'root' })
export class OvalTrackAdminService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/api/admin/ovaltrack`;

    getOverview(): Observable<OvalTrackAdminOverview> {
        return this.http.get<OvalTrackAdminOverview>(`${this.apiUrl}/overview`);
    }
}