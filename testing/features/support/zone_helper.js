import { makeHttpRequest } from './httpRequest.js';

const zonesPath = (matchId) => `matches/${matchId}/zones`;

export function createZone(matchId, zone, token) {
  return makeHttpRequest('POST', zonesPath(matchId), zone, token);
}

export function updateZone(matchId, zoneId, zone, token) {
  return makeHttpRequest('PUT', `${zonesPath(matchId)}/${zoneId}`, zone, token);
}

export function deleteZone(matchId, zoneId, token) {
  return makeHttpRequest('DELETE', `${zonesPath(matchId)}/${zoneId}`, null, token);
}

export function listZones(matchId, token) {
  return makeHttpRequest('GET', zonesPath(matchId), null, token);
}
