import assert from 'node:assert/strict';
import { getPostMatchEvents } from './event_helper.js';
import { makeHttpRequest } from './httpRequest.js';
import { getMatchRosterPlayers } from './match_helper.js';

export const POST_CAPTURE = 'post_capture';
export const LIVE_CAPTURE = 'live-capture';

/** Jugador del plantel del partido por nombre completo; su `id` es el de la persona. */
export async function findRosterPlayer(matchId, fullName, token) {
  const players = await getMatchRosterPlayers(matchId, token);
  const player = players.find((p) => p.fullName === fullName);
  assert.ok(player, `El jugador "${fullName}" no está en el plantel del partido`);
  return player;
}

/** Primer evento de la línea post-partido con ese nombre de tipo. */
export async function findTimelineEvent(matchId, tipoEvento, token) {
  const events = await getPostMatchEvents(matchId, token);
  const event = events.find((e) => e.eventTypeName === tipoEvento);
  assert.ok(event, `No se encontró el evento "${tipoEvento}" en la línea post-partido`);
  return event;
}

export function patchEvent(eventId, body, token) {
  return makeHttpRequest('PATCH', `event/${eventId}`, body, token);
}
