import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { findClubIdByName } from '../../support/club_helper.js';
import { findEventType } from '../../support/event_helper.js';
import { makeHttpRequest } from '../../support/httpRequest.js';
import { findDivisionId, findMatchByStatus, getDivisionMatches } from '../../support/match_helper.js';

// El inicio de sesión y los "Entonces el sistema responde con ..." están definidos en
// division-jugador/step_definitions/creacion_jugadores.js y support/common_steps.js

// <==================== Catálogo de tipos de evento ====================>

When('consulta el catálogo de tipos de evento', async function () {
  this.response = await makeHttpRequest('GET', 'eventType', null, this.token);
});

Then('el catálogo incluye los siguientes tipos de evento:', function (dataTable) {
  for (const { nombre, puntos } of dataTable.hashes()) {
    const eventType = this.response.body.find((t) => t.name === nombre);
    assert.ok(eventType, `El catálogo no incluye el tipo "${nombre}"`);
    assert.equal(eventType.points, Number(puntos), `Puntos de "${nombre}"`);
  }
});

When('consulta el tipo de evento {string}', async function (nombre) {
  const eventTypeId = await findEventType(nombre, this.token);
  this.response = await makeHttpRequest('GET', `eventType/${eventTypeId}`, null, this.token);
});

When('consulta el tipo de evento inexistente con ID {string}', async function (eventTypeId) {
  this.response = await makeHttpRequest('GET', `eventType/${eventTypeId}`, null, this.token);
});

Then('el tipo de evento devuelto es {string} con código {string} y suma {int} puntos', function (nombre, codigo, puntos) {
  assert.equal(this.response.body.name, nombre);
  assert.equal(this.response.body.code, codigo);
  assert.equal(this.response.body.points, puntos);
});

// <==================== Eventos por club y división ====================>

When('consulta los eventos del club {string}', async function (nombreClub) {
  const clubId = await findClubIdByName(nombreClub);
  this.response = await makeHttpRequest('GET', `event/club?clubId=${clubId}`, null, this.token);
});

When('consulta los eventos de la division {string}', async function (nombreDivision) {
  const divisionId = await findDivisionId(nombreDivision, this.token);
  this.response = await makeHttpRequest('GET', `event/division?divisionId=${divisionId}`, null, this.token);
});

Then('la lista incluye los eventos del partido contra {string} en la division {string}', async function (rival, nombreDivision) {
  const divisionId = await findDivisionId(nombreDivision, this.token);
  const match = await findMatchByStatus(divisionId, rival, ['IN_PROGRESS', 'HALFTIME', 'FINISHED'], this.token);
  assert.ok(match, `No hay un partido jugado contra ${rival}`);
  const matchEvents = await makeHttpRequest('GET', `event/match?matchId=${match.id}`, null, this.token);
  assert.ok(matchEvents.body.length > 0, `El partido contra ${rival} no tiene eventos`);

  const listedIds = new Set(this.response.body.map((e) => e.id));
  for (const event of matchEvents.body) {
    assert.ok(listedIds.has(event.id), `Falta el evento ${event.id} del partido contra ${rival}`);
  }
});

Then('todos los eventos pertenecen a partidos de la division {string}', async function (nombreDivision) {
  const divisionId = await findDivisionId(nombreDivision, this.token);
  const divisionMatchIds = new Set((await getDivisionMatches(divisionId, this.token)).map((m) => m.id));
  for (const event of this.response.body) {
    assert.ok(divisionMatchIds.has(event.matchId), `El evento ${event.id} pertenece a un partido ajeno a ${nombreDivision}`);
  }
});
