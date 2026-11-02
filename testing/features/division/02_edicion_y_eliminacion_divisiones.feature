# language: es
Característica: Edición y eliminación de divisiones
  Como administrador de club
  Quiero editar o eliminar las divisiones de mi club
  Para mantener actualizada la organización deportiva sin afectar a otros clubes

  # --- HAPPY PATHS ---

  Escenario: El administrador de club edita una división de su club
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe la division "Temporal" del club "PMRC" con categoria "U16" y genero "MIXED"
    Cuando edita la division "Temporal" del club "PMRC" con nombre "Temporal Editada", categoria "U18" y genero "MALE"
    Entonces el sistema responde con 200
    Y la division "Temporal Editada" del club "PMRC" figura con categoria "U18" y genero "MALE"

  Escenario: El administrador de club elimina una división de su club
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Y que existe la division "Para Eliminar" del club "PMRC" con categoria "U15" y genero "FEMALE"
    Cuando elimina la division "Para Eliminar" del club "PMRC"
    Entonces el sistema responde con 200 y "Division desactivada correctamente"
    Y la division "Para Eliminar" del club "PMRC" figura como inactiva

  # --- SAD PATHS ---

  Esquema del escenario: Un administrador no puede editar ni eliminar divisiones de otro club
    Dado que el administrador del club con email "admin_multiclub@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando <accion> la division "Primera" del club "PMRC"
    Entonces el sistema responde con 403 y "Acceso denegado: la división no pertenece a su club"

    Ejemplos:
      | accion          |
      | intenta editar  |
      | elimina         |

  Escenario: Un coach no puede editar divisiones
    Dado que el coach con email "felipe.conte@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando intenta editar la division "Primera" del club "PMRC"
    Entonces el sistema responde con 403 y "Acceso denegado: solo el administrador del club puede realizar esta acción"

  Escenario: Edición de una división inexistente
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando edita la division inexistente con ID "00000000-0000-0000-0000-000000000000"
    Entonces el sistema responde con 409 y "Division no encontrada"

  Escenario: Eliminación de una división inexistente
    Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
    Cuando elimina la division inexistente con ID "00000000-0000-0000-0000-000000000000"
    Entonces el sistema responde con 409 y "No se puede eliminar una division que no existe"
