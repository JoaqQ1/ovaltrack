import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { getUserToken } from "../../support/auth_helper.js";

const BACKEND_URL = process.env.API_URL || "http://backend:8080";
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
  const response = await fetch(
    `${BACKEND_URL}/api/admin/ovaltrack/users/pending`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-type": "application/json",
      },
    },
  );
  return response;
};

const getClubRequestsPendind = async () => {
  const token = await getTokenOvaltrack();
  const response = await fetch(
    `${BACKEND_URL}/api/admin/ovaltrack/clubs/pending`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-type": "application/json",
      },
    },
  );
  return response;
};
// <==================== Listar solicitudes pendientes ====================>

Given(
  `que el usuario Admin entra en el panel de administrador`,
  async function () {
    const response = await getUsersRequestsPending();
    this.response = await response.json();
  },
);
When(
  `visualiza la lista de pendientes y ve los resultados`,
  async function () {},
);

Then(`obtiene estos datos`, async function (dataTable) {
  // 1. Obtenemos el JSON estructurado del DocString
  const expectedRaw = JSON.parse(dataTable);
  const actualSubset = this.response.data.map((item) => ({
    user: {
      email: item.user?.email,
      role: item.user?.role,
      active: item.user?.active,
      firstName: item.user?.firstName,
      lastName: item.user?.lastName,
    },
    club: {
      name: item.club?.name,
      status: item.club?.status,
      city: item.club?.city,
      contactEmail: item.club?.contactEmail,
      contactPhone: item.club?.contactPhone,
    },
  }));
  const expectedSubset = expectedRaw.map((item) => ({
    user: {
      email: item.user?.email,
      role: item.user?.role,
      active: item.user?.active,
      firstName: item.user?.firstName,
      lastName: item.user?.lastName,
    },
    club: {
      name: item.club?.name,
      status: item.club?.status,
      city: item.club?.city,
      contactEmail: item.club?.contactEmail,
      contactPhone: item.club?.contactPhone,
    },
  }));

  for (const expectedItem of expectedSubset) {
    const found = actualSubset.find(
      (actualItem) =>
        actualItem.club.name === expectedItem.club.name &&
        actualItem.user.email === expectedItem.user.email,
    );
    assert.deepStrictEqual(found, expectedItem);
  }
});

// <==================== Aprobar solicitudes pendientes ususarios admin ====================>

Given(
  `el usuario con {string} {string} {string} {string} {string} {string} {string} {string} {string}`,
  async function (
    firstName,
    lastname,
    email,
    birthDate,
    requestedRole,
    clubName,
    clubCity,
    clubContactEmail,
    clubContactPhone,
  ) {
    const response = await getUsersRequestsPending();
    const responseJson = await response.json();
    const requestAdminClub = responseJson.data;

    this.userPending = requestAdminClub.find((u) => {
      return (
        u.user.firstName === firstName &&
        u.user.lastName === lastname &&
        u.user.email === email &&
        u.user.role === requestedRole &&
        u.club.name === clubName &&
        u.club.city === clubCity &&
        u.club.contactEmail === clubContactEmail &&
        u.club.contactPhone === clubContactPhone
      );
    });
    assert.ok(
      this.userPending,
      `No se encontró ninguna solicitud pendiente que coincida con los datos del usuario ${firstName} ${lastname} (${email}) y el club ${clubName}.`,
    );
  },
);
When(`se presiona el botón Aprobar solicitud`, async function () {
  const token = await getTokenOvaltrack();
  const response = await fetch(
    `${BACKEND_URL}/api/admin/ovaltrack/users/${this.userPending.user.id}/approve`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-type": "application/json",
      },
    },
  );
  this.response = await response.json();
});
Then(
  `se espera el siguiente {int} con la {string} del admin del club`,
  async function (status, message) {
    assert.strictEqual(this.response.status, status);
    assert.strictEqual(this.response.message, message);
  },
);

// <==================== Listar solicitudes pendientes de clubes ====================>

Given(
  `que el administrador del sistema entra a la aplicacion`,
  async function () {
    const response = await getClubRequestsPendind();
    this.response = await response.json();
  },
);
Then(
  `visualiza las solicitudes de clubes que se encuentran pendientes de aprobación`,
  async function () {},
);
When(`puede validar o rechazar las solicitudes`, async function (dataTable) {
  const expectedRaw = JSON.parse(dataTable);

  const actualSubset = this.response.data.map((item) => ({
    club: {
      name: item?.name,
      status: item?.status,
      city: item?.city,
      contactEmail: item?.contactEmail,
      contactPhone: item?.contactPhone,
    },
  }));
  const expectedSubset = expectedRaw.map((item) => ({
    club: {
      name: item?.name,
      status: item?.status,
      city: item?.city,
      contactEmail: item?.contactEmail,
      contactPhone: item?.contactPhone,
    },
  }));
  for (const expectedItem of expectedSubset) {
    const found = actualSubset.find(
      (item) => item.club.name === expectedItem.club.name,
    );
    assert.deepStrictEqual(found, expectedItem);
  }
});

// <==================== Aprobar solicitudes pendientes de clubs ====================>

Given(
  `el club con {string} {string} {string} {string} {string} {string}`,
  async function (
    name,
    clubStatus,
    emailAdmin,
    city,
    contactEmail,
    contactPhone,
  ) {
    const response = await getClubRequestsPendind();
    const responesJson = await response.json();
    const clubRequestsPendind = responesJson.data;
    this.clubRequest = clubRequestsPendind.find(
      (item) =>
        item.name === name &&
        item.status === clubStatus &&
        item.city === city &&
        item.contactEmail === contactEmail &&
        item.contactPhone === contactPhone,
    );
  },
);
Then(`se presiona el botón de Aprobar solicitud de club`, async function () {
  const token = await getTokenOvaltrack();
  const url = new URL(
    `${BACKEND_URL}/api/admin/ovaltrack/clubs/${this.clubRequest.id}/approve`,
  );
  const params = {
    adminUserId: this.clubRequest.adminUserId,
  };
  url.search = new URLSearchParams(params).toString();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-type": "application/json",
    },
  });
  const responesJson = await response.json();
  this.response = responesJson;
});
When(`se obtiene un {int} con una {string}`, async function (status, message) {
  assert.strictEqual(this.response.status, status);
  assert.strictEqual(this.response.message, message);
});
