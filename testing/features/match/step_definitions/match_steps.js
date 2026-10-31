import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { findDivisionIdByName } from '../../support/division_helper.js';
import { makeHttpRequest } from '../../support/httpRequest.js';

const BACKEND_URL = process.env.API_URL || 'http://backend:8080';

// Cache para almacenar partidos creados entre pasos
export const matchCache = new Map();

export async function findMatchByOpponent(opponent, token) {
  if (matchCache.has(opponent)) {
    return matchCache.get(opponent);
  }

  // Buscar a través de la división Primera
  const divisionId = await findDivisionIdByName('Primera', token);
  if (divisionId) {
    const res = await fetch(`${BACKEND_URL}/matches/division?divisionId=${divisionId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const matches = await res.json();
      const target = matches.find(m => m.opponent === opponent);
      if (target) {
        matchCache.set(opponent, target);
        return target;
      }
    }
  }

  return null;
}

// <==================== Helpers ====================>

const findOpponentIdByName = async (name, token) => {
  const response = await makeHttpRequest('GET', 'opponents', null, token);
  assert.equal(response.status, 200, 'No se pudieron obtener los rivales');
  const opponent = response.body.find((o) => o.name === name);
  assert.ok(opponent, `No se encontró el rival "${name}"`);
  return opponent.id;
};

const createMatch = async (fecha, divisionId, rival, token) => {
  const opponentId = await findOpponentIdByName(rival, token);
  const response = await makeHttpRequest('POST', 'matches', { date: fecha, divisionId, opponentId }, token);
  if (response.status === 200 && response.body?.id) {
    matchCache.set(rival, response.body);
  }
  return response;
};

const findDivisionId = async (divisionNombre, token) => {
  const divisionId = await findDivisionIdByName(divisionNombre, token);
  assert.ok(divisionId, `No se encontró la división con nombre "${divisionNombre}"`);
  return divisionId;
};

const findMatchInDivision = async (divisionId, rival, fecha, token) => {
  const response = await makeHttpRequest('GET', `matches/division?divisionId=${divisionId}`, null, token);
  assert.equal(response.status, 200, 'No se pudieron obtener los partidos de la división');
  return response.body.find((m) => m.opponent === rival && m.date === fecha) ?? null;
};

const assertCreatedMatch = (response, rival, estado) => {
  assert.ok(response.body?.id, `El partido contra ${rival} no contiene un ID asignado`);
  assert.equal(response.body.opponent, rival);
  assert.equal(response.body.status, estado);
};

// <==================== Creación de partidos ====================>

When('programa un partido contra el rival {string} para la fecha {string} en la división {string}', async function (rival, fecha, divisionNombre) {
  const divisionId = await findDivisionId(divisionNombre, this.token);
  this.response = await createMatch(fecha, divisionId, rival, this.token);
});

Then('el sistema responde con {int} y devuelve el partido en estado {string} contra el rival {string}', function (statusCode, estado, rival) {
  assert.equal(this.response.status, statusCode, this.response.body?.message);
  assertCreatedMatch(this.response, rival, estado);
});

// <==================== Errores al crear partidos ====================>

When('intenta programar un partido contra {string} para el {string} en la división {string}', async function (rival, fecha, divisionNombre) {
  const divisionId = await findDivisionId(divisionNombre, this.token);
  this.response = await createMatch(fecha, divisionId, rival, this.token);
});

When('intenta programar un partido contra {string} asociándolo a un ID de división inexistente', async function (rival) {
  const fakeDivisionId = '00000000-0000-0000-0000-000000000000';
  this.response = await createMatch('2026-11-15T15:30:00', fakeDivisionId, rival, this.token);
});

// <==================== Cancelación de partidos ====================>

Given('que existe un partido contra {string} para el {string} en la division {string}', async function (rival, fecha, divisionNombre) {
  const divisionId = await findDivisionId(divisionNombre, this.token);
  this.match = await findMatchInDivision(divisionId, rival, fecha, this.token);
  if (!this.match) {
    const response = await createMatch(fecha, divisionId, rival, this.token);
    assert.equal(response.status, 200, `No se pudo crear el partido contra ${rival}: ${response.body?.message}`);
    this.match = response.body;
  }
});

When('intenta cancelar el partido', async function () {
  this.response = await makeHttpRequest('DELETE', `matches/${this.match.id}/cancel`, null, this.token);
});
