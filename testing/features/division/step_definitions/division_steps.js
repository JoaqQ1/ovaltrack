import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { getAdminToken, getUserToken } from '../../support/auth_helper.js';

const BACKEND_URL = process.env.API_URL || 'http://backend:8080';

// Cache para almacenar IDs de divisiones creadas entre pasos
const divisionCache = new Map();

async function getAdminPuertoToken() {
  return await getUserToken('admin_puerto@test.com', 'PassSegura123!');
}

async function findDivisionIdByName(name, token) {
  if (divisionCache.has(name)) {
    return divisionCache.get(name);
  }

  // Consultar en los clubes conocidos
  const myClubRes = await fetch(`${BACKEND_URL}/club/my-club`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (myClubRes.ok) {
    const club = await myClubRes.json();
    const divRes = await fetch(`${BACKEND_URL}/division?clubId=${club.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (divRes.ok) {
      const divisions = await divRes.json();
      const target = divisions.find(d => d.name === name);
      if (target) {
        divisionCache.set(name, target.id);
        return target.id;
      }
    }
  }

  return null;
}

Given('que el usuario con rol entrenador con email {string} y contraseña {string} ha iniciado sesión', async function (email, password) {
  this.token = await getUserToken(email, password);
  assert.ok(this.token, `Fallo el inicio de sesión para el entrenador ${email}`);
});

Given('que el entrenador con email {string} y contraseña {string} ha iniciado sesión', async function (email, password) {
  this.token = await getUserToken(email, password);
  assert.ok(this.token, `Fallo el inicio de sesión para el entrenador ${email}`);
});


When('crea las siguientes divisiones para su club:', async function (dataTable) {
  const rows = dataTable.hashes();
  this.creationResponses = [];

  for (const row of rows) {
    const res = await fetch(`${BACKEND_URL}/division`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({
        name: row.nombre,
        ageCategory: row.categoria,
        gender: row.genero
      })
    });

    let resBody = null;
    try {
      resBody = await res.json();
      if (res.ok && resBody.id) {
        divisionCache.set(row.nombre, resBody.id);
      }
    } catch {
      resBody = null;
    }

    this.creationResponses.push({ status: res.status, body: resBody });
  }
});

Then('el sistema confirma la creación exitosa de las divisiones', function () {
  for (const item of this.creationResponses) {
    assert.equal(item.status, 200, 'Se esperaba código 200 en la creación de división');
    assert.ok(item.body?.id, 'La división creada no contiene un ID válido');
  }
});

When('intenta crear una división con nombre {string}, categoría {string} y género {string}', async function (nombre, categoria, genero) {
  this.lastResponse = await fetch(`${BACKEND_URL}/division`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify({
      name: nombre,
      ageCategory: categoria,
      gender: genero
    })
  });

  try {
    this.lastResponseBody = await this.lastResponse.json();
  } catch {
    this.lastResponseBody = await this.lastResponse.text();
  }
});

Then('el sistema rechaza la creación de la división informando que ya existe', function () {
  assert.equal(
    this.lastResponse.status,
    409,
    `Se esperaba código 409 Conflict pero se obtuvo ${this.lastResponse.status}`
  );
});

When('intenta crear una división {string} asignándola al club de {string}', async function (nombreDivision, emailOtroAdmin) {
  const otroToken = await getUserToken(emailOtroAdmin, 'PassSegura123!');
  const otroClubRes = await fetch(`${BACKEND_URL}/club/my-club`, {
    headers: { 'Authorization': `Bearer ${otroToken}` }
  });
  assert.ok(otroClubRes.ok, `No se pudo obtener el club de ${emailOtroAdmin}`);
  const otroClub = await otroClubRes.json();

  this.lastResponse = await fetch(`${BACKEND_URL}/division`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify({
      name: nombreDivision,
      ageCategory: 'U18',
      gender: 'MALE',
      clubId: otroClub.id
    })
  });

  try {
    this.lastResponseBody = await this.lastResponse.json();
  } catch {
    this.lastResponseBody = await this.lastResponse.text();
  }
});

When('intenta enviar la solicitud para crear la división {string} con categoría {string} y género {string}', async function (nombre, categoria, genero) {
  this.lastResponse = await fetch(`${BACKEND_URL}/division`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify({
      name: nombre,
      ageCategory: categoria,
      gender: genero
    })
  });

  try {
    this.lastResponseBody = await this.lastResponse.json();
  } catch {
    this.lastResponseBody = await this.lastResponse.text();
  }
});

Then('el sistema rechaza la acción con error de autorización 403', function () {
  assert.equal(
    this.lastResponse.status,
    403,
    `Se esperaba código 403 Forbidden pero se obtuvo ${this.lastResponse.status}`
  );
});

When('consulta el listado de divisiones de su club', async function () {
  const myClubRes = await fetch(`${BACKEND_URL}/club/my-club`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  assert.ok(myClubRes.ok, 'No se pudo obtener el club del usuario');
  const club = await myClubRes.json();

  this.lastResponse = await fetch(`${BACKEND_URL}/division?clubId=${club.id}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });

  try {
    this.lastResponseBody = await this.lastResponse.json();
  } catch {
    this.lastResponseBody = await this.lastResponse.text();
  }
});

