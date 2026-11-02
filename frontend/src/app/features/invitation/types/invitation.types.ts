/** Debe coincidir con InvitationValidationResponse.Action del backend. */
export type InvitationAction = 'CREATE_ACCOUNT' | 'ACCEPT_LINK';

/** Respuesta de POST /api/invitation/validate. */
export interface InvitationValidationResponse {
  action: InvitationAction;
  personId: string;
  divisionId: string;
}

/** Datos de solo lectura que se muestran en el formulario. */
export interface InvitationSummary {
  playerName: string;
  email: string;
  divisionName: string;
}

/** Body de POST /api/invitation/register (crear cuenta). */
export interface RegisterFromInvitationRequest {
  token: string;
  password: string;
}

/** Body de POST /api/invitation/accept (aceptar la asociación). */
export interface AcceptInvitationRequest {
  token: string;
}
/** Body de POST /api/invitation/invite. */
export interface CreateInvitationRequest {
  divisionId: string;
  personId: string;
}

/** Respuesta de POST /api/invitation/invite. */
export interface InvitationResponse {
  id: string;
  clubId: string;
  divisionId: string;
  personId: string;
  email: string;
  sentAt: string;
}
