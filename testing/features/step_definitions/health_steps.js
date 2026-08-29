import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';

const BACKEND_URL = process.env.API_URL || 'http://backend:8080';

When('consulto el endpoint de salud {string}', async function (endpoint) {
  try {
    this.response = await fetch(`${BACKEND_URL}${endpoint}`);
    this.responseBody = await this.response.json();
  } catch (error) {
    this.error = error;
  }
});

Then('el código de respuesta debe ser {int}', function (statusCode) {
  assert.equal(this.response?.status, statusCode, `Se esperaba status ${statusCode} pero se obtuvo ${this.response?.status}`);
});

Then('el estado del servicio debe ser {string}', function (status) {
  assert.equal(this.responseBody?.status, status, `Se esperaba status '${status}' en el JSON de respuesta`);
});
