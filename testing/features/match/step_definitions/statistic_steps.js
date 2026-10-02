import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';

const BACKEND_URL = process.env.API_URL || 'http://backend:8080';

When('el entrenador consulta las estadísticas del período {int} para el partido', async function (periodo) {
  assert.ok(this.currentMatch, 'No hay un partido en curso en el contexto');

  this.lastResponse = await fetch(`${BACKEND_URL}/statistics/match/${this.currentMatch.id}?period=${periodo}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${this.token}`
    }
  });

  const text = await this.lastResponse.text();
  try {
    this.lastResponseBody = JSON.parse(text);
  } catch {
    this.lastResponseBody = text;
  }
});

When('el entrenador consulta las estadísticas del período {int} para un partido con ID {string}', async function (periodo, matchId) {
  this.lastResponse = await fetch(`${BACKEND_URL}/statistics/match/${matchId}?period=${periodo}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${this.token}`
    }
  });

  const text = await this.lastResponse.text();
  try {
    this.lastResponseBody = JSON.parse(text);
  } catch {
    this.lastResponseBody = text;
  }
});

Then('el sistema responde con código {int} y devuelve las estadísticas calculadas:', function (statusCode, dataTable) {
  assert.equal(
    this.lastResponse.status,
    statusCode,
    `Se esperaba código ${statusCode} pero se obtuvo ${this.lastResponse.status}: ${JSON.stringify(this.lastResponseBody)}`
  );

  const rows = dataTable.hashes();
  for (const row of rows) {
    const fieldName = row.campo;
    const expectedValue = parseFloat(row.valor);
    const actualValue = parseFloat(this.lastResponseBody[fieldName]);

    assert.equal(
      actualValue,
      expectedValue,
      `Para el campo "${fieldName}" se esperaba ${expectedValue} pero se obtuvo ${actualValue}`
    );
  }
});
