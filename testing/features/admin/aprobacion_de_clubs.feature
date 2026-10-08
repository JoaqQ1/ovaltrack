# language: es
Característica: Panel de Administrador Ovaltrack
  Módulo responsable aprobar usuarios administradores de clubes y aprobacion de Clubes.

  Esquema del escenario: Aprobar un admin club 
    Dado el usuario con "<firstName>" "<lastname>" "<email>" "<birthDate>" "<requestedRole>" "<clubName>" "<clubCity>"
    Cuando se presiona el botón Aprobar solicitud
    Entonces se espera el siguiente <status> con la "<response>"

    Ejemplos:
      | firstName| lastname | email                   | password       | birthDate  | requestedRole  | clubName | clubCity      | status | response                          |
      | Felipe  | Contepomi| felipe.conte@test.com   | PassSegura123! | 1977-10-20 | COACH_ANALYST  | PMRC     | Puerto Madryn | 200    | La cuenta fue aprobada con éxito. |
      | Felipe  | Contepomi| felipe.conte@test.com   | PassSegura123! | 1977-10-20 | COACH_ANALYST  | PMRC     | Puerto Madryn | 200    | La cuenta fue aprobada con éxito. |
    Esquema del escenario: Aprobar un Club
    Dado el club con "<name>" "<status>" "<emailAdmin>" "<city>" "<contactEmail>" "<contactPhone>"
    Cuando se presiona el botón de Aprobar solicitud de club
    Entonces 
    # Ejemplos:
    #   | firstName| lastname | email                   | password       | birthDate  | requestedRole  | clubName | clubCity      | status | response                          |
    #   | Felipe  | Contepomi| felipe.conte@test.com   | PassSegura123! | 1977-10-20 | COACH_ANALYST  | PMRC     | Puerto Madryn | 200    | El club fue aprobado con éxito. |
    #   | Felipe  | Contepomi| felipe.conte@test.com   | PassSegura123! | 1977-10-20 | COACH_ANALYST  | PMRC     | Puerto Madryn | 200    | El club fue aprobado con éxito. |