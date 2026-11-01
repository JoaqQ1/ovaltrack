import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { getUserToken } from '../../support/auth_helper.js';
import { findEventType, getPostMatchEvents, parseAttributes, registerEvent } from '../../support/event_helper.js';
import { LIVE_CAPTURE, POST_CAPTURE, findRosterPlayer } from '../../support/post_match_helper.js';

// Los partidos de contexto, la consulta de la línea de eventos y el tanteador
// se definen en linea_eventos_steps.js

const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000';

// <==================== Helpers ====================>

const addPostMatchEvent = async function (tipoEvento, atributos, minuto, periodo, playerId = null) {
  this.response = await registerEvent(this.token, {
    eventTypeId: await findEventType(tipoEvento, this.token),
    matchId: this.currentMatch.id,
    teamPossession: 'OWN',
    playerId,
    matchTime: minuto * 60,
    period: periodo,
    origin: POST_CAPTURE,
    attributes: parseAttributes(atributos),
  });
  this.createdEventId = this.response.body?.id;
};

const findCreatedEvent = async function () {
  const events = await getPostMatchEvents(this.currentMatch.id, this.token);
  const event = events.find((e) => e.id === this.createdEventId);
  assert.ok(event, 'El evento agregado no aparece en la línea de eventos');
  return event;
};

// <==================== Alta post-partido ====================>

When('el entrenador agrega post-partido el evento {string} con atributos {string} para el equipo propio con el jugador {string} en el minuto {int} del periodo {int}', async function (tipoEvento, atributos, nombreJugador, minuto, periodo) {
  const player = await findRosterPlayer(this.currentMatch.id, nombreJugador, this.token);
  await addPostMatchEvent.call(this, tipoEvento, atributos, minuto, periodo, player.id);
});

When('el entrenador agrega post-partido el evento {string} con atributos {string} para el equipo propio en el minuto {int} del periodo {int}', async function (tipoEvento, atributos, minuto, periodo) {
  await addPostMatchEvent.call(this, tipoEvento, atributos, minuto, periodo);
});

Then('la línea de eventos refleja el nuevo evento {string} en el periodo {int} asignado a {string}', async function (tipoEvento, periodo, nombreJugador) {
  const event = await findCreatedEvent.call(this);
  assert.equal(event.eventTypeName, tipoEvento);
  assert.equal(event.period, periodo);
  assert.equal(event.playerName, nombreJugador);
});

Then('la línea de eventos refleja el nuevo evento {string} sin jugador asignado', async function (tipoEvento) {
  const event = await findCreatedEvent.call(this);
  assert.equal(event.eventTypeName, tipoEvento);
  assert.equal(event.playerId, null);
});

Then('el evento agregado se identifica con origen post-partido', async function () {
  const event = await findCreatedEvent.call(this);
  assert.equal(event.origin, POST_CAPTURE);
});

Then('se distingue claramente el evento cargado en vivo del evento agregado post-partido', function () {
  assert.equal(this.response.status, 200, this.response.body?.message);
  const origins = this.response.body.map((e) => e.origin);
  assert.ok(origins.includes(LIVE_CAPTURE), 'No hay eventos cargados en vivo en la línea');
  assert.ok(origins.includes(POST_CAPTURE), 'No hay eventos agregados post-partido en la línea');
});

// <==================== Errores en el alta post-partido ====================>

When('el entrenador intenta agregar post-partido el evento {string} con un jugador fuera del plantel', async function (tipoEvento) {
  this.response = await registerEvent(this.token, {
    eventTypeId: await findEventType(tipoEvento, this.token),
    matchId: this.currentMatch.id,
    teamPossession: 'OWN',
    playerId: UNKNOWN_ID,
    matchTime: 600,
    period: 1,
    origin: POST_CAPTURE,
    attributes: tipoEvento === 'Try' ? { zone: 'center' } : undefined,
  });
});

When('el entrenador intenta agregar post-partido un evento con un ID de tipo de evento inválido', async function () {
  this.response = await registerEvent(this.token, {
    eventTypeId: UNKNOWN_ID,
    matchId: this.currentMatch.id,
    teamPossession: 'OWN',
    matchTime: 600,
    period: 1,
    origin: POST_CAPTURE,
  });
});

When('el administrador del club con email {string} y contraseña {string} intenta agregar un evento post-partido a ese partido', async function (email, contraseña) {
  const otherClubToken = await getUserToken(email, contraseña);
  assert.ok(otherClubToken, `Fallo de inicio de sesión para ${email}`);
  this.response = await registerEvent(otherClubToken, {
    eventTypeId: await findEventType('Tackle completado', otherClubToken),
    matchId: this.currentMatch.id,
    teamPossession: 'OWN',
    matchTime: 600,
    period: 1,
    origin: POST_CAPTURE,
  });
});
