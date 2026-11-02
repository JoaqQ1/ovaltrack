import { When } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { makeHttpRequest } from "../../support/httpRequest.js";

// El "Dado que el administrador del club ... ha iniciado sesión" y el
// "Entonces el sistema responde con {int}" están definidos en support/common_steps.js

// <==================== Helpers ====================>

// Coaches del club que ya fueron dados de alta
const getActiveCoaches = async (token) => {
  const response = await makeHttpRequest("GET", "club/my-club/members", null, token);
  assert.equal(response.status, 200, "No se pudieron obtener los miembros del club");
  return response.body.filter(
    (member) => member.role === "COACH_ANALYST" && member.active === true,
  );
};

const findDivisionByName = async (clubId, nombreDivision, token) => {
  const response = await makeHttpRequest("GET", `division?clubId=${clubId}`, null, token);
  assert.equal(response.status, 200, "No se pudieron obtener las divisiones del club");
  return response.body.find((division) => division.name === nombreDivision);
};

// <==================== Asignar coach a una division ====================>

When('intenta asignar al coach {string} {string} {string} en la division {string}', async function (nombre, apellido, email, nombreDivision) {
  const activeCoaches = await getActiveCoaches(this.token);
  const coach = activeCoaches.find(
    (member) =>
      member.firstName === nombre &&
      member.lastName === apellido &&
      member.email === email,
  );
  assert.ok(coach, `El coach ${nombre} ${apellido} (${email}) no está dado de alta en el club.`);

  const division = await findDivisionByName(this.club.id, nombreDivision, this.token);
  assert.ok(division, `No se encontró la division ${nombreDivision} en el club.`);

  this.response = await makeHttpRequest(
    "POST",
    "coaches",
    { divisionId: division.id, personId: coach.personId },
    this.token,
  );
});
