import { Given, When } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { findClubMember } from "../../support/club_helper.js";
import { createSentInvitation } from "../../support/db_helper.js";
import { makeHttpRequest } from "../../support/httpRequest.js";
import { findDivisionId } from "../../support/match_helper.js";

// El "Dado que el administrador del club ... ha iniciado sesión" está definido en support/common_steps.js

// <==================== Helpers ====================>

const getClubDivisions = async (clubId, token) => {
  const response = await makeHttpRequest("GET", `division?clubId=${clubId}`, null, token);
  assert.equal(response.status, 200, "No se pudieron obtener las divisiones del club");
  return response.body;
};

const getDivisionPlayers = async (divisionId, token) => {
  const response = await makeHttpRequest("GET", `players/with-user?divisionId=${divisionId}`, null, token);
  assert.equal(response.status, 200, `No se pudieron obtener los jugadores de la division ${divisionId}`);
  return response.body;
};

// <==================== Listar jugadores ====================>

Given('lista a los jugadores', async function () {
  const divisions = await getClubDivisions(this.club.id, this.token);
  const playersByDivision = await Promise.all(
    divisions.map((division) => getDivisionPlayers(division.id, this.token)),
  );
  this.players = playersByDivision.flat();
});

// <==================== Invitar jugador ====================>

When('invita al jugador {string} {string} {string} {string} a crearse una cuenta', async function (nombre, apellido, email, fechaNacimiento) {
  const player = this.players.find(
    (p) =>
      p.firstName === nombre &&
      p.lastName === apellido &&
      p.contactEmail === email &&
      p.birthDate === fechaNacimiento,
  );
  assert.ok(player, `No se encontró al jugador ${nombre} ${apellido} (${email}) en las divisiones del club.`);

  this.response = await makeHttpRequest(
    "POST",
    "api/invitation/invite",
    { divisionId: player.divisionId, personId: player.personId },
    this.token,
  );
});

// <==================== Invitaciones no permitidas ====================>

Given('que el jugador con email {string} ya fue invitado a la division {string}', async function (email, nombreDivision) {
  const divisionId = await findDivisionId(nombreDivision, this.token);
  await createSentInvitation(email, divisionId);
});

When('invita a la persona con email {string} a la division {string}', async function (email, nombreDivision) {
  const member = await findClubMember(email, this.token);
  const divisionId = await findDivisionId(nombreDivision, this.token);
  this.response = await makeHttpRequest(
    "POST",
    "api/invitation/invite",
    { divisionId, personId: member.personId },
    this.token,
  );
});
