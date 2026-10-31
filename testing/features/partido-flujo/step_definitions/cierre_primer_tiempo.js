import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { getUserToken } from '../../support/auth_helper.js';
import { findEventType, parseAttributes, registerEvent } from '../../support/event_helper.js';
import { makeHttpRequest } from '../../support/httpRequest.js';
import {
  changeMatchStatus,
  createMatchForRival,
  findDivisionId,
  findMatchByStatus,
  startMatch,
} from '../../support/match_helper.js';

// Pasos reutilizados:
//  - "Dado que el coach ... ha iniciado sesión" (division-jugador/step_definitions/creacion_jugadores.js)
//  - "Y que existe un partido en curso ..." y "el partido cuenta con {int} eventos ..."
//    (evento/step_definitions/evento_steps.js)
//  - "Entonces el sistema responde con {int} y {string}" (support/common_steps.js)

// <==================== Helpers ====================>

// Eventos del primer tiempo con los que se deja preparado el partido antes de cerrarlo
const FIRST_HALF_EVENTS = [
  { tipoEvento: 'Try', teamPossession: 'OWN', matchTime: 300, attributes: { zone: 'left' } },
  { tipoEvento: 'Tackle completado', teamPossession: 'OPPONENT', matchTime: 600 },
  { tipoEvento: 'Kick H (Penal a palos)', teamPossession: 'OWN', matchTime: 1200, attributes: { wasSuccessful: true } },
];

const registerFirstHalfEvents = async (match, token) => {
  for (const { tipoEvento, ...event } of FIRST_HALF_EVENTS) {
    const response = await registerEvent(token, {
      eventTypeId: await findEventType(tipoEvento, token),
      matchId: match.id,
      period: 1,
      ...event,
    });
    assert.equal(response.status, 200, `No se pudo registrar el evento ${tipoEvento}: ${response.body?.message}`);
  }
};

// Busca un partido contra el rival en alguno de los estados dados o lo crea en NOT_STARTED
const findOrCreateMatch = async (divisionNombre, rival, statuses, token) => {
  const divisionId = await findDivisionId(divisionNombre, token);
  return await findMatchByStatus(divisionId, rival, statuses, token)
    ?? await createMatchForRival(divisionId, rival, token);
};

// Lleva el partido hasta el entretiempo: lo inicia (si hace falta), carga eventos y cierra el primer tiempo
const bringToHalftime = async (match, token) => {
  if (match.status === 'HALFTIME') return match;
  const started = match.status === 'NOT_STARTED' ? await startMatch(match, token) : match;
  await registerFirstHalfEvents(started, token);
  return changeMatchStatus(started, 'PUT', 'close-first-half', token);
};

const closeFirstHalf = (matchId, token) =>
  makeHttpRequest('PUT', `matches/${matchId}/close-first-half`, null, token);

// <==================== Partidos de contexto ====================>

Given('que se han registrado los siguientes eventos en el primer tiempo:', async function (dataTable) {
  for (const row of dataTable.hashes()) {
    const response = await registerEvent(this.token, {
      eventTypeId: await findEventType(row.tipo_evento, this.token),
      matchId: this.currentMatch.id,
      teamPossession: row.posesion,
      matchTime: parseInt(row.tiempo_segundos, 10),
      period: parseInt(row.periodo, 10),
      attributes: parseAttributes(row.atributos),
    });
    assert.equal(response.status, 200, `No se pudo registrar el evento ${row.tipo_evento}: ${response.body?.message}`);
  }
});

Given('que el partido contra {string} se encuentra en estado de entretiempo', async function (rival) {
  const match = await findOrCreateMatch('Primera', rival, ['NOT_STARTED', 'IN_PROGRESS', 'HALFTIME'], this.token);
  this.currentMatch = await bringToHalftime(match, this.token);
});

Given('que el partido contra {string} se encuentra en el segundo tiempo', async function (rival) {
  const match = await findOrCreateMatch('Primera', rival, ['NOT_STARTED', 'IN_PROGRESS', 'HALFTIME'], this.token);
  if (match.status === 'IN_PROGRESS' && match.currentPeriod === 2) {
    this.currentMatch = match;
    return;
  }
  const halftime = await bringToHalftime(match, this.token);
  this.currentMatch = await changeMatchStatus(halftime, 'PUT', 'start-second-half', this.token);
});

// <==================== Transiciones de período ====================>

When('el entrenador solicita cerrar el primer tiempo del partido', async function () {
  this.response = await closeFirstHalf(this.currentMatch.id, this.token);
});

When('el entrenador solicita iniciar el segundo tiempo del partido', async function () {
  this.response = await makeHttpRequest('PUT', `matches/${this.currentMatch.id}/start-second-half`, null, this.token);
});

Then('el sistema responde con {int} y devuelve el partido con estado {string} y periodo {int}', function (statusCode, estado, periodo) {
  assert.equal(this.response.status, statusCode, this.response.body?.message);
  assert.equal(this.response.body.status, estado);
  assert.equal(this.response.body.currentPeriod, periodo);
});

// <==================== Errores al cerrar el primer tiempo ====================>

When('el administrador del club con email {string} y contraseña {string} intenta cerrar el primer tiempo del partido', async function (email, contraseña) {
  const token = await getUserToken(email, contraseña);
  assert.ok(token, `Fallo de inicio de sesión para ${email}`);
  this.response = await closeFirstHalf(this.currentMatch.id, token);
});

When('solicita cerrar el primer tiempo para un partido inexistente con ID {string}', async function (matchId) {
  this.response = await closeFirstHalf(matchId, this.token);
});
