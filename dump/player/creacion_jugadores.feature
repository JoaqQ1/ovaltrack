# language: es
Característica: Registro de nuevos jugadores
Esquema del escenario: Creacion de jugadores en un club
Dado que el usuario 
Quiero registrar nuevas personas y usuarios en la plataforma
Para que formen parte del club y puedan acceder al sistema

Escenario: Registro de usuarios y miembros del club
Dado que se completan los formularios de registro con los siguientes datos:
| nombre  | apellido | email                   | contrasenia    | fechaNacimiento | rol        |
| Marcelo | Gallardo | admin@club.com          | administrador  | 1970-04-26      | ADMIN_CLUB |
| Agustín | Creevy   | jugador.uno@test.com    | PassSegura123! | 1985-03-15      | PLAYER     |
| Nicolás | Sánchez  | jugador.dos@test.com    | PassSegura123! | 1988-10-26      | PLAYER     |
| Pablo   | Matera   | jugador.tres@test.com   | PassSegura123! | 1993-03-16      | PLAYER     |
| Gonzalo | Quesada  | usuario.norole@test.com | PassSegura123! | 1974-05-02      | NO_ROLE    |
| Facundo | Isa      | otro.jugador@test.com   | PassSegura123! | 1993-09-21      | PLAYER     |
Cuando presiono el botón "Guardar" para registrar a cada usuario
Entonces el sistema confirma el registro exitoso de todos los usuarios
Y los usuarios quedan registrados en el sistema
Y el administrador "admin_puerto@test.com" puede ver a todos en su lista de miembros del club


Característica: Creación de Administradores de Club
Esquema del escenario: Registro de administradores base para los clubes
Dado que el usuario completa el formulario de registro con los datos "<nombre>", "<apellido>", "<email>", "<contrasenia>", "<fechaNacimiento>", "<rol>", "<nombreClub>", "<ciudadClub>" y "<telefonoClub>"
Cuando presiona el boton "Guardar" para dar de alta su club
Entonces el sistema responde con <estadoCodigo> y "<estadoTexto>"
Ejemplos: Alta de clubes