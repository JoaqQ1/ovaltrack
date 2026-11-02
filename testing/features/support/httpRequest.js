const BACKEND_URL = process.env.API_URL || 'http://backend:8080';

/**
 * Devuelve { status, body }: body es el JSON de la respuesta (un DTO, una lista
 * o { message }), el texto plano si no es JSON, o null si viene vacía.
 */
export async function makeHttpRequest(method, path, data = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BACKEND_URL}/${path}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });
  return { status: res.status, body: await readBody(res) };
}

async function readBody(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
