import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { findDivisionIdByName } from '../../support/division_helper.js';
import {
  buildZonePayload,
  createZone,
  updateZone,
  deleteZone,
  listZones,
  readJsonOrText,
  missingUuid
} from '../../support/zone_helper.js';

const BACKEND_URL = process.env.API_URL || 'http://backend:8080';

/**
 * Contrato esperado de la API de zonas (se implementa en las fases 2 y 3):
 *   POST   /matches/{id}/zones          -> 201 + ZoneAssignmentResponse
 *   PUT    /matches/{id}/zones/{zoneId} -> 200 + ZoneAssignmentResponse
 *   DELETE /matches/{id}/zones/{zoneId} -> 204
 *   GET    /matches/{id}/zones          -> 200 + { assignments: [...], summary: { cells: [{row, col, eventCount}], unzonedEventCount } }
 *   GET    /event/match/post-match      -> cada evento incluye `zone: { row, col } | null`
 * ZoneAssignmentResponse: { id, matchId, period, startMinute, endMinute, row, col }
 */

async function saveResponse(world, response) {
  world.lastResponse = response;
  world.lastResponseBody = await readJsonOrText(response);
}

async function fetchPostMatchEvents(world) {
  const res = await fetch(`${BACKEND_URL}/event/match/post-match?matchId=${world.currentMatch.id}`, {
    headers: { 'Authorization': `Bearer ${world.token}` }
  });
  assert.equal(res.status, 200, 'Error al consultar la línea de eventos post-partido');
  return res.json();
}

function findEventAt(events, tipoEvento, minuto, periodo) {
  const event = events.find(e =>
    e.eventTypeName === tipoEvento &&
    e.period === periodo &&
    e.matchTime === minuto * 60
  );
  assert.ok(event, `No se encontró el evento "${tipoEvento}" del minuto ${minuto} en el periodo ${periodo}`);
  return event;
}

// --- Contexto ---

