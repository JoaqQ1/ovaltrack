# language: es
Característica: Registro de nuevos jugadores en la division de un club
Como administrador de club o coach
Quiero registrar nuevas personas y usuarios en la plataforma
Para que formen parte del club y puedan acceder al sistema

Esquema del escenario: Administrador de club intenta registrar jugadores en una division
Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
Cuando intenta asignar al jugador "<nombre>" "<apellido>" "<email>" "<telefono>" "<fechaNacimiento>"  en la posicion "<posicion>" de la division "<nombreDivision>"
Entonces el sistema responde con <estadoCodigo>
Ejemplos: Alta de jugadores en una division
| nombre       | apellido | email                 | telefono | fechaNacimiento | posicion      | nombreDivision | estadoCodigo |
| Blue         | Album    | jugador.uno@test.com  | 12345678 | 1985-03-15      | Pilar         | Primera        | 200          |
| Art          | Angels   | jugador.dos@test.com  | 23456789 | 1988-10-26      | Tercera línea | Primera        | 200          |
| HOME         | SIAMES   | jugador.tres@test.com | 34567890 | 2020-03-16      | Centro        | Primera        | 200          |
| Melodramatic | SIAMES   | otro.jugador@test.com | 45678901 | 1993-09-21      | Ala           | Primera        | 200          |

Esquema del escenario: Coach intenta registrar jugadores en una division
Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
Cuando intenta asignar al jugador "<nombre>" "<apellido>" "<email>" "<telefono>" "<fechaNacimiento>"  en la posicion "<posicion>" de la division "<nombreDivision>"
Entonces el sistema responde con <estadoCodigo>
Ejemplos: Alta de jugadores en una division
| nombre     | apellido  | email                      | telefono | fechaNacimiento | posicion      | nombreDivision | estadoCodigo |
| ...Like    | Clockwork | jugador.cuatro@test.com    | 56789012 | 1985-03-15      | Delantero     | Primera        | 200          |
| Imaginal   | Disk      | jugador.cinco@test.com     | 67890123 | 1988-10-26      | Fullback      | Primera        | 200          |
| InTimes    | NewRoman  | jugador.seis@test.com      | 78901234 | 2018-03-16      | Trasero       | Primera        | 200          |
| Mercurial  | World     | jugador.siete@test.com     | 89012345 | 1993-09-21      | idk           | Primera        | 200          |
| BounceInto | TheMusic  | jugador.ocho@test.com      | 90123456 | 1993-09-21      | Hat Trick     | Primera        | 200          |
| Nueve      | Plantel   | jugador.nueve@test.com     | 60000001 | 1994-01-10      | Hooker        | Primera        | 200          |
| Diez       | Plantel   | jugador.diez@test.com      | 60000002 | 1995-02-11      | Segunda línea | Primera        | 200          |
| Once       | Plantel   | jugador.once@test.com      | 60000003 | 1996-03-12      | Segunda línea | Primera        | 200          |
| Doce       | Plantel   | jugador.doce@test.com      | 60000004 | 1997-04-13      | Medio scrum   | Primera        | 200          |
| Trece      | Plantel   | jugador.trece@test.com     | 60000005 | 1998-05-14      | Apertura      | Primera        | 200          |
| Catorce    | Plantel   | jugador.catorce@test.com   | 60000006 | 1999-06-15      | Wing          | Primera        | 200          |
| Quince     | Plantel   | jugador.quince@test.com    | 60000007 | 2000-07-16      | Wing          | Primera        | 200          |
| Dieciseis  | Plantel   | jugador.dieciseis@test.com | 60000008 | 2001-08-17      | Pilar         | Primera        | 200          |

Esquema del escenario: Coach intenta registrar jugadores con datos invalidos
Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
Cuando intenta asignar al jugador "<nombre>" "<apellido>" "<email>" "<telefono>" "<fechaNacimiento>"  en la posicion "<posicion>" de la division "<nombreDivision>"
Entonces el sistema responde con <estadoCodigo> y "<estadoTexto>"
Ejemplos:
| nombre      | apellido      | email                   | telefono | fechaNacimiento | posicion  | nombreDivision | estadoCodigo | estadoTexto                                                                              |
|             | apellidofalso | jugador.cuatro@test.com | 11111111 | 1985-03-15      | Delantero | Primera        | 409          | Debe seleccionar una persona existente o ingresar nombre y apellido para crear una nueva |
| nombrefalso |               | jugador.cinco@test.com  | 22222222 | 1988-10-26      | Fullback  | Primera        | 409          | Debe seleccionar una persona existente o ingresar nombre y apellido para crear una nueva |
| InTimes     | NewRoman      | jugador.seis@test.com   | 33333333 |                 | Trasero   | Primera        | 409          | La fecha de nacimiento es requerida.                                                     |
| Mercurial   | World         | jugador.oven@test.com   | 44444444 | 1993-09-21      | idk       |                | 409          | El ID de la division es obligatorio                                                      |
| BounceInto  | TheMusic      | jugador.pepe@test.com   | 55555555 | 1993-09-21      |           | Primera        | 409          | La posicion del jugador es obligatoria                                                   |
| apellido    | nombre        | jugador.camilo@test.com | 12345678 | 1993-09-21      | Waterboy  | Primera        | 409          | Teléfono ya registrado                                                                   |
| BounceInto  | TheMusic      | jugador.uno@test.com    | 12345678 | 1993-09-21      | Waterboy  | Primera        | 409          | Email ya registrado                                                                      |

Esquema del escenario: Coach intenta registrar jugadores menores de edad en una division
Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
Cuando intenta asignar al jugador menor de edad "<nombre>" "<apellido>" "<email>" "<telefono>" "<fechaNacimiento>"  en la posicion "<posicion>" de la division "<nombreDivision>"
Entonces el sistema responde con <estadoCodigo> y "<estadoTexto>"
Ejemplos:
| nombre   | apellido  | email                       | telefono | fechaNacimiento | posicion  | nombreDivision | estadoCodigo | estadoTexto                                                            |
| jugador  | menoredad |                             |          | 2019-03-15      | Delantero | Primera        | 409          | La persona es menor de edad, se requieren metodos de contacto validos. |
| Imaginal | Disk      |                             | 22222222 | 2021-10-26      | Fullback  | Primera        | 409          | La persona es menor de edad, se requieren metodos de contacto validos. |
| InTimes  | NewRoman  | jugador.quinientos@test.com |          | 2022-03-16      | Trasero   | Primera        | 409          | La persona es menor de edad, se requieren metodos de contacto validos. |
