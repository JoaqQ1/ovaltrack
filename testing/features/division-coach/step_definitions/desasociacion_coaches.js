import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { findClubMember } from '../../support/club_helper.js';
import { makeHttpRequest } from '../../support/httpRequest.js';
import { findDivisionId } from '../../support/match_helper.js';

// El inicio de sesión y los "Entonces el sistema responde con ..." están definidos en support/common_steps.js

// <==================== Helpers ====================>

const getActiveCoaches = async (divisionId, token) => {
  const response = await makeHttpRequest('GET', `coaches?divisionId=${divisionId}`, null, token);
  assert.equal(response.status, 200, 'No se pudieron obtener los coaches de la división');
  return response.body;
};

const getCoachHistory = (divisionId, personId, token) =>
  makeHttpRequest('GET', `coaches/history?divisionId=${divisionId}&personId=${personId}`, null, token);

const resolveCoach = async function (email, nombreDivision) {
  const coach = await findClubMember(email, this.token);
  const divisionId = await findDivisionId(nombreDivision, this.token);
  return { personId: coach.personId, divisionId };
};

// <==================== Desasociación ====================>

When('desasocia al coach {string} de la division {string}', async function (email, nombreDivision) {
  const { personId, divisionId } = await resolveCoach.call(this, email, nombreDivision);
  const association = (await getActiveCoaches(divisionId, this.token)).find((c) => c.personId === personId);
  assert.ok(association, `El coach ${email} no está asociado a la división ${nombreDivision}`);
  this.response = await makeHttpRequest('DELETE', `coaches/${association.id}`, null, this.token);
});

// La asociación ya finalizada solo aparece en el historial
When('intenta desasociar nuevamente al coach {string} de la division {string}', async function (email, nombreDivision) {
  const { personId, divisionId } = await resolveCoach.call(this, email, nombreDivision);
  const history = await getCoachHistory(divisionId, personId, this.token);
  const finished = history.body.find((c) => c.endDate !== null);
  assert.ok(finished, `El coach ${email} no tiene una asociación finalizada en ${nombreDivision}`);
  this.response = await makeHttpRequest('DELETE', `coaches/${finished.id}`, null, this.token);
});

When('desasocia la asociación de coach inexistente con ID {string}', async function (divisionCoachId) {
  this.response = await makeHttpRequest('DELETE', `coaches/${divisionCoachId}`, null, this.token);
});

Then('el coach {string} ya no figura entre los coaches de la division {string}', async function (email, nombreDivision) {
  const { personId, divisionId } = await resolveCoach.call(this, email, nombreDivision);
  const coaches = await getActiveCoaches(divisionId, this.token);
  assert.ok(!coaches.some((c) => c.personId === personId), `El coach ${email} sigue asociado a ${nombreDivision}`);
});

// <==================== Historial ====================>

When('consulta el historial del coach {string} en la division {string}', async function (email, nombreDivision) {
  const { personId, divisionId } = await resolveCoach.call(this, email, nombreDivision);
  this.response = await getCoachHistory(divisionId, personId, this.token);
});

Then('el historial tiene una asociación finalizada', function () {
  assert.ok(this.response.body.some((a) => a.startDate && a.endDate), 'El historial no tiene asociaciones finalizadas');
});

Then('el historial tiene una asociación vigente', function () {
  assert.ok(this.response.body.some((a) => a.startDate && a.endDate === null), 'El historial no tiene asociaciones vigentes');
});
