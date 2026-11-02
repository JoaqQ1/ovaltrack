import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { findClubIdByName, findDivisionByName } from '../../support/club_helper.js';
import { makeHttpRequest } from '../../support/httpRequest.js';

// Inicios de sesión: support/common_steps.js (administrador de club), division-jugador (coach),
// user (jugador y "sin sesión") y autenticacion_steps.js (usuario genérico).
// Los "Entonces el sistema responde con ..." están en support/common_steps.js.

// <==================== Consultas de divisiones ====================>

When('consulta las divisiones del club {string}', async function (nombreClub) {
  const clubId = await findClubIdByName(nombreClub);
  this.response = await makeHttpRequest('GET', `division?clubId=${clubId}`, null, this.token);
});

When('consulta la division {string} del club {string}', async function (nombreDivision, nombreClub) {
  const division = await findDivisionByName(nombreClub, nombreDivision);
  this.response = await makeHttpRequest('GET', `division/${division.id}`, null, this.token);
});

Then('el listado de divisiones incluye a {string} y {string}', function (division1, division2) {
  const names = this.response.body.map((d) => d.name);
  for (const nombre of [division1, division2]) {
    assert.ok(names.includes(nombre), `El listado no incluye la división ${nombre}`);
  }
});

// <==================== Creación de divisiones ====================>

When('intenta crear la division {string} con categoria {string} y genero {string} en el club {string}', async function (nombre, categoria, genero, nombreClub) {
  const clubId = await findClubIdByName(nombreClub);
  this.response = await makeHttpRequest('POST', 'division', { name: nombre, ageCategory: categoria, gender: genero, clubId }, this.token);
});
