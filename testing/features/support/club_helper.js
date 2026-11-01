import assert from 'node:assert/strict';
import { getOvalTrackAdminToken } from './auth_helper.js';
import { makeHttpRequest } from './httpRequest.js';

/** ID de un club activo por nombre, usando el listado público de registro. */
export async function findClubIdByName(nombreClub) {
  const response = await makeHttpRequest('GET', 'club/registration-options');
  assert.equal(response.status, 200, 'No se pudieron obtener los clubes');
  const club = response.body.find((c) => c.name === nombreClub);
  assert.ok(club, `No existe el club activo "${nombreClub}"`);
  return club.id;
}

/**
 * División de cualquier club por nombre. Se consulta como administrador de OvalTrack para poder
 * resolver divisiones ajenas al usuario del escenario (incluidas las desactivadas).
 */
export async function findDivisionByName(nombreClub, nombreDivision) {
  const clubId = await findClubIdByName(nombreClub);
  const response = await makeHttpRequest('GET', `division?clubId=${clubId}`, null, await getOvalTrackAdminToken());
  assert.equal(response.status, 200, `No se pudieron obtener las divisiones de ${nombreClub}`);
  const division = response.body.find((d) => d.name === nombreDivision);
  assert.ok(division, `No existe la división "${nombreDivision}" en ${nombreClub}`);
  return division;
}

export async function getClubMembers(token) {
  const response = await makeHttpRequest('GET', 'club/my-club/members', null, token);
  assert.equal(response.status, 200, 'No se pudieron obtener los miembros del club');
  return response.body;
}

export async function findClubMember(email, token) {
  const member = (await getClubMembers(token)).find((m) => m.email === email);
  assert.ok(member, `La cuenta ${email} no pertenece al club`);
  return member;
}
