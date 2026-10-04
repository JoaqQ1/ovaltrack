import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment.docker';
import { OvalTrackAdminOverview } from '../types/ovaltrack-admin.types';
import { BackendResponse } from 'src/app/shared/types/shared-types';

@Injectable({ providedIn: 'root' })
export class OvalTrackAdminService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/api/admin/ovaltrack`;

    getOverview(): Observable<BackendResponse> {
        return this.http.get<BackendResponse>(`${this.apiUrl}/overview`);
    }

    approveClubRequest(requestId: string): Observable<BackendResponse> {
        return this.http.post<BackendResponse>(`${this.apiUrl}/registration-requests/${requestId}/approve`, null);
    }
    rejectClubRequest(requestId: string, comment: string): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/registration-requests/${requestId}/reject`, { comment });
    }
    activateAccount(userId: string): Observable<BackendResponse> {
        return this.http.post<BackendResponse>(`${this.apiUrl}/${userId}/activate`, null);
    }
    deactivateAccount(userId: string): Observable<BackendResponse> {
        return this.http.delete<BackendResponse>(`${this.apiUrl}/${userId}/deactivate`);
    }

}