Given('que existe un partido no iniciado para la división {string} contra {string}', async function (divisionNombre, rival) {
  const divisionId = await findDivisionIdByName(divisionNombre, this.token);
  assert.ok(divisionId, `No se encontró la división "${divisionNombre}"`);

  const res = await fetch(`${BACKEND_URL}/matches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
    body: JSON.stringify({ date: '2026-12-01T15:30:00', divisionId, opponent: rival })
  });
  assert.equal(res.status, 200, `No se pudo crear el partido contra ${rival}`);
  this.currentMatch = await res.json();
});

Given('que el partido tiene asignada la zona fila {int} columna {int} en el periodo {int} entre el minuto {int} y el minuto {int}',
  async function (row, col, period, startMinute, endMinute) {
    assert.ok(this.currentMatch, 'No hay partido actual en el contexto');
    const res = await createZone(this.currentMatch.id, buildZonePayload({ row, col, period, startMinute, endMinute }), this.token);
    assert.equal(res.status, 201, `No se pudo preparar la zona inicial (código ${res.status})`);
    this.lastZone = await res.json();
  });

// --- Acciones ---

When('el entrenador asigna la zona fila {int} columna {int} al periodo {int} entre el minuto {int} y el minuto {int}',
  async function (row, col, period, startMinute, endMinute) {
    assert.ok(this.currentMatch, 'No hay partido actual en el contexto');
    const res = await createZone(this.currentMatch.id, buildZonePayload({ row, col, period, startMinute, endMinute }), this.token);
    await saveResponse(this, res);
    if (res.status === 201) this.lastZone = this.lastResponseBody;
  });

When('el entrenador modifica la zona asignada a fila {int} columna {int} entre el minuto {int} y el minuto {int}',
  async function (row, col, startMinute, endMinute) {
    assert.ok(this.lastZone, 'No hay una zona previa en el contexto');
    const payload = buildZonePayload({ row, col, period: this.lastZone.period, startMinute, endMinute });
    await saveResponse(this, await updateZone(this.currentMatch.id, this.lastZone.id, payload, this.token));
  });

When('el entrenador elimina la zona asignada', async function () {
  assert.ok(this.lastZone, 'No hay una zona previa en el contexto');
  await saveResponse(this, await deleteZone(this.currentMatch.id, this.lastZone.id, this.token));
});

When('el entrenador elimina el último evento agregado', async function () {
  assert.ok(this.lastCreatedEvent?.id, 'No hay un evento agregado en el contexto');
  const res = await fetch(`${BACKEND_URL}/event/${this.lastCreatedEvent.id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  assert.equal(res.status, 200, 'No se pudo eliminar el evento');
});

When('el entrenador consulta las zonas del partido', async function () {
  assert.ok(this.currentMatch, 'No hay partido actual en el contexto');
  await saveResponse(this, await listZones(this.currentMatch.id, this.token));
});

// --- Sad paths: datos inválidos / inexistentes / sin autenticar ---

When('el entrenador intenta asignar una zona sin indicar la fila', async function () {
  assert.ok(this.currentMatch, 'No hay partido actual en el contexto');
  const payload = { col: 3, period: 1, startMinute: 10, endMinute: 25 };
  await saveResponse(this, await createZone(this.currentMatch.id, payload, this.token));
});

When('el entrenador intenta asignar una zona a un partido inexistente', async function () {
  const payload = buildZonePayload({ row: 2, col: 3, period: 1, startMinute: 10, endMinute: 25 });
  await saveResponse(this, await createZone(missingUuid(), payload, this.token));
});

When('el entrenador intenta modificar una zona inexistente', async function () {
  const payload = buildZonePayload({ row: 2, col: 3, period: 1, startMinute: 10, endMinute: 25 });
  await saveResponse(this, await updateZone(this.currentMatch.id, missingUuid(), payload, this.token));
});

When('el entrenador intenta eliminar una zona inexistente', async function () {
  await saveResponse(this, await deleteZone(this.currentMatch.id, missingUuid(), this.token));
});

When('alguien sin autenticar intenta asignar una zona al partido', async function () {
  assert.ok(this.currentMatch, 'No hay partido actual en el contexto');
  const payload = buildZonePayload({ row: 2, col: 3, period: 1, startMinute: 10, endMinute: 25 });
  await saveResponse(this, await createZone(this.currentMatch.id, payload, null));
});

// --- Verificaciones ---

Then('la zona asignada se devuelve con fila {int}, columna {int}, periodo {int}, desde el minuto {int} hasta el minuto {int}',
  function (row, col, period, startMinute, endMinute) {
    const zone = this.lastResponseBody;
    assert.ok(zone && zone.id, 'La respuesta no contiene la zona creada');
    assert.deepEqual(
      { row: zone.row, col: zone.col, period: zone.period, startMinute: zone.startMinute, endMinute: zone.endMinute },
      { row, col, period, startMinute, endMinute }
    );
  });

Then('el evento {string} del minuto {int} del periodo {int} pertenece a la zona fila {int} columna {int}',
  async function (tipoEvento, minuto, periodo, row, col) {
    const event = findEventAt(await fetchPostMatchEvents(this), tipoEvento, minuto, periodo);
    assert.ok(event.zone, `El evento debería tener zona fila ${row} columna ${col} pero no tiene zona`);
    assert.deepEqual({ row: event.zone.row, col: event.zone.col }, { row, col });
  });

Then('el evento {string} del minuto {int} del periodo {int} queda sin zona', async function (tipoEvento, minuto, periodo) {
  const event = findEventAt(await fetchPostMatchEvents(this), tipoEvento, minuto, periodo);
  assert.ok(event.zone === null || event.zone === undefined, `El evento debería quedar sin zona pero tiene ${JSON.stringify(event.zone)}`);
});

Then('la consulta devuelve {int} asignación/asignaciones de zona', function (cantidad) {
  assert.ok(Array.isArray(this.lastResponseBody?.assignments), 'La respuesta debe incluir la lista "assignments"');
  assert.equal(this.lastResponseBody.assignments.length, cantidad);
});

Then('el resumen indica {int} evento/eventos en la fila {int} columna {int}', function (cantidad, row, col) {
  const cells = this.lastResponseBody?.summary?.cells;
  assert.ok(Array.isArray(cells), 'La respuesta debe incluir "summary.cells"');
  const cell = cells.find(c => c.row === row && c.col === col);
  const actual = cell ? cell.eventCount : 0;
  assert.equal(actual, cantidad, `Se esperaban ${cantidad} eventos en fila ${row} columna ${col} y hay ${actual}`);
});

Then('el resumen indica {int} evento/eventos sin zona', function (cantidad) {
  assert.equal(this.lastResponseBody?.summary?.unzonedEventCount, cantidad);
});
