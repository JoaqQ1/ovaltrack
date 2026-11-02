import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { findEventType, parseAttributes, registerEvent } from '../../support/event_helper.js';
import { makeHttpRequest } from '../../support/httpRequest.js';
import {
  changeMatchStatus,
  createMatchForRival,
  findDivisionId,
  findMatchByStatus,
  startMatch,
} from '../../support/match_helper.js';

// El "Dado que el coach ... ha iniciado sesión" está en division-jugador/step_definitions/creacion_jugadores.js
// y el "Entonces el sistema responde con {int} y {string}" en support/common_steps.js

// <==================== Partidos de contexto ====================>

Given('que existe un partido en curso para la división {string} contra {string}', async function (divisionNombre, rival) {
  const divisionId = await findDivisionId(divisionNombre, this.token);
  let match = await findMatchByStatus(divisionId, rival, ['IN_PROGRESS', 'NOT_STARTED'], this.token)
    ?? await createMatchForRival(divisionId, rival, this.token);

  if (match.status === 'NOT_STARTED') {
    match = await startMatch(match, this.token);
  }
  this.currentMatch = match;
});

Given('que existe un partido en estado cancelado para la división {string} contra {string}', async function (divisionNombre, rival) {
  const divisionId = await findDivisionId(divisionNombre, this.token);
  this.currentMatch = await findMatchByStatus(divisionId, rival, ['CANCELLED'], this.token)
    ?? await changeMatchStatus(await createMatchForRival(divisionId, rival, this.token), 'DELETE', 'cancel', this.token);
});

// <==================== Registro de eventos ====================>

When('registra el evento {string} con atributos {string} para el equipo propio en el minuto {int} del periodo {int}', async function (tipoEvento, atributos, minuto, periodo) {
  this.response = await registerEvent(this.token, {
    eventTypeId: await findEventType(tipoEvento, this.token),
    matchId: this.currentMatch.id,
    teamPossession: 'OWN',
    matchTime: minuto * 60,
    period: periodo,
    attributes: parseAttributes(atributos),
  });
});

Then('el sistema responde con {int} y devuelve el evento creado con periodo {int} y posesión {string}', function (statusCode, periodo, posesion) {
  assert.equal(this.response.status, statusCode, this.response.body?.message);
  assert.ok(this.response.body.id, 'El evento no contiene un ID generado');
  assert.equal(this.response.body.period, periodo);
  assert.equal(this.response.body.teamPossession, posesion);
});

When('registra los siguientes eventos para el partido:', async function (dataTable) {
  this.eventCreationResponses = [];
  for (const row of dataTable.hashes()) {
    const response = await registerEvent(this.token, {
      eventTypeId: await findEventType(row.tipo_evento, this.token),
      matchId: this.currentMatch.id,
      teamPossession: row.posesion,
      matchTime: parseInt(row.tiempo_segundos, 10),
      period: parseInt(row.periodo, 10),
      attributes: parseAttributes(row.atributos),
    });
    this.eventCreationResponses.push({ response, tipoEvento: row.tipo_evento });
  }
});

Then('el sistema responde con {int} confirmando el registro de todos los eventos', function (statusCode) {
  assert.ok(this.eventCreationResponses.length > 0, 'No se registraron respuestas de creación de eventos');
  for (const { response, tipoEvento } of this.eventCreationResponses) {
    assert.equal(response.status, statusCode, `Evento ${tipoEvento}: ${response.body?.message}`);
    assert.ok(response.body.id, `El evento ${tipoEvento} no contiene un ID asignado`);
  }
});

Then('el partido cuenta con {int} eventos registrados para el periodo {int}', async function (cantidadEsperada, periodo) {
  const response = await makeHttpRequest('GET', `event/match?matchId=${this.currentMatch.id}`, null, this.token);
  assert.equal(response.status, 200, 'Error al consultar los eventos del partido');
  const eventsInPeriod = response.body.filter((e) => e.period === periodo && e.active !== false);
  assert.equal(eventsInPeriod.length, cantidadEsperada);
});

// <==================== Errores al registrar eventos ====================>

When('intenta registrar un evento de tipo desconocido con ID inexistente', async function () {
  this.response = await registerEvent(this.token, {
    eventTypeId: '00000000-0000-0000-0000-000000000000',
    matchId: this.currentMatch.id,
    teamPossession: 'OWN',
    matchTime: 999,
    period: 1,
  });
});

When('intenta registrar un evento para ese partido cancelado', async function () {
  this.response = await registerEvent(this.token, {
    eventTypeId: await findEventType('Turnover', this.token),
    matchId: this.currentMatch.id,
    teamPossession: 'NEUTRAL',
    matchTime: 120,
    period: 1,
  });
});
