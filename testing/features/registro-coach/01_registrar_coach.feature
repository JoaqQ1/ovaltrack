# language: es
Característica: Registro de coach
Módulo responsable de registrar un coach a a la plataforma con un club relacionado

Esquema del escenario: Registrar un nuevo coach en el club
Dado que el coach "<nombre>" "<apellido>" "<email>" "<contrasenia>" "<fechaNacimiento>" quiere registrarse en el "<nombreClub>" "<ciudadClub>" como "<rol>"
Cuando el coach presiona el botón para enviar su solicitud
Entonces el sistema responde con <estadoCodigo> y "<estadoTexto>"

Ejemplos:
| nombre  | apellido  | email                 | contrasenia    | fechaNacimiento | rol           | nombreClub | ciudadClub    | estadoCodigo | estadoTexto                                                     |
| Felipe  | Contepomi | felipe.conte@test.com | PassSegura123! | 1977-10-20      | COACH_ANALYST | PMRC       | Puerto Madryn | 201          | Solicitud de registro creada con éxito. Pendiente de aprobación |
| Gonzalo | Quesada   | gonza.quesa@test.com  | PassSegura123! | 1974-05-02      | COACH_ANALYST | PMRC       | Puerto Madryn | 201          | Solicitud de registro creada con éxito. Pendiente de aprobación |
| Pablo   | Bouza     | pablo.bouza@test.com  | PassSegura123! | 1973-05-09      | COACH_ANALYST | PMRC       | Puerto Madryn | 201          | Solicitud de registro creada con éxito. Pendiente de aprobación |
| Rodolfo | Ambrosio  | rodo.ambrosi@test.com | PassSegura123! | 1961-12-27      | COACH_ANALYST | TRC        | Trelew        | 201          | Solicitud de registro creada con éxito. Pendiente de aprobación |
| Juan    | Imhoff    | juan.imhoff@test.com  | PassSegura123! | 1988-05-11      | COACH_ANALYST | TRC        | Trelew        | 201          | Solicitud de registro creada con éxito. Pendiente de aprobación |
|         | Imhoff    | juan.imhoff@test.com  | PassSegura123! | 1988-05-11      | COACH_ANALYST | TRC        | Trelew        | 409          | El nombre del usuario es obligatorio.                           |
| Juan    |           | juan.imhoff@test.com  | PassSegura123! | 1988-05-11      | COACH_ANALYST | TRC        | Trelew        | 409          | El apellido del usuario es obligatorio.                         |
| Juan    | Imhoff    | ju                    | PassSegura123! | 1988-05-11      | COACH_ANALYST | TRC        | Trelew        | 409          | El formato del email no es válido                               |
| Juan    | Imhoff    | juan.imhoff@test.com  | pepe           | 1988-05-11      | COACH_ANALYST | TRC        | Trelew        | 409          | La contraseña debe tener al menos 8 caracteres                  |
| Juan    | Imhoff    | juan.imhoff@test.com  | PassSegura123! |                 | COACH_ANALYST | TRC        | Trelew        | 409          | La fecha de nacimiento es obligatoria.                          |
| Juan    | Imhoff    | juan.imhoff@test.com  | PassSegura123! | 1988-05-11      | COACH_ANALYST |            |               | 409          | El club es obligatorio                                          |
| Felipe  | Contepomi | felipe.conte@test.com | PassSegura123! | 1977-10-20      | COACH_ANALYST | PMRC       | Puerto Madryn | 409          | El email ya fue registrado con una cuenta                       |