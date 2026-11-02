import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { findEventType, getPostMatchEvents } from '../../support/event_helper.js';
import { findTimelineEvent, patchEvent } from '../../support/post_match_helper.js';

// Los partidos y eventos de contexto se definen en linea_eventos_steps.js.
// PATCH /event/{id} reemplaza todos los atributos y vuelve a validar los campos "live" obligatorios.

// <==================== Helpers ====================>

const toAttributeValue = (text) => (Number.isNaN(Number(text)) ? text : Number(text));

const tryEnrich = async function (tipoEvento, attributes) {
  const event = await findTimelineEvent(this.currentMatch.id, tipoEvento, this.token);
  this.response = await patchEvent(event.id, { attributes }, this.token);
};

const assertRejected = function (statusCode, mensajeParcial) {
  assert.equal(this.response.status, statusCode, this.response.body?.message);
  assert.ok(
    this.response.body?.message?.includes(mensajeParcial),
    `Se esperaba un mensaje con "${mensajeParcial}" pero se obtuvo "${this.response.body?.message}"`,
  );
};

// <==================== Enriquecimiento ====================>

When('el entrenador enriquece los eventos del partido con los siguientes atributos:', async function (dataTable) {
  const attributesByType = new Map();
  for (const row of dataTable.hashes()) {
    const attrs = attributesByType.get(row.tipo_evento) ?? {};
    attrs[row.atributo_clave] = toAttributeValue(row.atributo_valor);
    attributesByType.set(row.tipo_evento, attrs);
  }

  this.enrichmentResponses = [];
  this.expectedAttributes = new Map();
  for (const [tipoEvento, attributes] of attributesByType) {
    const event = await findTimelineEvent(this.currentMatch.id, tipoEvento, this.token);
    this.enrichmentResponses.push({ tipoEvento, response: await patchEvent(event.id, { attributes }, this.token) });
    this.expectedAttributes.set(event.id, attributes);
  }
});

Then('el sistema responde con {int} en todas las modificaciones de atributos', function (statusCode) {
  for (const { tipoEvento, response } of this.enrichmentResponses) {
    assert.equal(response.status, statusCode, `Evento ${tipoEvento}: ${response.body?.message}`);
  }
});

Then('al consultar la línea de tiempo del partido post-match, cada evento contiene sus atributos tácticos persistidos', async function () {
  const events = await getPostMatchEvents(this.currentMatch.id, this.token);
  for (const [eventId, attributes] of this.expectedAttributes) {
    const event = events.find((e) => e.id === eventId);
    assert.ok(event, `El evento ${eventId} no está en la línea de tiempo`);
    assert.deepStrictEqual(event.attributes, attributes);
  }
});

// <==================== Reseteo al cambiar de tipo ====================>

Given('que el evento {string} tiene el atributo {string} con valor {string}', async function (tipoEvento, clave, valor) {
  const event = await findTimelineEvent(this.currentMatch.id, tipoEvento, this.token);
  const response = await patchEvent(event.id, { attributes: { [clave]: toAttributeValue(valor) } }, this.token);
  assert.equal(response.status, 200, `No se pudo preparar el atributo: ${response.body?.message}`);
  this.editedEventId = event.id;
});

When('el entrenador cambia el tipo del evento a {string} sin especificar atributos', async function (tipoNuevo) {
  this.response = await patchEvent(this.editedEventId, { eventTypeId: await findEventType(tipoNuevo, this.token) }, this.token);
});

Then('al consultar la línea de tiempo, el evento modificado no contiene atributos remanentes del tipo anterior', async function () {
  const events = await getPostMatchEvents(this.currentMatch.id, this.token);
  const event = events.find((e) => e.id === this.editedEventId);
  assert.ok(event, 'El evento modificado no está en la línea de tiempo');
  assert.ok(!event.attributes || Object.keys(event.attributes).length === 0,
    `El evento conserva atributos: ${JSON.stringify(event.attributes)}`);
});

// <==================== Rechazos de atributos ====================>

When('el entrenador intenta enriquecer el evento {string} con el atributo numérico {string} y valor {int}', async function (tipoEvento, clave, valor) {
  await tryEnrich.call(this, tipoEvento, { [clave]: valor });
});

When('el entrenador intenta enriquecer el evento {string} con el atributo select {string} y valor {string}', async function (tipoEvento, clave, valor) {
  await tryEnrich.call(this, tipoEvento, { [clave]: valor });
});

When('el entrenador intenta enriquecer el evento {string} con un atributo no permitido {string} y valor {string}', async function (tipoEvento, clave, valor) {
  await tryEnrich.call(this, tipoEvento, { [clave]: valor });
});

When('el entrenador intenta enriquecer el evento {string} con el atributo {string} enviando texto {string}', async function (tipoEvento, clave, texto) {
  await tryEnrich.call(this, tipoEvento, { [clave]: texto });
});

Then('el sistema rechaza la modificación con código {int} por límite de rango', function (statusCode) {
  assertRejected.call(this, statusCode, 'Valor fuera de rango');
});

Then('el sistema rechaza la modificación con código {int} por opción inválida', function (statusCode) {
  assertRejected.call(this, statusCode, 'Opción inválida');
});

Then('el sistema rechaza la modificación con código {int} por atributo no permitido', function (statusCode) {
  assertRejected.call(this, statusCode, 'Atributo no permitido');
});

Then('el sistema rechaza la modificación con código {int} por tipo de dato inválido', function (statusCode) {
  assertRejected.call(this, statusCode, 'Valor inválido');
});
