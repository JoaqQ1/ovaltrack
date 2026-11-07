import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { findDivisionByName } from '../../support/club_helper.js';
import { makeHttpRequest } from '../../support/httpRequest.js';
import { findDivisionId } from '../../support/match_helper.js';

// El inicio de sesión del administrador y los "Entonces el sistema responde con ..." están definidos en
// support/common_steps.js

// <==================== Helpers ====================>

// La división es la del club del usuario, o la del club indicado cuando se prueba el acceso a un club ajeno
const resolveDivisionId = async function (nombreDivision, nombreClub) {
  return nombreClub
    ? (await findDivisionByName(nombreClub, nombreDivision)).id
    : findDivisionId(nombreDivision, this.token);
};

const requestPlayersPage = async function (pagina, tamanio, nombreDivision, nombreClub) {
  const divisionId = await resolveDivisionId.call(this, nombreDivision, nombreClub);
  this.response = await makeHttpRequest('GET', `players?divisionId=${divisionId}&page=${pagina}&size=${tamanio}`, null, this.token);
};

const requestAvailablePlayers = async function (nombreDivision, nombreClub) {
  const divisionId = await resolveDivisionId.call(this, nombreDivision, nombreClub);
  this.response = await makeHttpRequest('GET', `division/${divisionId}/players`, null, this.token);
};

// <==================== Listado paginado ====================>

When('consulta la página {int} de {int} jugadores de la division {string}', async function (pagina, tamanio, nombreDivision) {
  await requestPlayersPage.call(this, pagina, tamanio, nombreDivision);
});

When('consulta la página {int} de {int} jugadores de la division {string} del club {string}', async function (pagina, tamanio, nombreDivision, nombreClub) {
  await requestPlayersPage.call(this, pagina, tamanio, nombreDivision, nombreClub);
});

Then('la página tiene {int} jugadores de {int} en total', function (enPagina, total) {
  assert.equal(this.response.body.content.length, enPagina);
  assert.equal(this.response.body.totalElements, total);
});

// <==================== Jugadores disponibles ====================>

When('consulta los jugadores disponibles de la division {string}', async function (nombreDivision) {
  await requestAvailablePlayers.call(this, nombreDivision);
});

When('consulta los jugadores disponibles de la division {string} del club {string}', async function (nombreDivision, nombreClub) {
  await requestAvailablePlayers.call(this, nombreDivision, nombreClub);
});

Then('la lista incluye al jugador {string} en la posición {string}', function (nombreCompleto, posicion) {
  const found = this.response.body.some((p) => p.fullName === nombreCompleto && p.position === posicion);
  assert.ok(found, `La lista no incluye a ${nombreCompleto} como ${posicion}`);
});

// <==================== Asociación inexistente ====================>

When('consulta la asociación de jugador inexistente con ID {string}', async function (divisionPlayerId) {
  this.response = await makeHttpRequest('GET', `players/${divisionPlayerId}`, null, this.token);
});
