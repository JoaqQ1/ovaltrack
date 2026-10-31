import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { makeHttpRequest } from "../../support/httpRequest.js";

// El "Dado que el administrador del club ... ha iniciado sesión" y el
// "Entonces el sistema responde con {int}" están definidos en support/common_steps.js

// <==================== Helpers ====================>

// Campos generados por el backend: se verifica que existan, pero no su valor
const GENERATED_FIELDS = ["id", "personId", "createdAt"];

const withoutGeneratedFields = (user) =>
  Object.fromEntries(
    Object.entries(user).filter(([key]) => !GENERATED_FIELDS.includes(key)),
  );

// Coaches del club filtrados por estado: active=false son los pendientes, active=true los dados de alta
const getClubCoaches = async (token, active) => {
  const response = await makeHttpRequest("GET", "club/my-club/members", null, token);
  assert.equal(response.status, 200, "No se pudieron obtener los miembros del club");
  return response.body.filter(
    (member) => member.role === "COACH_ANALYST" && member.active === active,
  );
};

const getPendingCoaches = (token) => getClubCoaches(token, false);

const findCoach = (coaches, nombre, apellido, email) =>
  coaches.find(
    (coach) =>
      coach.firstName === nombre &&
      coach.lastName === apellido &&
      coach.email === email,
  );

// <==================== Listar coaches pendientes ====================>

When('visualiza la lista de coaches pendientes', async function () {
  this.pendingCoaches = await getPendingCoaches(this.token);
});

Then('el sistema devuelve los datos de los coaches por dar de alta', function (docString) {
  const expectedCoaches = JSON.parse(docString);

  for (const { user: expected } of expectedCoaches) {
    const found = this.pendingCoaches.find((coach) => coach.email === expected.email);
    assert.ok(found, `No se encontró una solicitud pendiente para el coach ${expected.email}.`);

    for (const field of GENERATED_FIELDS) {
      assert.ok(found[field], `Falta ${field} en la solicitud del coach ${expected.email}.`);
    }
    assert.deepStrictEqual(withoutGeneratedFields(found), withoutGeneratedFields(expected));
  }
});

// <==================== Aprobar coaches pendientes ====================>

Given('que existe una solicitud de aprobacion para el coach {string} {string} con mail {string}', async function (nombre, apellido, email) {
  const pendingCoaches = await getPendingCoaches(this.token);
  this.coachPending = findCoach(pendingCoaches, nombre, apellido, email);
  assert.ok(
    this.coachPending,
    `No se encontró ninguna solicitud pendiente que coincida con el coach ${nombre} ${apellido} (${email}).`,
  );
});

When('se presiona el botón para aprobar la solicitud del coach', async function () {
  this.response = await makeHttpRequest(
    "PATCH",
    `user/${this.coachPending.id}/activar`,
    null,
    this.token,
  );
});

// <==================== Revocar acceso de coaches ====================>

Given('que el coach {string} {string} con mail {string} esta asociado al club', async function (nombre, apellido, email) {
  const activeCoaches = await getClubCoaches(this.token, true);
  this.coachActive = findCoach(activeCoaches, nombre, apellido, email);
  assert.ok(
    this.coachActive,
    `El coach ${nombre} ${apellido} (${email}) no está dado de alta en el club.`,
  );
});

When('se presiona el botón para revocar el acceso del coach', async function () {
  this.response = await makeHttpRequest(
    "PATCH",
    `user/${this.coachActive.id}/baja`,
    null,
    this.token,
  );
});
