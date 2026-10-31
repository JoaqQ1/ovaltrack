import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { findEventTypeIdByName } from '../../support/event_helper.js';

const BACKEND_URL = process.env.API_URL || 'http://backend:8080';

// HP1: Enriquecimiento táctico en lote
When('el entrenador enriquece los eventos del partido con los siguientes atributos:', async function (dataTable) {
  assert.ok(this.currentMatch, 'No hay partido actual en el contexto');
  
  const eventsRes = await fetch(`${BACKEND_URL}/event/match/post-match?matchId=${this.currentMatch.id}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  const events = await eventsRes.json();
  
  const rows = dataTable.hashes();
  const groupedAttributes = new Map();

  for (const row of rows) {
    if (!groupedAttributes.has(row.tipo_evento)) {
      groupedAttributes.set(row.tipo_evento, {});
    }
    const val = isNaN(Number(row.atributo_valor)) ? row.atributo_valor : Number(row.atributo_valor);
    groupedAttributes.get(row.tipo_evento)[row.atributo_clave] = val;
  }

  this.enrichmentResponses = [];
  this.expectedEnrichments = new Map();

  for (const [tipoEvento, attrs] of groupedAttributes.entries()) {
    const event = events.find(e => e.eventTypeName === tipoEvento);
    assert.ok(event, `Evento "${tipoEvento}" no encontrado en el partido`);

    const patchRes = await fetch(`${BACKEND_URL}/event/${event.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({
        attributes: attrs
      })
    });

    this.enrichmentResponses.push(patchRes);
    this.expectedEnrichments.set(event.id, attrs);
  }
});

Then('el sistema responde con código 200 en todas las modificaciones de atributos', async function () {
  assert.ok(this.enrichmentResponses && this.enrichmentResponses.length > 0, 'No hubo respuestas de enriquecimiento');
  for (const res of this.enrichmentResponses) {
    assert.equal(res.status, 200, `Se esperaba status 200 pero se recibió ${res.status}`);
  }
});

