const BACKEND_URL = process.env.API_URL || 'http://backend:8080';

export async function makeHttpRequest(method, path, data = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BACKEND_URL}/${path}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, ...body };
}
