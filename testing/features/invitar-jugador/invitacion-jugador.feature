# language: es
Característica: Panel de jugadores
Modulo responsable de ver los jugadores de la aplicacion e invitar a los jugadores a unirse a la aplicacion.

Esquema del escenario: Listar Jugadores
Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
Y lista a los jugadores
Cuando invita al jugador "<nombre>" "<apellido>" "<email>" "<fechaNacimiento>" a crearse una cuenta
Entonces el sistema responde con <estadoCodigo> y "<estadoTexto>"

Ejemplos:
| nombre       | apellido  | email                   | fechaNacimiento | estadoCodigo | estadoTexto                                                                 |
| Blue         | Album     | jugador.uno@test.com    | 1985-03-15      | 200          | Se envio correctamente el mail de invitación al jugador Blue Album          |
| Art          | Angels    | jugador.dos@test.com    | 1988-10-26      | 200          | Se envio correctamente el mail de invitación al jugador Art Angels          |
| HOME         | SIAMES    | jugador.tres@test.com   | 2020-03-16      | 200          | Se envio correctamente el mail de invitación al jugador HOME SIAMES         |
| Melodramatic | SIAMES    | otro.jugador@test.com   | 1993-09-21      | 200          | Se envio correctamente el mail de invitación al jugador Melodramatic SIAMES |
| ...Like      | Clockwork | jugador.cuatro@test.com | 1985-03-15      | 200          | Se envio correctamente el mail de invitación al jugador ...Like Clockwork   |
| Imaginal     | Disk      | jugador.cinco@test.com  | 1988-10-26      | 200          | Se envio correctamente el mail de invitación al jugador Imaginal Disk       |
| InTimes      | NewRoman  | jugador.seis@test.com   | 2018-03-16      | 200          | Se envio correctamente el mail de invitación al jugador InTimes NewRoman    |
| Mercurial    | World     | jugador.siete@test.com  | 1993-09-21      | 200          | Se envio correctamente el mail de invitación al jugador Mercurial World     |
| BounceInto   | TheMusic  | jugador.ocho@test.com   | 1993-09-21      | 200          | Se envio correctamente el mail de invitación al jugador BounceInto TheMusic |