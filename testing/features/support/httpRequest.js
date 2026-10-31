const BACKEND_URL = process.env.API_URL || 'http://backend:8080';

export async function makeHttpRequest(method, path, data = null) {
  const res = await fetch(`${BACKEND_URL}/${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, ...body };
}
