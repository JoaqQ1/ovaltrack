import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { PersonResponse, PersonCreationRequest, PersonUpdateRequest } from '../features/person/types/person.types';

@Injectable({
  providedIn: 'root'
})
export class PersonService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/person`;

  getPersons(): Observable<PersonResponse[]> {
    return this.http.get<PersonResponse[]>(this.apiUrl);
  }

  getPersonById(id: string): Observable<PersonResponse> {
    return this.http.get<PersonResponse>(`${this.apiUrl}/${id}`);
  }

  createPerson(person: PersonCreationRequest): Observable<PersonResponse> {
    return this.http.post<PersonResponse>(this.apiUrl, person);
  }

  updatePerson(id: string, person: PersonUpdateRequest): Observable<PersonResponse> {
    return this.http.put<PersonResponse>(`${this.apiUrl}/${id}`, person);
  }

  deletePerson(id: string): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${id}`, { responseType: 'text' as 'json' });
  }
}