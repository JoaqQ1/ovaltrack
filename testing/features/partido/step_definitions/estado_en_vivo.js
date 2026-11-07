import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { findEventType, registerEvent } from '../../support/event_helper.js';
import { MISSING_UUID } from '../../support/ids.js';
import { makeHttpRequest } from '../../support/httpRequest.js';

// Pasos reutilizados:
//  - "Y que existe un partido programado ..." y "Y que el partido está en curso" (partido_steps.js)

const CLOCK = { 'en marcha': false, pausado: true };

const getLiveState = (matchId, token) => makeHttpRequest('GET', `matches/${matchId}/live-state`, null, token);

// <==================== Contexto ====================>

Given('que se registró el evento {string} en el partido', async function (tipoEvento) {
  const response = await registerEvent(this.token, {
    eventTypeId: await findEventType(tipoEvento, this.token),
    matchId: this.match.id,
    teamPossession: 'OWN',
    matchTime: 300,
    period: 1,
  });
  assert.equal(response.status, 200, `No se pudo registrar el evento ${tipoEvento}: ${response.body?.message}`);
  this.event = response.body;
});

// <==================== Estado en vivo ====================>

When('guarda el estado en vivo con {int} segundos transcurridos, reloj {string} y posesión {string}', async function (segundos, reloj, posesion) {
  this.response = await makeHttpRequest(
    'PUT',
    `matches/${this.match.id}/live-state`,
    { clockElapsedSeconds: segundos, clockPaused: CLOCK[reloj], currentPossession: posesion },
    this.token,
  );
  assert.equal(this.response.status, 200, this.response.body?.message);
});

Then('el estado en vivo del partido es de {int} segundos con el reloj {string} y posesión {string}', async function (segundos, reloj, posesion) {
  const { status, body } = await getLiveState(this.match.id, this.token);
  assert.equal(status, 200, body?.message);
  assert.deepEqual(
    { clockElapsedSeconds: body.clockElapsedSeconds, clockPaused: body.clockPaused, currentPossession: body.currentPossession },
    { clockElapsedSeconds: segundos, clockPaused: CLOCK[reloj], currentPossession: posesion },
  );
});

When('intenta consultar el estado en vivo de un partido inexistente', async function () {
  this.response = await getLiveState(MISSING_UUID, this.token);
});

// <==================== Arranque de la captura ====================>

When('consulta el arranque de la captura en vivo', async function () {
  this.response = await makeHttpRequest('GET', `matches/${this.match.id}/live-bootstrap`, null, this.token);
});

Then('el arranque incluye el partido en curso, {int} evento y el catálogo de tipos de evento', function (cantidad) {
  const { match, events, eventTypes } = this.response.body;
  assert.equal(match.id, this.match.id);
  assert.equal(match.status, 'IN_PROGRESS');
  assert.equal(events.length, cantidad);
  assert.ok(eventTypes.length > 0, 'El catálogo de tipos de evento está vacío');
});
