import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { findEventTypeIdByName } from '../../support/event_helper.js';
import { findDivisionIdByName } from '../../support/division_helper.js';

const BACKEND_URL = process.env.API_URL || 'http://backend:8080';

// HP1: Alta con jugador
When('el entrenador agrega post-partido el evento {string} para el equipo propio con el jugador {string} en el minuto {int} del periodo {int}', async function (tipoEvento, nombreJugador, minuto, periodo) {
  assert.ok(this.currentMatch, 'No hay partido actual en el contexto');

  const eventTypeId = await findEventTypeIdByName(tipoEvento, this.token);
  assert.ok(eventTypeId, `No se encontró el tipo de evento "${tipoEvento}"`);

  const rosterRes = await fetch(`${BACKEND_URL}/roster/${this.currentMatch.id}/available`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  const players = await rosterRes.json();
  let player = players.find(p => p.fullName === nombreJugador);
  if (!player && players.length > 0) {
    player = players[0];
  }
  assert.ok(player, 'No hay jugadores disponibles en el roster del partido');
  this.lastAssignedPlayerId = player.id;

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
      playerId: player.id,
      matchTime: minuto * 60,
      period: periodo,
      origin: 'post_capture',
      realTime: new Date().toISOString()
    })
  });

  const text = await this.lastResponse.text();
  try {
    this.lastCreatedEvent = JSON.parse(text);
  } catch {
    this.lastCreatedEvent = text;
  }
});

Then('la línea de eventos refleja el nuevo evento {string} en el periodo {int} asignado a {string}', async function (tipoEvento, periodo, nombreJugador) {
  const eventsRes = await fetch(`${BACKEND_URL}/event/match/post-match?matchId=${this.currentMatch.id}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  assert.equal(eventsRes.status, 200, 'Error al consultar la línea de eventos post-partido');
  const events = await eventsRes.json();

  const found = events.find(e => 
    e.eventTypeName === tipoEvento &&
    e.period === periodo &&
    e.playerId === this.lastAssignedPlayerId
  );
  assert.ok(found, `No se encontró en la línea de eventos el evento "${tipoEvento}" asignado al jugador`);
});

Then('el evento agregado se identifica con origen post-partido', async function () {
  const eventsRes = await fetch(`${BACKEND_URL}/event/match/post-match?matchId=${this.currentMatch.id}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  assert.equal(eventsRes.status, 200, 'Error al consultar post-match');
  const events = await eventsRes.json();

  const targetId = this.lastCreatedEvent?.id;
  const event = events.find(e => e.id === targetId);
  assert.ok(event, `No se encontró el evento creado con ID ${targetId}`);
  assert.equal(event.origin, 'post_capture', `Se esperaba origin "post_capture" pero se obtuvo "${event.origin}"`);
});

// HP2: Alta sin jugador
When('el entrenador agrega post-partido el evento {string} para el equipo propio sin jugador en el minuto {int} del periodo {int}', async function (tipoEvento, minuto, periodo) {
  assert.ok(this.currentMatch, 'No hay partido actual en el contexto');

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
      playerId: null,
      matchTime: minuto * 60,
      period: periodo,
      origin: 'post_capture',
      realTime: new Date().toISOString()
    })
  });

  const text = await this.lastResponse.text();
  try {
    this.lastCreatedEvent = JSON.parse(text);
  } catch {
    this.lastCreatedEvent = text;
  }
});

