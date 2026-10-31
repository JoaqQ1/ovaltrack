import { Given, When } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { getUserToken } from "../../support/auth_helper.js";
import { makeHttpRequest } from "../../support/httpRequest.js";

// El "Dado que el administrador del club ... ha iniciado sesión" y los
// "Entonces el sistema responde con ..." están definidos en support/common_steps.js

// <==================== Helpers ====================>

const findDivisionByName = async (clubId, nombreDivision, token) => {
  if (!nombreDivision) return null;
  const response = await makeHttpRequest("GET", `division?clubId=${clubId}`, null, token);
  assert.equal(response.status, 200, "No se pudieron obtener las divisiones del club");
  return response.body.find((division) => division.name === nombreDivision) ?? null;
};

// Los campos vacíos del ejemplo se envían como null para que los valide el backend
const assignPlayerToDivision = async function (nombre, apellido, email, telefono, fechaNacimiento, posicion, nombreDivision) {
  const division = await findDivisionByName(this.club.id, nombreDivision, this.token);

  this.response = await makeHttpRequest(
    "POST",
    "players",
    {
      divisionId: division?.id ?? null,
      firstName: nombre || null,
      lastName: apellido || null,
      birthDate: fechaNacimiento || null,
      contactEmail: email || null,
      contactPhone: telefono || null,
      position: posicion || null,
    },
    this.token,
  );
};

// <==================== Inicio de sesión del coach ====================>

Given('que el coach con email {string} y contraseña {string} ha iniciado sesión', async function (email, contraseña) {
  this.token = await getUserToken(email, contraseña);
  assert.ok(this.token, `Fallo de inicio de sesión para el coach ${email}`);
  this.response = await makeHttpRequest("GET", "club/my-club", null, this.token);
  assert.equal(this.response.status, 200, `No se pudo obtener el club del coach ${email}`);
  this.club = this.response.body;
});

// <==================== Asignar jugadores a una division ====================>

When(
  'intenta asignar al jugador {string} {string} {string} {string} {string}  en la posicion {string} de la division {string}',
  assignPlayerToDivision,
);

When(
  'intenta asignar al jugador menor de edad {string} {string} {string} {string} {string}  en la posicion {string} de la division {string}',
  assignPlayerToDivision,
);
