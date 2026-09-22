# language: es
Característica: Creación de Administradores de Club
  Escenario: Registro de administradores base para los clubes
    Dado que se completan los formularios de registro con los siguientes datos:
      | nombre  | apellido | email                   | contrasenia    | fechaNacimiento | rol        |
      | Admin   | Puerto   | admin_puerto@test.com   | PassSegura123! | 1980-01-01      | ADMIN_CLUB |
      | Admin   | Multi    | admin_multiclub@test.com| PassSegura123! | 1980-01-01      | ADMIN_CLUB |
    Cuando presiono el botón "Guardar" para registrar a cada usuario
    Entonces el sistema confirma el registro exitoso de todos los usuarios
