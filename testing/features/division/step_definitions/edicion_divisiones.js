import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { findClubIdByName, findDivisionByName } from '../../support/club_helper.js';
import { makeHttpRequest } from '../../support/httpRequest.js';

// Los inicios de sesión y los "Entonces el sistema responde con ..." están definidos en
// support/common_steps.js y division-jugador/step_definitions/creacion_jugadores.js

// <==================== Helpers ====================>

const updateDivision = (divisionId, body, token) => makeHttpRequest('PUT', `division/${divisionId}`, body, token);

const deleteDivision = (divisionId, token) => makeHttpRequest('DELETE', `division/${divisionId}`, null, token);

// <==================== Contexto ====================>

Given('que existe la division {string} del club {string} con categoria {string} y genero {string}', async function (nombre, nombreClub, categoria, genero) {
  const clubId = await findClubIdByName(nombreClub);
  const divisions = await makeHttpRequest('GET', `division?clubId=${clubId}`, null, this.token);
  if (divisions.body.some((d) => d.name === nombre && d.active !== false)) return;

  const response = await makeHttpRequest('POST', 'division', { name: nombre, ageCategory: categoria, gender: genero, clubId }, this.token);
  assert.equal(response.status, 200, `No se pudo crear la división ${nombre}: ${response.body?.message}`);
});

// <==================== Edición ====================>

When('edita la division {string} del club {string} con nombre {string}, categoria {string} y genero {string}', async function (nombre, nombreClub, nuevoNombre, categoria, genero) {
  const division = await findDivisionByName(nombreClub, nombre);
  this.response = await updateDivision(division.id, { name: nuevoNombre, ageCategory: categoria, gender: genero }, this.token);
});

// Envía los mismos datos de la división: el rechazo tiene que venir de los permisos, no de la validación
When('intenta editar la division {string} del club {string}', async function (nombre, nombreClub) {
  const division = await findDivisionByName(nombreClub, nombre);
  const { name, ageCategory, gender } = division;
  this.response = await updateDivision(division.id, { name, ageCategory, gender }, this.token);
});

When('edita la division inexistente con ID {string}', async function (divisionId) {
  this.response = await updateDivision(divisionId, { name: 'Inexistente', ageCategory: 'SENIOR', gender: 'MALE' }, this.token);
});

Then('la division {string} del club {string} figura con categoria {string} y genero {string}', async function (nombre, nombreClub, categoria, genero) {
  const division = await findDivisionByName(nombreClub, nombre);
  assert.equal(division.ageCategory, categoria);
  assert.equal(division.gender, genero);
});

// <==================== Eliminación ====================>

When('elimina la division {string} del club {string}', async function (nombre, nombreClub) {
  const division = await findDivisionByName(nombreClub, nombre);
  this.response = await deleteDivision(division.id, this.token);
});

When('elimina la division inexistente con ID {string}', async function (divisionId) {
  this.response = await deleteDivision(divisionId, this.token);
});

Then('la division {string} del club {string} figura como inactiva', async function (nombre, nombreClub) {
  const division = await findDivisionByName(nombreClub, nombre);
  assert.equal(division.active, false);
});
