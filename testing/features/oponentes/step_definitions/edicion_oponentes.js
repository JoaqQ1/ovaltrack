import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { makeHttpRequest } from '../../support/httpRequest.js';

// El inicio de sesión, el alta de rivales ("intenta crear al rival ...") y los
// "Entonces el sistema responde con ..." están definidos en support/common_steps.js y crear_oponentes.js

// <==================== Helpers ====================>

const getOpponents = async (token) => {
  const response = await makeHttpRequest('GET', 'opponents', null, token);
  assert.equal(response.status, 200, 'No se pudieron obtener los rivales');
  return response.body;
};

const findOpponent = async (nombre, token) => (await getOpponents(token)).find((o) => o.name === nombre);

const requireOpponent = async (nombre, token) => {
  const opponent = await findOpponent(nombre, token);
  assert.ok(opponent, `No existe el rival "${nombre}"`);
  return opponent;
};

// <==================== Contexto ====================>

Given('que existe el rival {string} \\({string}) de la ciudad {string}', async function (nombre, alias, ciudad) {
  if (await findOpponent(nombre, this.token)) return;
  const response = await makeHttpRequest('POST', 'opponents', { name: nombre, alias, city: ciudad }, this.token);
  assert.equal(response.status, 201, `No se pudo crear el rival ${nombre}: ${response.body?.message}`);
});

// <==================== Edición ====================>

When('edita el rival {string} con nombre {string}, alias {string} y ciudad {string}', async function (nombre, nuevoNombre, alias, ciudad) {
  const opponent = await requireOpponent(nombre, this.token);
  this.response = await makeHttpRequest('PUT', `opponents/${opponent.id}`, { name: nuevoNombre, alias, city: ciudad }, this.token);
});

When('edita el rival inexistente con ID {string}', async function (opponentId) {
  this.response = await makeHttpRequest('PUT', `opponents/${opponentId}`, { name: 'Inexistente', alias: 'INX', city: 'Rawson' }, this.token);
});

Then('el rival {string} figura con alias {string} y ciudad {string}', async function (nombre, alias, ciudad) {
  const opponent = await requireOpponent(nombre, this.token);
  assert.equal(opponent.alias, alias);
  assert.equal(opponent.city, ciudad);
});

// <==================== Eliminación ====================>

When('elimina el rival {string}', async function (nombre) {
  const opponent = await requireOpponent(nombre, this.token);
  this.response = await makeHttpRequest('DELETE', `opponents/${opponent.id}`, null, this.token);
});

Then('el rival {string} ya no figura en la lista de rivales', async function (nombre) {
  assert.equal(await findOpponent(nombre, this.token), undefined, `El rival ${nombre} sigue en la lista`);
});
