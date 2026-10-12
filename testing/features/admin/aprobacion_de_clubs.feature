# language: es
Característica: Panel de Administrador Ovaltrack
  Módulo responsable visualizar solicitudes pendientes y aprobar usuarios administradores de clubes y aprobacion de Clubes.

  Esquema del escenario: Listar solicitudes de usuarios pendientes
    Dado que el usuario Admin entra en el panel de administrador
    Cuando visualiza la lista de pendientes y ve los resultados
    Entonces obtiene estos datos
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
            "name": "<clubName>",
            "status": "PENDING",
            "adminUserId": null,
            "city": "<clubCity>",
            "logoUrl": null,
            "contactEmail": "<clubEmailContact>",
            "contactPhone": "<clubPhoneContact>"
          }
        }
      ]
      """

    Ejemplos:
      | nombre | apellido | email                    | contrasenia    | fechaNacimiento | rol        | clubName | clubCity      | clubEmailContact | clubPhoneContact |
      | Admin  | Puerto   | admin_puerto@test.com    | PassSegura123! |      1980-01-01 | ADMIN_CLUB | PMRC     | Puerto Madryn | pmrc@gmail.com   |    +542804010203 |
      | Admin  | Multi    | admin_multiclub@test.com | PassSegura123! |      1980-01-01 | ADMIN_CLUB | TRC      | Trelew        | trc@gmail.com    |    +542804010204 |

  Esquema del escenario: Aprobar un admin club
    Dado el usuario con "<firstName>" "<lastname>" "<email>" "<birthDate>" "<requestedRole>" "<clubName>" "<clubCity>" "<clubContactEmail>" "<clubContactPhone>"
    Cuando se presiona el botón Aprobar solicitud
    Entonces se espera el siguiente <status> con la "<response>" del admin del club

    Ejemplos:
      | firstName | lastname | email                    | birthDate  | requestedRole | clubName | clubCity      | clubContactEmail | clubContactPhone | status | response                          |
      | Admin     | Puerto   | admin_puerto@test.com    | 1980-01-01 | ADMIN_CLUB    | PMRC     | Puerto Madryn | pmrc@gmail.com   |    +542804010203 |    200 | La cuenta fue aprobada con éxito. |
      | Admin     | Multi    | admin_multiclub@test.com | 1980-01-01 | ADMIN_CLUB    | TRC      | Trelew        | trc@gmail.com    |    +542804010204 |    200 | La cuenta fue aprobada con éxito. |


Esquema del escenario: Listar solicitudes de clubes pendientes
    Dado que el administrador del sistema entra a la aplicacion
    Cuando visualiza las solicitudes de clubes que se encuentran pendientes de aprobación
    Entonces puede validar o rechazar las solicitudes
      """
      [
        {
          "name": "PMRC",
          "status": "PENDING",
          "adminUserId": null,
          "city": "Puerto Madryn",
          "logoUrl": null,
          "contactEmail": "pmrc@gmail.com",
          "contactPhone": "+542804010203"
        },
        {
          "name": "TRC",
          "status": "PENDING",
          "adminUserId": null,
          "city": "Trelew",
          "logoUrl": null,
          "contactEmail": "trc@gmail.com",
          "contactPhone": "+542804010204"
        }
      ]
      """

  Esquema del escenario: Aprobar un Club
    Dado el club con "<name>" "<clubStatus>" "<emailAdmin>" "<city>" "<contactEmail>" "<contactPhone>"
    Cuando se presiona el botón de Aprobar solicitud de club
    Entonces se obtiene un <status> con una "<response>"

    Ejemplos:
      | name | clubStatus | emailAdmin            | city          | contactEmail   | contactPhone  | status | response                        |
      | PMRC | PENDING    | admin_puerto@test.com | Puerto Madryn | pmrc@gmail.com | +542804010203 |    200 | El club fue aprobado con éxito. |
      | TRC  | PENDING    | admin_puerto@test.com | Trelew        | trc@gmail.com  | +542804010204 |    200 | El club fue aprobado con éxito. |
