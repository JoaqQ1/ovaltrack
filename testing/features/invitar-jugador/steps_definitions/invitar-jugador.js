import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";

// <=============== Helper ===============>
const getPlayer = async (player) => {
  // implement..
  throw new Error("Method not implemented");
};
const aprovedPlayer = async (player) => {
  // implement..
  throw new Error("Method not implemented");
};

// <============== Invitacion de jugador ==============>

Given(
  `que el administrador del club o el coach lista los jugadores`,
  async function () {
    // console.log("Invitacion a jugador")
    // console.log("Dado...")
  },
);
When(
  `hace foco en el jugador {string} {string} {string} {string} presiono la opcion de invitarlo`,
  async function (firstName, lastName, contactEmail, birthDate) {
    // console.log("Cuando...")
    const player = await getPlayer({
      firstName,
      lastName,
      contactEmail,
      birthDate,
    });
    const response = await aprovedPlayer(player);
    this.response = await response.json();
  },
);
Then(
  `se envia una invitacion correctamente y vuelve un {int} con un {string}`,
  async function (status, message) {

    // console.log("Entonces...")
    assert.strictEqual(this.response.status, status);
    assert.strictEqual(this.response.message, message);
  },
);
