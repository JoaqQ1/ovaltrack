# language: es
Característica: Panel de jugadores
    Modulo responsable de ver los jugadores de la aplicacion e invitar a los jugadores a unirse a la aplicacion.

  Esquema del escenario: Listar Jugadores
    Dado que el administrador del club o el coach lista los jugadores
    Cuando hace foco en el jugador "<firstName>" "<lastName>" "<contactEmail>" "<birthDate>" presiono la opcion de invitarlo
    Entonces se envia una invitacion correctamente y vuelve un <status> con un <"response">

    Ejemplos:
      | firstName | lastName | contactEmail             | birthDate  | status | response                                                                |
      | Agustín   | Creevy   | jugador.uno@test.com    | 1985-03-15 | 200    | Se envio correctamente el mail de invitación al jugador Agustín Creevy  |
      | Nicolás   | Sánchez  | jugador.dos@test.com    | 1988-10-26 | 200    | Se envio correctamente el mail de invitación al jugador Nicolás Sánchez |
      | Pablo     | Matera   | jugador.tres@test.com   | 1993-03-16 | 200    | Se envio correctamente el mail de invitación al jugador Pablo Matera    |
      | Gonzalo   | Quesada  | usuario.norole@test.com | 1974-05-02 | 200    | Se envio correctamente el mail de invitación al jugador Gonzalo Quesada |
      | Facundo   | Isa      | otro.jugador@test.com   | 1993-09-21 | 200    | Se envio correctamente el mail de invitación al jugador Facundo Isa     |
