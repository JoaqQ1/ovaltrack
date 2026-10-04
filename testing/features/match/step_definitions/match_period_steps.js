import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { findDivisionIdByName } from '../../support/division_helper.js';
import { findEventTypeIdByName } from '../../support/event_helper.js';

const BACKEND_URL = process.env.API_URL || 'http://backend:8080';

const matchDates = {
  'Comodoro Rugby Club': '2026-10-20T15:30:00',
  'Calafate RC': '2026-10-21T15:30:00',
  'Puerto Madryn RC': '2026-10-22T17:00:00',
  'Chenque Rugby Club': '2026-10-23T15:30:00',
  'Draig Goch RC': '2026-10-24T15:30:00'
};

Given('que se han registrado los siguientes eventos en el primer tiempo:', async function (dataTable) {
  assert.ok(this.currentMatch, 'No hay un partido en curso en el contexto');
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
        origin: 'live-capture'
      })
    });
    assert.equal(res.status, 200, `Error al registrar evento previo ${row.tipo_evento}`);
  }
});

When('el entrenador solicita cerrar el primer tiempo del partido', async function () {
  assert.ok(this.currentMatch, 'No hay un partido en curso en el contexto');

  this.lastResponse = await fetch(`${BACKEND_URL}/matches/${this.currentMatch.id}/close-first-half`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${this.token}` }
  });

  const text = await this.lastResponse.text();
  try {
    this.lastResponseBody = JSON.parse(text);
  } catch {
    this.lastResponseBody = text;
  }
});

Then('el sistema responde con código {int} y devuelve el partido con estado {string} y periodo {int}', function (statusCode, estadoEsperado, periodoEsperado) {
  assert.equal(this.lastResponse.status, statusCode, `Se esperaba código ${statusCode} pero se obtuvo ${this.lastResponse.status}: ${JSON.stringify(this.lastResponseBody)}`);
  assert.equal(this.lastResponseBody.status, estadoEsperado, `Se esperaba estado "${estadoEsperado}" pero se obtuvo "${this.lastResponseBody.status}"`);
  assert.equal(this.lastResponseBody.currentPeriod, periodoEsperado, `Se esperaba periodo ${periodoEsperado} pero se obtuvo ${this.lastResponseBody.currentPeriod}`);
});

Given('que el partido contra {string} se encuentra en estado de entretiempo', async function (rival) {
  const divisionId = await findDivisionIdByName('Primera', this.token);
  assert.ok(divisionId, 'No se encontró la división "Primera"');

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
    const matchDate = matchDates[rival] || '2026-10-25T15:30:00';
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
    assert.equal(createRes.status, 200, `No se pudo crear el partido base contra ${rival}`);
    match = await createRes.json();
  }

  // 3. Ponerlo en curso si está SCHEDULED
  if (match.status === 'SCHEDULED' || match.status === 'NOT_STARTED') {
    const startRes = await fetch(`${BACKEND_URL}/matches/${match.id}/start`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    assert.equal(startRes.status, 200, 'No se pudo iniciar el partido');
    match.status = 'IN_PROGRESS';
  }

  // 4. Cerrar el primer tiempo si está en IN_PROGRESS
  if (match.status === 'IN_PROGRESS' && match.currentPeriod !== 2) {
    const tryTypeId = await findEventTypeIdByName('Try', this.token);
    const tackleTypeId = await findEventTypeIdByName('Tackle completado', this.token);
    const penalTypeId = await findEventTypeIdByName('Penal a los palos', this.token);

    await fetch(`${BACKEND_URL}/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
      body: JSON.stringify({ eventTypeId: tryTypeId, matchId: match.id, teamPossession: 'OWN', matchTime: 300, period: 1, origin: 'live-capture' })
    });
    await fetch(`${BACKEND_URL}/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
      body: JSON.stringify({ eventTypeId: tackleTypeId, matchId: match.id, teamPossession: 'OPPONENT', matchTime: 600, period: 1, origin: 'live-capture' })
    });
    await fetch(`${BACKEND_URL}/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
      body: JSON.stringify({ eventTypeId: penalTypeId, matchId: match.id, teamPossession: 'OWN', matchTime: 1200, period: 1, origin: 'live-capture' })
    });

    const closeRes = await fetch(`${BACKEND_URL}/matches/${match.id}/close-first-half`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    const closeText = await closeRes.text();
    assert.equal(closeRes.status, 200, `No se pudo cerrar el primer tiempo para dejarlo en entretiempo: ${closeText}`);
    match = JSON.parse(closeText);
  }

  this.currentMatch = match;
});

