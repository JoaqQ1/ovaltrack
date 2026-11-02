import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { getUserToken } from '../../support/auth_helper.js';
import { makeHttpRequest } from '../../support/httpRequest.js';

// Pasos reutilizados:
//  - "Cuando el usuario con email ... intenta iniciar sesión" y "Dado un usuario sin sesión iniciada ..."
//    (user/step_definitions/baja_usuario_steps.js)
//  - "Entonces el sistema responde con {int}" y "... con {int} y {string}" (support/common_steps.js)

// <==================== Sesiones ====================>

Given('que el usuario con email {string} y contraseña {string} ha iniciado sesión', async function (email, contraseña) {
  this.token = await getUserToken(email, contraseña);
  assert.ok(this.token, `Fallo de inicio de sesión para ${email}`);
});

Given('un usuario con un token de sesión inválido', function () {
  this.token = 'token.invalido.123';
});

// <==================== Inicio de sesión ====================>

Then('la respuesta incluye un token de sesión', function () {
  assert.ok(this.response.body?.token, 'La respuesta no incluye un token');
});

Then('la respuesta no incluye un token de sesión', function () {
  assert.equal(this.response.body?.token, undefined, 'La respuesta no debería incluir un token');
});

// <==================== Recuperación de contraseña ====================>

When('solicita recuperar la contraseña de la cuenta {string}', async function (email) {
  this.response = await makeHttpRequest('POST', 'api/auth/password-reset/request', { email });
});

// <==================== Sesión actual ====================>

When('consulta los datos de su sesión', async function () {
  this.response = await makeHttpRequest('GET', 'api/me', null, this.token);
});

Then('el sistema devuelve la sesión de {string} con el rol {string} en el club {string}', function (email, rol, nombreClub) {
  assert.equal(this.response.status, 200, this.response.body?.message);
  assert.equal(this.response.body.email, email);
  assert.equal(this.response.body.role, rol);
  assert.equal(this.response.body.club?.name, nombreClub);
});
