import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { findEventType, parseAttributes, registerEvent } from '../../support/event_helper.js';
import { MISSING_UUID } from '../../support/ids.js';
import { makeHttpRequest } from '../../support/httpRequest.js';
import { getMatchRosterPlayers } from '../../support/match_helper.js';

// Pasos reutilizados:
//  - "Dado que el coach ... ha iniciado sesión" (division-jugador/step_definitions/creacion_jugadores.js)
//  - "Y que existe un partido programado ...", "Y que el partido está en curso" (partido/step_definitions/partido_steps.js)
//  - "Y que se registró el evento ... en el partido" (partido/step_definitions/estado_en_vivo.js)

// <==================== Helpers ====================>

const registerLiveEvent = async function (tipoEvento, fields) {
  return registerEvent(this.token, {
    eventTypeId: await findEventType(tipoEvento, this.token),
    matchId: this.match.id,
    ...fields,
  });
};

const getMatchEvents = (matchId, token) => makeHttpRequest('GET', `event/match?matchId=${matchId}`, null, token);

// <==================== Consulta ====================>

When('consulta los eventos del partido', async function () {
  this.response = await getMatchEvents(this.match.id, this.token);
});

When('consulta los eventos de un partido inexistente', async function () {
  this.response = await getMatchEvents(MISSING_UUID, this.token);
});

Then('el partido tiene {int} evento/eventos registrado/registrados', async function (cantidad) {
  const { status, body } = await getMatchEvents(this.match.id, this.token);
  assert.equal(status, 200, body?.message);
  assert.equal(body.length, cantidad);
});

When('consulta el evento registrado', async function () {
  this.response = await makeHttpRequest('GET', `event/${this.event.id}`, null, this.token);
});

Then('el evento devuelto es de tipo {string}', async function (tipoEvento) {
  assert.equal(this.response.body.id, this.event.id);
  assert.equal(this.response.body.eventTypeId, await findEventType(tipoEvento, this.token));
});

// <==================== Idempotencia ====================>

When('registra dos veces el evento {string} con el mismo identificador de cliente', async function (tipoEvento) {
  const event = { clientEventId: randomUUID(), teamPossession: 'OWN', matchTime: 300, period: 1 };
  this.responses = [
    await registerLiveEvent.call(this, tipoEvento, event),
    await registerLiveEvent.call(this, tipoEvento, event),
  ];
});

Then('ambos envíos devuelven el mismo evento', function () {
  const [first, second] = this.responses;
  assert.equal(first.status, 200, first.body?.message);
  assert.equal(second.status, 200, second.body?.message);
  assert.equal(second.body.id, first.body.id);
});

// <==================== Reglas de posesión, jugador y tiempo ====================>

When('intenta registrar el evento {string} del rival asignado a un jugador del plantel', async function (tipoEvento) {
  const [player] = await getMatchRosterPlayers(this.match.id, this.token);
  this.response = await registerLiveEvent.call(this, tipoEvento, { teamPossession: 'OPPONENT', playerId: player.id, matchTime: 300, period: 1 });
});

When('intenta registrar el evento {string} con el jugador {string} que no integra el plantel', async function (tipoEvento, email) {
  const persons = await makeHttpRequest('GET', 'person', null, this.token);
  const person = persons.body.find((p) => p.contactEmail === email);
  assert.ok(person, `No existe la persona ${email}`);
  this.response = await registerLiveEvent.call(this, tipoEvento, { teamPossession: 'OWN', playerId: person.id, matchTime: 300, period: 1 });
});

When('intenta registrar un evento {string} con {int} segundos de juego en el periodo {int}', async function (tipoEvento, segundos, periodo) {
  this.response = await registerLiveEvent.call(this, tipoEvento, { teamPossession: 'OWN', matchTime: segundos, period: periodo });
});

// <==================== Marcador ====================>

When('registra en el partido el evento {string} con atributos {string} y posesión {string} en el minuto {int} del periodo {int}', async function (tipoEvento, atributos, posesion, minuto, periodo) {
  this.response = await registerLiveEvent.call(this, tipoEvento, {
    teamPossession: posesion,
    matchTime: minuto * 60,
    period: periodo,
    attributes: parseAttributes(atributos),
  });
});

Then('el marcador del partido es {int} a {int}', async function (local, visitante) {
  const { status, body } = await makeHttpRequest('GET', `matches/${this.match.id}`, null, this.token);
  assert.equal(status, 200, body?.message);
  assert.deepEqual({ homeScore: body.homeScore, awayScore: body.awayScore }, { homeScore: local, awayScore: visitante });
});
