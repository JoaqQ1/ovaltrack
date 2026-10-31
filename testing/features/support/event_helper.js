import assert from 'node:assert/strict';
import { makeHttpRequest } from './httpRequest.js';

const BACKEND_URL = process.env.API_URL || 'http://backend:8080';

const eventTypeCache = new Map();

export async function findEventTypeIdByName(name, token) {
  if (eventTypeCache.has(name)) {
    return eventTypeCache.get(name);
  }

  const res = await fetch(`${BACKEND_URL}/eventType`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (res.ok) {
    const types = await res.json();
    for (const t of types) {
      eventTypeCache.set(t.name, t.id);
    }
    if (eventTypeCache.has(name)) {
      return eventTypeCache.get(name);
    }
  }

  return null;
}

export function clearEventTypeCache() {
  eventTypeCache.clear();
}

export async function findEventType(tipoEvento, token) {
  const eventTypeId = await findEventTypeIdByName(tipoEvento, token);
  assert.ok(eventTypeId, `No se encontró el tipo de evento "${tipoEvento}"`);
  return eventTypeId;
}

// "zone=center;wasSuccessful=true" -> { zone: 'center', wasSuccessful: true }; vacío -> sin atributos
export function parseAttributes(text) {
  if (!text) return undefined;
  return Object.fromEntries(
    text.split(';').map((pair) => {
      const [key, value] = pair.split('=').map((part) => part.trim());
      if (value === 'true' || value === 'false') return [key, value === 'true'];
      return [key, Number.isNaN(Number(value)) ? value : Number(value)];
    }),
  );
}

export function registerEvent(token, event) {
  return makeHttpRequest('POST', 'event', { origin: 'live-capture', ...event }, token);
}