Then('el sistema responde con código 200 y devuelve las divisiones del club', function () {
  assert.equal(this.lastResponse.status, 200, `Se esperaba 200 pero fue ${this.lastResponse.status}`);
  assert.ok(Array.isArray(this.lastResponseBody), 'La respuesta debe ser una lista de divisiones');
  assert.ok(this.lastResponseBody.length >= 1, 'Debe devolver al menos una división');
});

Given('que el usuario con email {string} tiene el rol de entrenador', async function (email) {
  const adminToken = await getAdminPuertoToken();
  const usersRes = await fetch(`${BACKEND_URL}/user`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const users = await usersRes.json();
  const user = users.find(u => (u.email || u.loginEmail) === email);
  assert.ok(user, `Usuario ${email} no encontrado`);

  if (user.role !== 'COACH_ANALYST') {
    const updateRes = await fetch(`${BACKEND_URL}/user/${user.id}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ role: 'COACH_ANALYST' })
    });
    assert.ok(updateRes.ok, `Error al asignar rol COACH_ANALYST a ${email}`);
  }
});

When('el administrador asigna a {string} como entrenador de la división {string}', async function (emailCoach, nombreDivision) {
  const adminToken = this.token || await getAdminPuertoToken();
  const usersRes = await fetch(`${BACKEND_URL}/user`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const users = await usersRes.json();
  const targetUser = users.find(u => (u.email || u.loginEmail) === emailCoach);
  assert.ok(targetUser, `Usuario ${emailCoach} no encontrado`);

  const divisionId = await findDivisionIdByName(nombreDivision, adminToken);
  assert.ok(divisionId, `División ${nombreDivision} no encontrada`);

  const res = await fetch(`${BACKEND_URL}/coaches`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      divisionId: divisionId,
      personId: targetUser.personId || targetUser.person?.id || targetUser.id
    })
  });

  assert.ok(res.ok || res.status === 409, `Error al asociar entrenador a la división ${nombreDivision}: status ${res.status}`);
});

When('el entrenador con email {string} y contraseña {string} inicia sesión', async function (email, password) {
  this.token = await getUserToken(email, password);
  assert.ok(this.token, `Fallo el inicio de sesión para ${email}`);
});

When('consulta los datos de la división {string}', async function (nombreDivision) {
  const adminToken = await getAdminPuertoToken();
  const divisionId = await findDivisionIdByName(nombreDivision, adminToken);
  assert.ok(divisionId, `División ${nombreDivision} no encontrada`);

  this.lastResponse = await fetch(`${BACKEND_URL}/division/${divisionId}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });

  try {
    this.lastResponseBody = await this.lastResponse.json();
  } catch {
    this.lastResponseBody = await this.lastResponse.text();
  }
});

Then('el sistema responde con código 200 y permite el acceso a la división', function () {
  assert.equal(this.lastResponse.status, 200, `Se esperaba 200 pero fue ${this.lastResponse.status}`);
});

When('intenta consultar los jugadores de la división {string}', async function (nombreDivision) {
  const adminToken = await getAdminPuertoToken();
  const divisionId = await findDivisionIdByName(nombreDivision, adminToken);
  assert.ok(divisionId, `División ${nombreDivision} no encontrada`);

  this.lastResponse = await fetch(`${BACKEND_URL}/players?divisionId=${divisionId}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });

  try {
    this.lastResponseBody = await this.lastResponse.json();
  } catch {
    this.lastResponseBody = await this.lastResponse.text();
  }
});

Then('el sistema rechaza el acceso con error de autorización 403', function () {
  assert.equal(
    this.lastResponse.status,
    403,
    `Se esperaba código 403 Forbidden pero se obtuvo ${this.lastResponse.status}`
  );
});

When('intenta consultar los datos de la división {string} perteneciente al club de {string}', async function (nombreDivision, emailOtroAdmin) {
  const otroToken = await getUserToken(emailOtroAdmin, 'PassSegura123!');
  const divisionId = await findDivisionIdByName(nombreDivision, otroToken);
  assert.ok(divisionId, `División ${nombreDivision} de ${emailOtroAdmin} no encontrada`);

  this.lastResponse = await fetch(`${BACKEND_URL}/division/${divisionId}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });

  try {
    this.lastResponseBody = await this.lastResponse.json();
  } catch {
    this.lastResponseBody = await this.lastResponse.text();
  }
});

When('intenta consultar las divisiones del club', async function () {
  const adminToken = await getAdminPuertoToken();
  const myClubRes = await fetch(`${BACKEND_URL}/club/my-club`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const club = await myClubRes.json();

  this.lastResponse = await fetch(`${BACKEND_URL}/division?clubId=${club.id}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });

  try {
    this.lastResponseBody = await this.lastResponse.json();
  } catch {
    this.lastResponseBody = await this.lastResponse.text();
  }
});

When('intenta consultar los datos de la división {string}', async function (nombreDivision) {
  const adminToken = await getAdminPuertoToken();
  const divisionId = await findDivisionIdByName(nombreDivision, adminToken);
  assert.ok(divisionId, `División ${nombreDivision} no encontrada`);

  this.lastResponse = await fetch(`${BACKEND_URL}/division/${divisionId}`);

  try {
    this.lastResponseBody = await this.lastResponse.json();
  } catch {
    this.lastResponseBody = await this.lastResponse.text();
  }
});
