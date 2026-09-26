-- Limpieza de la base de datos para pruebas automatizadas.
-- La estructura se conserva; solo se eliminan los datos.

TRUNCATE TABLE
    events,
    event_types,
    matches,
    division_players,
    division_coaches,
    divisions,
    registration_requests,
    clubs,
    users,
    persons
RESTART IDENTITY CASCADE;