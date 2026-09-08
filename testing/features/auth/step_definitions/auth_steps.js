import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';

const BACKEND_URL = process.env.API_URL || 'http://backend:8080';

When('registro un usuario con una contraseña segura', async function () {
  this.password = 'password-seguro-123';
  this.email = `cucumber-${Date.now()}@ovaltrack.com`;

  this.registrationResponse = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: this.email,
      password: this.password,
      firstName: 'Cucumber',
      lastName: 'Tester',
      birthDate: '2000-01-01',
      role: 'PLAYER'
    })
  });
  this.registrationBody = await this.registrationResponse.json();
});

Then('el registro debe responder con el código {int}', function (statusCode) {
  assert.equal(this.registrationResponse.status, statusCode);
});

Then('la respuesta de registro debe incluir un token', function () {
  assert.equal(typeof this.registrationBody.token, 'string');
  assert.ok(this.registrationBody.token.length > 0);
});

When('inicio sesión con la contraseña registrada', async function () {
  this.loginResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: this.email,
      password: this.password
    })
  });
  this.loginBody = await this.loginResponse.json();
});

Then('el login debe responder con el código {int}', function (statusCode) {
  assert.equal(this.loginResponse.status, statusCode);
});

Then('la respuesta de login debe incluir un token', function () {
  assert.equal(typeof this.loginBody.token, 'string');
  assert.ok(this.loginBody.token.length > 0);
});

When('solicito la recuperación de contraseña para el usuario registrado', async function () {
  this.passwordRecoveryResponse = await fetch(`${BACKEND_URL}/api/auth/password-reset/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: this.email })
  });
  this.passwordRecoveryBody = await this.passwordRecoveryResponse.json();
});

Then('la solicitud de recuperación debe responder con el código {int}', function (statusCode) {
  assert.equal(this.passwordRecoveryResponse.status, statusCode);
});

Then('la respuesta de recuperación no debe incluir un token', function () {
  assert.equal(this.passwordRecoveryBody.token, undefined);
});