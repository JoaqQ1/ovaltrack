import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { getUserToken } from '../../support/auth_helper.js';
import { makeHttpRequest } from '../../support/httpRequest.js';

// El "Dado que el administrador del club ... ha iniciado sesión" y los
// "Entonces el sistema responde con {int}" / "... con {int} y {string}" están en support/common_steps.js

// <==================== Helpers ====================>

// Las cuentas se buscan como las ve el administrador del club en su tabla de miembros, así los
// escenarios sin sesión o con un jugador también pueden apuntar a una cuenta por su email
const CLUB_ADMIN = { email: 'admin_puerto@test.com', password: 'PassSegura123!' };

const getClubAdminToken = async () => {
  const token = await getUserToken(CLUB_ADMIN.email, CLUB_ADMIN.password);
  assert.ok(token, `Fallo de inicio de sesión para ${CLUB_ADMIN.email}`);
  return token;
};

const findClubMember = async (email) => {
  const response = await makeHttpRequest('GET', 'club/my-club/members', null, await getClubAdminToken());
  assert.equal(response.status, 200, 'No se pudieron obtener los miembros del club');
  const member = response.body.find((m) => m.email === email);
  assert.ok(member, `La cuenta ${email} no pertenece al club`);
  return member;
};

const changeRole = (userId, role, token) => makeHttpRequest('PATCH', `user/${userId}/role`, { role }, token);

const deactivate = (userId, token) => makeHttpRequest('PATCH', `user/${userId}/baja`, null, token);

// <==================== Sesiones ====================>

Given('que el jugador con email {string} y contraseña {string} ha iniciado sesión', async function (email, contraseña) {
  this.token = await getUserToken(email, contraseña);
  assert.ok(this.token, `Fallo de inicio de sesión para el jugador ${email}`);
});

Given('un usuario sin sesión iniciada en la plataforma', function () {
  this.token = null;
});

When('el usuario con email {string} y contraseña {string} intenta iniciar sesión', async function (email, contraseña) {
  this.response = await makeHttpRequest('POST', 'api/auth/login', { email, password: contraseña });
});

// <==================== Modificación de rol ====================>

When('cambia el rol de {string} a {string}', async function (email, nuevoRol) {
  const member = await findClubMember(email);
  this.response = await changeRole(member.id, nuevoRol, this.token);
});

When('cambia el rol del usuario inexistente con ID {string} a {string}', async function (userId, nuevoRol) {
  this.response = await changeRole(userId, nuevoRol, this.token);
});

// <==================== Revocación de rol y acceso ====================>

// El rol se revoca antes de la baja: el backend no permite cambiar el rol de una cuenta dada de baja
When('revoca el rol y el acceso de {string}', async function (email) {
  const member = await findClubMember(email);
  const roleResponse = await changeRole(member.id, 'NO_ROLE', this.token);
  assert.equal(roleResponse.status, 200, `No se pudo revocar el rol de ${email}: ${roleResponse.body?.message}`);
  this.response = await deactivate(member.id, this.token);
});

When('da de baja la cuenta {string}', async function (email) {
  const member = await findClubMember(email);
  this.response = await deactivate(member.id, this.token);
});

When('da de baja al usuario inexistente con ID {string}', async function (userId) {
  this.response = await deactivate(userId, this.token);
});

Given('que la cuenta {string} fue dada de baja', async function (email) {
  const member = await findClubMember(email);
  if (member.active) {
    const response = await deactivate(member.id, await getClubAdminToken());
    assert.equal(response.status, 200, `No se pudo dar de baja a ${email}: ${response.body?.message}`);
  }
});

Then('la cuenta {string} figura en el club con el rol {string} y acceso {string}', async function (email, rol, acceso) {
  const member = await findClubMember(email);
  assert.equal(member.role, rol);
  assert.equal(member.active, acceso === 'activo');
});
