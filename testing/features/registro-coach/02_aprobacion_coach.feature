# language: es
Característica: Aprobacion de coaches en un club

Esquema del escenario: Listar solicitudes de coaches pendientes
Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
Cuando visualiza la lista de coaches pendientes
Entonces el sistema devuelve los datos de los coaches por dar de alta
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
        }
    }
]
"""

Ejemplos:
| nombre  | apellido  | email                 | rol           |
| Felipe  | Contepomi | felipe.conte@test.com | COACH_ANALYST |
| Gonzalo | Quesada   | gonza.quesa@test.com  | COACH_ANALYST |
| Pablo   | Bouza     | pablo.bouza@test.com  | COACH_ANALYST |
| Alberto | Pitagoras | Albert.pita@test.com  | COACH_ANALYST |

Esquema del escenario: Intentar aprobar la solicitud de alta de un coach
Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
Y que existe una solicitud de aprobacion para el coach "<nombre>" "<apellido>" con mail "<email>"
Cuando se presiona el botón para aprobar la solicitud del coach
Entonces el sistema responde con <estadoCodigo>
Ejemplos: Alta de coaches en un club
| nombre  | apellido  | email                 | estadoCodigo |
| Felipe  | Contepomi | felipe.conte@test.com | 200          |
| Gonzalo | Quesada   | gonza.quesa@test.com  | 200          |
| Pablo   | Bouza     | pablo.bouza@test.com  | 200          |
| Alberto | Pitagoras | Albert.pita@test.com  | 200          |

Esquema del escenario: Revocar el acceso de un coach al club
Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
Y que el coach "<nombre>" "<apellido>" con mail "<email>" esta asociado al club
Cuando se presiona el botón para revocar el acceso del coach
Entonces el sistema responde con <estadoCodigo>
Ejemplos: Coaches con acceso a revocar
| nombre  | apellido  | email                 | estadoCodigo |
| Alberto | Pitagoras | Albert.pita@test.com  | 200          |
