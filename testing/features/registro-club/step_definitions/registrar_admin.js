import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";

const BACKEND_URL = process.env.API_URL || "http://backend:8080";

// ============================ Registro de Admin del Club ============================

Given(
  "que se completan los formularios de registro con los siguientes datos:",
  function (dataTable) {
    this.formulariosRegistro = dataTable.hashes();
  },
);

When(
  'presiono el botón "Guardar" para solicitar el registro de mi club',
  async function () {
    this.respuestasRegistro = [];

    for (const form of this.formulariosRegistro) {
      const adminData = {
        email: form.email,
        password: form.contrasenia,
        firstName: form.nombre,
        lastName: form.apellido,
        birthDate: form.fechaNacimiento,
        role: form.rol,
      };
      const clubData = {
        name: form.clubName,
        city: form.clubCity,
        contactEmail: form.clubEmailContact,
        contactPhone: form.clubPhoneContact,
      };
      const clubRegistrationDTO = {
        admin: adminData,
        club: clubData,
      };

      const response = await fetch(`${BACKEND_URL}/api/auth/register-club`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clubRegistrationDTO),
      });
      let responseJson = await response.json();
      this.respuestasRegistro.push(responseJson);
    }
  },
);
Then(
  "el sistema confirma el registro exitoso de todos los usuarios",
  function () {
    for (const res of this.respuestasRegistro) {
      assert.equal(res.status, 201);
      assert.equal(
        res.message,
        "Solicitud de registro creada con éxito. Pendiente de aprobación",
      );
    }
  },
);



// this.club = await fetch(`${BACKEND_URL}/club/${nombre}`)
