import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { findEventType, getPostMatchTimeline, parseAttributes, registerEvent } from '../../support/event_helper.js';
import { makeHttpRequest } from '../../support/httpRequest.js';
import { createFinishedMatch, findDivisionId, getMatchRosterPlayers } from '../../support/match_helper.js';
import { LIVE_CAPTURE, POST_CAPTURE } from '../../support/post_match_helper.js';

// Pasos reutilizados:
//  - "Dado que el coach ... ha iniciado sesión" (division-jugador/step_definitions/creacion_jugadores.js)
//  - "Y que existe un partido en curso ..." (evento/step_definitions/evento_steps.js)
//  - "Entonces el sistema responde con {int}" y "... con {int} y {string}" (support/common_steps.js)

// <==================== Helpers ====================>

const registerPostMatchEvent = async (match, token, { tipoEvento, ...event }) => {
  const response = await registerEvent(token, {
    eventTypeId: await findEventType(tipoEvento, token),
    matchId: match.id,
    origin: POST_CAPTURE,
    ...event,
  });
  assert.equal(response.status, 200, `No se pudo registrar el evento ${tipoEvento}: ${response.body?.message}`);
  return response.body;
};

// <==================== Partidos finalizados ====================>

Given('que existe un partido finalizado para la división {string} contra {string}', async function (divisionNombre, rival) {
  const divisionId = await findDivisionId(divisionNombre, this.token);
  this.currentMatch = await createFinishedMatch(divisionId, rival, this.token);
});

Given('que existe un partido finalizado para la división {string} contra {string} con eventos cargados en vivo', async function (divisionNombre, rival) {
  const divisionId = await findDivisionId(divisionNombre, this.token);
  this.currentMatch = await createFinishedMatch(divisionId, rival, this.token, async (match) => {
    const response = await registerEvent(this.token, {
      eventTypeId: await findEventType('Tackle completado', this.token),
      matchId: match.id,
      teamPossession: 'OWN',
      matchTime: 300,
      period: 1,
      origin: LIVE_CAPTURE,
    });
    assert.equal(response.status, 200, `No se pudo registrar el evento en vivo: ${response.body?.message}`);
  });
});

// <==================== Eventos de contexto ====================>

Given('que se han registrado los siguientes eventos en el partido:', async function (dataTable) {
  for (const row of dataTable.hashes()) {
    await registerPostMatchEvent(this.currentMatch, this.token, {
      tipoEvento: row.tipo_evento,
      teamPossession: row.posesion,
      matchTime: parseInt(row.tiempo_segundos, 10),
      period: parseInt(row.periodo, 10),
      attributes: parseAttributes(row.atributos),
    });
  }
});

Given('que se han registrado eventos con y sin jugador asignado para el partido', async function () {
  const [player] = await getMatchRosterPlayers(this.currentMatch.id, this.token);
  assert.ok(player, 'El partido no tiene jugadores en el plantel');
  const tackle = { tipoEvento: 'Tackle completado', teamPossession: 'OWN', period: 1 };
  await registerPostMatchEvent(this.currentMatch, this.token, { ...tackle, matchTime: 300, playerId: player.id });
  await registerPostMatchEvent(this.currentMatch, this.token, { ...tackle, matchTime: 600 });
});

// <==================== Línea de eventos post-partido ====================>

When('el entrenador consulta la línea de eventos del partido cerrado', async function () {
  this.response = await getPostMatchTimeline(this.currentMatch.id, this.token);
});

Then('el sistema responde con {int} y devuelve la lista completa de {int} eventos ordenados cronológicamente', function (statusCode, cantidad) {
  assert.equal(this.response.status, statusCode, this.response.body?.message);
  const events = this.response.body;
  assert.equal(events.length, cantidad);
  for (let i = 1; i < events.length; i++) {
    const [anterior, actual] = [events[i - 1], events[i]];
    const ordenado = anterior.period < actual.period
      || (anterior.period === actual.period && anterior.matchTime <= actual.matchTime);
    assert.ok(ordenado, `El evento ${i} no está en orden cronológico respecto del anterior`);
  }
});

Then('cada evento contiene tipo, tiempo de juego y marca de tiempo real', function () {
  for (const event of this.response.body) {
    assert.ok(event.eventTypeId && event.eventTypeName, 'El evento no tiene tipo');
    assert.ok(event.matchTime !== null && event.matchTime !== undefined, 'El evento no tiene tiempo de juego');
    assert.ok(event.realTime, 'El evento no tiene marca de tiempo real');
  }
});

Then('se identifican claramente los eventos que no tienen jugador asignado', function () {
  const events = this.response.body;
  assert.ok(events.some((e) => e.playerId === null), 'No hay eventos sin jugador asignado');
  assert.ok(events.some((e) => e.playerId !== null), 'No hay eventos con jugador asignado para comparar');
});

// <==================== Tanteador ====================>

Then('el tanteador propio del partido es {int}', async function (puntos) {
  const response = await makeHttpRequest('GET', `matches/${this.currentMatch.id}`, null, this.token);
  assert.equal(response.status, 200, 'No se pudo consultar el partido');
  assert.equal(response.body.homeScore, puntos);
});
