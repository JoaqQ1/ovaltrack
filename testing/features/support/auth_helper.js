import { makeHttpRequest } from './httpRequest.js';

export async function getUserToken(email, password = 'PassSegura123!') {
  const res = await makeHttpRequest('POST', 'api/auth/login', { email, password });
  if (res.status !== 200) return null;
  return res.body?.token ?? null;
}

export async function getAdminToken() {
  return getUserToken('admin@club.com', 'administrador');
}

/** Token del administrador de OvalTrack creado por el bootstrap (variables de entorno del contenedor). */
export async function getOvalTrackAdminToken() {
  return getUserToken(process.env.OVALTRACK_BOOTSTRAP_ADMIN_EMAIL, process.env.OVALTRACK_BOOTSTRAP_ADMIN_PASSWORD);
}