Then('al consultar la línea de tiempo del partido post-match, cada evento contiene sus atributos tácticos persistidos', async function () {
  const eventsRes = await fetch(`${BACKEND_URL}/event/match/post-match?matchId=${this.currentMatch.id}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  assert.equal(eventsRes.status, 200, 'Error al consultar post-match timeline');
  const events = await eventsRes.json();

  for (const [eventId, expectedAttrs] of this.expectedEnrichments.entries()) {
    const event = events.find(e => e.id === eventId);
    assert.ok(event, `Evento ${eventId} no encontrado en la línea de tiempo`);
    assert.ok(event.attributes, `El evento ${eventId} no tiene atributos en la respuesta`);

    for (const [k, v] of Object.entries(expectedAttrs)) {
      assert.equal(
        event.attributes[k],
        v,
        `El atributo "${k}" en evento ${eventId} esperaba "${v}" pero tiene "${event.attributes[k]}"`
      );
    }
  }
});

// HP2: Reseteo de atributos al cambiar de tipo
Given('que el evento {string} tiene el atributo {string} con valor {string}', async function (tipoEvento, clave, valor) {
  assert.ok(this.currentMatch, 'No hay partido actual');
  const eventsRes = await fetch(`${BACKEND_URL}/event/match/post-match?matchId=${this.currentMatch.id}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  const events = await eventsRes.json();
  const event = events.find(e => e.eventTypeName === tipoEvento);
  assert.ok(event, `Evento ${tipoEvento} no encontrado`);

  const patchRes = await fetch(`${BACKEND_URL}/event/${event.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify({
      attributes: { [clave]: valor }
    })
  });
  assert.equal(patchRes.status, 200, 'Error al preestablecer atributos del evento');
  this.lastTargetEventId = event.id;
});

When('el entrenador cambia el tipo del evento a {string} sin especificar atributos', async function (nuevoTipoNombre) {
  assert.ok(this.lastTargetEventId, 'No hay ID de evento seleccionado');
  const newTypeId = await findEventTypeIdByName(nuevoTipoNombre, this.token);
  assert.ok(newTypeId, `No se encontró el tipo de evento "${nuevoTipoNombre}"`);

  this.lastResponse = await fetch(`${BACKEND_URL}/event/${this.lastTargetEventId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify({
      eventTypeId: newTypeId
    })
  });
});

Then('al consultar la línea de tiempo, el evento modificado no contiene atributos remanentes del tipo anterior', async function () {
  const eventsRes = await fetch(`${BACKEND_URL}/event/match/post-match?matchId=${this.currentMatch.id}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  const events = await eventsRes.json();
  const event = events.find(e => e.id === this.lastTargetEventId);
  assert.ok(event, 'Evento no encontrado en la línea de tiempo');
  assert.ok(
    !event.attributes || Object.keys(event.attributes).length === 0,
    `El evento no debió conservar atributos anteriores, pero tiene: ${JSON.stringify(event.attributes)}`
  );
});

// Sad Paths
When('el entrenador intenta enriquecer el evento {string} con el atributo numérico {string} y valor {int}', async function (tipoEvento, clave, valor) {
  assert.ok(this.currentMatch, 'No hay partido actual');
  const eventsRes = await fetch(`${BACKEND_URL}/event/match/post-match?matchId=${this.currentMatch.id}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  const events = await eventsRes.json();
  const event = events.find(e => e.eventTypeName === tipoEvento);
  assert.ok(event, `Evento "${tipoEvento}" no encontrado`);

  this.lastResponse = await fetch(`${BACKEND_URL}/event/${event.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify({
      attributes: { [clave]: valor }
    })
  });
});

Then('el sistema rechaza la modificación con código 409 por límite de rango', async function () {
  assert.equal(this.lastResponse.status, 409, `Se esperaba código 409 pero se recibió ${this.lastResponse.status}`);
  const data = await this.lastResponse.json();
  const msg = typeof data === 'string' ? data : (data.message || '');
  assert.ok(msg.toLowerCase().includes('rango') || msg.toLowerCase().includes('mínimo') || msg.toLowerCase().includes('máximo'), `Mensaje inesperado: ${msg}`);
});

When('el entrenador intenta enriquecer el evento {string} con el atributo select {string} y valor {string}', async function (tipoEvento, clave, valor) {
  assert.ok(this.currentMatch, 'No hay partido actual');
  const eventsRes = await fetch(`${BACKEND_URL}/event/match/post-match?matchId=${this.currentMatch.id}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  const events = await eventsRes.json();
  const event = events.find(e => e.eventTypeName === tipoEvento);
  assert.ok(event, `Evento "${tipoEvento}" no encontrado`);

  this.lastResponse = await fetch(`${BACKEND_URL}/event/${event.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify({
      attributes: { [clave]: valor }
    })
  });
});

Then('el sistema rechaza la modificación con código 409 por opción inválida', async function () {
  assert.equal(this.lastResponse.status, 409, `Se esperaba código 409 pero se recibió ${this.lastResponse.status}`);
  const data = await this.lastResponse.json();
  const msg = typeof data === 'string' ? data : (data.message || '');
  assert.ok(msg.toLowerCase().includes('opción inválida') || msg.toLowerCase().includes('opcion'), `Mensaje inesperado: ${msg}`);
});

When('el entrenador intenta enriquecer el evento {string} con un atributo no permitido {string} y valor {string}', async function (tipoEvento, clave, valor) {
  assert.ok(this.currentMatch, 'No hay partido actual');
  const eventsRes = await fetch(`${BACKEND_URL}/event/match/post-match?matchId=${this.currentMatch.id}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  const events = await eventsRes.json();
  const event = events.find(e => e.eventTypeName === tipoEvento);
  assert.ok(event, `Evento "${tipoEvento}" no encontrado`);

  this.lastResponse = await fetch(`${BACKEND_URL}/event/${event.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify({
      attributes: { [clave]: valor }
    })
  });
});

Then('el sistema rechaza la modificación con código 409 por atributo no permitido', async function () {
  assert.equal(this.lastResponse.status, 409, `Se esperaba código 409 pero se recibió ${this.lastResponse.status}`);
  const data = await this.lastResponse.json();
  const msg = typeof data === 'string' ? data : (data.message || '');
  assert.ok(msg.toLowerCase().includes('no permitido'), `Mensaje inesperado: ${msg}`);
});

When('el entrenador intenta enriquecer el evento {string} con el atributo {string} enviando texto {string}', async function (tipoEvento, clave, valor) {
  assert.ok(this.currentMatch, 'No hay partido actual');
  const eventsRes = await fetch(`${BACKEND_URL}/event/match/post-match?matchId=${this.currentMatch.id}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  const events = await eventsRes.json();
  const event = events.find(e => e.eventTypeName === tipoEvento);
  assert.ok(event, `Evento "${tipoEvento}" no encontrado`);

  this.lastResponse = await fetch(`${BACKEND_URL}/event/${event.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify({
      attributes: { [clave]: valor }
    })
  });
});

Then('el sistema rechaza la modificación con código 409 por tipo de dato inválido', async function () {
  assert.equal(this.lastResponse.status, 409, `Se esperaba código 409 pero se recibió ${this.lastResponse.status}`);
  const data = await this.lastResponse.json();
  const msg = typeof data === 'string' ? data : (data.message || '');
  assert.ok(msg.toLowerCase().includes('inválido') || msg.toLowerCase().includes('invalido'), `Mensaje inesperado: ${msg}`);
});
