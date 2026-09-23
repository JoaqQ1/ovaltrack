import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';

const BACKEND_URL = process.env.API_URL || 'http://backend:8080';

Given('que se completan los formularios de registro con los siguientes datos:', function (dataTable) {
  this.formulariosRegistro = dataTable.hashes();
});

When('presiono el botón "Guardar" para registrar a cada usuario', async function () {
  this.respuestasRegistro = [];

  for (const form of this.formulariosRegistro) {
    // Intentar obtener el clubId del club creado previamente
    let clubId = null;
    const adminLoginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin_puerto@test.com', password: 'PassSegura123!' })
    });
    if (adminLoginRes.ok) {
      const adminToken = (await adminLoginRes.json()).token;
      const myClubRes = await fetch(`${BACKEND_URL}/club/my-club`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (myClubRes.ok) {
        clubId = (await myClubRes.json()).id;
      }
    }

    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email,
        password: form.contrasenia,
        firstName: form.nombre,
        lastName: form.apellido,
        birthDate: form.fechaNacimiento,
        role: form.rol,
        clubId: clubId
      })
    });

    let body = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    this.respuestasRegistro.push({
      status: response.status,
      body,
      email: form.email
    });
  }
});

Then('el sistema confirma el registro exitoso de todos los usuarios', function () {
  for (const res of this.respuestasRegistro) {
    assert.equal(
      res.status,
      201,
      `Se esperaba confirmación de registro (código 201) para ${res.email}, pero se obtuvo ${res.status}`
    );
  }
});

Then('los usuarios quedan registrados en el sistema', function () {
  for (const res of this.respuestasRegistro) {
    assert.ok(res.body, `El usuario ${res.email} no recibió cuerpo de respuesta`);
    assert.equal(
      typeof res.body.token,
      'string',
      `El usuario ${res.email} debe poseer un token válido generado por el sistema`
    );
  }
});

Then('el administrador {string} puede ver a todos en su lista de miembros del club', async function (adminEmail) {
  const adminLoginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: 'PassSegura123!' })
  });
  assert.ok(adminLoginRes.ok, 'No se pudo iniciar sesión como administrador');
  const adminToken = (await adminLoginRes.json()).token;

  const membersRes = await fetch(`${BACKEND_URL}/club/my-club/members`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert.ok(membersRes.ok, 'No se pudo obtener la lista de miembros del club');
  
  const members = await membersRes.json();
  const membersEmails = members.map(m => m.email);

  for (const form of this.formulariosRegistro) {
    assert.ok(
      membersEmails.includes(form.email),
      `El usuario ${form.email} no aparece en la lista de miembros del club del administrador ${adminEmail}`
    );
  }
});
