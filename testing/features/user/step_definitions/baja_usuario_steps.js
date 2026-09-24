import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { getAdminToken } from '../../support/auth_helper.js';

const BACKEND_URL = process.env.API_URL || 'http://backend:8080';

Given('que el usuario con email {string} ha sido dado de baja previamente por el administrador', async function (email) {
  const adminToken = await getAdminToken();
  assert.ok(adminToken, 'Debe obtenerse token técnico para preparar el estado inactivo');

  // Buscar el usuario por email
  const usersRes = await fetch(`${BACKEND_URL}/user`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert.ok(usersRes.ok, 'Error al consultar lista de usuarios');
  const users = await usersRes.json();
  let targetUser = users.find(u => (u.email || u.loginEmail) === email);
  assert.ok(targetUser, `El usuario ${email} debe existir previamente`);

  // Enviar baja lógica si es necesario para asegurar que el usuario esté inactivo
  const bajaRes = await fetch(`${BACKEND_URL}/user/${targetUser.id}/baja`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  });

  assert.ok(
    bajaRes.status === 200 || bajaRes.status === 409,
    `Error al preparar usuario inactivo ${email}: se obtuvo status ${bajaRes.status}`
  );

  targetUser.active = false;
  this.targetUser = targetUser;
});

Given('que el usuario {string} tiene el rol de administrador de club', async function (email) {
  const adminToken = await getAdminToken();
  assert.ok(adminToken, 'Debe obtenerse token técnico para asignar rol ADMIN_CLUB');

  const usersRes = await fetch(`${BACKEND_URL}/user`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert.ok(usersRes.ok, 'Error al consultar usuarios');
  const users = await usersRes.json();
  const targetUser = users.find(u => (u.email || u.loginEmail) === email);
  assert.ok(targetUser, `Usuario ${email} no encontrado`);

  if (targetUser.role !== 'ADMIN_CLUB') {
    const roleRes = await fetch(`${BACKEND_URL}/user/${targetUser.id}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ role: 'ADMIN_CLUB' })
    });
    assert.ok(roleRes.ok, `Error al asignar rol ADMIN_CLUB a ${email}`);
  }
});

When('solicita dar de baja al usuario con email {string}', async function (email) {
  const setupToken = this.token || await getAdminToken();

  const usersRes = await fetch(`${BACKEND_URL}/user`, {
    headers: { 'Authorization': `Bearer ${setupToken}` }
  });
  assert.ok(usersRes.ok, 'Error al consultar usuarios');
  const users = await usersRes.json();
  const targetUser = users.find(u => (u.email || u.loginEmail) === email);
  assert.ok(targetUser, `Usuario ${email} no encontrado para dar de baja`);

  this.targetUser = targetUser;
  this.lastResponse = await fetch(`${BACKEND_URL}/user/${targetUser.id}/baja`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    }
  });

  try {
    this.lastResponseBody = await this.lastResponse.json();
  } catch {
    this.lastResponseBody = await this.lastResponse.text();
  }
});

When('intenta enviar la solicitud de baja para el usuario {string}', async function (email) {
  const adminToken = await getAdminToken();
  const usersRes = await fetch(`${BACKEND_URL}/user`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert.ok(usersRes.ok, 'Error al buscar usuario');
  const users = await usersRes.json();
  const targetUser = users.find(u => (u.email || u.loginEmail) === email);
  assert.ok(targetUser, `Usuario ${email} no encontrado`);

  this.lastResponse = await fetch(`${BACKEND_URL}/user/${targetUser.id}/baja`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': this.token ? `Bearer ${this.token}` : ''
    }
  });

  try {
    this.lastResponseBody = await this.lastResponse.json();
  } catch {
    this.lastResponseBody = await this.lastResponse.text();
  }
});

When('solicita dar de baja al usuario inexistente con ID {string}', async function (nonexistentId) {
  this.lastResponse = await fetch(`${BACKEND_URL}/user/${nonexistentId}/baja`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    }
  });

  try {
    this.lastResponseBody = await this.lastResponse.json();
  } catch {
    this.lastResponseBody = await this.lastResponse.text();
  }
});

When('el usuario con email {string} y contraseña {string} intenta iniciar sesión', async function (email, password) {
  this.lastResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  try {
    this.lastResponseBody = await this.lastResponse.json();
  } catch {
    this.lastResponseBody = await this.lastResponse.text();
  }
});

Then('el sistema confirma la baja del usuario correctamente', function () {
  assert.equal(
    this.lastResponse.status,
    200,
    `Se esperaba status 200 al dar de baja pero se recibió ${this.lastResponse.status}`
  );
  assert.ok(this.lastResponseBody, 'Debe recibir cuerpo de respuesta');
  assert.equal(this.lastResponseBody.active, false, 'El campo active debe ser false en la respuesta');
});

Then('el usuario con email {string} figura como inactivo en el sistema', async function (email) {
  const adminToken = await getAdminToken();
  const usersRes = await fetch(`${BACKEND_URL}/user`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const users = await usersRes.json();
  const userInDb = users.find(u => (u.email || u.loginEmail) === email);
  assert.ok(userInDb, `El usuario ${email} debe existir`);
  assert.equal(userInDb.active, false, `El usuario ${email} debe tener active = false`);
});

Then('el sistema rechaza el inicio de sesión indicando {string}', function (mensajeEsperado) {
  assert.equal(
    this.lastResponse.status,
    403,
    `Se esperaba código 403 Forbidden al bloquear el login pero se obtuvo ${this.lastResponse.status}`
  );

  let mensajeObtenido = '';
  if (typeof this.lastResponseBody === 'string') {
    mensajeObtenido = this.lastResponseBody;
  } else if (this.lastResponseBody && this.lastResponseBody.message) {
    mensajeObtenido = this.lastResponseBody.message;
  }

  assert.equal(
    mensajeObtenido,
    mensajeEsperado,
    `Se esperaba el mensaje '${mensajeEsperado}' pero se obtuvo '${mensajeObtenido}'`
  );
});

Then('la persona asociada al usuario con email {string} y sus registros de eventos y divisiones permanecen en la base de datos', async function (email) {
  const adminToken = await getAdminToken();
  const usersRes = await fetch(`${BACKEND_URL}/user`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const users = await usersRes.json();
  const user = users.find(u => (u.email || u.loginEmail) === email);

  assert.ok(user, `El usuario ${email} debe existir en el sistema`);
  assert.ok(user.personId || (user.person && (user.person.id || user.person.firstName)), `El usuario ${email} debe conservar su vinculación con Person`);
});

Then('el sistema rechaza la baja con el mensaje {string}', function (mensajeEsperado) {
  const status = this.lastResponse.status;
  assert.ok(
    status === 409 || status === 403,
    `Se esperaba código de rechazo (409 Conflict o 403 Forbidden) pero se obtuvo ${status}`
  );

  let mensajeObtenido = '';
  if (typeof this.lastResponseBody === 'string') {
    mensajeObtenido = this.lastResponseBody;
  } else if (this.lastResponseBody && this.lastResponseBody.message) {
    mensajeObtenido = this.lastResponseBody.message;
  }

  assert.equal(
    mensajeObtenido,
    mensajeEsperado,
    `Se esperaba '${mensajeEsperado}' pero se obtuvo '${mensajeObtenido}'`
  );
});

Then('el sistema rechaza la acción indicando {string}', function (mensajeEsperado) {
  const status = this.lastResponse.status;
  assert.ok(
    status === 409 || status === 400 || status === 403,
    `Se esperaba rechazo de acción pero se obtuvo status ${status}`
  );

  let mensajeObtenido = '';
  if (typeof this.lastResponseBody === 'string') {
    mensajeObtenido = this.lastResponseBody;
  } else if (this.lastResponseBody && this.lastResponseBody.message) {
    mensajeObtenido = this.lastResponseBody.message;
  }

  assert.equal(
    mensajeObtenido,
    mensajeEsperado,
    `Se esperaba '${mensajeEsperado}' pero se obtuvo '${mensajeObtenido}'`
  );
});
