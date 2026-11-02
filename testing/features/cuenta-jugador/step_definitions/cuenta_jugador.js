import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { createPlayerAccount, personExists } from '../../support/db_helper.js';
import { makeHttpRequest } from '../../support/httpRequest.js';

// El "Entonces el sistema responde con {int}" está definido en support/common_steps.js

// <==================== Cuenta del jugador ====================>

Given('que el jugador con email {string} creó su cuenta con contraseña {string}', async function (email, contraseña) {
  assert.ok(await personExists(email), `No existe una persona con el email ${email} para vincularle la cuenta`);
  await createPlayerAccount(email, contraseña);
});

When('el jugador inicia sesión con email {string} y contraseña {string}', async function (email, contraseña) {
  this.response = await makeHttpRequest('POST', 'api/auth/login', { email, password: contraseña });
  this.token = this.response.body?.token;
});

Then('la cuenta tiene el rol {string}', async function (rol) {
  const me = await makeHttpRequest('GET', 'api/me', null, this.token);
  assert.equal(me.status, 200, `No se pudo obtener el contexto del usuario: ${me.body?.message}`);
  assert.equal(me.body.role, rol);
  assert.ok(me.body.personId, 'La cuenta no quedó vinculada a una persona');
});
