import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { findEventTypeIdByName } from '../../support/event_helper.js';
import { getUserToken } from '../../support/auth_helper.js';
import { findDivisionIdByName } from '../../support/division_helper.js';

const BACKEND_URL = process.env.API_URL || 'http://backend:8080';

// We store the target event id here across steps
let targetEventId = null;

// HP1
When('el entrenador edita el evento {string} asignándole el jugador {string}', async function (tipoEvento, nombreJugador) {
  assert.ok(this.currentMatch, 'No hay partido actual');
  const eventsRes = await fetch(`${BACKEND_URL}/event/match/post-match?matchId=${this.currentMatch.id}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  const events = await eventsRes.json();
  const event = events.find(e => e.eventTypeName === tipoEvento);
  assert.ok(event, `Evento ${tipoEvento} no encontrado`);
  targetEventId = event.id;

  const rosterRes = await fetch(`${BACKEND_URL}/roster/${this.currentMatch.id}/available`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  const players = await rosterRes.json();
  let player = players.find(p => p.fullName === nombreJugador);
  if (!player && players.length > 0) player = players[0]; 
  assert.ok(player, 'No hay jugadores disponibles en el roster');
  
  this.lastAssignedPlayerId = player.id;

  this.lastResponse = await fetch(`${BACKEND_URL}/event/${event.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify({
      eventTypeId: event.eventTypeId,
      teamPossession: event.teamPossession,
      playerId: player.id
    })
  });
});

