import { When } from "@cucumber/cucumber";
import { makeHttpRequest } from "../../support/httpRequest.js";

// El "Dado que el administrador del club ... ha iniciado sesión" y el
// "Entonces el sistema responde con {int}" están definidos en support/common_steps.js

// <==================== Alta de oponentes ====================>

When('intenta crear al rival {string} \\({string}) de la ciudad {string}', async function (nombreClub, aliasClub, ciudadClub) {
  this.response = await makeHttpRequest(
    "POST",
    "opponents",
    { name: nombreClub, alias: aliasClub, city: ciudadClub },
    this.token,
  );
});
