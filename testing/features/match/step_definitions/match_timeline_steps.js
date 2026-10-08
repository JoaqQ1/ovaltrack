import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { findDivisionIdByName } from '../../support/division_helper.js';
import { findEventTypeIdByName } from '../../support/event_helper.js';

const BACKEND_URL = process.env.API_URL || 'http://backend:8080';

const matchDates = {
  'Trelew Rugby Club': '2026-10-15T15:30:00',
  'Comodoro Rugby Club': '2026-10-20T15:30:00',
  'Calafate RC': '2026-10-21T15:30:00',
};

Given('que existe un partido finalizado para la división {string} contra {string}', async function (divisionNombre, rival) {
  const divisionId = await findDivisionIdByName(divisionNombre, this.token);
  assert.ok(divisionId, `No se encontró la división con nombre "${divisionNombre}"`);

  // 1. Buscar si ya existe
  const listRes = await fetch(`${BACKEND_URL}/matches/division?divisionId=${divisionId}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  let match = null;
  if (listRes.ok) {
    const matches = await listRes.json();
    match = matches.find(m => m.opponent === rival);
  }

  // 2. Si no existe, crearlo
  if (!match) {
    const matchDate = matchDates[rival] || '2026-11-01T15:30:00';
    const createRes = await fetch(`${BACKEND_URL}/matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({
        date: matchDate,
        divisionId: divisionId,
        opponent: rival
      })
    });
    assert.equal(createRes.status, 200, `No se pudo crear el partido contra ${rival}`);
    match = await createRes.json();
  }

  // 3. Pasar a IN_PROGRESS si es NOT_STARTED
  if (match.status === 'NOT_STARTED') {
    const startRes = await fetch(`${BACKEND_URL}/matches/${match.id}/start`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    assert.equal(startRes.status, 200, 'No se pudo iniciar el partido');
    match.status = 'IN_PROGRESS';
  }

  // 4. Finalizar si no está FINISHED
  if (match.status !== 'FINISHED') {
    const finishRes = await fetch(`${BACKEND_URL}/matches/${match.id}/finish`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    assert.equal(finishRes.status, 200, 'No se pudo finalizar el partido');
    match.status = 'FINISHED';
  }

  this.currentMatch = match;
});

Given('que se han registrado los siguientes eventos en el partido:', async function (dataTable) {
  assert.ok(this.currentMatch, 'No hay un partido en el contexto');
  const rows = dataTable.hashes();

  for (const row of rows) {
    const eventTypeId = await findEventTypeIdByName(row.tipo_evento, this.token);
    assert.ok(eventTypeId, `No se encontró el tipo de evento "${row.tipo_evento}"`);

    const res = await fetch(`${BACKEND_URL}/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({
        eventTypeId: eventTypeId,
        matchId: this.currentMatch.id,
        teamPossession: row.posesion,
        matchTime: parseInt(row.tiempo_segundos, 10),
        period: parseInt(row.periodo, 10),
        realTime: new Date().toISOString(),
        origin: 'post_capture'
      })
    });
    assert.equal(res.status, 200, `Error al registrar evento previo ${row.tipo_evento}`);
  }
});

Given('que se han registrado eventos con y sin jugador asignado para el partido', async function () {
  assert.ok(this.currentMatch, 'No hay un partido en el contexto');
  const eventTypeId = await findEventTypeIdByName('Try', this.token);
  assert.ok(eventTypeId, 'No se encontró el tipo de evento "Try"');

  // Evento sin jugador (playerId: null)
  const resSinJugador = await fetch(`${BACKEND_URL}/event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify({
      eventTypeId: eventTypeId,
      matchId: this.currentMatch.id,
      teamPossession: 'OWN',
      matchTime: 300,
      period: 1,
      playerId: null,
      realTime: new Date().toISOString(),
      origin: 'post_capture'
    })
  });
  assert.equal(resSinJugador.status, 200, 'Error al registrar evento sin jugador');
});

When('el entrenador consulta la línea de eventos del partido cerrado', async function () {
  assert.ok(this.currentMatch, 'No hay un partido en el contexto');

  this.lastResponse = await fetch(`${BACKEND_URL}/event/match/post-match?matchId=${this.currentMatch.id}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${this.token}` }
  });

  const text = await this.lastResponse.text();
  try {
    this.lastResponseBody = JSON.parse(text);
  } catch {
    this.lastResponseBody = text;
  }
});

When('el entrenador intenta consultar la línea de eventos post-partido de ese partido en curso', async function () {
  assert.ok(this.currentMatch, 'No hay un partido en el contexto');

  this.lastResponse = await fetch(`${BACKEND_URL}/event/match/post-match?matchId=${this.currentMatch.id}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${this.token}` }
  });

  const text = await this.lastResponse.text();
  try {
    this.lastResponseBody = JSON.parse(text);
  } catch {
    this.lastResponseBody = text;
  }
});

Then('el sistema responde con código {int} y devuelve la lista completa de {int} eventos ordenados cronológicamente', function (statusCode, cantidad) {
  assert.equal(this.lastResponse.status, statusCode, `Status code inválido: ${this.lastResponse.status}`);
  assert.ok(Array.isArray(this.lastResponseBody), 'La respuesta debe ser una lista de eventos');
  assert.equal(this.lastResponseBody.length, cantidad, `Se esperaban ${cantidad} eventos pero se obtuvieron ${this.lastResponseBody.length}`);

  // Verificar orden cronológico
  for (let i = 0; i < this.lastResponseBody.length - 1; i++) {
    const actual = this.lastResponseBody[i];
    const siguiente = this.lastResponseBody[i + 1];

    if (actual.period === siguiente.period) {
      assert.ok(actual.matchTime <= siguiente.matchTime, `Los eventos deben estar ordenados cronológicamente por matchTime`);
    } else {
      assert.ok(actual.period <= siguiente.period, `Los eventos deben estar ordenados cronológicamente por período`);
    }
  }
});

Then('cada evento contiene tipo, tiempo de juego y marca de tiempo real', function () {
  assert.ok(Array.isArray(this.lastResponseBody), 'La respuesta debe ser un arreglo de eventos');
  for (const evento of this.lastResponseBody) {
    assert.ok(evento.eventTypeId, 'El evento debe tener un eventTypeId');
    assert.ok(evento.matchTime !== null && evento.matchTime !== undefined, 'El evento debe tener matchTime');
    assert.ok(evento.realTime !== null && evento.realTime !== undefined, 'El evento debe tener realTime');
  }
});

Then('se identifican claramente los eventos que no tienen jugador asignado', function () {
  assert.ok(Array.isArray(this.lastResponseBody), 'La respuesta debe ser un arreglo');
  const eventoSinJugador = this.lastResponseBody.find(e => e.playerId === null || e.playerId === undefined);
  assert.ok(eventoSinJugador, 'Debe existir al menos un evento sin jugador asignado en la lista');
});
