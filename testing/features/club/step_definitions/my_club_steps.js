// import { When, Then } from '@cucumber/cucumber';
// import assert from 'node:assert/strict';

// const BACKEND_URL = process.env.API_URL || 'http://backend:8080';

// import { Given } from '@cucumber/cucumber';

// Given('que existe un administrador de club con email {string} y contraseña {string}', async function (email, password) {
//     // Attempt to register the user
//     this.adminEmail = email;
//     this.adminPassword = password;
//     const registerResponse = await fetch(`${BACKEND_URL}/api/auth/register`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//             email,
//             password,
//             firstName: 'Admin',
//             lastName: 'Test',
//             birthDate: '1980-01-01',
//             role: 'ADMIN_CLUB'
//         })
//     });
//     // We ignore if it already exists (409) because we just want to ensure it exists
//     const body = await registerResponse.json();
//     if (registerResponse.ok) {
//         this.adminId = body.id; // Or wherever it returns it, but we can just login next
//     }
// });

// Given('que dicho administrador tiene registrado el club {string}', async function (clubName) {
//     // Login to get token to create club
//     const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email: this.adminEmail, password: this.adminPassword })
//     });
//     const loginBody = await loginRes.json();
//     const token = loginBody.token;
    
//     // Check if club exists first
//     const checkRes = await fetch(`${BACKEND_URL}/api/club/my-club`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//     });
    
//     if (checkRes.status === 404) {
//         // Needs to fetch users to get admin user ID? Yes, club creation requires adminUserId
//         const usersRes = await fetch(`${BACKEND_URL}/user`, {
//             headers: { 'Authorization': `Bearer ${token}` }
//         });
//         const users = await usersRes.json();
//         const targetUser = users.find(u => (u.email || u.loginEmail) === this.adminEmail);
        
//         await fetch(`${BACKEND_URL}/api/club`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${token}`
//             },
//             body: JSON.stringify({
//                 name: clubName,
//                 city: 'Test City',
//                 contactEmail: this.adminEmail,
//                 adminUserId: targetUser.id
//             })
//         });
//     }
// });

// When('consulto la información de mi club', async function () {
//     this.lastResponse = await fetch(`${BACKEND_URL}/api/club/my-club`, {
//         headers: { 'Authorization': `Bearer ${this.token}` }
//     });
//     this.lastResponseBody = await this.lastResponse.json();
// });

// Then('la respuesta debe contener el nombre {string}', function (nombreEsperado) {
//     assert.equal(this.lastResponseBody.name, nombreEsperado);
// });

// When('actualizo la información de mi club con la ciudad {string} y el email {string}', async function (nuevaCiudad, nuevoEmail) {
//     const miClubResponse = await fetch(`${BACKEND_URL}/api/club/my-club`, {
//         headers: { 'Authorization': `Bearer ${this.token}` }
//     });
//     const data = await miClubResponse.json();
//     const clubId = data.id;

//     this.lastResponse = await fetch(`${BACKEND_URL}/api/club/${clubId}`, {
//         method: 'PUT',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${this.token}`
//         },
//         body: JSON.stringify({
//             name: data.name,
//             city: nuevaCiudad,
//             contactEmail: nuevoEmail,
//             logoUrl: data.logoUrl,
//             contactPhone: data.contactPhone
//         })
//     });
//     this.lastResponseBody = await this.lastResponse.json();
// });

// Then('la respuesta debe tener el código {int}', function (statusCode) {
//     assert.equal(this.lastResponse.status, statusCode);
// });

// Then('la respuesta debe reflejar los cambios realizados', function () {
//     assert.equal(this.lastResponseBody.city, "Nueva Ciudad");
//     assert.equal(this.lastResponseBody.contactEmail, "contacto@club.com");
// });

// Then('la base de datos debe almacenar la ciudad {string} para mi club', async function (ciudadEsperada) {
//     const checkResponse = await fetch(`${BACKEND_URL}/api/club/my-club`, {
//         headers: { 'Authorization': `Bearer ${this.token}` }
//     });
//     const checkBody = await checkResponse.json();
//     assert.equal(checkBody.city, ciudadEsperada);
// });

// When('actualizo la información de mi club con un nombre vacío', async function () {
//     const miClubResponse = await fetch(`${BACKEND_URL}/api/club/my-club`, {
//         headers: { 'Authorization': `Bearer ${this.token}` }
//     });
//     const data = await miClubResponse.json();
//     const clubId = data.id;

//     this.lastResponse = await fetch(`${BACKEND_URL}/api/club/${clubId}`, {
//         method: 'PUT',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${this.token}`
//         },
//         body: JSON.stringify({
//             name: "", // empty name
//             city: "Otra Ciudad",
//             contactEmail: "otro@club.com"
//         })
//     });
    
//     try {
//         this.lastResponseBody = await this.lastResponse.json();
//     } catch {
//         this.lastResponseBody = await this.lastResponse.text();
//     }
// });

// Then('la respuesta debe indicar que el nombre es obligatorio', function () {
//     const errorMessage = typeof this.lastResponseBody === 'string' 
//         ? this.lastResponseBody 
//         : (this.lastResponseBody.message || JSON.stringify(this.lastResponseBody));
//     assert.ok(errorMessage.includes("El nombre del club es obligatorio"), "Mensaje de error incorrecto o ausente");
// });
