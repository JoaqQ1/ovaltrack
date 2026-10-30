import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { findDivisionIdByName } from '../../support/division_helper.js';

const BACKEND_URL = process.env.API_URL || 'http://backend:8080';

// Cache para almacenar partidos creados entre pasos
export const matchCache = new Map();

export async function findMatchByOpponent(opponent, token) {
  if (matchCache.has(opponent)) {
    return matchCache.get(opponent);
  }

  // Buscar a través de la división Primera
  const divisionId = await findDivisionIdByName('Primera', token);
  if (divisionId) {
    const res = await fetch(`${BACKEND_URL}/matches/division?divisionId=${divisionId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const matches = await res.json();
      const target = matches.find(m => m.opponent === opponent);
      if (target) {
        matchCache.set(opponent, target);
        return target;
      }
    }
  }

  return null;
}

When('programa un partido contra el rival {string} para la fecha {string} en la división {string}', async function (rival, fecha, divisionNombre) {
  const divisionId = await findDivisionIdByName(divisionNombre, this.token);
  assert.ok(divisionId, `No se encontró la división con nombre "${divisionNombre}"`);

  this.lastResponse = await fetch(`${BACKEND_URL}/matches`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify({
      date: fecha,
      divisionId: divisionId,
      opponent: rival
    })
  });

  const text = await this.lastResponse.text();
  try {
    this.lastResponseBody = JSON.parse(text);
    if (this.lastResponse.ok && this.lastResponseBody.id) {
      matchCache.set(rival, this.lastResponseBody);
    }
  } catch {
    this.lastResponseBody = text;
  }
});

Then('el sistema responde con código {int} y devuelve el partido creado con rival {string} y estado {string}', function (statusCode, rivalEsperado, estadoEsperado) {
  assert.equal(this.lastResponse.status, statusCode, `Se esperaba código ${statusCode} pero se obtuvo ${this.lastResponse.status}`);
  assert.ok(this.lastResponseBody.id, 'El partido devuelto no contiene un ID asignado');
  assert.equal(this.lastResponseBody.opponent, rivalEsperado, `Se esperaba rival ${rivalEsperado} pero se obtuvo ${this.lastResponseBody.opponent}`);
  assert.equal(this.lastResponseBody.status, estadoEsperado, `Se esperaba estado ${estadoEsperado} pero se obtuvo ${this.lastResponseBody.status}`);
});

When('programa los siguientes partidos para la división {string}:', async function (divisionNombre, dataTable) {
  const divisionId = await findDivisionIdByName(divisionNombre, this.token);
  assert.ok(divisionId, `No se encontró la división con nombre "${divisionNombre}"`);

  const rows = dataTable.hashes();
  this.matchCreationResponses = [];

  for (const row of rows) {
    const res = await fetch(`${BACKEND_URL}/matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({
        date: row.fecha,
        divisionId: divisionId,
        opponent: row.rival
      })
    });

    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
      if (res.ok && body.id) {
        matchCache.set(row.rival, body);
      }
    } catch {
      body = text;
    }

    this.matchCreationResponses.push({ status: res.status, body, expectedRival: row.rival });
  }
});

Then('el sistema responde con código {int} confirmando la creación exitosa de todos los partidos', function (statusCode) {
  assert.ok(this.matchCreationResponses.length > 0, 'No se registraron respuestas de creación de partidos');
  for (const item of this.matchCreationResponses) {
    assert.equal(item.status, statusCode, `Se esperaba código ${statusCode} para el partido ${item.expectedRival} pero se obtuvo ${item.status}`);
    assert.ok(item.body.id, `El partido ${item.expectedRival} no contiene un ID generado`);
    assert.equal(item.body.opponent, item.expectedRival);
    assert.equal(item.body.status, 'NOT_STARTED');
  }
});

When('intenta programar un partido contra {string} asociándolo a un ID de división inexistente', async function (rival) {
  const fakeDivisionId = '00000000-0000-0000-0000-000000000000';

  this.lastResponse = await fetch(`${BACKEND_URL}/matches`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify({
      date: '2026-10-15T15:30:00',
      divisionId: fakeDivisionId,
      opponent: rival
    })
  });

  const text = await this.lastResponse.text();
  try {
    this.lastResponseBody = JSON.parse(text);
  } catch {
    this.lastResponseBody = text;
  }
});

When('intenta programar un partido contra {string} para el {string} en la división {string}', async function (rival, fecha, divisionNombre) {
  const divisionId = await findDivisionIdByName(divisionNombre, this.token);
  assert.ok(divisionId, `No se encontró la división con nombre "${divisionNombre}"`);

  this.lastResponse = await fetch(`${BACKEND_URL}/matches`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify({
      date: fecha,
      divisionId: divisionId,
      opponent: rival
    })
  });

  const text = await this.lastResponse.text();
  try {
    this.lastResponseBody = JSON.parse(text);
  } catch {
    this.lastResponseBody = text;
  }
});

