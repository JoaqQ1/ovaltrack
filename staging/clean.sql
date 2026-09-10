-- OvalTrack - Limpieza de datos
-- Vacia todas las tablas preservando la estructura, tablas y restricciones.
-- =========================================================================

TRUNCATE TABLE 
    events,
    event_types,
    matches,
    division_players,
    division_coaches,
    divisions,
    clubs,
    users,
    persons
RESTART IDENTITY CASCADE;