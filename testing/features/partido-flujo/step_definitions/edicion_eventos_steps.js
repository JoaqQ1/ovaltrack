import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { findEventType, getPostMatchEvents } from '../../support/event_helper.js';
import { getUserToken } from '../../support/auth_helper.js';
import { makeHttpRequest } from '../../support/httpRequest.js';
import { findRosterPlayer, findTimelineEvent, patchEvent } from '../../support/post_match_helper.js';

// Los partidos y eventos de contexto se definen en linea_eventos_steps.js

const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000';

// <==================== Asignación de jugador ====================>

When('el entrenador edita el evento {string} asignándole el jugador {string}', async function (tipoEvento, nombreJugador) {
  const event = await findTimelineEvent(this.currentMatch.id, tipoEvento, this.token);
  const player = await findRosterPlayer(this.currentMatch.id, nombreJugador, this.token);
  this.editedEventId = event.id;
  this.response = await patchEvent(event.id, { playerId: player.id }, this.token);
});

Then('la línea de eventos refleja que el evento modificado está asignado a {string}', async function (nombreJugador) {
  const events = await getPostMatchEvents(this.currentMatch.id, this.token);
  const event = events.find((e) => e.id === this.editedEventId);
  assert.ok(event, 'El evento modificado ya no está en la línea de eventos');
  assert.equal(event.playerName, nombreJugador);
});

Then('el jugador {string} queda vinculado como autor de la acción en el evento', async function (nombreJugador) {
  const player = await findRosterPlayer(this.currentMatch.id, nombreJugador, this.token);
  const response = await makeHttpRequest('GET', `event/${this.editedEventId}`, null, this.token);
  assert.equal(response.status, 200, 'No se pudo obtener el evento');
  assert.equal(response.body.playerId, player.id);
});

// <==================== Cambio de tipo y posesión ====================>

When('el entrenador edita el evento {string} cambiándolo a {string} con posesión {string}', async function (tipoAnterior, tipoNuevo, posesion) {
  const event = await findTimelineEvent(this.currentMatch.id, tipoAnterior, this.token);
  this.editedEventId = event.id;
  // Line-out exige su resultado en vivo, por eso se envía junto con el cambio de tipo
  this.response = await patchEvent(event.id, {
    eventTypeId: await findEventType(tipoNuevo, this.token),
    teamPossession: posesion,
    attributes: tipoNuevo === 'Line-out' ? { lineResult: 'won_clean' } : undefined,
  }, this.token);
});

Then('la línea de eventos refleja el cambio de tipo a {string} y posesión a {string}', async function (tipoNuevo, posesion) {
  const events = await getPostMatchEvents(this.currentMatch.id, this.token);
  const event = events.find((e) => e.id === this.editedEventId);
  assert.ok(event, 'El evento modificado ya no está en la línea de eventos');
  assert.equal(event.eventTypeName, tipoNuevo);
  assert.equal(event.teamPossession, posesion);
});

// <==================== Eliminación ====================>

When('el entrenador elimina el evento {string}', async function (tipoEvento) {
  this.initialEventCount = (await getPostMatchEvents(this.currentMatch.id, this.token)).length;
  const event = await findTimelineEvent(this.currentMatch.id, tipoEvento, this.token);
  this.response = await makeHttpRequest('DELETE', `event/${event.id}`, null, this.token);
});

Then('al consultar la línea de eventos, la lista tiene un evento menos', async function () {
  const events = await getPostMatchEvents(this.currentMatch.id, this.token);
  assert.equal(events.length, this.initialEventCount - 1);
});

// <==================== Errores al editar o eliminar ====================>

When('el entrenador intenta editar el evento {string} asignándole un jugador fuera del plantel', async function (tipoEvento) {
  const event = await findTimelineEvent(this.currentMatch.id, tipoEvento, this.token);
  this.response = await patchEvent(event.id, { playerId: UNKNOWN_ID }, this.token);
});

When('el entrenador intenta editar el evento {string} enviando un ID de tipo de evento inválido', async function (tipoEvento) {
  const event = await findTimelineEvent(this.currentMatch.id, tipoEvento, this.token);
  this.response = await patchEvent(event.id, { eventTypeId: UNKNOWN_ID }, this.token);
});

When('el entrenador intenta eliminar un evento con un ID que no existe', async function () {
  this.response = await makeHttpRequest('DELETE', `event/${UNKNOWN_ID}`, null, this.token);
});

When('el administrador del club con email {string} y contraseña {string} intenta eliminar el evento {string}', async function (email, contraseña, tipoEvento) {
  const event = await findTimelineEvent(this.currentMatch.id, tipoEvento, this.token);
  const otherClubToken = await getUserToken(email, contraseña);
  assert.ok(otherClubToken, `Fallo de inicio de sesión para ${email}`);
  this.response = await makeHttpRequest('DELETE', `event/${event.id}`, null, otherClubToken);
});