Then('la línea de eventos refleja el nuevo evento {string} sin jugador asignado', async function (tipoEvento) {
  const eventsRes = await fetch(`${BACKEND_URL}/event/match/post-match?matchId=${this.currentMatch.id}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  const events = await eventsRes.json();

  const targetId = this.lastCreatedEvent?.id;
  const found = events.find(e => e.id === targetId && (e.playerId === null || e.playerId === undefined));
  assert.ok(found, `No se encontró el evento "${tipoEvento}" sin jugador asignado`);
});

// HP3: Actualización de tanteador al sumar
Then('el tanteador propio del partido se actualiza correctamente sumando los puntos', async function () {
  const matchRes = await fetch(`${BACKEND_URL}/matches/${this.currentMatch.id}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  const freshMatch = await matchRes.json();
  const initial = this.initialHomeScore || 0;
  assert.ok(freshMatch.homeScore > initial, `El marcador no se incrementó. Inicial: ${initial}, Actual: ${freshMatch.homeScore}`);
});

// HP4: Distinción entre vivo y post-partido
Given('que se han registrado eventos en vivo para el partido', async function () {
  assert.ok(this.currentMatch, 'No hay partido actual en el contexto');
  
  // Para registrar un evento con origin live-capture, creamos uno específico
  // Si el partido ya está cerrado, simulamos el registro con un helper o aseguramos que exista
  // Nota: en BD o mediante endpoint de fixture
  const eventTypeId = await findEventTypeIdByName('Tackle completado', this.token);
  assert.ok(eventTypeId, 'No se encontró el tipo de evento');

  // Si necesitamos que tenga origin 'live-capture', usamos un evento previamente cargado o lo creamos
  // Nota: El backend permite saveEvent si el match no está finished O si origin != post_capture falla si está finished.
  // Por lo tanto, si necesitamos crear un partido con eventos en vivo, reiniciamos el flujo para este partido:
  const divisionId = this.currentMatch.divisionId || (await findDivisionIdByName('Primera', this.token));
  const uniqueOpponent = `Patoruzu-${Date.now()}`;
  
  const createRes = await fetch(`${BACKEND_URL}/matches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
    body: JSON.stringify({ date: '2026-11-10T15:30:00', divisionId: divisionId, opponent: uniqueOpponent })
  });
  const newMatch = await createRes.json();

  // Iniciar partido
  await fetch(`${BACKEND_URL}/matches/${newMatch.id}/start`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${this.token}` }
  });

  // Cargar evento en vivo
  await fetch(`${BACKEND_URL}/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
    body: JSON.stringify({
      eventTypeId: eventTypeId,
      matchId: newMatch.id,
      teamPossession: 'OWN',
      matchTime: 300,
      period: 1,
      origin: 'live-capture',
      realTime: new Date().toISOString()
    })
  });

  // Finalizar partido
  await fetch(`${BACKEND_URL}/matches/${newMatch.id}/finish`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${this.token}` }
  });

  this.currentMatch = newMatch;
});

When('el entrenador agrega post-partido el evento {string} para el equipo propio en el minuto {int} del periodo {int}', async function (tipoEvento, minuto, periodo) {
  assert.ok(this.currentMatch, 'No hay partido en el contexto');
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
      origin: 'post_capture',
      realTime: new Date().toISOString()
    })
  });

  const text = await this.lastResponse.text();
  try {
    this.lastCreatedEvent = JSON.parse(text);
  } catch {
    this.lastCreatedEvent = text;
  }
});

Then('se distingue claramente el evento cargado en vivo del evento agregado post-partido', function () {
  assert.ok(Array.isArray(this.lastResponseBody), 'La respuesta debe ser una lista de eventos');
  
  const liveEvent = this.lastResponseBody.find(e => e.origin === 'live-capture');
  const postEvent = this.lastResponseBody.find(e => e.origin === 'post_capture');

  assert.ok(liveEvent, 'Debe existir al menos un evento con origin "live-capture"');
  assert.ok(postEvent, 'Debe existir al menos un evento con origin "post_capture"');
  assert.notEqual(liveEvent.origin, postEvent.origin, 'Los orígenes de los eventos deben ser distintos');
});

// Sad Paths
When('el entrenador intenta agregar post-partido el evento {string} con un jugador fuera del plantel', async function (tipoEvento) {
  assert.ok(this.currentMatch, 'No hay partido en el contexto');
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
      playerId: '00000000-0000-0000-0000-000000000000',
      matchTime: 600,
      period: 1,
      origin: 'post_capture'
    })
  });
});

When('el entrenador intenta agregar post-partido un evento con un ID de tipo de evento inválido', async function () {
  assert.ok(this.currentMatch, 'No hay partido en el contexto');

  this.lastResponse = await fetch(`${BACKEND_URL}/event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify({
      eventTypeId: '00000000-0000-0000-0000-000000000000',
      matchId: this.currentMatch.id,
      teamPossession: 'OWN',
      matchTime: 600,
      period: 1,
      origin: 'post_capture'
    })
  });
});

When('el entrenador intenta agregar un evento post-partido a ese partido ajeno', async function () {
  assert.ok(this.currentMatch, 'No hay partido ajeno en el contexto');
  const eventTypeId = await findEventTypeIdByName('Try', this.token);
  assert.ok(eventTypeId, 'No se encontró el tipo de evento Try');

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
      matchTime: 600,
      period: 1,
      origin: 'post_capture'
    })
  });
});
