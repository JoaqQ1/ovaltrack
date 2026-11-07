import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { getUserToken } from '../../support/auth_helper.js';
import { MISSING_UUID } from '../../support/ids.js';
import { makeHttpRequest } from '../../support/httpRequest.js';
import { findDivisionId } from '../../support/match_helper.js';

// Pasos reutilizados:
//  - "Dado que el coach / jugador ... ha iniciado sesión" y "Dado un usuario sin sesión iniciada ..."
//  - "Y que existe un partido finalizado ..." y "Y que se han registrado los siguientes eventos en el partido:"
//    (partido-flujo/step_definitions/linea_eventos_steps.js)
//  - "Cuando el entrenador elimina el último evento agregado" (partido-flujo/step_definitions/match_zones_steps.js)

// <==================== Helpers ====================>

const getMatchStatistics = (matchId, token, period) =>
  makeHttpRequest('GET', `statistics/match/${matchId}${period ? `?period=${period}` : ''}`, null, token);

const getDivisionStatistics = (divisionId, from, to, token) =>
  makeHttpRequest('GET', `statistics/division/${divisionId}?from=${from}&to=${to}`, null, token);

// Fecha (yyyy-MM-dd) del partido desplazada `days` días
const matchDay = (match, days = 0) => {
  const day = new Date(`${match.date.slice(0, 10)}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + days);
  return day.toISOString().slice(0, 10);
};

const assertFields = (statistics, dataTable) => {
  for (const { campo, valor } of dataTable.hashes()) {
    assert.equal(statistics[campo], Number(valor), `Campo "${campo}"`);
  }
};

// <==================== Estadísticas del partido ====================>

When('consulta las estadísticas del periodo {int} del partido', async function (periodo) {
  this.response = await getMatchStatistics(this.currentMatch.id, this.token, periodo);
});

When('consulta las estadísticas del partido sin indicar el período', async function () {
  this.response = await getMatchStatistics(this.currentMatch.id, this.token);
});

When('consulta las estadísticas de un partido inexistente', async function () {
  this.response = await getMatchStatistics(MISSING_UUID, this.token);
});

When('el administrador del club con email {string} y contraseña {string} intenta consultar las estadísticas de ese partido', async function (email, contraseña) {
  const token = await getUserToken(email, contraseña);
  assert.ok(token, `Fallo de inicio de sesión para ${email}`);
  this.response = await getMatchStatistics(this.currentMatch.id, token, 1);
});

Then('las estadísticas incluyen:', function (dataTable) {
  assertFields(this.response.body, dataTable);
});

// <==================== Estadísticas de la división ====================>

When('consulta las estadísticas de la division {string} del día del partido', async function (divisionNombre) {
  const divisionId = await findDivisionId(divisionNombre, this.token);
  this.response = await getDivisionStatistics(divisionId, matchDay(this.currentMatch), matchDay(this.currentMatch), this.token);
});

When('consulta las estadísticas de la division {string} del día siguiente al partido', async function (divisionNombre) {
  const divisionId = await findDivisionId(divisionNombre, this.token);
  this.response = await getDivisionStatistics(divisionId, matchDay(this.currentMatch, 1), matchDay(this.currentMatch, 1), this.token);
});

When('consulta las estadísticas de la division {string} entre el {string} y el {string}', async function (divisionNombre, desde, hasta) {
  const divisionId = await findDivisionId(divisionNombre, this.token);
  this.response = await getDivisionStatistics(divisionId, desde, hasta, this.token);
});

When('consulta las estadísticas de una división inexistente', async function () {
  this.response = await getDivisionStatistics(MISSING_UUID, '2027-03-01', '2027-03-10', this.token);
});

Then('la división informa solo el partido consultado contra {string}', function (rival) {
  const { matches } = this.response.body;
  assert.equal(matches.length, 1);
  assert.equal(matches[0].matchId, this.currentMatch.id);
  assert.equal(matches[0].opponentName, rival);
});

Then('la división no informa el partido consultado', function () {
  assert.ok(!this.response.body.matches.some((m) => m.matchId === this.currentMatch.id));
});

Then('las estadísticas del partido de la división incluyen:', function (dataTable) {
  assertFields(this.response.body.matches[0].statistics, dataTable);
});
