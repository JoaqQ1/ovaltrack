import { makeHttpRequest } from './httpRequest.js';

const divisionCache = new Map();

export async function findDivisionIdByName(name, token) {
  if (divisionCache.has(name)) {
    return divisionCache.get(name);
  }

  const myClub = await makeHttpRequest('GET', 'club/my-club', null, token);
  if (myClub.status !== 200) return null;
  const divisions = await makeHttpRequest('GET', `division?clubId=${myClub.body.id}`, null, token);
  if (divisions.status !== 200) return null;

  const target = divisions.body.find((d) => d.name === name);
  if (target) divisionCache.set(name, target.id);
  return target?.id ?? null;
}
