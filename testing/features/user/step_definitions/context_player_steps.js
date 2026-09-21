import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';

const BACKEND_URL = process.env.API_URL || 'http://backend:8080';

async function ensureClubAndDivisionForUser(token) {
  const meRes = await fetch(`${BACKEND_URL}/api/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  assert.ok(meRes.ok, `GET /api/me failed: ${meRes.status}`);
  const me = await meRes.json();
  assert.ok(me.userId, `me.userId is missing: ${JSON.stringify(me)}`);

  let clubId = me.club?.id;
  if (!clubId) {
    const clubsRes = await fetch(`${BACKEND_URL}/club`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.ok(clubsRes.ok, `GET /club failed: ${clubsRes.status}`);
    const clubs = await clubsRes.json();

    if (Array.isArray(clubs) && clubs.length > 0) {
      clubId = clubs[0].id;
    } else {
      const createClubRes = await fetch(`${BACKEND_URL}/club`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: 'Puerto Madryn Rugby Club',
          adminUserId: me.userId,
          city: 'Puerto Madryn'
        })
      });
      const createClubBody = await createClubRes.json();
      assert.equal(createClubRes.status, 200, `POST /club failed (${createClubRes.status}): ${JSON.stringify(createClubBody)}`);
      clubId = createClubBody.id;
    }
  }

  const divRes = await fetch(`${BACKEND_URL}/division?clubId=${clubId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  let divs = [];
  if (divRes.ok) {
    divs = await divRes.json();
  }

  let divisionId;
  if (Array.isArray(divs) && divs.length > 0) {
    divisionId = divs[0].id;
  } else {
    const createDivRes = await fetch(`${BACKEND_URL}/division`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        clubId: clubId,
        name: 'Primera Masculina',
        ageCategory: 'SENIOR',
        gender: 'MALE'
      })
    });
    const createDivBody = await createDivRes.json();
    assert.equal(createDivRes.status, 200, `POST /division failed (${createDivRes.status}): ${JSON.stringify(createDivBody)}`);
    divisionId = createDivBody.id;
  }

  return { clubId, divisionId };
}

Given('que el usuario con email {string} y contraseña {string} ha iniciado sesión', async function (email, password) {
  const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const body = await response.json();
  this.token = body.token;
  assert.ok(this.token, 'El usuario debe recibir un token de sesión');
});

When('solicita su información de contexto de usuario autenticado', async function () {
  this.lastResponse = await fetch(`${BACKEND_URL}/api/me`, {
    headers: {
      'Authorization': `Bearer ${this.token}`
    }
  });
  this.lastResponseBody = await this.lastResponse.json();
});

Then('el sistema responde con el contexto del usuario incluyendo sus datos de usuario y club asignado', function () {
  assert.equal(this.lastResponse.status, 200, `Se esperaba código 200 pero se obtuvo ${this.lastResponse.status}`);
  assert.ok(this.lastResponseBody, 'Respuesta vacía');
  assert.ok(this.lastResponseBody.userId, 'El contexto debe contener el userId del usuario');
  assert.ok(this.lastResponseBody.email, 'El contexto debe contener el email del usuario');
});

When('consulta la lista de miembros de su club', async function () {
  await ensureClubAndDivisionForUser(this.token);

  this.lastResponse = await fetch(`${BACKEND_URL}/club/my-club/members`, {
    headers: {
      'Authorization': `Bearer ${this.token}`
    }
  });
  this.lastResponseBody = await this.lastResponse.json();
});

Then('el sistema responde con la lista de miembros pertenecientes al club', function () {
  assert.equal(this.lastResponse.status, 200, `Se esperaba código 200 pero se obtuvo ${this.lastResponse.status}`);
  assert.ok(Array.isArray(this.lastResponseBody), 'La respuesta debe ser una lista de miembros');
});

Given('que existe una división en el club', async function () {
  const { divisionId } = await ensureClubAndDivisionForUser(this.token);
  this.divisionId = divisionId;
  assert.ok(this.divisionId, 'No se pudo obtener ni crear una división');
});

Given('que ya existe una persona registrada con email {string}', async function (email) {
  const createPersonRes = await fetch(`${BACKEND_URL}/person`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify({
      firstName: 'Bautista',
      lastName: 'Existente',
      contactEmail: email
    })
  });
  // Podría ya existir o haber sido creada
  assert.ok(
    createPersonRes.ok || createPersonRes.status === 409,
    `Error al preparar la persona existente: ${createPersonRes.status}`
  );
});

When('registra un nuevo jugador con la siguiente información:', async function (dataTable) {
  const row = dataTable.hashes()[0];
  assert.ok(this.divisionId, 'ID de división no definido');

  this.lastResponse = await fetch(`${BACKEND_URL}/players`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify({
      divisionId: this.divisionId,
      firstName: row.nombre,
      lastName: row.apellido,
      jerseyNumber: row.camiseta ? parseInt(row.camiseta, 10) : null,
      position: row.posicion,
      contactEmail: row.email || null,
      contactPhone: row.telefono || null
    })
  });

  try {
    this.lastResponseBody = await this.lastResponse.json();
  } catch {
    this.lastResponseBody = await this.lastResponse.text();
  }
  this.registeredPlayerInput = row;
});

Then('el sistema crea la persona y la asocia exitosamente a la división como jugador', function () {
  assert.equal(this.lastResponse.status, 200, `Se esperaba status 200 pero se recibió ${this.lastResponse.status}`);
  assert.ok(this.lastResponseBody, 'Respuesta vacía');
  assert.equal(
    this.lastResponseBody.position,
    this.registeredPlayerInput.posicion,
    `La posición debería ser ${this.registeredPlayerInput.posicion}`
  );
  assert.ok(this.lastResponseBody.personId, 'El objeto respuesta debe incluir el ID de la Persona creada');
});

Then('el sistema rechaza el registro con el mensaje de conflicto {string}', function (mensajeEsperado) {
  assert.equal(
    this.lastResponse.status,
    409,
    `Se esperaba código 409 Conflict pero se obtuvo ${this.lastResponse.status}`
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
