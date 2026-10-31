const BACKEND_URL = process.env.API_URL || 'http://backend:8080';

export async function getUserToken(email, password = 'PassSegura123!') {
  const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!loginRes.ok) return null;
  const body = await loginRes.json();
  return body.token;
}

export async function getAdminToken() {
  return getUserToken('admin@club.com', 'administrador');
}
