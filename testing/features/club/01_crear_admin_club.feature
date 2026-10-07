# language: es
Característica: Creación de Administradores de Club
  Escenario: Registro de administradores base para los clubes
    Dado que se completan los formularios de registro con los siguientes datos:
      | nombre  | apellido | email                   | contrasenia    | fechaNacimiento | rol        | clubName   | clubCity      | clubEmailContact | clubPhoneContact  |
      | Admin   | Puerto   | admin_puerto@test.com   | PassSegura123! | 1980-01-01      | ADMIN_CLUB | PMRC       | Puerto Madryn | pmrc@gmail.com   | +542804010203     |
      | Admin   | Multi    | admin_multiclub@test.com| PassSegura123! | 1980-01-01      | ADMIN_CLUB | TRC        | Trelew        | trc@gmail.com    | +542804010204     |
    Cuando presiono el botón "Guardar" para registrar a cada usuario
    Entonces el sistema confirma el registro exitoso de todos los usuarios
