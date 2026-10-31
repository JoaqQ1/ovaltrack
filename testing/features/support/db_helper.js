import pg from 'pg';
import bcrypt from 'bcryptjs';

async function query(sql, params) {
  const client = new pg.Client({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  await client.connect();
  try {
    return await client.query(sql, params);
  } finally {
    await client.end();
  }
}

/**
 * Crea la cuenta de jugador de una persona que ya existe, simulando la aceptacion de la invitacion por mail.
 *  No hace nada si la persona ya tiene cuenta.
 * Devuelve la cantidad de cuentas creadas (0 o 1).
 */
export async function createPlayerAccount(email, password) {
  const passwordHash = await bcrypt.hash(password, 10);
  const result = await query(
    `INSERT INTO users (id, login_email, password_hash, role, account_status, active, created_at, person_id)
     SELECT gen_random_uuid(), p.contact_email, $2, 'PLAYER', 'ACTIVE', true, now(), p.id
     FROM persons p
     WHERE p.contact_email = $1
     ON CONFLICT DO NOTHING`,
    [email, passwordHash],
  );
  return result.rowCount;
}

export async function personExists(email) {
  const result = await query('SELECT 1 FROM persons WHERE contact_email = $1', [email]);
  return result.rowCount > 0;
}
