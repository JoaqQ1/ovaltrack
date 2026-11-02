# language: es
Característica: Edición y eliminación de oponentes
  Como administrador de club
  Quiero editar o eliminar los clubes oponentes registrados
  Para mantener la lista de rivales correcta al programar partidos

  Escenario: El administrador de club edita un oponente
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe el rival "Rival Temporal" ("RT") de la ciudad "Rawson"
    Cuando edita el rival "Rival Temporal" con nombre "Rival Editado", alias "RE" y ciudad "Gaiman"
    Entonces el sistema responde con 200
    Y el rival "Rival Editado" figura con alias "RE" y ciudad "Gaiman"

  Escenario: El administrador de club elimina un oponente
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe el rival "Rival Para Eliminar" ("RPE") de la ciudad "Rawson"
    Cuando elimina el rival "Rival Para Eliminar"
    Entonces el sistema responde con 204
    Y el rival "Rival Para Eliminar" ya no figura en la lista de rivales

  Esquema del escenario: No se puede registrar un oponente que viola las restricciones de datos
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando intenta crear al rival "<nombreClub>" ("<aliasClub>") de la ciudad "<ciudadClub>"
    Entonces el sistema responde con 409 y "No se pudo guardar la información porque viola una restricción de datos."

    Ejemplos:
      | nombreClub        | aliasClub      | ciudadClub | motivo                    |
      | Trelew Rugby Club | TRC            | Trelew     | nombre repetido           |
      | Alias Largo       | ALIASDEMASIADO | Rawson     | alias de más de 10 letras |

  Escenario: Edición de un oponente inexistente
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando edita el rival inexistente con ID "00000000-0000-0000-0000-000000000000"
    Entonces el sistema responde con 404 y "Oponente no encontrado"
