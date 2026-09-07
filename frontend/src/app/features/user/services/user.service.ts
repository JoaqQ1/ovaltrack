import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment.docker';
import { SaveUserRequest, User } from '../types/user.types';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/user`;

  findAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  findUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${userId}`);
  }

  saveUser(user: SaveUserRequest): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  deleteUser(userId: string): Observable<string> {
    return this.http.delete(this.buildUserUrl(userId), { responseType: 'text' });
  }

  private buildUserUrl(userId: string): string {
    return `${this.apiUrl}/${userId}`;
  }
}
