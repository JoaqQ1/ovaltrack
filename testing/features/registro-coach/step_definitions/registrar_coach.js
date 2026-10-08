import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";

const BACKEND_URL = process.env.API_URL || "http://backend:8080";

// ============================ Registro de Entrenador / Analista del Club ============================

Given(
  `el usuario con {string} {string} {string} {string} {string} {string} {string} {string}`,
  async function (
    firstName,
    lastname,
    email,
    password,
    birthDate,
    role,
    clubName,
    clubCity,
  ) {
    this.coach = { firstName, lastname, email, password, birthDate, role };
    const response = await fetch(`${BACKEND_URL}/club/${clubName}/${clubCity}`);
    let json = await response.json();
    this.club = json.data;
  },
);

When("se presiona el botón Enviar solicitud de acceso", async function () {
  const member = { ...this.coach };
  const club = { ...this.club };
  const payload = {
    applicant: member,
    club: club,
  };

  const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  this.response = await response.json();
});

Then(
  `se espera el siguiente {int} con la {string}`,
  async function (status, response) {
    assert.strictEqual(this.response.status, status);
    assert.strictEqual(this.response.message, response);
  },
);
