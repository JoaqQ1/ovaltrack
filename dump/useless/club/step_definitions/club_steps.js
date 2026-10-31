import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';

const BACKEND_URL = process.env.API_URL || 'http://backend:8080';

// Función auxiliar para obtener el ID de usuario mediante login (o buscar en tabla)
async function getUserIdByEmail(email) {
    const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: 'PassSegura123!' })
    });
    const loginBody = await loginRes.json();
    const token = loginBody.token;

    const usersRes = await fetch(`${BACKEND_URL}/user`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const users = await usersRes.json();
    const targetUser = users.find(u => (u.email || u.loginEmail) === email);
    
    return { token, userId: targetUser?.id };
}

Given('que existe un club previamente registrado con los siguientes datos:', async function (dataTable) {
    const clubData = dataTable.hashes()[0];
    const email = clubData.administrador;
    
    const { token, userId } = await getUserIdByEmail(email);
    assert.ok(userId, `No se pudo encontrar al usuario ${email}`);

    const res = await fetch(`${BACKEND_URL}/club`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            name: clubData.nombre,
            city: clubData.ciudad,
            adminUserId: userId
        })
    });
    assert.equal(res.status, 200, `No se pudo crear el club inicial para ${email}`);
});

When('completo el formulario de creación de club con los siguientes datos:', async function (dataTable) {
    const clubData = dataTable.hashes()[0];
    const adminEmail = clubData.administrador;
    
    const { token, userId } = await getUserIdByEmail(adminEmail);
    assert.ok(userId, `No se pudo encontrar al usuario ${adminEmail}`);

    this.creationToken = token;
    this.clubPayload = {
        name: clubData.nombre,
        city: clubData.ciudad,
        adminUserId: userId
    };
});

When('presiono el botón "Guardar Club"', async function () {
    this.lastResponse = await fetch(`${BACKEND_URL}/club`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.creationToken}`
        },
        body: JSON.stringify(this.clubPayload)
    });

    const text = await this.lastResponse.text();
    try {
        this.lastResponseBody = JSON.parse(text);
    } catch {
        this.lastResponseBody = text;
    }
});

Then('el sistema confirma la creación exitosa del club', function () {
    assert.equal(this.lastResponse.status, 200, `Se esperaba código 200 pero devolvió ${this.lastResponse.status}`);
});