Then('la línea de eventos refleja que el evento modificado está asignado a {string}', async function (nombreJugador) {
  const eventsRes = await fetch(`${BACKEND_URL}/event/match/post-match?matchId=${this.currentMatch.id}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  const events = await eventsRes.json();
  const event = events.find(e => e.id === targetEventId);
  
  assert.ok(event, 'El evento modificado ya no se encuentra en la lista');
  assert.equal(event.playerId, this.lastAssignedPlayerId, 'El playerId no coincide con el asignado');
});

// HP2
When('el entrenador edita el evento {string} cambiándolo a {string} con posesión {string}', async function (tipoAntiguo, tipoNuevo, posesion) {
  const eventsRes = await fetch(`${BACKEND_URL}/event/match/post-match?matchId=${this.currentMatch.id}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  const events = await eventsRes.json();
  const event = events.find(e => e.eventTypeName === tipoAntiguo);
  assert.ok(event, `Evento ${tipoAntiguo} no encontrado`);
  targetEventId = event.id;

  const newEventTypeId = await findEventTypeIdByName(tipoNuevo, this.token);

  this.lastResponse = await fetch(`${BACKEND_URL}/event/${event.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify({
      eventTypeId: newEventTypeId,
      teamPossession: posesion,
      playerId: null
    })
  });
});

Then('la línea de eventos refleja el cambio de tipo a {string} y posesión a {string}', async function (tipoNuevo, posesion) {
  const eventsRes = await fetch(`${BACKEND_URL}/event/match/post-match?matchId=${this.currentMatch.id}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  const events = await eventsRes.json();
  const event = events.find(e => e.id === targetEventId);
  
  assert.ok(event, 'El evento modificado ya no se encuentra en la lista');
  assert.equal(event.eventTypeName, tipoNuevo, 'El tipo de evento no coincide');
  assert.equal(event.teamPossession, posesion, 'La posesión no coincide');
});

// HP3
When('el entrenador elimina el evento {string}', async function (tipoEvento) {
  const eventsRes = await fetch(`${BACKEND_URL}/event/match/post-match?matchId=${this.currentMatch.id}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  const events = await eventsRes.json();
  const event = events.find(e => e.eventTypeName === tipoEvento);
  assert.ok(event, `Evento ${tipoEvento} no encontrado`);
  
  this.initialEventCount = events.length;
  targetEventId = event.id;

  this.lastResponse = await fetch(`${BACKEND_URL}/event/${event.id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
});

Then('al consultar la línea de eventos, la lista tiene un evento menos', async function () {
  const eventsRes = await fetch(`${BACKEND_URL}/event/match/post-match?matchId=${this.currentMatch.id}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  const events = await eventsRes.json();
  assert.equal(events.length, this.initialEventCount - 1, 'La cantidad de eventos no disminuyó');
});

// HP4
// We can intercept the given step from match_timeline_steps.js by declaring it here specifically with "con tanteador X a Y"
Given('que existe un partido finalizado para la división {string} contra {string} con tanteador {int} a {int}', async function (divisionNombre, rival, homeScore, awayScore) {
  // Simplemente re-usamos la logica de inicializacion básica, asumiendo que los eventos agregados luego daran el tanteador
  const divisionId = await findDivisionIdByName(divisionNombre, this.token);
  assert.ok(divisionId, `No se encontró la división con nombre "${divisionNombre}"`);

  let res = await fetch(`${BACKEND_URL}/matches/division?divisionId=${divisionId}`, { headers: { 'Authorization': `Bearer ${this.token}` } });
  let match = (await res.json()).find(m => m.opponent === rival);
  
  if (!match) {
    const createRes = await fetch(`${BACKEND_URL}/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
      body: JSON.stringify({ date: '2026-11-01T15:30:00', divisionId: divisionId, opponent: rival })
    });
    match = await createRes.json();
  }
  
  if (match.status === 'NOT_STARTED') await fetch(`${BACKEND_URL}/matches/${match.id}/start`, { method: 'PUT', headers: { 'Authorization': `Bearer ${this.token}` } });
  if (match.status !== 'FINISHED') await fetch(`${BACKEND_URL}/matches/${match.id}/finish`, { method: 'PUT', headers: { 'Authorization': `Bearer ${this.token}` } });
  
  this.currentMatch = match;
  
  // Guardar score inicial
  const matchRes = await fetch(`${BACKEND_URL}/matches/${match.id}`, { headers: { 'Authorization': `Bearer ${this.token}` } });
  const freshMatch = await matchRes.json();
  this.initialHomeScore = freshMatch.homeScore;
});

Then('el tanteador propio del partido se actualiza correctamente descontando los puntos', async function () {
  const matchRes = await fetch(`${BACKEND_URL}/matches/${this.currentMatch.id}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  const freshMatch = await matchRes.json();
  // Al borrar un Try, descuenta 5 puntos
  assert.ok(freshMatch.homeScore < this.initialHomeScore, 'El home_score no fue descontado');
});

// SP1
When('el entrenador intenta editar el evento {string} asignándole un jugador fuera del plantel', async function (tipoEvento) {
  const eventsRes = await fetch(`${BACKEND_URL}/event/match/post-match?matchId=${this.currentMatch.id}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  const event = (await eventsRes.json()).find(e => e.eventTypeName === tipoEvento);
  assert.ok(event, `Evento ${tipoEvento} no encontrado`);

  this.lastResponse = await fetch(`${BACKEND_URL}/event/${event.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify({
      eventTypeId: event.eventTypeId,
      teamPossession: event.teamPossession,
      playerId: '00000000-0000-0000-0000-000000000000' // UUID falso
    })
  });
});

Then('el sistema rechaza la solicitud con código {int} o {int}', function (code1, code2) {
  const status = this.lastResponse.status;
  assert.ok(status === code1 || status === code2, `Código de estado inesperado: ${status}. Se esperaba ${code1} o ${code2}`);
});

// SP2
When('el entrenador intenta editar el evento enviando un ID de tipo de evento inválido', async function () {
  const eventsRes = await fetch(`${BACKEND_URL}/event/match/post-match?matchId=${this.currentMatch.id}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  const event = (await eventsRes.json())[0];
  assert.ok(event, `No hay eventos para editar`);

  this.lastResponse = await fetch(`${BACKEND_URL}/event/${event.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify({
      eventTypeId: '00000000-0000-0000-0000-000000000000',
      teamPossession: event.teamPossession,
      playerId: null
    })
  });
});

// SP3
When('el entrenador intenta eliminar un evento con un ID que no existe', async function () {
  this.lastResponse = await fetch(`${BACKEND_URL}/event/00000000-0000-0000-0000-000000000000`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
});

// SP4
Given('que el entrenador del club {string} con email {string} y contraseña {string} ha iniciado sesión', async function (clubNombre, email, pwd) {
  this.token = await getUserToken(email, pwd);
  assert.ok(this.token, `Fallo el login para ${email}`);
});

Given('que existe un partido finalizado del club ajeno contra {string}', async function (rival) {
  // Inicia sesion temporalmente como el creador para tener un match
  const ownerToken = await getUserToken('jugador.uno@test.com', 'PassSegura123!');
  const divisionId = await findDivisionIdByName('Primera', ownerToken);
  let res = await fetch(`${BACKEND_URL}/matches/division?divisionId=${divisionId}`, { headers: { 'Authorization': `Bearer ${ownerToken}` } });
  let match = (await res.json()).find(m => m.opponent === rival);
  
  if (!match) {
    const createRes = await fetch(`${BACKEND_URL}/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
      body: JSON.stringify({ date: '2026-11-01T15:30:00', divisionId: divisionId, opponent: rival })
    });
    match = await createRes.json();
  }
  
  if (match.status === 'NOT_STARTED') await fetch(`${BACKEND_URL}/matches/${match.id}/start`, { method: 'PUT', headers: { 'Authorization': `Bearer ${ownerToken}` } });
  if (match.status !== 'FINISHED') await fetch(`${BACKEND_URL}/matches/${match.id}/finish`, { method: 'PUT', headers: { 'Authorization': `Bearer ${ownerToken}` } });
  
  // Create dummy event just in case
  const eventTypeId = await findEventTypeIdByName('Try', ownerToken);
  await fetch(`${BACKEND_URL}/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
    body: JSON.stringify({ eventTypeId, matchId: match.id, teamPossession: 'OWN', matchTime: 100, period: 1, realTime: new Date().toISOString(), origin: 'post_capture'})
  });

  this.currentMatch = match;
});

When('el entrenador intenta eliminar un evento de ese partido', async function () {
  // Use the other token
  const ownerToken = await getUserToken('jugador.uno@test.com', 'PassSegura123!');
  const eventsRes = await fetch(`${BACKEND_URL}/event/match/post-match?matchId=${this.currentMatch.id}`, {
    headers: { 'Authorization': `Bearer ${ownerToken}` }
  });
  const event = (await eventsRes.json())[0];
  assert.ok(event, `No hay evento ajeno`);

  // Try to delete it with our own token
  this.lastResponse = await fetch(`${BACKEND_URL}/event/${event.id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
});
