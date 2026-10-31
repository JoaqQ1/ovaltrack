import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { getUserToken } from "../../support/auth_helper.js";
import { makeHttpRequest } from "../../support/httpRequest.js";

const EMAIL_OVALTRACK = process.env.OVALTRACK_BOOTSTRAP_ADMIN_EMAIL;
const PASS_OVALTRACK = process.env.OVALTRACK_BOOTSTRAP_ADMIN_PASSWORD;
let TOKEN = "";
// <==================== Helpers ====================>

const getTokenOvaltrack = async () => {
  if (TOKEN !== "") return TOKEN;
  TOKEN = await getUserToken(EMAIL_OVALTRACK, PASS_OVALTRACK);
  return TOKEN;
};

const getUsersRequestsPending = async () => {
  const token = await getTokenOvaltrack();
  return makeHttpRequest("GET", "api/admin/ovaltrack/users/pending", null, token);
};

const getClubRequestsPendind = async () => {
  const token = await getTokenOvaltrack();
  return makeHttpRequest("GET", "api/admin/ovaltrack/clubs/pending", null, token);
};
// <==================== Listar solicitudes pendientes ====================>

Given('que el admin de OvalTrack entra en el panel de administrador', function () {
  return true;
});

When('visualiza la lista de usuarios pendientes',   async function () {
    this.response = await getUsersRequestsPending();
    assert.equal(this.response.status, 200);
  },
);

// Campos generados por el backend: se verifica que existan, pero no su valor
const GENERATED_FIELDS = {
  user: ["id", "personId", "createdAt"],
  club: ["id", "adminUserId"],
};

const withoutGeneratedFields = (section, fields) =>
  Object.fromEntries(
    Object.entries(section).filter(([key]) => !fields.includes(key)),
  );

Then('el sistema devuelve los datos de las solicitudes pendientes', function (docString) {
  const expectedRequests = JSON.parse(docString);
  const pendingRequests = this.response.data;

  for (const expected of expectedRequests) {
    const found = pendingRequests.find(
      (item) =>
        item.user?.email === expected.user.email &&
        item.club?.name === expected.club.name,
    );
    assert.ok(
      found,
      `No se encontró una solicitud pendiente para ${expected.user.email} con el club ${expected.club.name}.`,
    );

    for (const section of ["user", "club"]) {
      for (const field of GENERATED_FIELDS[section]) {
        assert.ok(found[section][field], `Falta ${section}.${field} en la solicitud de ${expected.user.email}.`);
      }
      assert.deepStrictEqual(
        withoutGeneratedFields(found[section], GENERATED_FIELDS[section]),
        withoutGeneratedFields(expected[section], GENERATED_FIELDS[section]),
      );
    }
    assert.strictEqual(found.club.adminUserId, found.user.id);
  }
});


// <==================== Aprobar solicitudes pendientes ususarios admin ====================>

Given('que el usuario {string} {string} con mail {string} tiene una solicitud para darse de alta', async function (nombre, apellido, email) {
    const response = await getUsersRequestsPending();
    const requestAdminClub = response.data;
    this.userPending = requestAdminClub.find((u) => {
      return (
        u.user.firstName === nombre &&
        u.user.lastName === apellido &&
        u.user.email === email
      );
    });
    assert.ok(
      this.userPending,
      `No se encontró ninguna solicitud pendiente que coincida con los datos del usuario ${nombre} ${apellido} (${email}).`,
    );
});

When('se presiona el botón para aprobar su solicitud de usuario', async function () {
  const token = await getTokenOvaltrack();
  this.response = await makeHttpRequest(
    "POST",
    `api/admin/ovaltrack/users/${this.userPending.user.id}/approve`,
    null,
    token,
  );
});

Given('que existe una solicitud de aprobacion para el club {string} de la ciudad {string} con mail {string}', async function (nombreClub, ciudadClub, email) {
    const response = await getClubRequestsPendind();
    const requestAdminClub = response.data;

    this.clubPending = requestAdminClub.find((u) => {
      return (
        u.name === nombreClub &&
        u.city === ciudadClub &&
        u.contactEmail === email
      );
    });
    assert.ok(
      this.clubPending,
      `No se encontró ninguna solicitud pendiente que coincida con los datos del club ${nombreClub} ${ciudadClub} (${email}).`,
    );
});


When('se presiona el botón para aprobar su solicitud de club', async function () {
  const token = await getTokenOvaltrack();
  const params = new URLSearchParams({
    adminUserId: this.clubPending.adminUserId,
  });
  this.response = await makeHttpRequest(
    "POST",
    `api/admin/ovaltrack/clubs/${this.clubPending.id}/approve?${params}`,
    null,
    token,
  );
});
