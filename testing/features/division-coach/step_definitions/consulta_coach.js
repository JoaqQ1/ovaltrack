import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { findClubMember } from '../../support/club_helper.js';
import { makeHttpRequest } from '../../support/httpRequest.js';
import { findDivisionId } from '../../support/match_helper.js';

// El inicio de sesión del administrador y los "Entonces el sistema responde con ..." están definidos en
// support/common_steps.js

const getCoachAssociation = (divisionCoachId, token) => makeHttpRequest('GET', `coaches/${divisionCoachId}`, null, token);

When('consulta por su ID la asociación del coach {string} a la division {string}', async function (email, nombreDivision) {
  const coach = await findClubMember(email, this.token);
  const divisionId = await findDivisionId(nombreDivision, this.token);
  const coaches = await makeHttpRequest('GET', `coaches?divisionId=${divisionId}`, null, this.token);
  const association = coaches.body.find((c) => c.personId === coach.personId);
  assert.ok(association, `El coach ${email} no está asociado a ${nombreDivision}`);
  this.coachPersonId = coach.personId;
  this.response = await getCoachAssociation(association.id, this.token);
});

When('consulta la asociación de coach inexistente con ID {string}', async function (divisionCoachId) {
  this.response = await getCoachAssociation(divisionCoachId, this.token);
});

Then('la asociación corresponde al coach consultado y sigue vigente', function () {
  assert.equal(this.response.body.personId, this.coachPersonId);
  assert.equal(this.response.body.endDate, null);
});
