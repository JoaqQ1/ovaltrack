import { Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';

export function extractResponseMessage(responseBody) {
  if (!responseBody) return '';
  if (typeof responseBody === 'string') return responseBody;
  const parts = [
    responseBody.message,
    responseBody.mensaje,
    responseBody.error,
    responseBody.detail
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' | ') : JSON.stringify(responseBody);
}

export async function assertResponseCodeAndMessage(world, expectedStatus, expectedMessage) {
  assert.ok(world.lastResponse, 'No se encontró lastResponse en el contexto del escenario');

  const actualStatus = world.lastResponse.status;
  assert.equal(
    actualStatus,
    expectedStatus,
    `Se esperaba código HTTP ${expectedStatus} pero se obtuvo ${actualStatus}`
  );

  let body = world.lastResponseBody;
  if (body === undefined || body === null) {
    try {
      const cloned = world.lastResponse.clone();
      try {
        body = await cloned.json();
      } catch {
        body = await cloned.text();
      }
      world.lastResponseBody = body;
    } catch {
      // Si el stream ya fue consumido o no es clonable, continúa con el body existente
    }
  }

  const actualMessage = extractResponseMessage(body);
  assert.ok(
    actualMessage.includes(expectedMessage),
    `Se esperaba que el mensaje contuviera "${expectedMessage}", pero se obtuvo: "${actualMessage}" (Status ${actualStatus})`
  );
}

Then('el sistema rechaza la solicitud con código {int} y el mensaje {string}', async function (statusCode, mensajeEsperado) {
  await assertResponseCodeAndMessage(this, statusCode, mensajeEsperado);
});

Then('el sistema responde con código {int} y el mensaje {string}', async function (statusCode, mensajeEsperado) {
  await assertResponseCodeAndMessage(this, statusCode, mensajeEsperado);
});
