# language: es
Característica: Panel de Administrador Ovaltrack
Módulo responsable visualizar solicitudes pendientes y aprobar usuarios administradores de clubes y aprobacion de Clubes.

Esquema del escenario: Listar solicitudes de usuarios pendientes
Dado que el admin de OvalTrack entra en el panel de administrador
Cuando visualiza la lista de usuarios pendientes
Entonces el sistema devuelve los datos de las solicitudes pendientes
"""
[
  {
    "user": {
      "id": null,
      "email": "<email>",
      "role": "<rol>",
      "active": false,
      "personId": null,
      "firstName": "<nombre>",
      "lastName": "<apellido>",
      "createdAt": null
    },
    "club": {
      "name": "<nombreClub>",
      "status": "PENDING",
      "adminUserId": null,
      "city": "<ciudadClub>",
      "logoUrl": null,
      "contactEmail": "<email>",
      "contactPhone": "<telefonoClub>"
    }
  }
]
"""

Ejemplos:
| nombre | apellido | email                    | contrasenia    | fechaNacimiento | rol        | nombreClub | ciudadClub    | telefonoClub  |
| Admin  | Puerto   | admin_puerto@test.com    | PassSegura123! | 1980-01-01      | ADMIN_CLUB | PMRC       | Puerto Madryn | +542804010203 |
| Admin  | Multi    | admin_multiclub@test.com | PassSegura123! | 1980-01-01      | ADMIN_CLUB | TRC        | Trelew        | +542804010204 |
| test   | admin    | admin@test_no_active.com | PassSegura123! | 1980-01-01      | ADMIN_CLUB | RWS        | Rawson        | +542804010204 |

Esquema del escenario: Intentar aprobar al administrador de un club
Dado que el usuario "<nombre>" "<apellido>" con mail "<email>" tiene una solicitud para darse de alta
Cuando se presiona el botón para aprobar su solicitud de usuario
Entonces el sistema responde con <estadoCodigo> y "<estadoTexto>"

Ejemplos:
| nombre | apellido | email                    | estadoCodigo | estadoTexto                       |
| Admin  | Puerto   | admin_puerto@test.com    | 200          | La cuenta fue aprobada con éxito. |
| Admin  | Multi    | admin_multiclub@test.com | 200          | La cuenta fue aprobada con éxito. |

Esquema del escenario: Intentar aprobar un club
Dado que existe una solicitud de aprobacion para el club "<nombreClub>" de la ciudad "<ciudadClub>" con mail "<email>"
Cuando se presiona el botón para aprobar su solicitud de club
Entonces el sistema responde con <estadoCodigo> y "<estadoTexto>"

Ejemplos:
| nombreClub | ciudadClub    | email                    | estadoCodigo | estadoTexto                                                       |
| PMRC       | Puerto Madryn | admin_puerto@test.com    | 200          | El club fue aprobado con éxito.                                   |
| TRC        | Trelew        | admin_multiclub@test.com | 200          | El club fue aprobado con éxito.                                   |
| RWS        | Rawson        | admin@test_no_active.com | 409          | El administrador debe estar dado de alta para dar de alta el club |