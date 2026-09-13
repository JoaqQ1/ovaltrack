import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment.docker';
import { BackendUserResponse, ClubInfo, Member, UserRole } from '../types/members.types';

@Injectable({
  providedIn: 'root'
})
export class MembersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getMembers(): Observable<Member[]> {
    return this.http.get<BackendUserResponse[]>(`${this.baseUrl}/user`).pipe(
      map(users =>
        users.map(u => ({
          id: u.id,
          email: u.email || u.loginEmail || '',
          firstName: u.person?.firstName || '',
          lastName: u.person?.lastName || '',
          role: u.role,
          active: u.active ?? true,
          jersey: undefined,
          isProtected: u.role === 'ADMIN_CLUB' || u.role === 'ADMIN_OVALTRACK'
        }))
      )
    );
  }

  updateUserRole(userId: string, newRole: UserRole): Observable<any> {
    return this.http.put(`${this.baseUrl}/user/${userId}/role`, { role: newRole });
  }

  updateBatchRoles(updates: Array<{ userId: string; newRole: UserRole }>): Observable<any[]> {
    if (!updates || updates.length === 0) {
      return of([]);
    }
    return forkJoin(updates.map(u => this.updateUserRole(u.userId, u.newRole)));
  }

  getMyClub(): Observable<ClubInfo> {
    return this.http.get<ClubInfo>(`${this.baseUrl}/club/my-club`);
  }
}
