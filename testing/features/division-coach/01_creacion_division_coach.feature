# language: es
Característica: Asociacion de coach en la division de un club
Como administrador de club
Quiero asociar un coach del club en una division
Para que formen parte de la division y puedan realizar operaciones en ella

Esquema del escenario: Administrador de club intenta registrar coaches en una division
Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
Cuando intenta asignar al coach "<nombre>" "<apellido>" "<email>" en la division "<nombreDivision>"
Entonces el sistema responde con <estadoCodigo>
Ejemplos: Alta de coaches en una division
| nombre  | apellido  | email                 | nombreDivision | estadoCodigo |
| Felipe  | Contepomi | felipe.conte@test.com | Primera        | 200          |
| Gonzalo | Quesada   | gonza.quesa@test.com  | Primera        | 200          |
| Pablo   | Bouza     | pablo.bouza@test.com  | Primera        | 200          |
