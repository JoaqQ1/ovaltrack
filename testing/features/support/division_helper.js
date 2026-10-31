const BACKEND_URL = process.env.API_URL || 'http://backend:8080';

const divisionCache = new Map();

export async function findDivisionIdByName(name, token) {
  if (divisionCache.has(name)) {
    return divisionCache.get(name);
  }

  const myClubRes = await fetch(`${BACKEND_URL}/club/my-club`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (myClubRes.ok) {
    const club = await myClubRes.json();
    const divRes = await fetch(`${BACKEND_URL}/division?clubId=${club.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (divRes.ok) {
      const divisions = await divRes.json();
      const target = divisions.find(d => d.name === name);
      if (target) {
        divisionCache.set(name, target.id);
        return target.id;
      }
    }
  }

  return null;
}

export function clearDivisionCache() {
  divisionCache.clear();
}
