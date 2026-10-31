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
