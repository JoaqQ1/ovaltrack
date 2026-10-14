import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";

const BACKEND_URL = process.env.API_URL || "http://backend:8080";

// ============================ Registro de Entrenador / Analista del Club ============================

Given(
  `el usuario con {string} {string} {string} {string} {string} {string} {string} {string}`,
  async function (
    firstName,
    lastName,
    email,
    password,
    birthDate,
    requestedRole,
    clubName,
    clubCity,
  ) {
    this.coach = { firstName, lastName, email, password, birthDate, requestedRole };
    const response = await fetch(`${BACKEND_URL}/club/search/${clubName}`);
    let json = await response.json();
    this.club = json.data[0];
  },
);

When("se presiona el botón Enviar solicitud de acceso", async function () {
  const member = { ...this.coach };
  const club = { ...this.club };
  const memberRegistrationDTO = {
    applicant: member,
    club: club,
  };
  console.log(memberRegistrationDTO)

  const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(memberRegistrationDTO),
  });
  this.response = await response.json();
  console.log(this.response)
});

Then(
  `se espera el siguiente {int} con la {string}`,
  async function (status, response) {
    assert.strictEqual(this.response.status, status);
    assert.strictEqual(this.response.message, response);
  },
);
