import { When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import {getUserToken } from '../../support/auth_helper.js';
import { makeHttpRequest } from '../../support/httpRequest.js';

//Given ('que el administrador del club con email {string} y contraseña {string} ha iniciado sesión') en common_steps.js

When('intenta crear la division con nombre {string}, categoria {string} y genero {string}', async function (nombreDivision, categoriaDivision, generoDivision) {
  const division = {
    name: nombreDivision || null,
    ageCategory: categoriaDivision || null,
    gender: generoDivision || null,
    clubId: this.club.id,
  };
  
  this.response = await makeHttpRequest(
    "POST",
    `division`,
    division,
    this.token,
  );
});

When('intenta crear la division con nombre {string}, categoria {string} y genero {string} en el club que tiene el email {string}', 
  async function (nombreDivision, categoriaDivision, generoDivision, emailOtroClub) {
  const otroToken = await getUserToken(emailOtroClub, 'PassSegura123!');
  assert.ok(otroToken, `Fallo de inicio de sesión para ${emailOtroClub}`);

  const otroClubResponse = await makeHttpRequest('GET', `club/my-club`, null, otroToken)
  assert.equal(otroClubResponse.status, 200, `No se pudo obtener el club de ${emailOtroClub}`);
  const otroClub = otroClubResponse.body;

  const division = {
    name: nombreDivision || null,
    ageCategory: categoriaDivision || null,
    gender: generoDivision || null,
    clubId: otroClub.id,
  };

  this.response = await makeHttpRequest('POST', `division`, division, this.token);

});

//Then (el sistema responde con <estadoCodigo>) en common_steps.js 
//Then (el sistema responde con <estadoCodigo> y "<estadoTexto>") en common_steps.js
