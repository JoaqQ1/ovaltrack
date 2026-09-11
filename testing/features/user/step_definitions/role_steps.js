import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';

const BACKEND_URL = process.env.API_URL || 'http://backend:8080';

// =========================================================================
// Steps de gestión de roles (estilo BDD orientado a usuario / frontend)
// =========================================================================

Given('que el administrador de club con email {string} y contraseña {string} ha iniciado sesión', async function (email, password) {
  const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const body = await response.json();
  this.token = body.token;
  assert.ok(this.token, 'El administrador debe recibir un token de sesión');
});

Given('que el usuario con rol jugador con email {string} y contraseña {string} ha iniciado sesión', async function (email, password) {
  const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const body = await response.json();
  this.token = body.token;
  assert.ok(this.token, 'El jugador debe recibir un token de sesión');
});

Given('un usuario sin sesión iniciada en la plataforma', function () {
  this.token = null;
});

Given('que existe el usuario con email {string}', async function (email) {
  // Se llama al endpoint para obtener los usuarios que el frontend visualiza en la tabla
  const usersRes = await fetch(`${BACKEND_URL}/user`, {
    headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {}
  });

  assert.ok(
    usersRes.ok,
    `Error al consultar la lista de usuarios: se recibió status ${usersRes.status}`
  );

  const users = await usersRes.json();
  const targetUser = users.find(u => (u.email || u.loginEmail) === email);

  assert.ok(
    targetUser,
    `El usuario con email ${email} no existe en la base de datos (debe crearse previamente en 01_creacion_personas_usuarios.feature)`
  );

  this.targetUser = targetUser;
});

When('en la tabla de miembros selecciona el nuevo rol {string} para {string} y presiona "Guardar rol"', async function (newRole, email) {
  const userId = this.targetUser?.id;
  assert.ok(userId, `El usuario ${email} no posee un ID válido`);

  this.lastResponse = await fetch(`${BACKEND_URL}/user/${userId}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify({ role: newRole })
  });

  try {
    this.lastResponseBody = await this.lastResponse.json();
  } catch {
    this.lastResponseBody = await this.lastResponse.text();
  }
});

Then('el sistema muestra el mensaje {string}', function (mensajeEsperado) {
  let mensajeObtenido = '';

  if (this.lastResponse.status === 200) {
    mensajeObtenido = 'Rol actualizado correctamente';
  } else if (typeof this.lastResponseBody === 'string') {
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

Then('la tabla de miembros muestra al usuario {string} con el rol {string}', async function (email, rolFinal) {
  // Consultar nuevamente la tabla de miembros en el frontend para validar actualización
  const usersRes = await fetch(`${BACKEND_URL}/user`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  const users = await usersRes.json();
  const targetUser = users.find(u => (u.email || u.loginEmail) === email);

  assert.ok(targetUser, `No se encontró en la tabla al usuario ${email}`);
  assert.equal(
    targetUser.role,
    rolFinal,
    `En la tabla, el rol de ${email} debería ser ${rolFinal} pero es ${targetUser.role}`
  );
});

When('modifica los roles en la tabla según los siguientes cambios y presiona "Guardar cambios":', async function (dataTable) {
  const rows = dataTable.hashes();
  this.loteResultados = [];

  const usersRes = await fetch(`${BACKEND_URL}/user`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  const users = await usersRes.json();

  for (const row of rows) {
    const targetUser = users.find(u => (u.email || u.loginEmail) === row.emailUsuario);
    assert.ok(targetUser, `Usuario ${row.emailUsuario} no encontrado en la tabla`);

    const res = await fetch(`${BACKEND_URL}/user/${targetUser.id}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ role: row.nuevoRol })
    });

    this.loteResultados.push({
      email: row.emailUsuario,
      status: res.status,
      nuevoRol: row.nuevoRol
    });
  }
});

Then('la tabla de miembros refleja todos los cambios realizados', async function () {
  const usersRes = await fetch(`${BACKEND_URL}/user`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  const users = await usersRes.json();

  for (const item of this.loteResultados) {
    assert.equal(item.status, 200, `El cambio para ${item.email} debió ser exitoso`);
    const userInTable = users.find(u => (u.email || u.loginEmail) === item.email);
    assert.equal(userInTable.role, item.nuevoRol);
  }
});

When('presiona el botón para cambiar el rol de {string} a {string}', async function (email, newRole) {
  const userId = this.targetUser?.id;
  assert.ok(userId, `Usuario ${email} no encontrado`);

  this.lastResponse = await fetch(`${BACKEND_URL}/user/${userId}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify({ role: newRole })
  });

  try {
    this.lastResponseBody = await this.lastResponse.json();
  } catch {
    this.lastResponseBody = await this.lastResponse.text();
  }
});

Then('el sistema rechaza la acción con el mensaje {string}', function (mensajeEsperado) {
  assert.equal(
    this.lastResponse.status,
    403,
    `Se esperaba código 403 Forbidden pero se obtuvo ${this.lastResponse.status}`
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
    `Se esperaba mensaje '${mensajeEsperado}' pero se obtuvo '${mensajeObtenido}'`
  );
});

When('intenta enviar la solicitud para cambiar el rol de {string} a {string}', async function (email, newRole) {
  const userId = this.targetUser?.id;
  assert.ok(userId, `Usuario ${email} no encontrado`);

  this.lastResponse = await fetch(`${BACKEND_URL}/user/${userId}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ role: newRole })
  });
});

Then('el sistema rechaza la acción solicitando autenticación', function () {
  const status = this.lastResponse.status;
  assert.ok(
    status === 401 || status === 403,
    `Se esperaba rechazo por falta de autenticación (401 o 403) pero se recibió ${status}`
  );
});

When('presiona el botón para cambiar el rol del usuario inexistente con ID {string} a {string}', async function (nonexistentId, newRole) {
  this.lastResponse = await fetch(`${BACKEND_URL}/user/${nonexistentId}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify({ role: newRole })
  });

  try {
    this.lastResponseBody = await this.lastResponse.json();
  } catch {
    this.lastResponseBody = await this.lastResponse.text();
  }
});

Then('el sistema muestra el mensaje de error {string}', function (mensajeEsperado) {
  assert.equal(
    this.lastResponse.status,
    404,
    `Se esperaba código 404 pero se obtuvo ${this.lastResponse.status}`
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
