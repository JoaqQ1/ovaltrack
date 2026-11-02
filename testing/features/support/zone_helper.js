const BACKEND_URL = process.env.API_URL || 'http://backend:8080';

const MISSING_UUID = '00000000-0000-0000-0000-000000000000';

function authHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export function missingUuid() {
  return MISSING_UUID;
}

export function buildZonePayload({ row, col, period, startMinute, endMinute }) {
  return { row, col, period, startMinute, endMinute };
}

export function createZone(matchId, payload, token) {
  return fetch(`${BACKEND_URL}/matches/${matchId}/zones`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });
}

export function updateZone(matchId, zoneId, payload, token) {
  return fetch(`${BACKEND_URL}/matches/${matchId}/zones/${zoneId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });
}

export function deleteZone(matchId, zoneId, token) {
  return fetch(`${BACKEND_URL}/matches/${matchId}/zones/${zoneId}`, {
    method: 'DELETE',
    headers: authHeaders(token)
  });
}

export function listZones(matchId, token) {
  return fetch(`${BACKEND_URL}/matches/${matchId}/zones`, {
    method: 'GET',
    headers: authHeaders(token)
  });
}

export async function readJsonOrText(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
