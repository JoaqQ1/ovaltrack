import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment.docker';
import { BackendResponse } from 'src/app/shared/types/shared-types';
import { ClubStatus } from '../../club/types/club.types';

@Injectable({ providedIn: 'root' })
export class OvalTrackAdminService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/api/admin/ovaltrack`;

    /* ---------- Listados ---------- */

    /** GET /clubs/pending */
    getPendingClubs(): Observable<BackendResponse> {
        return this.http.get<BackendResponse>(`${this.apiUrl}/clubs/pending`);
    }

    /** GET /users/pending */
    getPendingUsers(): Observable<BackendResponse> {
        return this.http.get<BackendResponse>(`${this.apiUrl}/users/pending`);
    }

    /** GET /users: sin parámetro devuelve activas e inactivas; con `active` filtra. */
    getUsers(active?: boolean): Observable<BackendResponse> {
        let params = new HttpParams();
        if (active !== undefined) {
            params = params.set('active', active);
        }
        return this.http.get<BackendResponse>(`${this.apiUrl}/users`, { params });
    }

    /** GET /clubs: sin parámetro devuelve ACTIVE y REJECTED; con `status` filtra. */
    getClubs(status?: ClubStatus): Observable<BackendResponse> {
        let params = new HttpParams();
        if (status) {
            params = params.set('status', status);
        }
        return this.http.get<BackendResponse>(`${this.apiUrl}/clubs`, { params });
    }

    /* ---------- Clubes ---------- */

    /** POST /clubs/{clubId}/approve */
    approveClub(clubId: string, adminUserId: string): Observable<BackendResponse> {
        const params = new HttpParams().set('adminUserId', adminUserId);

        return this.http.post<BackendResponse>(`${this.apiUrl}/clubs/${clubId}/approve`, null, { params });
    }

    /** POST /clubs/{clubId}/reject (comentario opcional) */
    rejectClub(clubId: string): Observable<BackendResponse> {
        return this.http.post<BackendResponse>(`${this.apiUrl}/clubs/${clubId}/reject`, null);
    }

    /* ---------- Cuentas ---------- */

    /** POST /users/{userId}/approve */
    approveAccount(userId: string): Observable<BackendResponse> {
        return this.http.post<BackendResponse>(`${this.apiUrl}/users/${userId}/approve`, null);
    }

    /** POST /users/{userId}/reject (comentario opcional) */
    rejectAccount(userId: string): Observable<BackendResponse> {
        return this.http.post<BackendResponse>(`${this.apiUrl}/users/${userId}/reject`, null);
    }

    activateAccount(userId: string): Observable<BackendResponse> {
        return this.http.post<BackendResponse>(`${this.apiUrl}/${userId}/activate`, null);
    }
    deactivateAccount(userId: string): Observable<BackendResponse> {
        return this.http.delete<BackendResponse>(`${this.apiUrl}/${userId}/deactivate`);
    }

}