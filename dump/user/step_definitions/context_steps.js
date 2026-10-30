import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';

const BACKEND_URL = process.env.API_URL || 'http://backend:8080';

Given('que el usuario con email {string} y contraseña {string} ha iniciado sesión', async function (email, password) {
  const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  assert.ok(response.ok, `Error al iniciar sesión con ${email}`);
  const data = await response.json();
  this.token = data.token;
  this.email = email;
});

When('solicita su información de contexto de usuario autenticado', async function () {
  this.contextResponse = await fetch(`${BACKEND_URL}/api/me`, {
    headers: {
      'Authorization': `Bearer ${this.token}`
    }
  });
  
  if (this.contextResponse.ok) {
    this.contextData = await this.contextResponse.json();
  }
});

Then('el sistema responde con el contexto del usuario incluyendo sus datos de usuario y club asignado', function () {
  assert.equal(this.contextResponse.status, 200, 'Se esperaba código 200 al solicitar el contexto');
  assert.ok(this.contextData, 'Se esperaba un JSON con el contexto del usuario');
  assert.equal(this.contextData.email, this.email, 'El email devuelto no coincide con el del usuario autenticado');
  assert.ok(this.contextData.club, 'El contexto debería incluir el club asignado');
});

When('consulta la lista de miembros de su club', async function () {
  this.membersResponse = await fetch(`${BACKEND_URL}/club/my-club/members`, {
    headers: {
      'Authorization': `Bearer ${this.token}`
    }
  });
  
  if (this.membersResponse.ok) {
    this.membersData = await this.membersResponse.json();
  }
});

Then('el sistema responde con la lista de miembros pertenecientes al club', function () {
  assert.equal(this.membersResponse.status, 200, 'Se esperaba código 200 al consultar los miembros');
  assert.ok(Array.isArray(this.membersData), 'Se esperaba una lista (array) de miembros');
  assert.ok(this.membersData.length > 0, 'La lista de miembros no debería estar vacía');
  
  // Opcional: verificar que el mismo usuario que consulta está en la lista si pertenece al club
  // Nota: El administrador fundador no tiene entidad Person asociada inicialmente, por lo que puede no aparecer.
  // assert.ok(found, 'El usuario consultante debería aparecer en su propia lista de miembros del club');
});

When('intenta solicitar su información de contexto de usuario', async function () {
  this.lastResponse = await fetch(`${BACKEND_URL}/api/me`, {
    // Sin header de Authorization
  });
  try {
    this.lastResponseBody = await this.lastResponse.json();
  } catch {
    this.lastResponseBody = await this.lastResponse.text();
  }
});



