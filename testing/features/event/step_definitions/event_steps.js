import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { findDivisionIdByName } from '../../support/division_helper.js';
import { findEventTypeIdByName } from '../../support/event_helper.js';

const BACKEND_URL = process.env.API_URL || 'http://backend:8080';

Given('que existe un partido en curso para la división {string} contra {string}', async function (divisionNombre, rival) {
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
    const createRes = await fetch(`${BACKEND_URL}/matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({
        date: '2026-10-15T15:30:00',
        divisionId: divisionId,
        opponent: rival
      })
    });
    assert.equal(createRes.status, 200, 'No se pudo crear el partido base');
    match = await createRes.json();
  }

  // 3. Ponerlo en curso si no lo está
  if (match.status !== 'IN_PROGRESS') {
    const startRes = await fetch(`${BACKEND_URL}/matches/${match.id}/start`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    assert.equal(startRes.status, 200, 'No se pudo iniciar el partido');
    match.status = 'IN_PROGRESS';
  }

  this.currentMatch = match;
});

Given('que existe un partido en estado cancelado para la división {string} contra {string}', async function (divisionNombre, rival) {
  const divisionId = await findDivisionIdByName(divisionNombre, this.token);
  assert.ok(divisionId, `No se encontró la división con nombre "${divisionNombre}"`);

  const createRes = await fetch(`${BACKEND_URL}/matches`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify({
      date: '2026-12-15T10:00:00',
      divisionId: divisionId,
      opponent: rival
    })
  });
  assert.equal(createRes.status, 200, 'No se pudo crear el partido para cancelar');
  const match = await createRes.json();

  const cancelRes = await fetch(`${BACKEND_URL}/matches/${match.id}/cancel`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  assert.equal(cancelRes.status, 200, 'No se pudo cancelar el partido');
  match.status = 'CANCELLED';

  this.currentMatch = match;
});

When('registra el evento {string} para el equipo propio en el minuto {int} del periodo {int}', async function (tipoEvento, minuto, periodo) {
  const eventTypeId = await findEventTypeIdByName(tipoEvento, this.token);
  assert.ok(eventTypeId, `No se encontró el tipo de evento "${tipoEvento}"`);

  this.lastResponse = await fetch(`${BACKEND_URL}/event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify({
      eventTypeId: eventTypeId,
      matchId: this.currentMatch.id,
      teamPossession: 'OWN',
      matchTime: minuto * 60,
      period: periodo,
      origin: 'live-capture'
    })
  });

  const text = await this.lastResponse.text();
  try {
    this.lastResponseBody = JSON.parse(text);
  } catch {
    this.lastResponseBody = text;
  }
});

Then('el sistema responde con código {int} y devuelve el evento creado con periodo {int} y posesión {string}', function (statusCode, periodoEsperado, posesionEsperada) {
  assert.equal(this.lastResponse.status, statusCode, `Se esperaba código ${statusCode} pero se obtuvo ${this.lastResponse.status}: ${JSON.stringify(this.lastResponseBody)}`);
  assert.ok(this.lastResponseBody.id, 'El evento no contiene un ID generado');
  assert.equal(this.lastResponseBody.period, periodoEsperado, `Se esperaba período ${periodoEsperado} pero se obtuvo ${this.lastResponseBody.period}`);
  assert.equal(this.lastResponseBody.teamPossession, posesionEsperada, `Se esperaba posesión ${posesionEsperada} pero se obtuvo ${this.lastResponseBody.teamPossession}`);
});

When('registra los siguientes eventos para el partido:', async function (dataTable) {
  const rows = dataTable.hashes();
  this.eventCreationResponses = [];

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
        origin: 'live-capture'
      })
    });

    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }

    this.eventCreationResponses.push({ status: res.status, body, expectedType: row.tipo_evento });
  }
});

Then('el sistema responde con código {int} confirmando el registro de todos los eventos', function (statusCode) {
  assert.ok(this.eventCreationResponses.length > 0, 'No se registraron respuestas de creación de eventos');
  for (const item of this.eventCreationResponses) {
    assert.equal(item.status, statusCode, `Se esperaba código ${statusCode} para el evento ${item.expectedType} pero se obtuvo ${item.status}: ${JSON.stringify(item.body)}`);
    assert.ok(item.body.id, `El evento ${item.expectedType} no contiene un ID asignado`);
  }
});

Then('el partido cuenta con {int} eventos registrados para el periodo {int}', async function (cantidadEsperada, periodo) {
  const res = await fetch(`${BACKEND_URL}/event/match?matchId=${this.currentMatch.id}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  assert.equal(res.status, 200, 'Error al consultar los eventos del partido');

  const events = await res.json();
  const eventsInPeriod = events.filter(e => e.period === periodo && e.active !== false);
  assert.equal(
    eventsInPeriod.length,
    cantidadEsperada,
    `Se esperaban ${cantidadEsperada} eventos en el período ${periodo} pero se encontraron ${eventsInPeriod.length}`
  );
});

When('intenta registrar un evento de tipo desconocido con ID inexistente', async function () {
  const fakeEventTypeId = '00000000-0000-0000-0000-000000000000';

  this.lastResponse = await fetch(`${BACKEND_URL}/event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify({
      eventTypeId: fakeEventTypeId,
      matchId: this.currentMatch.id,
      teamPossession: 'OWN',
      matchTime: 999,
      period: 1,
      origin: 'live-capture'
    })
  });

  const text = await this.lastResponse.text();
  try {
    this.lastResponseBody = JSON.parse(text);
  } catch {
    this.lastResponseBody = text;
  }
});

When('intenta registrar un evento para ese partido cancelado', async function () {
  const eventTypeId = await findEventTypeIdByName('Try', this.token);
  assert.ok(eventTypeId, 'No se pudo obtener el tipo de evento "Try"');

  this.lastResponse = await fetch(`${BACKEND_URL}/event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify({
      eventTypeId: eventTypeId,
      matchId: this.currentMatch.id,
      teamPossession: 'OWN',
      matchTime: 120,
      period: 1,
      origin: 'live-capture'
    })
  });

  const text = await this.lastResponse.text();
  try {
    this.lastResponseBody = JSON.parse(text);
  } catch {
    this.lastResponseBody = text;
  }
});
