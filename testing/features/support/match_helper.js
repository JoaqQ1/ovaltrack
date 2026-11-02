import assert from 'node:assert/strict';
import { findDivisionIdByName } from './division_helper.js';
import { makeHttpRequest } from './httpRequest.js';

export async function findDivisionId(divisionNombre, token) {
  const divisionId = await findDivisionIdByName(divisionNombre, token);
  assert.ok(divisionId, `No se encontró la división con nombre "${divisionNombre}"`);
  return divisionId;
}

export async function findOpponentIdByName(name, token) {
  const response = await makeHttpRequest('GET', 'opponents', null, token);
  assert.equal(response.status, 200, 'No se pudieron obtener los rivales');
  const opponent = response.body.find((o) => o.name === name);
  assert.ok(opponent, `No se encontró el rival "${name}"`);
  return opponent.id;
}

/** Envía POST /matches buscando el ID del rival por nombre; devuelve { status, body }. */
export async function requestMatchCreation(fecha, divisionId, rival, token) {
  const opponentId = await findOpponentIdByName(rival, token);
  return makeHttpRequest('POST', 'matches', { date: fecha, divisionId, opponentId }, token);
}

export async function getDivisionMatches(divisionId, token) {
  const response = await makeHttpRequest('GET', `matches/division?divisionId=${divisionId}`, null, token);
  assert.equal(response.status, 200, 'No se pudieron obtener los partidos de la división');
  return response.body;
}

// Fecha usada al crear el partido cuando todavía no existe uno contra ese rival
const MATCH_DATES = {
  'Comodoro Rugby Club': '2026-12-12T15:30:00',
  'Trelew Rugby Club': '2026-12-15T10:00:00',
  'Calafate Rugby Club': '2026-12-19T15:30:00',
  'Deportivo Portugués': '2026-12-26T15:30:00',
};
const DEFAULT_MATCH_DATE = '2027-01-09T15:30:00';

export async function findMatchByStatus(divisionId, rival, statuses, token) {
  const matches = await getDivisionMatches(divisionId, token);
  return matches.find((m) => m.opponent?.name === rival && statuses.includes(m.status)) ?? null;
}

export async function createMatchForRival(divisionId, rival, token) {
  const response = await requestMatchCreation(MATCH_DATES[rival] ?? DEFAULT_MATCH_DATE, divisionId, rival, token);
  assert.equal(response.status, 200, `No se pudo crear el partido contra ${rival}: ${response.body?.message}`);
  return response.body;
}

/** Ejecuta una transición (start, cancel, close-first-half, start-second-half...) esperando 200. */
export async function changeMatchStatus(match, method, action, token) {
  const response = await makeHttpRequest(method, `matches/${match.id}/${action}`, null, token);
  assert.equal(response.status, 200, `No se pudo ${action} el partido: ${response.body?.message}`);
  return response.body;
}

// Los slots titulares del partido se completan con los jugadores de la división (hasta 15)
export async function saveRosterWithDivisionPlayers(match, token) {
  const players = await makeHttpRequest('GET', `players/with-user?divisionId=${match.divisionId}`, null, token);
  assert.equal(players.status, 200, 'No se pudieron obtener los jugadores de la división');
  assert.ok(players.body.length > 0, 'La división no tiene jugadores para armar el plantel');
  const titularesIds = players.body.slice(0, 15).map((p) => p.personId);
  const response = await makeHttpRequest('POST', `matches/${match.id}/roster`, { titularesIds, suplentesIds: [] }, token);
  assert.equal(response.status, 200, `No se pudo guardar el plantel: ${response.body?.message}`);
}

/** Arma el plantel con los jugadores de la división e inicia el partido. */
export async function startMatch(match, token) {
  await saveRosterWithDivisionPlayers(match, token);
  return changeMatchStatus(match, 'PUT', 'start', token);
}

// Cada partido finalizado de prueba se crea en un día distinto para no chocar con la franja horaria de otro
let finishedMatchCount = 0;
const nextFinishedMatchDate = () => {
  const date = new Date(Date.UTC(2027, 1, 1, 15, 30));
  date.setUTCDate(date.getUTCDate() + finishedMatchCount++);
  return date.toISOString().slice(0, 19);
};

/**
 * Crea un partido nuevo contra el rival, lo inicia con plantel, ejecuta `whileInProgress`
 * (por ejemplo, cargar eventos en vivo) y lo finaliza.
 */
export async function createFinishedMatch(divisionId, rival, token, whileInProgress = async () => {}) {
  const created = await requestMatchCreation(nextFinishedMatchDate(), divisionId, rival, token);
  assert.equal(created.status, 200, `No se pudo crear el partido contra ${rival}: ${created.body?.message}`);
  const started = await startMatch(created.body, token);
  await whileInProgress(started);
  return changeMatchStatus(started, 'PUT', 'finish', token);
}

export async function getMatchRosterPlayers(matchId, token) {
  const response = await makeHttpRequest('GET', `matches/${matchId}/roster/players`, null, token);
  assert.equal(response.status, 200, 'No se pudo obtener el plantel del partido');
  return response.body;
}
