import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { MISSING_UUID } from '../../support/ids.js';
import { makeHttpRequest } from '../../support/httpRequest.js';
import { findOpponentIdByName } from '../../support/match_helper.js';

// Pasos reutilizados:
//  - "Dado que el coach ... ha iniciado sesión" (division-jugador/step_definitions/creacion_jugadores.js)
//  - "Y que existe un partido contra ... para el ... en la division ..." y
//    "Entonces el sistema responde con {int} y devuelve el partido en estado ... contra el rival ..." (partido_steps.js)

const editMatch = (matchId, date, opponentId, token) =>
  makeHttpRequest('PUT', `matches/${matchId}`, { date, opponentId }, token);

// <==================== Consulta ====================>

When('consulta el partido', async function () {
  this.response = await makeHttpRequest('GET', `matches/${this.match.id}`, null, this.token);
});

When('consulta los partidos del club', async function () {
  this.response = await makeHttpRequest('GET', `matches/club?clubId=${this.club.id}`, null, this.token);
});

Then('el listado incluye el partido contra {string} para el {string}', function (rival, fecha) {
  const found = this.response.body.some((m) => m.opponent?.name === rival && m.date === fecha);
  assert.ok(found, `El listado no incluye el partido contra ${rival} del ${fecha}`);
});

// <==================== Edición ====================>

When('edita el partido con la fecha {string} y el rival {string}', async function (fecha, rival) {
  const opponentId = await findOpponentIdByName(rival, this.token);
  this.response = await editMatch(this.match.id, fecha, opponentId, this.token);
});

Then('el partido queda programado para el {string}', function (fecha) {
  assert.equal(this.response.body.date, fecha);
});

When('intenta editar el partido con un rival inexistente', async function () {
  this.response = await editMatch(this.match.id, this.match.date, MISSING_UUID, this.token);
});

When('intenta editar un partido inexistente', async function () {
  const opponentId = await findOpponentIdByName('Chenque Rugby Club', this.token);
  this.response = await editMatch(MISSING_UUID, '2027-08-14T16:00:00', opponentId, this.token);
});