When('el entrenador solicita iniciar el segundo tiempo del partido', async function () {
  assert.ok(this.currentMatch, 'No hay un partido en entretiempo en el contexto');

  this.lastResponse = await fetch(`${BACKEND_URL}/matches/${this.currentMatch.id}/start-second-half`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${this.token}` }
  });

  const text = await this.lastResponse.text();
  try {
    this.lastResponseBody = JSON.parse(text);
  } catch {
    this.lastResponseBody = text;
  }
});

When('el entrenador registra el evento {string} para el equipo propio en el minuto {int} del periodo {int}', async function (tipoEvento, minuto, periodo) {
  assert.ok(this.currentMatch, 'No hay un partido en el contexto');
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

Given('que existe un partido programado para la división {string} contra {string}', async function (divisionNombre, rival) {
  const divisionId = await findDivisionIdByName(divisionNombre, this.token);
  assert.ok(divisionId, `No se encontró la división "${divisionNombre}"`);

  const matchDate = matchDates[rival] || '2026-11-20T17:00:00';
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
  assert.equal(createRes.status, 200, `No se pudo crear el partido programado contra ${rival}`);
  this.scheduledMatch = await createRes.json();
});

When('el entrenador solicita cerrar el primer tiempo de ese partido programado', async function () {
  assert.ok(this.scheduledMatch, 'No hay un partido programado en el contexto');

  this.lastResponse = await fetch(`${BACKEND_URL}/matches/${this.scheduledMatch.id}/close-first-half`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${this.token}` }
  });

  const text = await this.lastResponse.text();
  try {
    this.lastResponseBody = JSON.parse(text);
  } catch {
    this.lastResponseBody = text;
  }
});

Given('que el partido contra {string} se encuentra en el segundo tiempo', async function (rival) {
  const divisionId = await findDivisionIdByName('Primera', this.token);
  assert.ok(divisionId, 'No se encontró la división "Primera"');

  // 1. Buscar o crear partido
  const listRes = await fetch(`${BACKEND_URL}/matches/division?divisionId=${divisionId}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  let match = null;
  if (listRes.ok) {
    const matches = await listRes.json();
    match = matches.find(m => m.opponent === rival);
  }

  if (!match) {
    const matchDate = matchDates[rival] || '2026-10-23T15:30:00';
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
    assert.equal(createRes.status, 200, `No se pudo crear el partido base contra ${rival}`);
    match = await createRes.json();
  }

  // 2. Iniciar si SCHEDULED
  if (match.status === 'SCHEDULED' || match.status === 'NOT_STARTED') {
    const startRes = await fetch(`${BACKEND_URL}/matches/${match.id}/start`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    assert.equal(startRes.status, 200, 'No se pudo iniciar el partido');
    match.status = 'IN_PROGRESS';
  }

  // 3. Cerrar 1T si está en 1T
  if (match.status === 'IN_PROGRESS' && match.currentPeriod !== 2) {
    const closeRes = await fetch(`${BACKEND_URL}/matches/${match.id}/close-first-half`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    const closeText = await closeRes.text();
    assert.equal(closeRes.status, 200, `No se pudo cerrar 1T: ${closeText}`);
    match.status = 'HALFTIME';
  }

  // 4. Iniciar 2T si está en HALFTIME
  if (match.status === 'HALFTIME') {
    const start2Res = await fetch(`${BACKEND_URL}/matches/${match.id}/start-second-half`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    assert.equal(start2Res.status, 200, 'No se pudo iniciar 2T');
    match = await start2Res.json();
  }

  this.currentMatch = match;
});

When('el usuario intenta solicitar el cierre del primer tiempo del partido', async function () {
  assert.ok(this.currentMatch, 'No hay un partido en curso en el contexto');

  this.lastResponse = await fetch(`${BACKEND_URL}/matches/${this.currentMatch.id}/close-first-half`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${this.token}` }
  });

  const text = await this.lastResponse.text();
  try {
    this.lastResponseBody = JSON.parse(text);
  } catch {
    this.lastResponseBody = text;
  }
});

When('solicita cerrar el primer tiempo para un partido inexistente con ID {string}', async function (fakeId) {
  this.lastResponse = await fetch(`${BACKEND_URL}/matches/${fakeId}/close-first-half`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${this.token}` }
  });

  const text = await this.lastResponse.text();
  try {
    this.lastResponseBody = JSON.parse(text);
  } catch {
    this.lastResponseBody = text;
  }
});
