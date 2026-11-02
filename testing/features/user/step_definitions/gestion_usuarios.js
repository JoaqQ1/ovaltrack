import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { makeHttpRequest } from '../../support/httpRequest.js';

// El inicio de sesión y los "Entonces el sistema responde con ..." están definidos en support/common_steps.js

// <==================== Helpers ====================>

const findUserByEmail = async (email, token) => {
  const response = await makeHttpRequest('GET', 'user', null, token);
  assert.equal(response.status, 200, 'No se pudo obtener el listado de usuarios');
  const user = response.body.find((u) => u.email === email);
  assert.ok(user, `No existe la cuenta ${email}`);
  return user;
};

// <==================== Alta y consulta ====================>

When('registra la cuenta {string} con rol {string} para {string} {string}', async function (email, rol, nombre, apellido) {
  this.response = await makeHttpRequest('POST', 'user', {
    email,
    password: 'PassSegura123!',
    role: rol,
    firstName: nombre,
    lastName: apellido,
    birthDate: '1992-07-20',
  }, this.token);
});

Then('la cuenta {string} puede consultarse por su ID con el rol {string}', async function (email, rol) {
  const user = await findUserByEmail(email, this.token);
  const response = await makeHttpRequest('GET', `user/${user.id}`, null, this.token);
  assert.equal(response.status, 200, response.body?.message);
  assert.equal(response.body.email, email);
  assert.equal(response.body.role, rol);
});

When('consulta el listado de usuarios', async function () {
  this.response = await makeHttpRequest('GET', 'user', null, this.token);
});

Then('el listado de usuarios incluye las cuentas {string} y {string}', function (email1, email2) {
  const emails = this.response.body.map((u) => u.email);
  for (const email of [email1, email2]) {
    assert.ok(emails.includes(email), `El listado no incluye la cuenta ${email}`);
  }
});

When('consulta la cuenta inexistente con ID {string}', async function (userId) {
  this.response = await makeHttpRequest('GET', `user/${userId}`, null, this.token);
});

// <==================== Eliminación ====================>

When('elimina la cuenta {string}', async function (email) {
  const user = await findUserByEmail(email, this.token);
  this.deletedUserId = user.id;
  this.response = await makeHttpRequest('DELETE', `user/${user.id}`, null, this.token);
});

Then('la cuenta eliminada ya no puede consultarse', async function () {
  const response = await makeHttpRequest('GET', `user/${this.deletedUserId}`, null, this.token);
  assert.equal(response.status, 404);
});
