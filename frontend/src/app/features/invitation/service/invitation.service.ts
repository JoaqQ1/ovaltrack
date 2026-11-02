import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { MessageResponse } from 'src/app/shared/types/shared-types';
import {
  AcceptInvitationRequest,
  CreateInvitationRequest,
  InvitationResponse,
  InvitationValidationResponse,
  RegisterFromInvitationRequest,
} from '../types/invitation.types';

@Injectable({
  providedIn: 'root'
})
export class InvitationService {

  private readonly apiUrl = `${environment.apiUrl}/api/invitation`;

  constructor(private http: HttpClient) { }

  sendInvitation(data: CreateInvitationRequest): Observable<InvitationResponse> {
    return this.http.post<InvitationResponse>(`${this.apiUrl}/invite`, data);
  }

  /** Valida el token y devuelve qué formulario corresponde mostrar. No lo consume. */
  validate(token: string): Observable<InvitationValidationResponse> {
    return this.http.post<InvitationValidationResponse>(`${this.apiUrl}/validate`, { token });
  }

  /** CREATE_ACCOUNT: crea el usuario, lo vincula a la persona y consume el token. */
  register(request: RegisterFromInvitationRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/register`, request);
  }

  /** ACCEPT_LINK: vincula la cuenta existente a la persona y consume el token. */
  accept(request: AcceptInvitationRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/accept`, request);
  }
}