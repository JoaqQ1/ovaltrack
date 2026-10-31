import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { makeHttpRequest } from '../../support/httpRequest.js';
import { findDivisionId } from '../../support/match_helper.js';

// El inicio de sesión, los "Entonces el sistema responde con ..." y el historial
// ("el historial tiene una asociación ...") están definidos en support/common_steps.js y
// division-coach/step_definitions/desasociacion_coaches.js

// <==================== Helpers ====================>

// Asociación del jugador en la división (players/with-user incluye también las finalizadas)
const findDivisionPlayer = async (email, nombreDivision, token) => {
  const divisionId = await findDivisionId(nombreDivision, token);
  const response = await makeHttpRequest('GET', `players/with-user?divisionId=${divisionId}`, null, token);
  assert.equal(response.status, 200, `No se pudieron obtener los jugadores de ${nombreDivision}`);
  const player = response.body.find((p) => p.contactEmail === email);
  return { divisionId, player };
};

const requireDivisionPlayer = async (email, nombreDivision, token) => {
  const found = await findDivisionPlayer(email, nombreDivision, token);
  assert.ok(found.player, `El jugador ${email} no está en la división ${nombreDivision}`);
  return found;
};

// <==================== Contexto ====================>

Given('que el jugador {string} {string} con email {string} pertenece a la division {string}', async function (nombre, apellido, email, nombreDivision) {
  const { divisionId, player } = await findDivisionPlayer(email, nombreDivision, this.token);
  if (player) return;

  const response = await makeHttpRequest('POST', 'players', {
    divisionId,
    firstName: nombre,
    lastName: apellido,
    birthDate: '1995-05-05',
    contactEmail: email,
    contactPhone: '99999999',
    position: 'Ala',
  }, this.token);
  assert.equal(response.status, 200, `No se pudo asociar al jugador ${email}: ${response.body?.message}`);
});

// <==================== Edición ====================>

When('edita al jugador {string} de la division {string} con camiseta {int} y posicion {string}', async function (email, nombreDivision, camiseta, posicion) {
  const { player } = await requireDivisionPlayer(email, nombreDivision, this.token);
  this.response = await makeHttpRequest('PUT', `players/${player.divisionPlayerId}`, { jerseyNumber: camiseta, position: posicion }, this.token);
});

When('edita la asociación de jugador inexistente con ID {string}', async function (divisionPlayerId) {
  this.response = await makeHttpRequest('PUT', `players/${divisionPlayerId}`, { jerseyNumber: 1, position: 'Ala' }, this.token);
});

Then('el jugador {string} de la division {string} figura con camiseta {int} y posicion {string}', async function (email, nombreDivision, camiseta, posicion) {
  const { player } = await requireDivisionPlayer(email, nombreDivision, this.token);
  const response = await makeHttpRequest('GET', `players/${player.divisionPlayerId}`, null, this.token);
  assert.equal(response.status, 200, 'No se pudo obtener la asociación del jugador');
  assert.equal(response.body.jerseyNumber, camiseta);
  assert.equal(response.body.position, posicion);
});

// <==================== Desasociación e historial ====================>

When('desasocia al jugador {string} de la division {string}', async function (email, nombreDivision) {
  const { player } = await requireDivisionPlayer(email, nombreDivision, this.token);
  this.response = await makeHttpRequest('DELETE', `players/${player.divisionPlayerId}`, null, this.token);
});

When('desasocia la asociación de jugador inexistente con ID {string}', async function (divisionPlayerId) {
  this.response = await makeHttpRequest('DELETE', `players/${divisionPlayerId}`, null, this.token);
});

When('consulta el historial del jugador {string} en la division {string}', async function (email, nombreDivision) {
  const { divisionId, player } = await requireDivisionPlayer(email, nombreDivision, this.token);
  this.response = await makeHttpRequest('GET', `players/history?divisionId=${divisionId}&personId=${player.personId}`, null, this.token);
});
