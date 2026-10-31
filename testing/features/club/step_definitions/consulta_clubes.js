import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { findClubIdByName } from '../../support/club_helper.js';
import { makeHttpRequest } from '../../support/httpRequest.js';

// El inicio de sesión, el "Dado un usuario sin sesión ..." y los "Entonces el sistema responde con ..."
// están definidos en support/common_steps.js y user/step_definitions/baja_usuario_steps.js

// <==================== Helpers ====================>

const getClub = (clubId, token) => makeHttpRequest('GET', `club/${clubId}`, null, token);

const findClubInList = async (nombreClub, token) => {
  const response = await makeHttpRequest('GET', 'club', null, token);
  assert.equal(response.status, 200, 'No se pudo obtener el listado de clubes');
  const club = response.body.find((c) => c.name === nombreClub);
  assert.ok(club, `No existe el club ${nombreClub}`);
  return club;
};

// <==================== Miembros del club ====================>

When('consulta los miembros de su club', async function () {
  this.response = await makeHttpRequest('GET', 'club/my-club/members', null, this.token);
});

Then('la lista de miembros incluye:', function (dataTable) {
  for (const { email, rol } of dataTable.hashes()) {
    const member = this.response.body.find((m) => m.email === email);
    assert.ok(member, `La lista de miembros no incluye a ${email}`);
    assert.equal(member.role, rol, `Rol de ${email}`);
  }
});

Then('la lista de miembros no incluye a {string}', function (email) {
  assert.ok(!this.response.body.some((m) => m.email === email), `La lista de miembros incluye a ${email}`);
});

// <==================== Consultas de clubes ====================>

When('consulta el listado de clubes', async function () {
  this.response = await makeHttpRequest('GET', 'club', null, this.token);
});

When('consulta los clubes activos', async function () {
  this.response = await makeHttpRequest('GET', 'club/actives-clubs', null, this.token);
});

When('consulta los clubes disponibles para registrarse', async function () {
  this.response = await makeHttpRequest('GET', 'club/registration-options', null, this.token);
});

Then('el listado de clubes incluye a {string} y {string}', function (club1, club2) {
  const names = this.response.body.map((c) => c.name);
  for (const nombre of [club1, club2]) {
    assert.ok(names.includes(nombre), `El listado no incluye al club ${nombre}`);
  }
});

Then('el listado de clubes no incluye a {string}', function (nombreClub) {
  assert.ok(!this.response.body.some((c) => c.name === nombreClub), `El listado incluye al club ${nombreClub}`);
});

When('consulta el club {string} por su ID', async function (nombreClub) {
  this.response = await getClub(await findClubIdByName(nombreClub), this.token);
});

When('consulta el club inexistente con ID {string}', async function (clubId) {
  this.response = await getClub(clubId, this.token);
});

Then('el club devuelto es {string} de la ciudad {string}', function (nombreClub, ciudad) {
  assert.equal(this.response.body.name, nombreClub);
  assert.equal(this.response.body.city, ciudad);
});

// <==================== Edición ====================>

// El PUT reemplaza todos los datos del club, así que se reenvían los actuales con el teléfono nuevo
When('actualiza el teléfono de contacto del club {string} a {string}', async function (nombreClub, telefono) {
  const club = (await getClub(await findClubIdByName(nombreClub), this.token)).body;
  const { name, city, logoUrl, contactEmail } = club;
  this.response = await makeHttpRequest('PUT', `club/${club.id}`, { name, city, logoUrl, contactEmail, contactPhone: telefono }, this.token);
});

When('edita el club inexistente con ID {string}', async function (clubId) {
  this.response = await makeHttpRequest('PUT', `club/${clubId}`, { name: 'Inexistente', city: 'Rawson' }, this.token);
});

Then('el club {string} figura con el teléfono de contacto {string}', async function (nombreClub, telefono) {
  const response = await getClub(await findClubIdByName(nombreClub), this.token);
  assert.equal(response.body.contactPhone, telefono);
});

// <==================== Eliminación ====================>

// POST /club exige un usuario administrador existente, por eso se crea uno para el club descartable
Given('que existe el club {string} de la ciudad {string} administrado por {string}', async function (nombreClub, ciudad, email) {
  const admin = await makeHttpRequest('POST', 'user', {
    email,
    password: 'PassSegura123!',
    role: 'ADMIN_CLUB',
    firstName: 'Admin',
    lastName: nombreClub,
    birthDate: '1985-01-01',
  }, this.token);
  assert.equal(admin.status, 200, `No se pudo crear el administrador ${email}: ${admin.body?.message}`);

  const club = await makeHttpRequest('POST', 'club', { name: nombreClub, adminUserId: admin.body.id, city: ciudad, contactEmail: email }, this.token);
  assert.equal(club.status, 200, `No se pudo crear el club ${nombreClub}: ${club.body?.message}`);
});

When('elimina el club {string}', async function (nombreClub) {
  const club = await findClubInList(nombreClub, this.token);
  this.deletedClubId = club.id;
  this.response = await makeHttpRequest('DELETE', `club/${club.id}`, null, this.token);
});

When('elimina el club inexistente con ID {string}', async function (clubId) {
  this.response = await makeHttpRequest('DELETE', `club/${clubId}`, null, this.token);
});

Then('el club eliminado ya no puede consultarse', async function () {
  const response = await getClub(this.deletedClubId, this.token);
  assert.equal(response.status, 404);
});
