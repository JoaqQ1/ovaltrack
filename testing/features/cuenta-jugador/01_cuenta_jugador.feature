# language: es
Característica: Cuentas de los jugadores invitados
Como jugador invitado a una división
Quiero tener mi cuenta creada y vinculada a mi persona
Para poder iniciar sesión en la aplicación

Esquema del escenario: El jugador invitado tiene su cuenta creada y puede iniciar sesión
Dado que el jugador con email "<email>" creó su cuenta con contraseña "PassSegura123!"
Cuando el jugador inicia sesión con email "<email>" y contraseña "PassSegura123!"
Entonces el sistema responde con 200
Y la cuenta tiene el rol "PLAYER"

Ejemplos: Jugadores de la división Primera
| email                 |
| jugador.uno@test.com  |
| jugador.dos@test.com  |
| jugador.tres@test.com |
| otro.jugador@test.com |
