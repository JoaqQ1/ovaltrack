import { When } from '@cucumber/cucumber';
import { makeHttpRequest } from '../../support/httpRequest.js';

// "Cuando intenta cancelar el partido" está en partido_steps.js

When('intenta finalizar el partido', async function () {
  this.response = await makeHttpRequest('PUT', `matches/${this.match.id}/finish`, null, this.token);
});
