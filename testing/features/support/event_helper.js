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
