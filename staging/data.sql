-- OvalTrack Data Seeder (Modificado para preservar ADMIN_OVALTRACK)
-- =========================================

BEGIN;

-- 1. Desactivar temporalmente validaciones de FK para evitar errores por dependencias circulares
SET session_replication_role = 'replica';

-- 2. Limpieza selectiva (preservando los usuarios con rol ADMIN_OVALTRACK y sus entidades relacionadas si es necesario)
DELETE FROM events;
DELETE FROM matches_players;
DELETE FROM event_types;
DELETE FROM matches;
DELETE FROM division_players;
DELETE FROM division_coaches;
DELETE FROM divisions;
DELETE FROM opponents;

-- Borrar usuarios excepto el administrador general del sistema
DELETE FROM users WHERE role != 'ADMIN_OVALTRACK';

-- Borrar personas que no estén asociadas a un usuario ADMIN_OVALTRACK activo
DELETE FROM persons WHERE id NOT IN (
    SELECT person_id FROM users WHERE role = 'ADMIN_OVALTRACK' AND person_id IS NOT NULL
);

-- Borrar clubs cuyo administrador no sea un ADMIN_OVALTRACK (o puedes limpiar todos si el club se vuelve a sembrar abajo)
DELETE FROM clubs WHERE admin_user_id NOT IN (
    SELECT id FROM users WHERE role = 'ADMIN_OVALTRACK'
);

-- 3. Restaurar las restricciones de FK
SET session_replication_role = 'origin';

COMMIT;


-- =========================================
-- Modificaciones y Estructura
-- =========================================

ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_status_check;
ALTER TABLE matches ADD CONSTRAINT matches_status_check CHECK (status IN ('EMPTY_ROSTER', 'NOT_STARTED', 'IN_PROGRESS', 'HALFTIME', 'FINISHED', 'CANCELLED'));

ALTER TABLE matches ADD COLUMN IF NOT EXISTS clock_elapsed_seconds INTEGER NOT NULL DEFAULT 0;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS clock_paused BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS clock_updated_at TIMESTAMP;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS current_possession VARCHAR(255) NOT NULL DEFAULT 'OWN';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS finished_at TIMESTAMP;
ALTER TABLE events ADD COLUMN IF NOT EXISTS client_event_id UUID;
-- Catálogo de eventos v3
ALTER TABLE event_types ADD COLUMN IF NOT EXISTS code VARCHAR(60);
CREATE UNIQUE INDEX IF NOT EXISTS uk_event_types_code ON event_types (code);
-- show_in_palette = false -> el tipo no aparece en la botonera en vivo (solo se crea como seguimiento o desde video)
ALTER TABLE event_types ADD COLUMN IF NOT EXISTS show_in_palette BOOLEAN NOT NULL DEFAULT TRUE;
-- follow_up_event_type_id -> tras registrar este tipo, la app pide automáticamente el evento de seguimiento
ALTER TABLE event_types ADD COLUMN IF NOT EXISTS follow_up_event_type_id UUID;
-- actor: quién ejecuta el evento (ATTACKING = equipo con la pelota, DEFENDING = equipo sin la pelota, CHOOSE = a elección)
ALTER TABLE event_types ADD COLUMN IF NOT EXISTS actor VARCHAR(10) NOT NULL DEFAULT 'ATTACKING';
-- possession_after: posesión resultante respecto del actor (KEEP = no cambia, ACTOR = queda en quien lo hizo, OTHER = pasa al rival)
ALTER TABLE event_types ADD COLUMN IF NOT EXISTS possession_after VARCHAR(10) NOT NULL DEFAULT 'KEEP';
-- follow_up_choices: eventos entre los que el analista elige al guardar este tipo (ej. cómo se juega un penal)
ALTER TABLE event_types ADD COLUMN IF NOT EXISTS follow_up_choices JSONB NOT NULL DEFAULT '[]';


-- =========================================
-- PERSONS (30 personas en total)
-- =========================================

INSERT INTO persons (id, first_name, last_name, birth_date, contact_email, contact_phone, created_at) VALUES
    -- 1: Administrador del Club
    ('11111111-1111-1111-1111-000000000001', 'Carlos', 'Administrador', '1980-01-01', 'admin@club.com', '123456789', CURRENT_TIMESTAMP),
    -- 2: Entrenador Gonzalo
    ('11111111-1111-1111-1111-000000000002', 'Gonzalo', 'Entrenador', '1985-05-10', 'gonzalo@mail.com', '123456789', CURRENT_TIMESTAMP),
    -- 3: Segundo Entrenador / Analista
    ('11111111-1111-1111-1111-000000000003', 'Mario', 'Analista', '1982-11-20', 'coach2@ovaltrack.com', '123456789', CURRENT_TIMESTAMP),
    -- 4 a 15: 12 Jugadores que SI tienen cuenta de usuario
    ('11111111-1111-1111-1111-000000000101', 'Agustin', 'Creevy', '1995-03-15', 'player1@ovaltrack.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000102', 'Julian', 'Montoya', '1996-04-20', 'player2@ovaltrack.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000103', 'Tomas', 'Lavanini', '1997-01-11', 'player3@ovaltrack.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000104', 'Guido', 'Petti', '1998-07-08', 'player4@ovaltrack.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000105', 'Pablo', 'Matera', '1999-02-14', 'player5@ovaltrack.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000106', 'Marcos', 'Kremer', '2000-06-25', 'player6@ovaltrack.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000107', 'Facundo', 'Isa', '1996-09-21', 'player7@ovaltrack.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000108', 'Gonzalo', 'Bertranou', '1997-12-31', 'player8@ovaltrack.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000109', 'Nicolas', 'Sanchez', '1995-10-26', 'player9@ovaltrack.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000110', 'Santiago', 'Carreras', '1998-05-01', 'player10@ovaltrack.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000111', 'Emiliano', 'Boffelli', '1999-01-16', 'player11@ovaltrack.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000112', 'Mateo', 'Carreras', '2000-12-17', 'player12@ovaltrack.com', '123456789', CURRENT_TIMESTAMP),
    -- 16 a 30: 15 Personas/Jugadores que NO tienen cuenta de usuario
    ('11111111-1111-1111-1111-000000000113', 'Juan', 'Perez', '2001-03-01', 'juan.perez@madryn.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000114', 'Lucas', 'Gomez', '2001-04-12', 'lucas.gomez@madryn.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000115', 'Martin', 'Rodriguez', '2002-05-18', 'martin.rodriguez@madryn.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000116', 'Joaquin', 'Lopez', '2002-08-22', 'joaquin.lopez@madryn.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000117', 'Franco', 'Diaz', '2003-01-30', 'franco.diaz@madryn.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000118', 'Bautista', 'Alvarez', '2003-06-14', 'bautista.alvarez@madryn.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000119', 'Tomas', 'Romero', '2003-09-09', 'tomas.romero@madryn.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000120', 'Ignacio', 'Sosa', '2004-02-11', 'ignacio.sosa@madryn.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000121', 'Santiago', 'Torres', '2004-07-19', 'santiago.torres@madryn.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000122', 'Manuel', 'Ruiz', '2004-11-05', 'manuel.ruiz@madryn.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000123', 'Felipe', 'Benitez', '2005-01-25', 'felipe.benitez@madryn.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000124', 'Ramiro', 'Castro', '2005-04-16', 'ramiro.castro@madryn.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000125', 'Esteban', 'Morales', '2005-08-03', 'esteban.morales@madryn.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000126', 'Lautaro', 'Gutierrez', '2005-10-10', 'lautaro.gutierrez@madryn.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000127', 'Valentin', 'Ortiz', '2005-12-28', 'valentin.ortiz@madryn.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000128', 'Rodrigo', 'Isgro', '1999-03-24', 'player13@ovaltrack.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000129', 'Lucio', 'Cinti', '2000-02-23', 'player14@ovaltrack.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000130', 'Matias', 'Moroni', '1991-03-29', 'player15@ovaltrack.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000131', 'Bautista', 'Delguy', '1997-04-22', 'player16@ovaltrack.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000132', 'Juan Cruz', 'Mallia', '1996-09-11', 'player17@ovaltrack.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000133', 'Thomas', 'Gallo', '1999-04-30', 'player18@ovaltrack.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000134', 'Ignacio', 'Ruiz', '2001-01-03', 'player19@ovaltrack.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000135', 'Joel', 'Sclavi', '1994-06-25', 'player20@ovaltrack.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000136', 'Pedro', 'Rubiolo', '2002-12-21', 'player21@ovaltrack.com', '123456789', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000137', 'Rodrigo', 'Bruni', '1993-09-03', 'player22@ovaltrack.com', '123456789', CURRENT_TIMESTAMP);


-- =========================================
-- USERS (15 cuentas de usuario en total)
-- =========================================

INSERT INTO users (id, login_email, password_hash, role, person_id, active, created_at) VALUES
    -- 1: Admin de Club (password: 'administrador')
    ('11111111-1111-1111-1111-000000000001', 'admin@club.com', '$2a$10$muT5CkR/ijOSgfmjvAWwNuYxVc6bZUKpt2inx5AXux7ukib9X3h6K', 'ADMIN_CLUB', '11111111-1111-1111-1111-000000000001', true, CURRENT_TIMESTAMP),
    -- 2: Entrenador Gonzalo (password: '12345678')
    ('11111111-1111-1111-1111-000000000002', 'gonzalo@mail.com', '$2a$10$EJRf2jQGFPYWYSL03J6rCe4v9v3dMxeyt/efj17fIzSgCO9Um1ImW', 'COACH_ANALYST', '11111111-1111-1111-1111-000000000002', true, CURRENT_TIMESTAMP),
    -- 3: Segundo Entrenador / Analista (password: '123456')
    ('11111111-1111-1111-1111-000000000003', 'coach2@ovaltrack.com', '$2a$10$rfosuoBOENyuQRIy6eCSX.RVjuk2ZrLtlz7NdGpBlxrqviDJflWiG', 'COACH_ANALYST', '11111111-1111-1111-1111-000000000003', true, CURRENT_TIMESTAMP),
    -- 4 a 15: 12 Jugadores con cuenta (password: '123456')
    ('11111111-1111-1111-1111-000000000101', 'player1@ovaltrack.com', '$2a$10$rfosuoBOENyuQRIy6eCSX.RVjuk2ZrLtlz7NdGpBlxrqviDJflWiG', 'PLAYER', '11111111-1111-1111-1111-000000000101', true, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000102', 'player2@ovaltrack.com', '$2a$10$rfosuoBOENyuQRIy6eCSX.RVjuk2ZrLtlz7NdGpBlxrqviDJflWiG', 'PLAYER', '11111111-1111-1111-1111-000000000102', true, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000103', 'player3@ovaltrack.com', '$2a$10$rfosuoBOENyuQRIy6eCSX.RVjuk2ZrLtlz7NdGpBlxrqviDJflWiG', 'PLAYER', '11111111-1111-1111-1111-000000000103', true, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000104', 'player4@ovaltrack.com', '$2a$10$rfosuoBOENyuQRIy6eCSX.RVjuk2ZrLtlz7NdGpBlxrqviDJflWiG', 'PLAYER', '11111111-1111-1111-1111-000000000104', true, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000105', 'player5@ovaltrack.com', '$2a$10$rfosuoBOENyuQRIy6eCSX.RVjuk2ZrLtlz7NdGpBlxrqviDJflWiG', 'PLAYER', '11111111-1111-1111-1111-000000000105', true, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000106', 'player6@ovaltrack.com', '$2a$10$rfosuoBOENyuQRIy6eCSX.RVjuk2ZrLtlz7NdGpBlxrqviDJflWiG', 'PLAYER', '11111111-1111-1111-1111-000000000106', true, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000107', 'player7@ovaltrack.com', '$2a$10$rfosuoBOENyuQRIy6eCSX.RVjuk2ZrLtlz7NdGpBlxrqviDJflWiG', 'PLAYER', '11111111-1111-1111-1111-000000000107', true, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000108', 'player8@ovaltrack.com', '$2a$10$rfosuoBOENyuQRIy6eCSX.RVjuk2ZrLtlz7NdGpBlxrqviDJflWiG', 'PLAYER', '11111111-1111-1111-1111-000000000108', true, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000109', 'player9@ovaltrack.com', '$2a$10$rfosuoBOENyuQRIy6eCSX.RVjuk2ZrLtlz7NdGpBlxrqviDJflWiG', 'PLAYER', '11111111-1111-1111-1111-000000000109', true, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000110', 'player10@ovaltrack.com', '$2a$10$rfosuoBOENyuQRIy6eCSX.RVjuk2ZrLtlz7NdGpBlxrqviDJflWiG', 'PLAYER', '11111111-1111-1111-1111-000000000110', true, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000111', 'player11@ovaltrack.com', '$2a$10$rfosuoBOENyuQRIy6eCSX.RVjuk2ZrLtlz7NdGpBlxrqviDJflWiG', 'PLAYER', '11111111-1111-1111-1111-000000000111', true, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000112', 'player12@ovaltrack.com', '$2a$10$rfosuoBOENyuQRIy6eCSX.RVjuk2ZrLtlz7NdGpBlxrqviDJflWiG', 'PLAYER', '11111111-1111-1111-1111-000000000112', true, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000128', 'player13@ovaltrack.com', '$2a$10$rfosuoBOENyuQRIy6eCSX.RVjuk2ZrLtlz7NdGpBlxrqviDJflWiG', 'PLAYER', '11111111-1111-1111-1111-000000000128', true, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000129', 'player14@ovaltrack.com', '$2a$10$rfosuoBOENyuQRIy6eCSX.RVjuk2ZrLtlz7NdGpBlxrqviDJflWiG', 'PLAYER', '11111111-1111-1111-1111-000000000129', true, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000130', 'player15@ovaltrack.com', '$2a$10$rfosuoBOENyuQRIy6eCSX.RVjuk2ZrLtlz7NdGpBlxrqviDJflWiG', 'PLAYER', '11111111-1111-1111-1111-000000000130', true, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000131', 'player16@ovaltrack.com', '$2a$10$rfosuoBOENyuQRIy6eCSX.RVjuk2ZrLtlz7NdGpBlxrqviDJflWiG', 'PLAYER', '11111111-1111-1111-1111-000000000131', true, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000132', 'player17@ovaltrack.com', '$2a$10$rfosuoBOENyuQRIy6eCSX.RVjuk2ZrLtlz7NdGpBlxrqviDJflWiG', 'PLAYER', '11111111-1111-1111-1111-000000000132', true, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000133', 'player18@ovaltrack.com', '$2a$10$rfosuoBOENyuQRIy6eCSX.RVjuk2ZrLtlz7NdGpBlxrqviDJflWiG', 'PLAYER', '11111111-1111-1111-1111-000000000133', true, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000134', 'player19@ovaltrack.com', '$2a$10$rfosuoBOENyuQRIy6eCSX.RVjuk2ZrLtlz7NdGpBlxrqviDJflWiG', 'PLAYER', '11111111-1111-1111-1111-000000000134', true, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000135', 'player20@ovaltrack.com', '$2a$10$rfosuoBOENyuQRIy6eCSX.RVjuk2ZrLtlz7NdGpBlxrqviDJflWiG', 'PLAYER', '11111111-1111-1111-1111-000000000135', true, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000136', 'player21@ovaltrack.com', '$2a$10$rfosuoBOENyuQRIy6eCSX.RVjuk2ZrLtlz7NdGpBlxrqviDJflWiG', 'PLAYER', '11111111-1111-1111-1111-000000000136', true, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000137', 'player22@ovaltrack.com', '$2a$10$rfosuoBOENyuQRIy6eCSX.RVjuk2ZrLtlz7NdGpBlxrqviDJflWiG', 'PLAYER', '11111111-1111-1111-1111-000000000137', true, CURRENT_TIMESTAMP);


-- =========================================
-- CLUBS
-- =========================================

INSERT INTO clubs (id, name, created_at, status, admin_user_id, city, logo_url, contact_email, contact_phone) VALUES
    ('11111111-1111-1111-1111-000000000010', 'Puerto Madryn Rugby Club', CURRENT_TIMESTAMP, 'ACTIVE', '11111111-1111-1111-1111-000000000001', 'Puerto Madryn', '/argentina-escudo.png', 'contacto@pmrc.com', '123456789');

-- Asociar todas las personas existentes al club creado
UPDATE persons SET club_id = '11111111-1111-1111-1111-000000000010';


-- =========================================
-- DIVISIONS
-- =========================================

INSERT INTO divisions (id, name, club_id, created_at, age_category, gender, active) VALUES
    ('11111111-1111-1111-1111-000000000020', 'Primera', '11111111-1111-1111-1111-000000000010', CURRENT_TIMESTAMP, 'SENIOR', 'MALE', true),
    ('11111111-1111-1111-1111-000000000021', 'M19', '11111111-1111-1111-1111-000000000010', CURRENT_TIMESTAMP, 'U20', 'MALE', true);


-- =========================================
-- DIVISION_COACHES (Entrenadores por División)
-- =========================================

INSERT INTO division_coaches (id, person_id, division_id, start_date, end_date) VALUES
    ('11111111-1111-1111-1111-000000000030', '11111111-1111-1111-1111-000000000002', '11111111-1111-1111-1111-000000000020', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000031', '11111111-1111-1111-1111-000000000003', '11111111-1111-1111-1111-000000000021', '2023-01-01', NULL);


-- =========================================
-- DIVISION_PLAYERS (Jugadores por División)
-- =========================================

INSERT INTO division_players (id, person_id, division_id, jersey_number, position, start_date, end_date) VALUES
    -- Jugadores en Primera (15 jugadores)
    ('11111111-1111-1111-1111-000000000200', '11111111-1111-1111-1111-000000000101', '11111111-1111-1111-1111-000000000020', 1, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000201', '11111111-1111-1111-1111-000000000102', '11111111-1111-1111-1111-000000000020', 2, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000202', '11111111-1111-1111-1111-000000000103', '11111111-1111-1111-1111-000000000020', 3, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000203', '11111111-1111-1111-1111-000000000104', '11111111-1111-1111-1111-000000000020', 4, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000204', '11111111-1111-1111-1111-000000000105', '11111111-1111-1111-1111-000000000020', 5, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000205', '11111111-1111-1111-1111-000000000106', '11111111-1111-1111-1111-000000000020', 6, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000206', '11111111-1111-1111-1111-000000000107', '11111111-1111-1111-1111-000000000020', 7, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000207', '11111111-1111-1111-1111-000000000108', '11111111-1111-1111-1111-000000000020', 8, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000208', '11111111-1111-1111-1111-000000000109', '11111111-1111-1111-1111-000000000020', 9, 'Back', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000209', '11111111-1111-1111-1111-000000000110', '11111111-1111-1111-1111-000000000020', 10, 'Back', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000210', '11111111-1111-1111-1111-000000000111', '11111111-1111-1111-1111-000000000020', 11, 'Back', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000211', '11111111-1111-1111-1111-000000000112', '11111111-1111-1111-1111-000000000020', 12, 'Back', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000212', '11111111-1111-1111-1111-000000000113', '11111111-1111-1111-1111-000000000020', 13, 'Back', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000213', '11111111-1111-1111-1111-000000000114', '11111111-1111-1111-1111-000000000020', 14, 'Back', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000214', '11111111-1111-1111-1111-000000000115', '11111111-1111-1111-1111-000000000020', 15, 'Back', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000227', '11111111-1111-1111-1111-000000000128', '11111111-1111-1111-1111-000000000020', 16, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000228', '11111111-1111-1111-1111-000000000129', '11111111-1111-1111-1111-000000000020', 17, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000229', '11111111-1111-1111-1111-000000000130', '11111111-1111-1111-1111-000000000020', 18, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000230', '11111111-1111-1111-1111-000000000131', '11111111-1111-1111-1111-000000000020', 19, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000231', '11111111-1111-1111-1111-000000000132', '11111111-1111-1111-1111-000000000020', 20, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000232', '11111111-1111-1111-1111-000000000133', '11111111-1111-1111-1111-000000000020', 21, 'Back', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000233', '11111111-1111-1111-1111-000000000134', '11111111-1111-1111-1111-000000000020', 22, 'Back', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000234', '11111111-1111-1111-1111-000000000135', '11111111-1111-1111-1111-000000000020', 23, 'Back', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000235', '11111111-1111-1111-1111-000000000136', '11111111-1111-1111-1111-000000000020', 24, 'Back', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000236', '11111111-1111-1111-1111-000000000137', '11111111-1111-1111-1111-000000000020', 25, 'Back', '2023-01-01', NULL),
    -- Jugadores en M19 (12 jugadores)
    ('11111111-1111-1111-1111-000000000215', '11111111-1111-1111-1111-000000000116', '11111111-1111-1111-1111-000000000021', 1, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000216', '11111111-1111-1111-1111-000000000117', '11111111-1111-1111-1111-000000000021', 2, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000217', '11111111-1111-1111-1111-000000000118', '11111111-1111-1111-1111-000000000021', 3, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000218', '11111111-1111-1111-1111-000000000119', '11111111-1111-1111-1111-000000000021', 4, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000219', '11111111-1111-1111-1111-000000000120', '11111111-1111-1111-1111-000000000021', 5, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000220', '11111111-1111-1111-1111-000000000121', '11111111-1111-1111-1111-000000000021', 6, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000221', '11111111-1111-1111-1111-000000000122', '11111111-1111-1111-1111-000000000021', 7, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000222', '11111111-1111-1111-1111-000000000123', '11111111-1111-1111-1111-000000000021', 8, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000223', '11111111-1111-1111-1111-000000000124', '11111111-1111-1111-1111-000000000021', 9, 'Back', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000224', '11111111-1111-1111-1111-000000000125', '11111111-1111-1111-1111-000000000021', 10, 'Back', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000225', '11111111-1111-1111-1111-000000000126', '11111111-1111-1111-1111-000000000021', 11, 'Back', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000226', '11111111-1111-1111-1111-000000000127', '11111111-1111-1111-1111-000000000021', 12, 'Back', '2023-01-01', NULL);



-- =========================================
-- OPPONENTS (Clubes rivales)
-- =========================================

INSERT INTO opponents (id, name, city, alias) VALUES
    ('22222222-1111-1111-1111-000000000001', 'Trelew Rugby Club', 'Trelew', 'TRC'),
    ('22222222-1111-1111-1111-000000000002', 'Bigornia Club', 'Rawson', 'BRC'),
    ('22222222-1111-1111-1111-000000000003', 'Chenque Rugby Club', 'Comodoro Rivadavia', 'CRC'),
    ('22222222-1111-1111-1111-000000000004', 'Patoruzú Rugby Club', 'Trelew', 'PRC'),
    ('22222222-1111-1111-1111-000000000005', 'Deportivo Portugués', 'Comodoro Rivadavia', 'DP'),
    ('22222222-1111-1111-1111-000000000006', 'Calafate Rugby Club', 'Comodoro Rivadavia', 'CalRC'),
    ('22222222-1111-1111-1111-000000000007', 'Comodoro Rugby Club', 'Comodoro Rivadavia', 'ComRC');


-- =========================================
-- MATCHES (Partidos)
-- =========================================

INSERT INTO matches (
  id, date, division_id, opponent_id, status, current_period,
  clock_elapsed_seconds, clock_paused, clock_updated_at,
  current_possession, home_score, away_score, started_at, finished_at
) VALUES
    -- 1: Trelew RC
  ('11111111-1111-1111-1111-000000000040', '2026-09-28 15:30:00', '11111111-1111-1111-1111-000000000020', '22222222-1111-1111-1111-000000000001', 'IN_PROGRESS', 1, 1800, true, CURRENT_TIMESTAMP, 'OWN', 0, 0, CURRENT_TIMESTAMP, NULL),
    -- 2: Bigornia Club
  ('11111111-1111-1111-1111-000000000041', '2026-10-05 16:00:00', '11111111-1111-1111-1111-000000000020', '22222222-1111-1111-1111-000000000002', 'NOT_STARTED', 1, 0, true, NULL, 'OWN', 0, 0, NULL, NULL),
    -- 3: Chenque RC
  ('11111111-1111-1111-1111-000000000042', '2026-09-28 14:00:00', '11111111-1111-1111-1111-000000000020', '22222222-1111-1111-1111-000000000003', 'HALFTIME', 1, 2400, true, CURRENT_TIMESTAMP, 'OWN', 0, 0, CURRENT_TIMESTAMP, NULL),
    -- 4: Patoruzú RC
  ('11111111-1111-1111-1111-000000000043', '2026-09-28 16:45:00', '11111111-1111-1111-1111-000000000020', '22222222-1111-1111-1111-000000000004', 'IN_PROGRESS', 2, 4500, true, CURRENT_TIMESTAMP, 'OWN', 0, 0, CURRENT_TIMESTAMP, NULL),
    -- 5: Deportivo Portugués
  ('11111111-1111-1111-1111-000000000044', '2026-09-21 15:30:00', '11111111-1111-1111-1111-000000000020', '22222222-1111-1111-1111-000000000005', 'FINISHED', 2, 4800, true, CURRENT_TIMESTAMP, 'OWN', 0, 0, '2026-09-21 15:30:00', '2026-09-21 17:30:00'),
    -- 6: Calafate RC
  ('11111111-1111-1111-1111-000000000045', '2026-10-12 14:00:00', '11111111-1111-1111-1111-000000000021', '22222222-1111-1111-1111-000000000006', 'NOT_STARTED', 1, 0, true, NULL, 'OWN', 0, 0, NULL, NULL),
    -- 7: Comodoro Rugby Club
  ('11111111-1111-1111-1111-000000000046', '2026-10-09 15:30:00', '11111111-1111-1111-1111-000000000020', '22222222-1111-1111-1111-000000000007', 'HALFTIME', 1, 2400, true, CURRENT_TIMESTAMP, 'OWN', 21, 13, '2026-10-09 15:30:00', NULL);



-- =========================================
-- EVENT_TYPES (Catálogo Estándar de Tipos de Eventos, v3)
-- =========================================
-- template_event_fields es un ARRAY ORDENADO de campos:
--   key        identificador estable (clave dentro de events.attributes)
--   label      texto a mostrar
--   type       select | number | boolean
--   phase      'live' -> se pide al cargar el evento (un paso del modal) | 'post' -> se completa después, con el video
--   required   en 'live' es obligatorio (solo los number/slider pueden omitirse)
--   options    [{value, label, possession?}] solo para select; possession (KEEP | ACTOR | OTHER) define la
--              posesión resultante cuando se elige esa opción (pisa possession_after del tipo)
--   min/max/default   obligatorios en number (slider)
--   effects    solo boolean: "scoring" (si es false no suma puntos), "possession" (si es false la posesión no cambia)
--   trueLabel/falseLabel   textos de los botones de un boolean
--   followUps (en una opción) | follow_up_choices (en el tipo): lista de {code, label?, preset?}; al guardar el evento
--              se muestra una botonera con esos eventos (más «Nada más»). preset pre-llena campos en vivo del evento elegido
--              y salta ese paso. El equipo del evento elegido se resuelve con la posesión ya actualizada (actor).
-- Reglas del catálogo:
--   * Máximo 2 toques por evento en el modal: jugador (si requires_player) + 1 campo 'live'.
--   * Un solo tipo por acción; el resultado va en un campo, no en tipos duplicados.
--   * actor decide qué equipo se asigna: ATTACKING = el que tiene la pelota, DEFENDING = el otro, CHOOSE = el analista elige.
--   * Claves reservadas en attributes: playerNumber.
--   * Turnovers: 'Turnover ganado' (forzado, se acredita a quien lo gana) y 'Error de manejo' (no forzado, se carga a quien lo pierde).
--     Un turnover se registra una sola vez; los resultados de Maul/Scrum/Line-out ya cambian la posesión por sí solos.
-- Pendientes: Cambio sin campos (cambia la lista de jugadores en cancha); elegir el evento siguiente tras un penal.

INSERT INTO event_types
(id, code, name, group_name, category, is_scoring, points,
 requires_player, is_active, show_in_palette, follow_up_event_type_id, actor, possession_after, follow_up_choices, template_event_fields, created_at)
VALUES
(
    '550e8400-e29b-41d4-a716-446655440101',
    'TRY',
    'Try',
    'Puntuación',
    'ATTACK',
    true,
    5,
    true,
    true,
    true,
    '550e8400-e29b-41d4-a716-446655440102',
    'ATTACKING',
    'KEEP',
    $$[]$$::jsonb,
    $$[
      {
        "key": "zone",
        "label": "Zona de apoyo",
        "type": "select",
        "phase": "live",
        "required": true,
        "options": [
          {
            "value": "left",
            "label": "Izquierda"
          },
          {
            "value": "center",
            "label": "Centro"
          },
          {
            "value": "right",
            "label": "Derecha"
          }
        ]
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440102',
    'CONVERSION',
    'Conversión',
    'Puntuación',
    'ATTACK',
    true,
    2,
    true,
    true,
    false,
    NULL,
    'ATTACKING',
    'OTHER',
    $$[]$$::jsonb,
    $$[
      {
        "key": "wasSuccessful",
        "label": "Resultado",
        "type": "boolean",
        "phase": "live",
        "required": true,
        "effects": [
          "scoring"
        ],
        "trueLabel": "Convertido",
        "falseLabel": "Errado"
      },
      {
        "key": "distanceMeters",
        "label": "Distancia (m)",
        "type": "number",
        "phase": "post",
        "required": false,
        "min": 0,
        "max": 80
      },
      {
        "key": "zone",
        "label": "Zona de patada",
        "type": "select",
        "phase": "post",
        "required": false,
        "options": [
          {
            "value": "left",
            "label": "Izquierda"
          },
          {
            "value": "center",
            "label": "Centro"
          },
          {
            "value": "right",
            "label": "Derecha"
          }
        ]
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440103',
    'PENALTY_TRY',
    'Try penal',
    'Puntuación',
    'ATTACK',
    true,
    7,
    false,
    true,
    true,
    NULL,
    'ATTACKING',
    'OTHER',
    $$[]$$::jsonb,
    $$[
      {
        "key": "reason",
        "label": "Causa de sanción",
        "type": "select",
        "phase": "post",
        "required": false,
        "options": [
          {
            "value": "scrum_collapse",
            "label": "Derrumbe de scrum"
          },
          {
            "value": "maul_collapse",
            "label": "Derrumbe de maul"
          },
          {
            "value": "high_tackle_ingoal",
            "label": "Tackle alto / Infracción en ingoal"
          },
          {
            "value": "deliberate_knockon",
            "label": "Knock-on intencional"
          }
        ]
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440104',
    'PENALTY_KICK',
    'Kick H (Penal a palos)',
    'Puntuación',
    'ATTACK',
    true,
    3,
    true,
    true,
    false,
    NULL,
    'ATTACKING',
    'OTHER',
    $$[]$$::jsonb,
    $$[
      {
        "key": "wasSuccessful",
        "label": "Resultado",
        "type": "boolean",
        "phase": "live",
        "required": true,
        "effects": [
          "scoring",
          "possession"
        ],
        "trueLabel": "Convertido",
        "falseLabel": "Errado"
      },
      {
        "key": "distanceMeters",
        "label": "Distancia (m)",
        "type": "number",
        "phase": "post",
        "required": false,
        "min": 0,
        "max": 80
      },
      {
        "key": "zone",
        "label": "Zona de patada",
        "type": "select",
        "phase": "post",
        "required": false,
        "options": [
          {
            "value": "left",
            "label": "Izquierda"
          },
          {
            "value": "center",
            "label": "Centro"
          },
          {
            "value": "right",
            "label": "Derecha"
          }
        ]
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440105',
    'DROP_GOAL',
    'Drop goal',
    'Puntuación',
    'ATTACK',
    true,
    3,
    false,
    true,
    true,
    NULL,
    'ATTACKING',
    'OTHER',
    $$[]$$::jsonb,
    $$[
      {
        "key": "wasSuccessful",
        "label": "Resultado",
        "type": "boolean",
        "phase": "live",
        "required": true,
        "effects": [
          "scoring",
          "possession"
        ],
        "trueLabel": "Convertido",
        "falseLabel": "Errado"
      },
      {
        "key": "distanceMeters",
        "label": "Distancia (m)",
        "type": "number",
        "phase": "post",
        "required": false,
        "min": 0,
        "max": 80
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440106',
    'CARRY',
    'Acarreo (Carry)',
    'Ataque',
    'ATTACK',
    false,
    0,
    false,
    true,
    false,
    NULL,
    'ATTACKING',
    'KEEP',
    $$[]$$::jsonb,
    $$[
      {
        "key": "metersGained",
        "label": "Metros ganados",
        "type": "number",
        "phase": "post",
        "required": false,
        "min": 0,
        "max": 50
      },
      {
        "key": "defendersBeaten",
        "label": "Defensores eludidos",
        "type": "number",
        "phase": "post",
        "required": false,
        "default": 0,
        "min": 0,
        "max": 6
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440107',
    'PASS_OFFLOAD',
    'Pase / Offload',
    'Ataque',
    'ATTACK',
    false,
    0,
    true,
    true,
    false,
    NULL,
    'ATTACKING',
    'KEEP',
    $$[]$$::jsonb,
    $$[
      {
        "key": "passType",
        "label": "Tipo de pase",
        "type": "select",
        "phase": "live",
        "required": true,
        "options": [
          {
            "value": "standard",
            "label": "Pase simple"
          },
          {
            "value": "offload",
            "label": "Offload en contacto"
          },
          {
            "value": "skip",
            "label": "Pase salteado"
          }
        ]
      },
      {
        "key": "isBadPass",
        "label": "Pase comprometido / impreciso",
        "type": "boolean",
        "phase": "post",
        "required": false
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440108',
    'RUCK_OFFENSIVE',
    'Ruck ofensivo',
    'Ataque',
    'ATTACK',
    false,
    0,
    false,
    true,
    true,
    NULL,
    'ATTACKING',
    'KEEP',
    $$[]$$::jsonb,
    $$[
      {
        "key": "speed",
        "label": "Velocidad de reciclaje",
        "type": "select",
        "phase": "post",
        "required": false,
        "options": [
          {
            "value": "fast",
            "label": "Rápido (<3s)"
          },
          {
            "value": "medium",
            "label": "Medio (3-6s)"
          },
          {
            "value": "slow",
            "label": "Lento (>6s)"
          }
        ]
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440109',
    'LINEBREAK',
    'Quiebre de línea',
    'Ataque',
    'ATTACK',
    false,
    0,
    false,
    true,
    true,
    NULL,
    'ATTACKING',
    'KEEP',
    $$[]$$::jsonb,
    $$[
      {
        "key": "metersGained",
        "label": "Metros netos",
        "type": "number",
        "phase": "post",
        "required": false,
        "min": 0,
        "max": 100
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440127',
    'ENTRY_22',
    'Ingreso a 22m rival',
    'Ataque',
    'ATTACK',
    false,
    0,
    false,
    true,
    true,
    NULL,
    'ATTACKING',
    'KEEP',
    $$[]$$::jsonb,
    $$[]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440110',
    'KICK_IN_PLAY',
    'Patada en juego',
    'Ataque',
    'ATTACK',
    false,
    0,
    false,
    true,
    true,
    NULL,
    'ATTACKING',
    'OTHER',
    $$[]$$::jsonb,
    $$[
      {
        "key": "kickType",
        "label": "Tipo de patada",
        "type": "select",
        "phase": "post",
        "required": true,
        "options": [
          {
            "value": "tactical",
            "label": "Táctica / Despeje"
          },
          {
            "value": "up_under",
            "label": "A cargar (Sombrerito/Bombazo)"
          },
          {
            "value": "grubber",
            "label": "Rastrón"
          },
          {
            "value": "50_22",
            "label": "Intento 50/22"
          }
        ]
      },
      {
        "key": "outcome",
        "label": "Resultado",
        "type": "select",
        "phase": "live",
        "required": false,
        "options": [
          {
            "value": "touch_won",
            "label": "Touch ganado"
          },
          {
            "value": "retained",
            "label": "Recuperada propia"
          },
          {
            "value": "opp_possession",
            "label": "Recepcionada por rival"
          },
          {
            "value": "out_in_full",
            "label": "Directa afuera (Error)"
          },
          {
            "value": "dead_ball",
            "label": "Pelota muerta"
          }
        ]
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440128',
    'KICK_TO_TOUCH',
    'Patada a touch',
    'Ataque',
    'ATTACK',
    false,
    0,
    true,
    true,
    false,
    NULL,
    'ATTACKING',
    'KEEP',
    $$[]$$::jsonb,
    $$[
      {
        "key": "kind",
        "label": "Tipo",
        "type": "select",
        "phase": "live",
        "required": true,
        "options": [
          {
            "value": "penalty_touch",
            "label": "Penal a touch",
            "possession": "KEEP"
          },
          {
            "value": "open_play",
            "label": "Juego abierto",
            "possession": "OTHER"
          }
        ]
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440111',
    'SCRUM',
    'Scrum',
    'Juego Fijo',
    'NEUTRAL',
    false,
    0,
    false,
    true,
    true,
    NULL,
    'ATTACKING',
    'KEEP',
    $$[]$$::jsonb,
    $$[
      {
        "key": "scrumResult",
        "label": "Resultado",
        "type": "select",
        "phase": "live",
        "required": true,
        "options": [
          {
            "value": "won_clean",
            "label": "Ganó propio limpio",
            "possession": "KEEP"
          },
          {
            "value": "lost_own",
            "label": "Perdió su introducción",
            "possession": "OTHER"
          },
          {
            "value": "stolen",
            "label": "Robó introducción rival",
            "possession": "OTHER"
          },
          {
            "value": "reset",
            "label": "Reset / Re-scrum",
            "possession": "KEEP"
          },
          {
            "value": "penalty_for",
            "label": "Penal a favor",
            "possession": "KEEP",
            "followUps": [
              {
                "code": "PENALTY_KICK"
              },
              {
                "code": "KICK_TO_TOUCH",
                "preset": {
                  "kind": "penalty_touch"
                }
              }
            ]
          },
          {
            "value": "penalty_against",
            "label": "Penal en contra",
            "possession": "OTHER",
            "followUps": [
              {
                "code": "PENALTY_KICK"
              },
              {
                "code": "KICK_TO_TOUCH",
                "preset": {
                  "kind": "penalty_touch"
                }
              }
            ]
          }
        ]
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440112',
    'LINEOUT',
    'Line-out',
    'Juego Fijo',
    'NEUTRAL',
    false,
    0,
    false,
    true,
    true,
    NULL,
    'ATTACKING',
    'KEEP',
    $$[]$$::jsonb,
    $$[
      {
        "key": "lineResult",
        "label": "Resultado",
        "type": "select",
        "phase": "live",
        "required": true,
        "options": [
          {
            "value": "won_clean",
            "label": "Ganado limpio",
            "possession": "KEEP"
          },
          {
            "value": "won_dirty",
            "label": "Ganado sucio",
            "possession": "KEEP"
          },
          {
            "value": "lost",
            "label": "Perdido (Parabrisas/Errado)",
            "possession": "OTHER"
          },
          {
            "value": "stolen",
            "label": "Robado al rival",
            "possession": "OTHER"
          },
          {
            "value": "penalty_for",
            "label": "Penal a favor",
            "possession": "KEEP",
            "followUps": [
              {
                "code": "PENALTY_KICK"
              },
              {
                "code": "KICK_TO_TOUCH",
                "preset": {
                  "kind": "penalty_touch"
                }
              }
            ]
          },
          {
            "value": "penalty_against",
            "label": "Penal en contra",
            "possession": "OTHER",
            "followUps": [
              {
                "code": "PENALTY_KICK"
              },
              {
                "code": "KICK_TO_TOUCH",
                "preset": {
                  "kind": "penalty_touch"
                }
              }
            ]
          }
        ]
      },
      {
        "key": "jumpZone",
        "label": "Zona de salto",
        "type": "select",
        "phase": "post",
        "required": false,
        "options": [
          {
            "value": "front",
            "label": "Adelante (2)"
          },
          {
            "value": "middle",
            "label": "Medio (4)"
          },
          {
            "value": "back",
            "label": "Atrás (6)"
          }
        ]
      },
      {
        "key": "isMaulFormed",
        "label": "Generó Maul",
        "type": "boolean",
        "phase": "post",
        "required": false
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440113',
    'RESTART_KICK',
    'Kick-off / Salida',
    'Juego Fijo',
    'NEUTRAL',
    false,
    0,
    true,
    true,
    true,
    NULL,
    'ATTACKING',
    'KEEP',
    $$[]$$::jsonb,
    $$[
      {
        "key": "outcome",
        "label": "Resultado",
        "type": "select",
        "phase": "live",
        "required": true,
        "options": [
          {
            "value": "received_clean",
            "label": "Recibida limpia",
            "possession": "OTHER"
          },
          {
            "value": "regained_attack",
            "label": "Recuperada",
            "possession": "KEEP"
          },
          {
            "value": "error_out_full",
            "label": "Directa afuera / No pasa 10m",
            "possession": "OTHER"
          }
        ]
      },
      {
        "key": "kickType",
        "label": "Tipo de salida",
        "type": "select",
        "phase": "post",
        "required": false,
        "options": [
          {
            "value": "halfway_start",
            "label": "Salida de centro (Mitad de cancha)"
          },
          {
            "value": "22m_drop",
            "label": "Salida de 22m"
          },
          {
            "value": "goalline_drop",
            "label": "Drop-out línea de ingol"
          }
        ]
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440114',
    'MAUL',
    'Maul',
    'Juego Fijo',
    'ATTACK',
    false,
    0,
    false,
    true,
    false,
    NULL,
    'ATTACKING',
    'KEEP',
    $$[]$$::jsonb,
    $$[
      {
        "key": "maulOutcome",
        "label": "Resultado del Maul",
        "type": "select",
        "phase": "live",
        "required": true,
        "options": [
          {
            "value": "advanced",
            "label": "Avanzó / Dominante",
            "possession": "KEEP"
          },
          {
            "value": "stopped",
            "label": "Detenido / Trabado",
            "possession": "KEEP"
          },
          {
            "value": "turnover_held",
            "label": "Pelota trabada (Turnover)",
            "possession": "OTHER"
          }
        ]
      },
      {
        "key": "metersGained",
        "label": "Metros de avance",
        "type": "number",
        "phase": "post",
        "required": false,
        "min": 0,
        "max": 30
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440115',
    'TACKLE_MADE',
    'Tackle completado',
    'Defensa',
    'DEFENSE',
    false,
    0,
    true,
    true,
    false,
    NULL,
    'DEFENDING',
    'KEEP',
    $$[]$$::jsonb,
    $$[
      {
        "key": "assisted",
        "label": "Tackle asistido (2° defensor)",
        "type": "boolean",
        "phase": "post",
        "required": false
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440116',
    'TACKLE_MISSED',
    'Tackle fallado',
    'Defensa',
    'DEFENSE',
    false,
    0,
    true,
    true,
    false,
    NULL,
    'DEFENDING',
    'KEEP',
    $$[]$$::jsonb,
    $$[
      {
        "key": "failReason",
        "label": "Motivo",
        "type": "select",
        "phase": "post",
        "required": false,
        "options": [
          {
            "value": "missed",
            "label": "No llegó / Apenas tocó"
          },
          {
            "value": "bounced_off",
            "label": "Lo superaron con físico"
          },
          {
            "value": "late",
            "label": "Llegó tarde"
          },
          {
            "value": "footwork",
            "label": "Engañado por amague"
          }
        ]
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440117',
    'TURNOVER_WON',
    'Turnover ganado',
    'Cambio de Posesión',
    'NEUTRAL',
    false,
    0,
    false,
    true,
    true,
    NULL,
    'DEFENDING',
    'ACTOR',
    $$[]$$::jsonb,
    $$[
      {
        "key": "stealType",
        "label": "Cómo lo ganó",
        "type": "select",
        "phase": "post",
        "required": true,
        "options": [
          {
            "value": "jackal_ruck",
            "label": "Pesca en Ruck"
          },
          {
            "value": "rip_standing",
            "label": "Arrancón de pie (Strip)"
          },
          {
            "value": "interception",
            "label": "Intercepción"
          },
          {
            "value": "other",
            "label": "Otro"
          }
        ]
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440119',
    'HANDLING_ERROR',
    'Knock-on / Error de manejo',
    'Cambio de Posesión',
    'NEUTRAL',
    false,
    0,
    false,
    true,
    true,
    NULL,
    'ATTACKING',
    'OTHER',
    $$[]$$::jsonb,
    $$[
      {
        "key": "errorType",
        "label": "Tipo de error",
        "type": "select",
        "phase": "live",
        "required": true,
        "options": [
          {
            "value": "knock_on",
            "label": "Knock-on (Caída adelante)"
          },
          {
            "value": "forward_pass",
            "label": "Pase hacia adelante"
          },
          {
            "value": "dropped_unforced",
            "label": "Caída no forzada"
          }
        ]
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440120',
    'KICK_RECEPTION',
    'Recepción de patada',
    'Cambio de Posesión',
    'NEUTRAL',
    false,
    0,
    false,
    true,
    true,
    NULL,
    'ATTACKING',
    'KEEP',
    $$[]$$::jsonb,
    $$[
      {
        "key": "receptionQuality",
        "label": "Resultado recepción",
        "type": "select",
        "phase": "live",
        "required": true,
        "options": [
          {
            "value": "clean_mark",
            "label": "Atrapada limpia / Mark",
            "possession": "KEEP"
          },
          {
            "value": "contested_won",
            "label": "Disputada en aire (Ganada)",
            "possession": "KEEP"
          },
          {
            "value": "fumbled",
            "label": "Pelota suelta / Error",
            "possession": "OTHER"
          }
        ]
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440121',
    'OTHER_TURNOVER',
    'Otro cambio de posesión',
    'Cambio de Posesión',
    'NEUTRAL',
    false,
    0,
    false,
    true,
    true,
    NULL,
    'ATTACKING',
    'OTHER',
    $$[]$$::jsonb,
    $$[
      {
        "key": "reason",
        "label": "Causa",
        "type": "select",
        "phase": "post",
        "required": false,
        "options": [
          {
            "value": "pushed_touch",
            "label": "Empujado a touch"
          },
          {
            "value": "held_ingoal",
            "label": "Trabado en ingoal"
          },
          {
            "value": "offensive_penalty",
            "label": "Penal del atacante"
          }
        ]
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440122',
    'PENALTY_CONCEDED',
    'Penal / Infracción',
    'Neutro',
    'NEUTRAL',
    false,
    0,
    true,
    true,
    true,
    NULL,
    'CHOOSE',
    'OTHER',
    $$[{"code": "PENALTY_KICK"}, {"code": "KICK_TO_TOUCH", "preset": {"kind": "penalty_touch"}}]$$::jsonb,
    $$[
      {
        "key": "penaltyType",
        "label": "Infracción",
        "type": "select",
        "phase": "live",
        "required": true,
        "options": [
          {
            "value": "offside",
            "label": "Offside"
          },
          {
            "value": "holding_on",
            "label": "Retención (No libera)"
          },
          {
            "value": "high_tackle",
            "label": "Tackle alto"
          },
          {
            "value": "scrum_illegal",
            "label": "Infracción Scrum"
          },
          {
            "value": "lineout_foul",
            "label": "Infracción Line-out"
          },
          {
            "value": "side_entry",
            "label": "Entrada de costado en Ruck"
          },
          {
            "value": "not_rolling_away",
            "label": "No rueda ni se aleja (Ruck)"
          },
          {
            "value": "maul_illegal",
            "label": "Derrumbe / infracción en Maul"
          }
        ]
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440123',
    'YELLOW_CARD',
    'Tarjeta Amarilla',
    'Neutro',
    'NEUTRAL',
    false,
    0,
    true,
    true,
    true,
    NULL,
    'CHOOSE',
    'KEEP',
    $$[]$$::jsonb,
    $$[
      {
        "key": "reason",
        "label": "Motivo",
        "type": "select",
        "phase": "live",
        "required": true,
        "options": [
          {
            "value": "high_tackle",
            "label": "Tackle alto / peligroso"
          },
          {
            "value": "repeated_infringements",
            "label": "Infracciones reiteradas"
          },
          {
            "value": "cynical_foul",
            "label": "Falta cínica / Cortó ataque claro"
          },
          {
            "value": "dissent",
            "label": "Protesta / Falta de respeto"
          }
        ]
      },
      {
        "key": "durationMinutes",
        "label": "Minutos de suspensión",
        "type": "number",
        "phase": "post",
        "required": false,
        "default": 10,
        "min": 1,
        "max": 20
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440124',
    'RED_CARD',
    'Tarjeta Roja / Expulsión',
    'Neutro',
    'NEUTRAL',
    false,
    0,
    true,
    true,
    true,
    NULL,
    'CHOOSE',
    'KEEP',
    $$[]$$::jsonb,
    $$[
      {
        "key": "reason",
        "label": "Motivo",
        "type": "select",
        "phase": "live",
        "required": true,
        "options": [
          {
            "value": "foul_play",
            "label": "Juego sucio grave"
          },
          {
            "value": "head_contact",
            "label": "Contacto directo a la cabeza"
          },
          {
            "value": "second_yellow",
            "label": "Segunda amarilla"
          }
        ]
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440125',
    'INJURY',
    'Lesión',
    'Neutro',
    'NEUTRAL',
    false,
    0,
    true,
    true,
    false,
    NULL,
    'CHOOSE',
    'KEEP',
    $$[]$$::jsonb,
    $$[
      {
        "key": "injuryArea",
        "label": "Zona del cuerpo",
        "type": "select",
        "phase": "post",
        "required": false,
        "options": [
          {
            "value": "head",
            "label": "Cabeza / Protocolo HIA"
          },
          {
            "value": "shoulder",
            "label": "Hombro"
          },
          {
            "value": "knee",
            "label": "Rodilla"
          },
          {
            "value": "ankle",
            "label": "Tobillo"
          },
          {
            "value": "muscle",
            "label": "Muscular"
          }
        ]
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440126',
    'SUBSTITUTION',
    'Cambio / Sustitución',
    'Neutro',
    'NEUTRAL',
    false,
    0,
    false,
    true,
    true,
    NULL,
    'CHOOSE',
    'KEEP',
    $$[]$$::jsonb,
    $$[
      {"key":"playerOutNumber","label":"Jugador que sale","type":"number","phase":"live","required":true,"min":1,"max":15},
      {"key":"playerInNumber","label":"Jugador que entra","type":"number","phase":"live","required":true,"min":16,"max":23}
    ]$$::jsonb,
    CURRENT_TIMESTAMP
);


-- =========================================
-- EVENTS (Eventos registrados en el partido)
-- =========================================
/* 
INSERT INTO events (id, match_id, player_id, event_type_id, team_possession, match_time, real_time, period, origin, created_at, synchronized_at, active) VALUES
    ('11111111-1111-1111-1111-000000000300', '11111111-1111-1111-1111-000000000040', '11111111-1111-1111-1111-000000000104', '11111111-1111-1111-1111-000000000051', 'OPPONENT', 0, CURRENT_TIMESTAMP, 1, 'APP', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000301', '11111111-1111-1111-1111-000000000040', '11111111-1111-1111-1111-000000000106', '11111111-1111-1111-1111-000000000052', 'NEUTRAL', 5, CURRENT_TIMESTAMP, 1, 'APP', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000302', '11111111-1111-1111-1111-000000000040', '11111111-1111-1111-1111-000000000103', '11111111-1111-1111-1111-000000000052', 'NEUTRAL', 10, CURRENT_TIMESTAMP, 1, 'APP', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000303', '11111111-1111-1111-1111-000000000040', '11111111-1111-1111-1111-000000000108', '11111111-1111-1111-1111-000000000052', 'NEUTRAL', 15, CURRENT_TIMESTAMP, 1, 'APP', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000304', '11111111-1111-1111-1111-000000000040', '11111111-1111-1111-1111-000000000101', '11111111-1111-1111-1111-000000000052', 'NEUTRAL', 20, CURRENT_TIMESTAMP, 1, 'APP', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000305', '11111111-1111-1111-1111-000000000040', '11111111-1111-1111-1111-000000000105', '11111111-1111-1111-1111-000000000050', 'OWN', 25, CURRENT_TIMESTAMP, 1, 'APP', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000306', '11111111-1111-1111-1111-000000000040', '11111111-1111-1111-1111-000000000107', '11111111-1111-1111-1111-000000000050', 'OWN', 30, CURRENT_TIMESTAMP, 1, 'APP', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000307', '11111111-1111-1111-1111-000000000040', '11111111-1111-1111-1111-000000000104', '11111111-1111-1111-1111-000000000052', 'NEUTRAL', 35, CURRENT_TIMESTAMP, 1, 'APP', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000308', '11111111-1111-1111-1111-000000000040', '11111111-1111-1111-1111-000000000113', '11111111-1111-1111-1111-000000000051', 'OPPONENT', 40, CURRENT_TIMESTAMP, 1, 'APP', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
     */

    -- Eventos para Partido 5: Deportivo Portugués (FINISHED, 80 min reloj, finalizado a las 2h reales)
INSERT INTO events (id, match_id, player_id, event_type_id, team_possession, match_time, absolute_match_time, real_time, period, origin, active, created_at, synchronized_at) VALUES
    ('2dc019ed-223b-4c38-ac4c-ded58efd8e29', '11111111-1111-1111-1111-000000000044', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 44, 58, '2026-09-21 15:30:58', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('cef3334a-c0bc-4a7b-ace8-736d6e5bad65', '11111111-1111-1111-1111-000000000044', NULL, '550e8400-e29b-41d4-a716-446655440104', 'OPPONENT', 78, 103, '2026-09-21 15:31:43', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('180cdf49-b829-4d08-aadf-71f69983a651', '11111111-1111-1111-1111-000000000044', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 153, 203, '2026-09-21 15:33:23', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('91bafd3c-06a8-4358-9b13-eeb98d38ac93', '11111111-1111-1111-1111-000000000044', NULL, '550e8400-e29b-41d4-a716-446655440122', 'OWN', 156, 207, '2026-09-21 15:33:27', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('5df3b1ae-520d-4c4c-976c-5e1f239a3da3', '11111111-1111-1111-1111-000000000044', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440115', 'NEUTRAL', 185, 246, '2026-09-21 15:34:06', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('69c9c5b1-083f-4289-83d7-e4c50da153bf', '11111111-1111-1111-1111-000000000044', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440122', 'OWN', 431, 579, '2026-09-21 15:39:39', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('f549de96-7e3c-4ed6-a5af-017bdc386bc0', '11111111-1111-1111-1111-000000000044', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 576, 777, '2026-09-21 15:42:57', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('df2c2461-664a-490f-bab8-7d57dd508388', '11111111-1111-1111-1111-000000000044', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440122', 'NEUTRAL', 677, 915, '2026-09-21 15:45:15', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('9ec5309b-402f-4d9c-a69c-e9a01d245857', '11111111-1111-1111-1111-000000000044', '11111111-1111-1111-1111-000000000101', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 949, 1289, '2026-09-21 15:51:29', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('2e3bc95b-49a5-492e-b13e-2125a9a721e8', '11111111-1111-1111-1111-000000000044', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 1035, 1407, '2026-09-21 15:53:27', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('aa55efec-95f0-46be-b7d1-70ab1bfb5414', '11111111-1111-1111-1111-000000000044', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440122', 'NEUTRAL', 1041, 1415, '2026-09-21 15:53:35', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('82622c32-386c-4175-ae66-e654f338b029', '11111111-1111-1111-1111-000000000044', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 1082, 1472, '2026-09-21 15:54:32', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('a2442cae-f008-4dcc-8bf0-90d04f488a33', '11111111-1111-1111-1111-000000000044', NULL, '550e8400-e29b-41d4-a716-446655440122', 'OPPONENT', 1231, 1677, '2026-09-21 15:57:57', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('5ed1910b-8815-4703-9b64-81969f95c317', '11111111-1111-1111-1111-000000000044', NULL, '550e8400-e29b-41d4-a716-446655440104', 'OPPONENT', 1308, 1784, '2026-09-21 15:59:44', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ed1a63fc-fe74-48be-9737-b18fcfdc8ae6', '11111111-1111-1111-1111-000000000044', NULL, '550e8400-e29b-41d4-a716-446655440122', 'OWN', 1315, 1794, '2026-09-21 15:59:54', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('8aab944d-0352-47fe-bd90-0c8fe90d2b63', '11111111-1111-1111-1111-000000000044', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 1347, 1838, '2026-09-21 16:00:38', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('39dc8574-bbdc-46cd-9f45-9b51ac01030e', '11111111-1111-1111-1111-000000000044', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 1381, 1885, '2026-09-21 16:01:25', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('974c7cd8-6a60-4bd6-8a17-0c012f4f34c0', '11111111-1111-1111-1111-000000000044', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 1391, 1899, '2026-09-21 16:01:39', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('e41031fb-54b2-41a7-ba04-4128a1d7b190', '11111111-1111-1111-1111-000000000044', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440112', 'NEUTRAL', 1482, 2025, '2026-09-21 16:03:45', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('31446a7c-1f14-424a-b639-19243e021d0f', '11111111-1111-1111-1111-000000000044', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440116', 'NEUTRAL', 1488, 2033, '2026-09-21 16:03:53', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('a187ff91-4923-4b3c-b794-30356cb9f19c', '11111111-1111-1111-1111-000000000044', NULL, '550e8400-e29b-41d4-a716-446655440104', 'OPPONENT', 1740, 2382, '2026-09-21 16:09:42', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c0cc46c0-1842-4d36-b47a-757db0860097', '11111111-1111-1111-1111-000000000044', '11111111-1111-1111-1111-000000000101', '550e8400-e29b-41d4-a716-446655440115', 'NEUTRAL', 1861, 2550, '2026-09-21 16:12:30', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('a463bb0b-44b6-4458-994b-993b9d5e61e2', '11111111-1111-1111-1111-000000000044', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 1970, 2701, '2026-09-21 16:15:01', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('9f75da86-23a7-44a4-b54a-6cc8bdcf3013', '11111111-1111-1111-1111-000000000044', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440111', 'OWN', 2058, 2824, '2026-09-21 16:17:04', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c47eca79-18be-4106-b001-500e25070681', '11111111-1111-1111-1111-000000000044', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440104', 'OWN', 2142, 2941, '2026-09-21 16:19:01', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c3f3ce42-f32b-43e9-be3d-b060adec5408', '11111111-1111-1111-1111-000000000044', NULL, '550e8400-e29b-41d4-a716-446655440122', 'OWN', 2196, 3016, '2026-09-21 16:20:16', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('4ad44d4e-77a7-4d38-8d30-77d51bd1b87c', '11111111-1111-1111-1111-000000000044', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440117', 'NEUTRAL', 2364, 3250, '2026-09-21 16:24:10', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('194e28dd-09af-4295-96b6-620c931557ff', '11111111-1111-1111-1111-000000000044', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 2428, 4035, '2026-09-21 16:37:15', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('4455830d-ac42-4bc2-900e-403ffa8c4216', '11111111-1111-1111-1111-000000000044', NULL, '550e8400-e29b-41d4-a716-446655440111', 'OPPONENT', 2485, 4109, '2026-09-21 16:38:29', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('dfc3a67c-199c-41d1-8235-d5fcec97ebfc', '11111111-1111-1111-1111-000000000044', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OWN', 2819, 4547, '2026-09-21 16:45:47', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('1afc98eb-4aa7-4a71-bec0-4254686ca5e7', '11111111-1111-1111-1111-000000000044', '11111111-1111-1111-1111-000000000103', '550e8400-e29b-41d4-a716-446655440116', 'NEUTRAL', 2868, 4612, '2026-09-21 16:46:52', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('a65cb958-0706-4a9e-b9df-326f243aeb89', '11111111-1111-1111-1111-000000000044', NULL, '550e8400-e29b-41d4-a716-446655440122', 'OPPONENT', 2974, 4752, '2026-09-21 16:49:12', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('bf3ae683-d161-43ad-abca-c778b59d4afd', '11111111-1111-1111-1111-000000000044', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 3054, 4858, '2026-09-21 16:50:58', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('879c1eb6-1d8c-4f65-9ecd-4af69018fdd3', '11111111-1111-1111-1111-000000000044', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 3102, 4922, '2026-09-21 16:52:02', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('43bd7d0c-f830-4de3-89a2-d7ef79ad9af2', '11111111-1111-1111-1111-000000000044', NULL, '550e8400-e29b-41d4-a716-446655440122', 'OPPONENT', 3436, 5367, '2026-09-21 16:59:27', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('a577a61f-14be-46bb-8cfc-8c048431033f', '11111111-1111-1111-1111-000000000044', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 3540, 5506, '2026-09-21 17:01:46', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('c042f22b-6ae4-4a71-8acf-932966773f00', '11111111-1111-1111-1111-000000000044', NULL, '550e8400-e29b-41d4-a716-446655440104', 'OPPONENT', 3556, 5528, '2026-09-21 17:02:08', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('d9614121-923a-4b13-8de1-c77d6c435e1e', '11111111-1111-1111-1111-000000000044', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440122', 'OWN', 3586, 5568, '2026-09-21 17:02:48', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('aad5245f-688a-48a5-8785-c6d52e1e7bc7', '11111111-1111-1111-1111-000000000044', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 3678, 5691, '2026-09-21 17:04:51', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('d490971f-b027-456e-84ba-f4e7767f4adc', '11111111-1111-1111-1111-000000000044', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440112', 'NEUTRAL', 3815, 5874, '2026-09-21 17:07:54', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('17c68ea6-3dfd-4d71-bdfa-4376646de749', '11111111-1111-1111-1111-000000000044', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440117', 'NEUTRAL', 3850, 5921, '2026-09-21 17:08:41', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('669ec581-5412-4b1f-963c-f7dd3b721d61', '11111111-1111-1111-1111-000000000044', NULL, '550e8400-e29b-41d4-a716-446655440122', 'OPPONENT', 3951, 6057, '2026-09-21 17:10:57', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('bef0980c-9ee1-4401-9070-b877fe511ab8', '11111111-1111-1111-1111-000000000044', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 3980, 6096, '2026-09-21 17:11:36', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('dc7fd442-2faf-4c71-b73e-4712eeac9e12', '11111111-1111-1111-1111-000000000044', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 4088, 6241, '2026-09-21 17:14:01', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('7ff293bc-cdec-4b67-8679-c25d81ad914d', '11111111-1111-1111-1111-000000000044', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 4183, 6369, '2026-09-21 17:16:09', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('02d72880-4f32-448a-87a3-ddf4d60e062b', '11111111-1111-1111-1111-000000000044', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440111', 'NEUTRAL', 4191, 6379, '2026-09-21 17:16:19', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('0ff1a8c5-d3c5-4ff5-9117-ec15f1d1c03a', '11111111-1111-1111-1111-000000000044', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 4316, 6548, '2026-09-21 17:19:08', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('5d24aba0-8595-4b02-8e03-6f6e5dc7b0ee', '11111111-1111-1111-1111-000000000044', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 4599, 6929, '2026-09-21 17:25:29', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('29a69428-66af-4aa8-a19a-fb5c8eb01cce', '11111111-1111-1111-1111-000000000044', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440117', 'NEUTRAL', 4670, 7025, '2026-09-21 17:27:05', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('2313cc2f-efab-4959-a793-eb9f77a22942', '11111111-1111-1111-1111-000000000044', NULL, '550e8400-e29b-41d4-a716-446655440104', 'OPPONENT', 4778, 7170, '2026-09-21 17:29:30', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

    -- Eventos para Partido 7: Comodoro Rugby Club (HALFTIME)
INSERT INTO events (id, match_id, player_id, event_type_id, team_possession, match_time, real_time, period, origin, active, created_at, synchronized_at) VALUES
    ('22222222-2222-2222-2222-000000000001', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 25, '2026-10-09 15:30:25', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000002', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 48, '2026-10-09 15:30:48', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000003', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 80, '2026-10-09 15:31:20', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000004', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 115, '2026-10-09 15:31:55', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000005', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440111', 'NEUTRAL', 145, '2026-10-09 15:32:25', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000006', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000103', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 178, '2026-10-09 15:32:58', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000007', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440122', 'OWN', 210, '2026-10-09 15:33:30', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000008', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440112', 'NEUTRAL', 245, '2026-10-09 15:34:05', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000009', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 280, '2026-10-09 15:34:40', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000010', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000101', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 310, '2026-10-09 15:35:10', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000011', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440122', 'OWN', 355, '2026-10-09 15:35:55', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000012', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440104', 'OPPONENT', 390, '2026-10-09 15:36:30', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000013', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440112', 'NEUTRAL', 430, '2026-10-09 15:37:10', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000014', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 455, '2026-10-09 15:37:35', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000015', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 490, '2026-10-09 15:38:10', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000016', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 520, '2026-10-09 15:38:40', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000017', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 555, '2026-10-09 15:39:15', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000018', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 585, '2026-10-09 15:39:45', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000019', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440111', 'NEUTRAL', 615, '2026-10-09 15:40:15', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000020', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 645, '2026-10-09 15:40:45', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000021', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440122', 'OPPONENT', 675, '2026-10-09 15:41:15', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000022', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440112', 'NEUTRAL', 705, '2026-10-09 15:41:45', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000023', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 735, '2026-10-09 15:42:15', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000024', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 755, '2026-10-09 15:42:35', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000025', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440102', 'OWN', 795, '2026-10-09 15:43:15', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000026', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 830, '2026-10-09 15:43:50', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000027', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 860, '2026-10-09 15:44:20', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000028', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440111', 'NEUTRAL', 890, '2026-10-09 15:44:50', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000029', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000101', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 920, '2026-10-09 15:45:20', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000030', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 955, '2026-10-09 15:45:55', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000031', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440122', 'OWN', 985, '2026-10-09 15:46:25', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000032', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 1020, '2026-10-09 15:47:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000033', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440102', 'OPPONENT', 1065, '2026-10-09 15:47:45', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000034', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440112', 'NEUTRAL', 1110, '2026-10-09 15:48:30', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000035', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1135, '2026-10-09 15:48:55', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000036', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1170, '2026-10-09 15:49:30', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000037', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 1200, '2026-10-09 15:50:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000038', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440111', 'NEUTRAL', 1230, '2026-10-09 15:50:30', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000039', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000103', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1260, '2026-10-09 15:51:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000040', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440122', 'OPPONENT', 1295, '2026-10-09 15:51:35', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000041', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440104', 'OWN', 1330, '2026-10-09 15:52:10', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000042', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440112', 'NEUTRAL', 1370, '2026-10-09 15:52:50', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000043', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1400, '2026-10-09 15:53:20', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000044', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 1430, '2026-10-09 15:53:50', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000045', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 1460, '2026-10-09 15:54:20', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000046', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440125', 'OWN', 1495, '2026-10-09 15:54:55', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000047', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440111', 'NEUTRAL', 1525, '2026-10-09 15:55:25', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000048', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1560, '2026-10-09 15:56:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000049', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1590, '2026-10-09 15:56:30', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000050', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440105', 'OWN', 1630, '2026-10-09 15:57:10', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000051', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440112', 'NEUTRAL', 1670, '2026-10-09 15:57:50', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000052', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1700, '2026-10-09 15:58:20', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000053', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440122', 'OPPONENT', 1735, '2026-10-09 15:58:55', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000054', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 1765, '2026-10-09 15:59:25', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000055', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440111', 'NEUTRAL', 1800, '2026-10-09 16:00:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000056', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440122', 'OWN', 1830, '2026-10-09 16:00:30', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000057', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440104', 'OPPONENT', 1865, '2026-10-09 16:01:05', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000058', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440112', 'NEUTRAL', 1900, '2026-10-09 16:01:40', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000059', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1925, '2026-10-09 16:02:05', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000060', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440123', 'OWN', 1955, '2026-10-09 16:02:35', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000061', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 1985, '2026-10-09 16:03:05', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000062', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440123', 'OPPONENT', 2020, '2026-10-09 16:03:40', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000063', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2050, '2026-10-09 16:04:10', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000064', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000101', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 2080, '2026-10-09 16:04:40', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000065', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2110, '2026-10-09 16:05:10', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000066', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440111', 'NEUTRAL', 2145, '2026-10-09 16:05:45', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000067', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2175, '2026-10-09 16:06:15', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000068', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440125', 'OPPONENT', 2205, '2026-10-09 16:06:45', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000069', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440112', 'NEUTRAL', 2235, '2026-10-09 16:07:15', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000070', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 2265, '2026-10-09 16:07:45', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000071', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 2295, '2026-10-09 16:08:15', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000072', '11111111-1111-1111-1111-000000000046', NULL, '550e8400-e29b-41d4-a716-446655440122', 'OPPONENT', 2320, '2026-10-09 16:08:40', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000073', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440104', 'OWN', 2350, '2026-10-09 16:09:10', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000074', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2375, '2026-10-09 16:09:35', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-000000000075', '11111111-1111-1111-1111-000000000046', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2395, '2026-10-09 16:09:55', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);


-- =========================================
-- ROSTERS (Jugadores Asignados a Partidos)
-- =========================================
INSERT INTO matches_players (id, role, division_id, match_id) VALUES
    ('55555555-5555-5555-5555-000000400000', 'TITULAR', '11111111-1111-1111-1111-000000000200', '11111111-1111-1111-1111-000000000040'),
    ('55555555-5555-5555-5555-000000400001', 'TITULAR', '11111111-1111-1111-1111-000000000201', '11111111-1111-1111-1111-000000000040'),
    ('55555555-5555-5555-5555-000000400002', 'TITULAR', '11111111-1111-1111-1111-000000000202', '11111111-1111-1111-1111-000000000040'),
    ('55555555-5555-5555-5555-000000400003', 'TITULAR', '11111111-1111-1111-1111-000000000203', '11111111-1111-1111-1111-000000000040'),
    ('55555555-5555-5555-5555-000000400004', 'TITULAR', '11111111-1111-1111-1111-000000000204', '11111111-1111-1111-1111-000000000040'),
    ('55555555-5555-5555-5555-000000400005', 'TITULAR', '11111111-1111-1111-1111-000000000205', '11111111-1111-1111-1111-000000000040'),
    ('55555555-5555-5555-5555-000000400006', 'TITULAR', '11111111-1111-1111-1111-000000000206', '11111111-1111-1111-1111-000000000040'),
    ('55555555-5555-5555-5555-000000400007', 'TITULAR', '11111111-1111-1111-1111-000000000207', '11111111-1111-1111-1111-000000000040'),
    ('55555555-5555-5555-5555-000000400008', 'TITULAR', '11111111-1111-1111-1111-000000000208', '11111111-1111-1111-1111-000000000040'),
    ('55555555-5555-5555-5555-000000400009', 'TITULAR', '11111111-1111-1111-1111-000000000209', '11111111-1111-1111-1111-000000000040'),
    ('55555555-5555-5555-5555-000000400010', 'TITULAR', '11111111-1111-1111-1111-000000000210', '11111111-1111-1111-1111-000000000040'),
    ('55555555-5555-5555-5555-000000400011', 'TITULAR', '11111111-1111-1111-1111-000000000211', '11111111-1111-1111-1111-000000000040'),
    ('55555555-5555-5555-5555-000000400012', 'TITULAR', '11111111-1111-1111-1111-000000000212', '11111111-1111-1111-1111-000000000040'),
    ('55555555-5555-5555-5555-000000400013', 'TITULAR', '11111111-1111-1111-1111-000000000213', '11111111-1111-1111-1111-000000000040'),
    ('55555555-5555-5555-5555-000000400014', 'TITULAR', '11111111-1111-1111-1111-000000000214', '11111111-1111-1111-1111-000000000040'),
    ('55555555-5555-5555-5555-000000400015', 'SUPLENTE', '11111111-1111-1111-1111-000000000215', '11111111-1111-1111-1111-000000000040'),
    ('55555555-5555-5555-5555-000000400016', 'SUPLENTE', '11111111-1111-1111-1111-000000000216', '11111111-1111-1111-1111-000000000040'),
    ('55555555-5555-5555-5555-000000400017', 'SUPLENTE', '11111111-1111-1111-1111-000000000217', '11111111-1111-1111-1111-000000000040'),
    ('55555555-5555-5555-5555-000000400018', 'SUPLENTE', '11111111-1111-1111-1111-000000000218', '11111111-1111-1111-1111-000000000040'),
    ('55555555-5555-5555-5555-000000400019', 'SUPLENTE', '11111111-1111-1111-1111-000000000219', '11111111-1111-1111-1111-000000000040'),
    ('55555555-5555-5555-5555-000000400020', 'SUPLENTE', '11111111-1111-1111-1111-000000000220', '11111111-1111-1111-1111-000000000040'),
    ('55555555-5555-5555-5555-000000400021', 'SUPLENTE', '11111111-1111-1111-1111-000000000221', '11111111-1111-1111-1111-000000000040'),
    ('55555555-5555-5555-5555-000000400022', 'SUPLENTE', '11111111-1111-1111-1111-000000000222', '11111111-1111-1111-1111-000000000040'),
    ('55555555-5555-5555-5555-000000430000', 'TITULAR', '11111111-1111-1111-1111-000000000200', '11111111-1111-1111-1111-000000000043'),
    ('55555555-5555-5555-5555-000000430001', 'TITULAR', '11111111-1111-1111-1111-000000000201', '11111111-1111-1111-1111-000000000043'),
    ('55555555-5555-5555-5555-000000430002', 'TITULAR', '11111111-1111-1111-1111-000000000202', '11111111-1111-1111-1111-000000000043'),
    ('55555555-5555-5555-5555-000000430003', 'TITULAR', '11111111-1111-1111-1111-000000000203', '11111111-1111-1111-1111-000000000043'),
    ('55555555-5555-5555-5555-000000430004', 'TITULAR', '11111111-1111-1111-1111-000000000204', '11111111-1111-1111-1111-000000000043'),
    ('55555555-5555-5555-5555-000000430005', 'TITULAR', '11111111-1111-1111-1111-000000000205', '11111111-1111-1111-1111-000000000043'),
    ('55555555-5555-5555-5555-000000430006', 'TITULAR', '11111111-1111-1111-1111-000000000206', '11111111-1111-1111-1111-000000000043'),
    ('55555555-5555-5555-5555-000000430007', 'TITULAR', '11111111-1111-1111-1111-000000000207', '11111111-1111-1111-1111-000000000043'),
    ('55555555-5555-5555-5555-000000430008', 'TITULAR', '11111111-1111-1111-1111-000000000208', '11111111-1111-1111-1111-000000000043'),
    ('55555555-5555-5555-5555-000000430009', 'TITULAR', '11111111-1111-1111-1111-000000000209', '11111111-1111-1111-1111-000000000043'),
    ('55555555-5555-5555-5555-000000430010', 'TITULAR', '11111111-1111-1111-1111-000000000210', '11111111-1111-1111-1111-000000000043'),
    ('55555555-5555-5555-5555-000000430011', 'TITULAR', '11111111-1111-1111-1111-000000000211', '11111111-1111-1111-1111-000000000043'),
    ('55555555-5555-5555-5555-000000430012', 'TITULAR', '11111111-1111-1111-1111-000000000212', '11111111-1111-1111-1111-000000000043'),
    ('55555555-5555-5555-5555-000000430013', 'TITULAR', '11111111-1111-1111-1111-000000000213', '11111111-1111-1111-1111-000000000043'),
    ('55555555-5555-5555-5555-000000430014', 'TITULAR', '11111111-1111-1111-1111-000000000214', '11111111-1111-1111-1111-000000000043'),
    ('55555555-5555-5555-5555-000000430015', 'SUPLENTE', '11111111-1111-1111-1111-000000000215', '11111111-1111-1111-1111-000000000043'),
    ('55555555-5555-5555-5555-000000430016', 'SUPLENTE', '11111111-1111-1111-1111-000000000216', '11111111-1111-1111-1111-000000000043'),
    ('55555555-5555-5555-5555-000000430017', 'SUPLENTE', '11111111-1111-1111-1111-000000000217', '11111111-1111-1111-1111-000000000043'),
    ('55555555-5555-5555-5555-000000430018', 'SUPLENTE', '11111111-1111-1111-1111-000000000218', '11111111-1111-1111-1111-000000000043'),
    ('55555555-5555-5555-5555-000000430019', 'SUPLENTE', '11111111-1111-1111-1111-000000000219', '11111111-1111-1111-1111-000000000043'),
    ('55555555-5555-5555-5555-000000430020', 'SUPLENTE', '11111111-1111-1111-1111-000000000220', '11111111-1111-1111-1111-000000000043'),
    ('55555555-5555-5555-5555-000000430021', 'SUPLENTE', '11111111-1111-1111-1111-000000000221', '11111111-1111-1111-1111-000000000043'),
    ('55555555-5555-5555-5555-000000430022', 'SUPLENTE', '11111111-1111-1111-1111-000000000222', '11111111-1111-1111-1111-000000000043'),
    ('55555555-5555-5555-5555-000000410000', 'TITULAR', '11111111-1111-1111-1111-000000000200', '11111111-1111-1111-1111-000000000041'),
    ('55555555-5555-5555-5555-000000410001', 'TITULAR', '11111111-1111-1111-1111-000000000201', '11111111-1111-1111-1111-000000000041'),
    ('55555555-5555-5555-5555-000000410002', 'TITULAR', '11111111-1111-1111-1111-000000000202', '11111111-1111-1111-1111-000000000041'),
    ('55555555-5555-5555-5555-000000410003', 'TITULAR', '11111111-1111-1111-1111-000000000203', '11111111-1111-1111-1111-000000000041'),
    ('55555555-5555-5555-5555-000000410004', 'TITULAR', '11111111-1111-1111-1111-000000000204', '11111111-1111-1111-1111-000000000041'),
    ('55555555-5555-5555-5555-000000410005', 'TITULAR', '11111111-1111-1111-1111-000000000205', '11111111-1111-1111-1111-000000000041'),
    ('55555555-5555-5555-5555-000000410006', 'TITULAR', '11111111-1111-1111-1111-000000000206', '11111111-1111-1111-1111-000000000041'),
    ('55555555-5555-5555-5555-000000410007', 'TITULAR', '11111111-1111-1111-1111-000000000207', '11111111-1111-1111-1111-000000000041'),
    ('55555555-5555-5555-5555-000000410008', 'TITULAR', '11111111-1111-1111-1111-000000000208', '11111111-1111-1111-1111-000000000041'),
    ('55555555-5555-5555-5555-000000410009', 'TITULAR', '11111111-1111-1111-1111-000000000209', '11111111-1111-1111-1111-000000000041'),
    ('55555555-5555-5555-5555-000000410010', 'TITULAR', '11111111-1111-1111-1111-000000000210', '11111111-1111-1111-1111-000000000041'),
    ('55555555-5555-5555-5555-000000410011', 'TITULAR', '11111111-1111-1111-1111-000000000211', '11111111-1111-1111-1111-000000000041'),
    ('55555555-5555-5555-5555-000000410012', 'TITULAR', '11111111-1111-1111-1111-000000000212', '11111111-1111-1111-1111-000000000041'),
    ('55555555-5555-5555-5555-000000410013', 'TITULAR', '11111111-1111-1111-1111-000000000213', '11111111-1111-1111-1111-000000000041'),
    ('55555555-5555-5555-5555-000000410014', 'TITULAR', '11111111-1111-1111-1111-000000000214', '11111111-1111-1111-1111-000000000041'),
    ('55555555-5555-5555-5555-000000410015', 'SUPLENTE', '11111111-1111-1111-1111-000000000215', '11111111-1111-1111-1111-000000000041'),
    ('55555555-5555-5555-5555-000000410016', 'SUPLENTE', '11111111-1111-1111-1111-000000000216', '11111111-1111-1111-1111-000000000041'),
    ('55555555-5555-5555-5555-000000410017', 'SUPLENTE', '11111111-1111-1111-1111-000000000217', '11111111-1111-1111-1111-000000000041'),
    ('55555555-5555-5555-5555-000000410018', 'SUPLENTE', '11111111-1111-1111-1111-000000000218', '11111111-1111-1111-1111-000000000041'),
    ('55555555-5555-5555-5555-000000410019', 'SUPLENTE', '11111111-1111-1111-1111-000000000219', '11111111-1111-1111-1111-000000000041'),
    ('55555555-5555-5555-5555-000000410020', 'SUPLENTE', '11111111-1111-1111-1111-000000000220', '11111111-1111-1111-1111-000000000041'),
    ('55555555-5555-5555-5555-000000410021', 'SUPLENTE', '11111111-1111-1111-1111-000000000221', '11111111-1111-1111-1111-000000000041'),
    ('55555555-5555-5555-5555-000000410022', 'SUPLENTE', '11111111-1111-1111-1111-000000000222', '11111111-1111-1111-1111-000000000041'),
    ('55555555-5555-5555-5555-000000420000', 'TITULAR', '11111111-1111-1111-1111-000000000200', '11111111-1111-1111-1111-000000000042'),
    ('55555555-5555-5555-5555-000000420001', 'TITULAR', '11111111-1111-1111-1111-000000000201', '11111111-1111-1111-1111-000000000042'),
    ('55555555-5555-5555-5555-000000420002', 'TITULAR', '11111111-1111-1111-1111-000000000202', '11111111-1111-1111-1111-000000000042'),
    ('55555555-5555-5555-5555-000000420003', 'TITULAR', '11111111-1111-1111-1111-000000000203', '11111111-1111-1111-1111-000000000042'),
    ('55555555-5555-5555-5555-000000420004', 'TITULAR', '11111111-1111-1111-1111-000000000204', '11111111-1111-1111-1111-000000000042'),
    ('55555555-5555-5555-5555-000000420005', 'TITULAR', '11111111-1111-1111-1111-000000000205', '11111111-1111-1111-1111-000000000042'),
    ('55555555-5555-5555-5555-000000420006', 'TITULAR', '11111111-1111-1111-1111-000000000206', '11111111-1111-1111-1111-000000000042'),
    ('55555555-5555-5555-5555-000000420007', 'TITULAR', '11111111-1111-1111-1111-000000000207', '11111111-1111-1111-1111-000000000042'),
    ('55555555-5555-5555-5555-000000420008', 'TITULAR', '11111111-1111-1111-1111-000000000208', '11111111-1111-1111-1111-000000000042'),
    ('55555555-5555-5555-5555-000000420009', 'TITULAR', '11111111-1111-1111-1111-000000000209', '11111111-1111-1111-1111-000000000042'),
    ('55555555-5555-5555-5555-000000420010', 'TITULAR', '11111111-1111-1111-1111-000000000210', '11111111-1111-1111-1111-000000000042'),
    ('55555555-5555-5555-5555-000000420011', 'TITULAR', '11111111-1111-1111-1111-000000000211', '11111111-1111-1111-1111-000000000042'),
    ('55555555-5555-5555-5555-000000420012', 'TITULAR', '11111111-1111-1111-1111-000000000212', '11111111-1111-1111-1111-000000000042'),
    ('55555555-5555-5555-5555-000000420013', 'TITULAR', '11111111-1111-1111-1111-000000000213', '11111111-1111-1111-1111-000000000042'),
    ('55555555-5555-5555-5555-000000420014', 'TITULAR', '11111111-1111-1111-1111-000000000214', '11111111-1111-1111-1111-000000000042'),
    ('55555555-5555-5555-5555-000000420015', 'SUPLENTE', '11111111-1111-1111-1111-000000000215', '11111111-1111-1111-1111-000000000042'),
    ('55555555-5555-5555-5555-000000420016', 'SUPLENTE', '11111111-1111-1111-1111-000000000216', '11111111-1111-1111-1111-000000000042'),
    ('55555555-5555-5555-5555-000000420017', 'SUPLENTE', '11111111-1111-1111-1111-000000000217', '11111111-1111-1111-1111-000000000042'),
    ('55555555-5555-5555-5555-000000420018', 'SUPLENTE', '11111111-1111-1111-1111-000000000218', '11111111-1111-1111-1111-000000000042'),
    ('55555555-5555-5555-5555-000000420019', 'SUPLENTE', '11111111-1111-1111-1111-000000000219', '11111111-1111-1111-1111-000000000042'),
    ('55555555-5555-5555-5555-000000420020', 'SUPLENTE', '11111111-1111-1111-1111-000000000220', '11111111-1111-1111-1111-000000000042'),
    ('55555555-5555-5555-5555-000000420021', 'SUPLENTE', '11111111-1111-1111-1111-000000000221', '11111111-1111-1111-1111-000000000042'),
    ('55555555-5555-5555-5555-000000420022', 'SUPLENTE', '11111111-1111-1111-1111-000000000222', '11111111-1111-1111-1111-000000000042'),
    ('55555555-5555-5555-5555-000000440000', 'TITULAR', '11111111-1111-1111-1111-000000000200', '11111111-1111-1111-1111-000000000044'),
    ('55555555-5555-5555-5555-000000440001', 'TITULAR', '11111111-1111-1111-1111-000000000201', '11111111-1111-1111-1111-000000000044'),
    ('55555555-5555-5555-5555-000000440002', 'TITULAR', '11111111-1111-1111-1111-000000000202', '11111111-1111-1111-1111-000000000044'),
    ('55555555-5555-5555-5555-000000440003', 'TITULAR', '11111111-1111-1111-1111-000000000203', '11111111-1111-1111-1111-000000000044'),
    ('55555555-5555-5555-5555-000000440004', 'TITULAR', '11111111-1111-1111-1111-000000000204', '11111111-1111-1111-1111-000000000044'),
    ('55555555-5555-5555-5555-000000440005', 'TITULAR', '11111111-1111-1111-1111-000000000205', '11111111-1111-1111-1111-000000000044'),
    ('55555555-5555-5555-5555-000000440006', 'TITULAR', '11111111-1111-1111-1111-000000000206', '11111111-1111-1111-1111-000000000044'),
    ('55555555-5555-5555-5555-000000440007', 'TITULAR', '11111111-1111-1111-1111-000000000207', '11111111-1111-1111-1111-000000000044'),
    ('55555555-5555-5555-5555-000000440008', 'TITULAR', '11111111-1111-1111-1111-000000000208', '11111111-1111-1111-1111-000000000044'),
    ('55555555-5555-5555-5555-000000440009', 'TITULAR', '11111111-1111-1111-1111-000000000209', '11111111-1111-1111-1111-000000000044'),
    ('55555555-5555-5555-5555-000000440010', 'TITULAR', '11111111-1111-1111-1111-000000000210', '11111111-1111-1111-1111-000000000044'),
    ('55555555-5555-5555-5555-000000440011', 'TITULAR', '11111111-1111-1111-1111-000000000211', '11111111-1111-1111-1111-000000000044'),
    ('55555555-5555-5555-5555-000000440012', 'TITULAR', '11111111-1111-1111-1111-000000000212', '11111111-1111-1111-1111-000000000044'),
    ('55555555-5555-5555-5555-000000440013', 'TITULAR', '11111111-1111-1111-1111-000000000213', '11111111-1111-1111-1111-000000000044'),
    ('55555555-5555-5555-5555-000000440014', 'TITULAR', '11111111-1111-1111-1111-000000000214', '11111111-1111-1111-1111-000000000044'),
    ('55555555-5555-5555-5555-000000440015', 'SUPLENTE', '11111111-1111-1111-1111-000000000215', '11111111-1111-1111-1111-000000000044'),
    ('55555555-5555-5555-5555-000000440016', 'SUPLENTE', '11111111-1111-1111-1111-000000000216', '11111111-1111-1111-1111-000000000044'),
    ('55555555-5555-5555-5555-000000440017', 'SUPLENTE', '11111111-1111-1111-1111-000000000217', '11111111-1111-1111-1111-000000000044'),
    ('55555555-5555-5555-5555-000000440018', 'SUPLENTE', '11111111-1111-1111-1111-000000000218', '11111111-1111-1111-1111-000000000044'),
    ('55555555-5555-5555-5555-000000440019', 'SUPLENTE', '11111111-1111-1111-1111-000000000219', '11111111-1111-1111-1111-000000000044'),
    ('55555555-5555-5555-5555-000000440020', 'SUPLENTE', '11111111-1111-1111-1111-000000000220', '11111111-1111-1111-1111-000000000044'),
    ('55555555-5555-5555-5555-000000440021', 'SUPLENTE', '11111111-1111-1111-1111-000000000221', '11111111-1111-1111-1111-000000000044'),
    ('55555555-5555-5555-5555-000000440022', 'SUPLENTE', '11111111-1111-1111-1111-000000000222', '11111111-1111-1111-1111-000000000044'),
    ('55555555-5555-5555-5555-000000450000', 'TITULAR', '11111111-1111-1111-1111-000000000200', '11111111-1111-1111-1111-000000000045'),
    ('55555555-5555-5555-5555-000000450001', 'TITULAR', '11111111-1111-1111-1111-000000000201', '11111111-1111-1111-1111-000000000045'),
    ('55555555-5555-5555-5555-000000450002', 'TITULAR', '11111111-1111-1111-1111-000000000202', '11111111-1111-1111-1111-000000000045'),
    ('55555555-5555-5555-5555-000000450003', 'TITULAR', '11111111-1111-1111-1111-000000000203', '11111111-1111-1111-1111-000000000045'),
    ('55555555-5555-5555-5555-000000450004', 'TITULAR', '11111111-1111-1111-1111-000000000204', '11111111-1111-1111-1111-000000000045'),
    ('55555555-5555-5555-5555-000000450005', 'TITULAR', '11111111-1111-1111-1111-000000000205', '11111111-1111-1111-1111-000000000045'),
    ('55555555-5555-5555-5555-000000450006', 'TITULAR', '11111111-1111-1111-1111-000000000206', '11111111-1111-1111-1111-000000000045'),
    ('55555555-5555-5555-5555-000000450007', 'TITULAR', '11111111-1111-1111-1111-000000000207', '11111111-1111-1111-1111-000000000045'),
    ('55555555-5555-5555-5555-000000450008', 'TITULAR', '11111111-1111-1111-1111-000000000208', '11111111-1111-1111-1111-000000000045'),
    ('55555555-5555-5555-5555-000000450009', 'TITULAR', '11111111-1111-1111-1111-000000000209', '11111111-1111-1111-1111-000000000045'),
    ('55555555-5555-5555-5555-000000450010', 'TITULAR', '11111111-1111-1111-1111-000000000210', '11111111-1111-1111-1111-000000000045'),
    ('55555555-5555-5555-5555-000000450011', 'TITULAR', '11111111-1111-1111-1111-000000000211', '11111111-1111-1111-1111-000000000045'),
    ('55555555-5555-5555-5555-000000450012', 'TITULAR', '11111111-1111-1111-1111-000000000212', '11111111-1111-1111-1111-000000000045'),
    ('55555555-5555-5555-5555-000000450013', 'TITULAR', '11111111-1111-1111-1111-000000000213', '11111111-1111-1111-1111-000000000045'),
    ('55555555-5555-5555-5555-000000450014', 'TITULAR', '11111111-1111-1111-1111-000000000214', '11111111-1111-1111-1111-000000000045'),
    ('55555555-5555-5555-5555-000000450015', 'SUPLENTE', '11111111-1111-1111-1111-000000000215', '11111111-1111-1111-1111-000000000045'),
    ('55555555-5555-5555-5555-000000450016', 'SUPLENTE', '11111111-1111-1111-1111-000000000216', '11111111-1111-1111-1111-000000000045'),
    ('55555555-5555-5555-5555-000000450017', 'SUPLENTE', '11111111-1111-1111-1111-000000000217', '11111111-1111-1111-1111-000000000045'),
    ('55555555-5555-5555-5555-000000450018', 'SUPLENTE', '11111111-1111-1111-1111-000000000218', '11111111-1111-1111-1111-000000000045'),
    ('55555555-5555-5555-5555-000000450019', 'SUPLENTE', '11111111-1111-1111-1111-000000000219', '11111111-1111-1111-1111-000000000045'),
    ('55555555-5555-5555-5555-000000450020', 'SUPLENTE', '11111111-1111-1111-1111-000000000220', '11111111-1111-1111-1111-000000000045'),
    ('55555555-5555-5555-5555-000000450021', 'SUPLENTE', '11111111-1111-1111-1111-000000000221', '11111111-1111-1111-1111-000000000045'),
    ('55555555-5555-5555-5555-000000450022', 'SUPLENTE', '11111111-1111-1111-1111-000000000222', '11111111-1111-1111-1111-000000000045'),
    ('55555555-5555-5555-5555-000000460000', 'TITULAR', '11111111-1111-1111-1111-000000000200', '11111111-1111-1111-1111-000000000046'),
    ('55555555-5555-5555-5555-000000460001', 'TITULAR', '11111111-1111-1111-1111-000000000201', '11111111-1111-1111-1111-000000000046'),
    ('55555555-5555-5555-5555-000000460002', 'TITULAR', '11111111-1111-1111-1111-000000000202', '11111111-1111-1111-1111-000000000046'),
    ('55555555-5555-5555-5555-000000460003', 'TITULAR', '11111111-1111-1111-1111-000000000203', '11111111-1111-1111-1111-000000000046'),
    ('55555555-5555-5555-5555-000000460004', 'TITULAR', '11111111-1111-1111-1111-000000000204', '11111111-1111-1111-1111-000000000046'),
    ('55555555-5555-5555-5555-000000460005', 'TITULAR', '11111111-1111-1111-1111-000000000205', '11111111-1111-1111-1111-000000000046'),
    ('55555555-5555-5555-5555-000000460006', 'TITULAR', '11111111-1111-1111-1111-000000000206', '11111111-1111-1111-1111-000000000046'),
    ('55555555-5555-5555-5555-000000460007', 'TITULAR', '11111111-1111-1111-1111-000000000207', '11111111-1111-1111-1111-000000000046'),
    ('55555555-5555-5555-5555-000000460008', 'TITULAR', '11111111-1111-1111-1111-000000000208', '11111111-1111-1111-1111-000000000046'),
    ('55555555-5555-5555-5555-000000460009', 'TITULAR', '11111111-1111-1111-1111-000000000209', '11111111-1111-1111-1111-000000000046'),
    ('55555555-5555-5555-5555-000000460010', 'TITULAR', '11111111-1111-1111-1111-000000000210', '11111111-1111-1111-1111-000000000046'),
    ('55555555-5555-5555-5555-000000460011', 'TITULAR', '11111111-1111-1111-1111-000000000211', '11111111-1111-1111-1111-000000000046'),
    ('55555555-5555-5555-5555-000000460012', 'TITULAR', '11111111-1111-1111-1111-000000000212', '11111111-1111-1111-1111-000000000046'),
    ('55555555-5555-5555-5555-000000460013', 'TITULAR', '11111111-1111-1111-1111-000000000213', '11111111-1111-1111-1111-000000000046'),
    ('55555555-5555-5555-5555-000000460014', 'TITULAR', '11111111-1111-1111-1111-000000000214', '11111111-1111-1111-1111-000000000046'),
    ('55555555-5555-5555-5555-000000460015', 'SUPLENTE', '11111111-1111-1111-1111-000000000215', '11111111-1111-1111-1111-000000000046'),
    ('55555555-5555-5555-5555-000000460016', 'SUPLENTE', '11111111-1111-1111-1111-000000000216', '11111111-1111-1111-1111-000000000046'),
    ('55555555-5555-5555-5555-000000460017', 'SUPLENTE', '11111111-1111-1111-1111-000000000217', '11111111-1111-1111-1111-000000000046'),
    ('55555555-5555-5555-5555-000000460018', 'SUPLENTE', '11111111-1111-1111-1111-000000000218', '11111111-1111-1111-1111-000000000046'),
    ('55555555-5555-5555-5555-000000460019', 'SUPLENTE', '11111111-1111-1111-1111-000000000219', '11111111-1111-1111-1111-000000000046'),
    ('55555555-5555-5555-5555-000000460020', 'SUPLENTE', '11111111-1111-1111-1111-000000000220', '11111111-1111-1111-1111-000000000046'),
    ('55555555-5555-5555-5555-000000460021', 'SUPLENTE', '11111111-1111-1111-1111-000000000221', '11111111-1111-1111-1111-000000000046'),
    ('55555555-5555-5555-5555-000000460022', 'SUPLENTE', '11111111-1111-1111-1111-000000000222', '11111111-1111-1111-1111-000000000046');

-- =========================================
-- DEMO EVENTS (Nuevos)
-- =========================================
INSERT INTO events (id, match_id, player_id, event_type_id, team_possession, match_time, real_time, period, origin, active, created_at, synchronized_at) VALUES
    ('44444444-4444-4444-4444-000000005000', '11111111-1111-1111-1111-000000000040', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 0, '2026-10-15 15:30:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005001', '11111111-1111-1111-1111-000000000040', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 40, '2026-10-15 15:30:40', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005002', '11111111-1111-1111-1111-000000000040', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 80, '2026-10-15 15:31:20', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005003', '11111111-1111-1111-1111-000000000040', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 120, '2026-10-15 15:32:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005004', '11111111-1111-1111-1111-000000000040', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 160, '2026-10-15 15:32:40', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005005', '11111111-1111-1111-1111-000000000040', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 200, '2026-10-15 15:33:20', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005006', '11111111-1111-1111-1111-000000000040', '11111111-1111-1111-1111-000000000103', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 240, '2026-10-15 15:34:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005007', '11111111-1111-1111-1111-000000000040', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 280, '2026-10-15 15:34:40', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005008', '11111111-1111-1111-1111-000000000040', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 320, '2026-10-15 15:35:20', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005009', '11111111-1111-1111-1111-000000000040', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 360, '2026-10-15 15:36:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005010', '11111111-1111-1111-1111-000000000040', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 400, '2026-10-15 15:36:40', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005011', '11111111-1111-1111-1111-000000000040', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 440, '2026-10-15 15:37:20', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005012', '11111111-1111-1111-1111-000000000040', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 480, '2026-10-15 15:38:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005013', '11111111-1111-1111-1111-000000000040', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 520, '2026-10-15 15:38:40', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005014', '11111111-1111-1111-1111-000000000040', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 560, '2026-10-15 15:39:20', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005015', '11111111-1111-1111-1111-000000000040', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 600, '2026-10-15 15:40:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005016', '11111111-1111-1111-1111-000000000040', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 640, '2026-10-15 15:40:40', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005017', '11111111-1111-1111-1111-000000000040', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 680, '2026-10-15 15:41:20', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005018', '11111111-1111-1111-1111-000000000040', '11111111-1111-1111-1111-000000000103', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 720, '2026-10-15 15:42:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005019', '11111111-1111-1111-1111-000000000040', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 760, '2026-10-15 15:42:40', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005020', '11111111-1111-1111-1111-000000000040', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 800, '2026-10-15 15:43:20', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005021', '11111111-1111-1111-1111-000000000040', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 840, '2026-10-15 15:44:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005022', '11111111-1111-1111-1111-000000000040', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 880, '2026-10-15 15:44:40', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005023', '11111111-1111-1111-1111-000000000040', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 920, '2026-10-15 15:45:20', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005024', '11111111-1111-1111-1111-000000000040', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 960, '2026-10-15 15:46:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005025', '11111111-1111-1111-1111-000000000040', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 1000, '2026-10-15 15:46:40', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005026', '11111111-1111-1111-1111-000000000040', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 1040, '2026-10-15 15:47:20', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005027', '11111111-1111-1111-1111-000000000040', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1080, '2026-10-15 15:48:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005028', '11111111-1111-1111-1111-000000000040', '11111111-1111-1111-1111-000000000101', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 1120, '2026-10-15 15:48:40', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005029', '11111111-1111-1111-1111-000000000040', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 1160, '2026-10-15 15:49:20', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005030', '11111111-1111-1111-1111-000000000040', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 1200, '2026-10-15 15:50:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005031', '11111111-1111-1111-1111-000000000040', '11111111-1111-1111-1111-000000000101', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1240, '2026-10-15 15:50:40', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005032', '11111111-1111-1111-1111-000000000040', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 1280, '2026-10-15 15:51:20', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005033', '11111111-1111-1111-1111-000000000040', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 1320, '2026-10-15 15:52:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005034', '11111111-1111-1111-1111-000000000040', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 1360, '2026-10-15 15:52:40', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005035', '11111111-1111-1111-1111-000000000040', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 1400, '2026-10-15 15:53:20', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005036', '11111111-1111-1111-1111-000000000040', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 1440, '2026-10-15 15:54:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005037', '11111111-1111-1111-1111-000000000040', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 1480, '2026-10-15 15:54:40', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005038', '11111111-1111-1111-1111-000000000040', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1520, '2026-10-15 15:55:20', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005039', '11111111-1111-1111-1111-000000000040', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 1560, '2026-10-15 15:56:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005040', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 0, '2026-10-14 15:30:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005041', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 35, '2026-10-14 15:30:35', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005042', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000103', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 70, '2026-10-14 15:31:10', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005043', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 105, '2026-10-14 15:31:45', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005044', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 140, '2026-10-14 15:32:20', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005045', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 175, '2026-10-14 15:32:55', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005046', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 210, '2026-10-14 15:33:30', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005047', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 245, '2026-10-14 15:34:05', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005048', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 280, '2026-10-14 15:34:40', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005049', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 315, '2026-10-14 15:35:15', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005050', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 350, '2026-10-14 15:35:50', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005051', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 385, '2026-10-14 15:36:25', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005052', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 420, '2026-10-14 15:37:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005053', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 455, '2026-10-14 15:37:35', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005054', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 490, '2026-10-14 15:38:10', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005055', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 525, '2026-10-14 15:38:45', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005056', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 560, '2026-10-14 15:39:20', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005057', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 595, '2026-10-14 15:39:55', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005058', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 630, '2026-10-14 15:40:30', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005059', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 665, '2026-10-14 15:41:05', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005060', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 700, '2026-10-14 15:41:40', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005061', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000103', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 735, '2026-10-14 15:42:15', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005062', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 770, '2026-10-14 15:42:50', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005063', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 805, '2026-10-14 15:43:25', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005064', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 840, '2026-10-14 15:44:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005065', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 875, '2026-10-14 15:44:35', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005066', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 910, '2026-10-14 15:45:10', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005067', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 945, '2026-10-14 15:45:45', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005068', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 980, '2026-10-14 15:46:20', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005069', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 1015, '2026-10-14 15:46:55', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005070', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1050, '2026-10-14 15:47:30', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005071', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 1085, '2026-10-14 15:48:05', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005072', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 1120, '2026-10-14 15:48:40', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005073', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 1155, '2026-10-14 15:49:15', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005074', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 1190, '2026-10-14 15:49:50', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005075', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 1225, '2026-10-14 15:50:25', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005076', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 1260, '2026-10-14 15:51:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005077', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1295, '2026-10-14 15:51:35', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005078', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 1330, '2026-10-14 15:52:10', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005079', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 1365, '2026-10-14 15:52:45', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005080', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 1400, '2026-10-14 15:53:20', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005081', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 1435, '2026-10-14 15:53:55', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005082', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 1470, '2026-10-14 15:54:30', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005083', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 1505, '2026-10-14 15:55:05', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005084', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 1540, '2026-10-14 15:55:40', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005085', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 1575, '2026-10-14 15:56:15', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005086', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 1610, '2026-10-14 15:56:50', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005087', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 1645, '2026-10-14 15:57:25', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005088', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 1680, '2026-10-14 15:58:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005089', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 1715, '2026-10-14 15:58:35', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005090', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1750, '2026-10-14 15:59:10', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005091', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 1785, '2026-10-14 15:59:45', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005092', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 1820, '2026-10-14 16:00:20', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005093', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 1855, '2026-10-14 16:00:55', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005094', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 1890, '2026-10-14 16:01:30', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005095', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 1925, '2026-10-14 16:02:05', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005096', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 1960, '2026-10-14 16:02:40', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005097', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1995, '2026-10-14 16:03:15', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005098', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 2030, '2026-10-14 16:03:50', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005099', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 2065, '2026-10-14 16:04:25', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005100', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2100, '2026-10-14 16:05:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005101', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 2135, '2026-10-14 16:05:35', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005102', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 2170, '2026-10-14 16:06:10', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005103', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 2205, '2026-10-14 16:06:45', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005104', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 2240, '2026-10-14 16:07:20', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005105', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 2275, '2026-10-14 16:07:55', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005106', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 2310, '2026-10-14 16:08:30', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005107', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 2345, '2026-10-14 16:09:05', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005108', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 2380, '2026-10-14 16:09:40', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005109', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 2415, '2026-10-14 16:10:15', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005110', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2450, '2026-10-14 16:10:50', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005111', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 2485, '2026-10-14 16:11:25', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005112', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 2520, '2026-10-14 16:12:00', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005113', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 2555, '2026-10-14 16:12:35', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005114', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2590, '2026-10-14 16:13:10', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005115', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 2625, '2026-10-14 16:13:45', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005116', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 2660, '2026-10-14 16:14:20', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005117', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 2695, '2026-10-14 16:14:55', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005118', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 2730, '2026-10-14 16:15:30', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005119', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 2765, '2026-10-14 16:16:05', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005120', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000103', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 2800, '2026-10-14 16:16:40', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005121', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 2835, '2026-10-14 16:17:15', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005122', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 2870, '2026-10-14 16:17:50', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005123', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 2905, '2026-10-14 16:18:25', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005124', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 2940, '2026-10-14 16:19:00', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005125', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 2975, '2026-10-14 16:19:35', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005126', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 3010, '2026-10-14 16:20:10', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005127', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 3045, '2026-10-14 16:20:45', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005128', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000103', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 3080, '2026-10-14 16:21:20', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005129', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 3115, '2026-10-14 16:21:55', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005130', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 3150, '2026-10-14 16:22:30', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005131', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 3185, '2026-10-14 16:23:05', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005132', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 3220, '2026-10-14 16:23:40', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005133', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 3255, '2026-10-14 16:24:15', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005134', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 3290, '2026-10-14 16:24:50', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005135', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 3325, '2026-10-14 16:25:25', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005136', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 3360, '2026-10-14 16:26:00', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005137', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 3395, '2026-10-14 16:26:35', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005138', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 3430, '2026-10-14 16:27:10', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005139', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 3465, '2026-10-14 16:27:45', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005140', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 3500, '2026-10-14 16:28:20', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005141', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 3535, '2026-10-14 16:28:55', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005142', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 3570, '2026-10-14 16:29:30', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005143', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 3605, '2026-10-14 16:30:05', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005144', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 3640, '2026-10-14 16:30:40', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005145', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 3675, '2026-10-14 16:31:15', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005146', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 3710, '2026-10-14 16:31:50', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005147', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 3745, '2026-10-14 16:32:25', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005148', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 3780, '2026-10-14 16:33:00', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005149', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 3815, '2026-10-14 16:33:35', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005150', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 3850, '2026-10-14 16:34:10', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005151', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 3885, '2026-10-14 16:34:45', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005152', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 3920, '2026-10-14 16:35:20', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005153', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 3955, '2026-10-14 16:35:55', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005154', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 3990, '2026-10-14 16:36:30', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005155', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 4025, '2026-10-14 16:37:05', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005156', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000103', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 4060, '2026-10-14 16:37:40', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005157', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 4095, '2026-10-14 16:38:15', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005158', '11111111-1111-1111-1111-000000000043', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 4130, '2026-10-14 16:38:50', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007000', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 0, '2026-09-28 14:00:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007001', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 25, '2026-09-28 14:00:25', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007002', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 50, '2026-09-28 14:00:50', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007003', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 72, '2026-09-28 14:01:12', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007004', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 97, '2026-09-28 14:01:37', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007005', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 122, '2026-09-28 14:02:02', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007006', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 144, '2026-09-28 14:02:24', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007007', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 169, '2026-09-28 14:02:49', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007008', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 194, '2026-09-28 14:03:14', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007009', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 216, '2026-09-28 14:03:36', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007010', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 241, '2026-09-28 14:04:01', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007011', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 266, '2026-09-28 14:04:26', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007012', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 288, '2026-09-28 14:04:48', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007013', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 313, '2026-09-28 14:05:13', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007014', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 338, '2026-09-28 14:05:38', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007015', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 360, '2026-09-28 14:06:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007016', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 385, '2026-09-28 14:06:25', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007017', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 410, '2026-09-28 14:06:50', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007018', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000101', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 432, '2026-09-28 14:07:12', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007019', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 457, '2026-09-28 14:07:37', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007020', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 482, '2026-09-28 14:08:02', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007021', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 504, '2026-09-28 14:08:24', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007022', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 529, '2026-09-28 14:08:49', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007023', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 554, '2026-09-28 14:09:14', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007024', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 576, '2026-09-28 14:09:36', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007025', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 601, '2026-09-28 14:10:01', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007026', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 626, '2026-09-28 14:10:26', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007027', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 648, '2026-09-28 14:10:48', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007028', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 673, '2026-09-28 14:11:13', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007029', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 698, '2026-09-28 14:11:38', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007030', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 720, '2026-09-28 14:12:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007031', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 745, '2026-09-28 14:12:25', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007032', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 770, '2026-09-28 14:12:50', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007033', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 792, '2026-09-28 14:13:12', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007034', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 817, '2026-09-28 14:13:37', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007035', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 842, '2026-09-28 14:14:02', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007036', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 864, '2026-09-28 14:14:24', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007037', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 889, '2026-09-28 14:14:49', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007038', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 914, '2026-09-28 14:15:14', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007039', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 936, '2026-09-28 14:15:36', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007040', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 961, '2026-09-28 14:16:01', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007041', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 986, '2026-09-28 14:16:26', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007042', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 1008, '2026-09-28 14:16:48', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007043', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 1033, '2026-09-28 14:17:13', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007044', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 1058, '2026-09-28 14:17:38', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007045', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 1080, '2026-09-28 14:18:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007046', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 1105, '2026-09-28 14:18:25', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007047', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1130, '2026-09-28 14:18:50', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007048', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 1152, '2026-09-28 14:19:12', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007049', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 1177, '2026-09-28 14:19:37', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007050', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 1202, '2026-09-28 14:20:02', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007051', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 1224, '2026-09-28 14:20:24', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007052', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 1249, '2026-09-28 14:20:49', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007053', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 1274, '2026-09-28 14:21:14', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007054', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1296, '2026-09-28 14:21:36', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007055', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 1321, '2026-09-28 14:22:01', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007056', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 1346, '2026-09-28 14:22:26', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007057', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 1368, '2026-09-28 14:22:48', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007058', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 1393, '2026-09-28 14:23:13', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007059', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 1418, '2026-09-28 14:23:38', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007060', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 1440, '2026-09-28 14:24:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007061', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 1465, '2026-09-28 14:24:25', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007062', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 1490, '2026-09-28 14:24:50', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007063', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 1512, '2026-09-28 14:25:12', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007064', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1537, '2026-09-28 14:25:37', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007065', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 1562, '2026-09-28 14:26:02', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007066', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1584, '2026-09-28 14:26:24', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007067', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 1609, '2026-09-28 14:26:49', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007068', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 1634, '2026-09-28 14:27:14', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007069', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000101', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1656, '2026-09-28 14:27:36', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007070', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 1681, '2026-09-28 14:28:01', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007071', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000103', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 1706, '2026-09-28 14:28:26', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007072', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 1728, '2026-09-28 14:28:48', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007073', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 1753, '2026-09-28 14:29:13', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007074', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 1778, '2026-09-28 14:29:38', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007075', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 1800, '2026-09-28 14:30:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007076', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 1825, '2026-09-28 14:30:25', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007077', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 1850, '2026-09-28 14:30:50', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007078', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000101', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 1872, '2026-09-28 14:31:12', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007079', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 1897, '2026-09-28 14:31:37', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007080', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 1922, '2026-09-28 14:32:02', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007081', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1944, '2026-09-28 14:32:24', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007082', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 1969, '2026-09-28 14:32:49', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007083', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 1994, '2026-09-28 14:33:14', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007084', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 2016, '2026-09-28 14:33:36', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007085', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 2041, '2026-09-28 14:34:01', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007086', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000101', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 2066, '2026-09-28 14:34:26', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007087', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2088, '2026-09-28 14:34:48', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007088', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 2113, '2026-09-28 14:35:13', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007089', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 2138, '2026-09-28 14:35:38', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007090', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 2160, '2026-09-28 14:36:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007091', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2185, '2026-09-28 14:36:25', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007092', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 2210, '2026-09-28 14:36:50', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007093', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000103', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 2232, '2026-09-28 14:37:12', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007094', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2257, '2026-09-28 14:37:37', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007095', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 2282, '2026-09-28 14:38:02', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007096', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 2304, '2026-09-28 14:38:24', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007097', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 2329, '2026-09-28 14:38:49', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007098', '11111111-1111-1111-1111-000000000042', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 2354, '2026-09-28 14:39:14', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000007099', '11111111-1111-1111-1111-000000000042', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 2376, '2026-09-28 14:39:36', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000005159', '11111111-1111-1111-1111-000000000043', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 4165, '2026-10-14 16:39:25', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);


-- =========================================

-- =========================================
-- NUEVO PARTIDO FINALIZADO (300 EVENTOS, 60 PENDIENTES)
-- =========================================
INSERT INTO matches (id, date, division_id, opponent_id, status, current_period, clock_elapsed_seconds, clock_paused, clock_updated_at, current_possession, home_score, away_score, started_at, finished_at) VALUES
('11111111-1111-1111-1111-000000000047', '2026-09-10 15:30:00', '11111111-1111-1111-1111-000000000020', '22222222-1111-1111-1111-000000000002', 'FINISHED', 2, 4800, true, CURRENT_TIMESTAMP, 'OWN', 0, 0, '2026-09-10 15:30:00', '2026-09-10 17:15:00');

INSERT INTO matches_players (id, role, division_id, match_id) VALUES
    ('55555555-5555-5555-5555-000000470000', 'TITULAR', '11111111-1111-1111-1111-000000000200', '11111111-1111-1111-1111-000000000047'),
    ('55555555-5555-5555-5555-000000470001', 'TITULAR', '11111111-1111-1111-1111-000000000201', '11111111-1111-1111-1111-000000000047'),
    ('55555555-5555-5555-5555-000000470002', 'TITULAR', '11111111-1111-1111-1111-000000000202', '11111111-1111-1111-1111-000000000047'),
    ('55555555-5555-5555-5555-000000470003', 'TITULAR', '11111111-1111-1111-1111-000000000203', '11111111-1111-1111-1111-000000000047'),
    ('55555555-5555-5555-5555-000000470004', 'TITULAR', '11111111-1111-1111-1111-000000000204', '11111111-1111-1111-1111-000000000047'),
    ('55555555-5555-5555-5555-000000470005', 'TITULAR', '11111111-1111-1111-1111-000000000205', '11111111-1111-1111-1111-000000000047'),
    ('55555555-5555-5555-5555-000000470006', 'TITULAR', '11111111-1111-1111-1111-000000000206', '11111111-1111-1111-1111-000000000047'),
    ('55555555-5555-5555-5555-000000470007', 'TITULAR', '11111111-1111-1111-1111-000000000207', '11111111-1111-1111-1111-000000000047'),
    ('55555555-5555-5555-5555-000000470008', 'TITULAR', '11111111-1111-1111-1111-000000000208', '11111111-1111-1111-1111-000000000047'),
    ('55555555-5555-5555-5555-000000470009', 'TITULAR', '11111111-1111-1111-1111-000000000209', '11111111-1111-1111-1111-000000000047'),
    ('55555555-5555-5555-5555-000000470010', 'TITULAR', '11111111-1111-1111-1111-000000000210', '11111111-1111-1111-1111-000000000047'),
    ('55555555-5555-5555-5555-000000470011', 'TITULAR', '11111111-1111-1111-1111-000000000211', '11111111-1111-1111-1111-000000000047'),
    ('55555555-5555-5555-5555-000000470012', 'TITULAR', '11111111-1111-1111-1111-000000000212', '11111111-1111-1111-1111-000000000047'),
    ('55555555-5555-5555-5555-000000470013', 'TITULAR', '11111111-1111-1111-1111-000000000213', '11111111-1111-1111-1111-000000000047'),
    ('55555555-5555-5555-5555-000000470014', 'TITULAR', '11111111-1111-1111-1111-000000000214', '11111111-1111-1111-1111-000000000047'),
    ('55555555-5555-5555-5555-000000470015', 'SUPLENTE', '11111111-1111-1111-1111-000000000215', '11111111-1111-1111-1111-000000000047'),
    ('55555555-5555-5555-5555-000000470016', 'SUPLENTE', '11111111-1111-1111-1111-000000000216', '11111111-1111-1111-1111-000000000047'),
    ('55555555-5555-5555-5555-000000470017', 'SUPLENTE', '11111111-1111-1111-1111-000000000217', '11111111-1111-1111-1111-000000000047'),
    ('55555555-5555-5555-5555-000000470018', 'SUPLENTE', '11111111-1111-1111-1111-000000000218', '11111111-1111-1111-1111-000000000047'),
    ('55555555-5555-5555-5555-000000470019', 'SUPLENTE', '11111111-1111-1111-1111-000000000219', '11111111-1111-1111-1111-000000000047'),
    ('55555555-5555-5555-5555-000000470020', 'SUPLENTE', '11111111-1111-1111-1111-000000000220', '11111111-1111-1111-1111-000000000047'),
    ('55555555-5555-5555-5555-000000470021', 'SUPLENTE', '11111111-1111-1111-1111-000000000221', '11111111-1111-1111-1111-000000000047'),
    ('55555555-5555-5555-5555-000000470022', 'SUPLENTE', '11111111-1111-1111-1111-000000000222', '11111111-1111-1111-1111-000000000047');

INSERT INTO events (id, match_id, player_id, event_type_id, team_possession, match_time, real_time, period, origin, active, created_at, synchronized_at) VALUES
    ('44444444-4444-4444-4444-000000008000', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 0, '2026-09-10 15:30:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008001', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 17, '2026-09-10 15:30:17', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008002', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 34, '2026-09-10 15:30:34', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008003', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 48, '2026-09-10 15:30:48', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008004', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OWN', 65, '2026-09-10 15:31:05', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008005', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000103', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 82, '2026-09-10 15:31:22', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008006', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 96, '2026-09-10 15:31:36', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008007', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 113, '2026-09-10 15:31:53', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008008', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 130, '2026-09-10 15:32:10', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008009', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000103', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 144, '2026-09-10 15:32:24', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008010', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 161, '2026-09-10 15:32:41', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008011', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 178, '2026-09-10 15:32:58', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008012', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 192, '2026-09-10 15:33:12', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008013', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 209, '2026-09-10 15:33:29', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008014', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 226, '2026-09-10 15:33:46', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008015', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OWN', 240, '2026-09-10 15:34:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008016', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 257, '2026-09-10 15:34:17', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008017', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 274, '2026-09-10 15:34:34', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008018', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 288, '2026-09-10 15:34:48', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008019', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 305, '2026-09-10 15:35:05', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008020', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 322, '2026-09-10 15:35:22', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008021', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 336, '2026-09-10 15:35:36', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008022', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 353, '2026-09-10 15:35:53', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008023', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 370, '2026-09-10 15:36:10', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008024', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OWN', 384, '2026-09-10 15:36:24', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008025', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000101', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 401, '2026-09-10 15:36:41', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008026', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 418, '2026-09-10 15:36:58', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008027', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 432, '2026-09-10 15:37:12', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008028', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OWN', 449, '2026-09-10 15:37:29', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008029', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 466, '2026-09-10 15:37:46', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008030', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OWN', 480, '2026-09-10 15:38:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008031', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 497, '2026-09-10 15:38:17', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008032', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 514, '2026-09-10 15:38:34', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008033', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 528, '2026-09-10 15:38:48', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008034', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OWN', 545, '2026-09-10 15:39:05', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008035', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 562, '2026-09-10 15:39:22', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008036', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OWN', 576, '2026-09-10 15:39:36', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008037', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 593, '2026-09-10 15:39:53', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008038', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OWN', 610, '2026-09-10 15:40:10', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008039', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 624, '2026-09-10 15:40:24', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008040', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 641, '2026-09-10 15:40:41', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008041', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 658, '2026-09-10 15:40:58', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008042', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 672, '2026-09-10 15:41:12', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008043', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 689, '2026-09-10 15:41:29', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008044', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 706, '2026-09-10 15:41:46', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008045', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 720, '2026-09-10 15:42:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008046', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 737, '2026-09-10 15:42:17', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008047', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 754, '2026-09-10 15:42:34', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008048', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 768, '2026-09-10 15:42:48', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008049', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OWN', 785, '2026-09-10 15:43:05', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008050', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OWN', 802, '2026-09-10 15:43:22', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008051', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 816, '2026-09-10 15:43:36', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008052', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 833, '2026-09-10 15:43:53', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008053', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 850, '2026-09-10 15:44:10', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008054', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 864, '2026-09-10 15:44:24', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008055', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 881, '2026-09-10 15:44:41', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008056', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OWN', 898, '2026-09-10 15:44:58', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008057', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OWN', 912, '2026-09-10 15:45:12', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008058', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 929, '2026-09-10 15:45:29', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008059', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 946, '2026-09-10 15:45:46', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008060', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 960, '2026-09-10 15:46:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008061', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 977, '2026-09-10 15:46:17', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008062', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 994, '2026-09-10 15:46:34', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008063', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1008, '2026-09-10 15:46:48', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008064', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 1025, '2026-09-10 15:47:05', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008065', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 1042, '2026-09-10 15:47:22', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008066', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 1056, '2026-09-10 15:47:36', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008067', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 1073, '2026-09-10 15:47:53', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008068', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 1090, '2026-09-10 15:48:10', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008069', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 1104, '2026-09-10 15:48:24', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008070', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 1121, '2026-09-10 15:48:41', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008071', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 1138, '2026-09-10 15:48:58', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008072', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OWN', 1152, '2026-09-10 15:49:12', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008073', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 1169, '2026-09-10 15:49:29', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008074', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 1186, '2026-09-10 15:49:46', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008075', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 1200, '2026-09-10 15:50:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008076', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 1217, '2026-09-10 15:50:17', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008077', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OWN', 1234, '2026-09-10 15:50:34', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008078', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 1248, '2026-09-10 15:50:48', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008079', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 1265, '2026-09-10 15:51:05', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008080', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 1282, '2026-09-10 15:51:22', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008081', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 1296, '2026-09-10 15:51:36', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008082', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OWN', 1313, '2026-09-10 15:51:53', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008083', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 1330, '2026-09-10 15:52:10', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008084', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1344, '2026-09-10 15:52:24', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008085', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 1361, '2026-09-10 15:52:41', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008086', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 1378, '2026-09-10 15:52:58', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008087', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 1392, '2026-09-10 15:53:12', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008088', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 1409, '2026-09-10 15:53:29', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008089', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 1426, '2026-09-10 15:53:46', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008090', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 1440, '2026-09-10 15:54:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008091', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000101', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 1457, '2026-09-10 15:54:17', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008092', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 1474, '2026-09-10 15:54:34', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008093', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 1488, '2026-09-10 15:54:48', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008094', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1505, '2026-09-10 15:55:05', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008095', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 1522, '2026-09-10 15:55:22', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008096', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 1536, '2026-09-10 15:55:36', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008097', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 1553, '2026-09-10 15:55:53', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008098', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 1570, '2026-09-10 15:56:10', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008099', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 1584, '2026-09-10 15:56:24', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008100', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 1601, '2026-09-10 15:56:41', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008101', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 1618, '2026-09-10 15:56:58', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008102', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1632, '2026-09-10 15:57:12', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008103', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1649, '2026-09-10 15:57:29', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008104', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OWN', 1666, '2026-09-10 15:57:46', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008105', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 1680, '2026-09-10 15:58:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008106', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 1697, '2026-09-10 15:58:17', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008107', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 1714, '2026-09-10 15:58:34', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008108', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 1728, '2026-09-10 15:58:48', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008109', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 1745, '2026-09-10 15:59:05', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008110', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 1762, '2026-09-10 15:59:22', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008111', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 1776, '2026-09-10 15:59:36', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008112', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OWN', 1793, '2026-09-10 15:59:53', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008113', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000101', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 1810, '2026-09-10 16:00:10', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008114', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 1824, '2026-09-10 16:00:24', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008115', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 1841, '2026-09-10 16:00:41', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008116', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 1858, '2026-09-10 16:00:58', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008117', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 1872, '2026-09-10 16:01:12', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008118', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 1889, '2026-09-10 16:01:29', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008119', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OWN', 1906, '2026-09-10 16:01:46', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008120', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1920, '2026-09-10 16:02:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008121', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 1937, '2026-09-10 16:02:17', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008122', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OWN', 1954, '2026-09-10 16:02:34', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008123', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 1968, '2026-09-10 16:02:48', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008124', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 1985, '2026-09-10 16:03:05', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008125', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 2002, '2026-09-10 16:03:22', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008126', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 2016, '2026-09-10 16:03:36', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008127', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 2033, '2026-09-10 16:03:53', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008128', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OWN', 2050, '2026-09-10 16:04:10', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008129', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 2064, '2026-09-10 16:04:24', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008130', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OWN', 2081, '2026-09-10 16:04:41', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008131', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2098, '2026-09-10 16:04:58', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008132', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2112, '2026-09-10 16:05:12', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008133', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2129, '2026-09-10 16:05:29', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008134', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 2146, '2026-09-10 16:05:46', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008135', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 2160, '2026-09-10 16:06:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008136', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 2177, '2026-09-10 16:06:17', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008137', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OWN', 2194, '2026-09-10 16:06:34', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008138', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2208, '2026-09-10 16:06:48', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008139', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 2225, '2026-09-10 16:07:05', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008140', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OWN', 2242, '2026-09-10 16:07:22', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008141', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2256, '2026-09-10 16:07:36', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008142', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 2273, '2026-09-10 16:07:53', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008143', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000101', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2290, '2026-09-10 16:08:10', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008144', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 2304, '2026-09-10 16:08:24', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008145', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 2321, '2026-09-10 16:08:41', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008146', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 2338, '2026-09-10 16:08:58', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008147', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 2352, '2026-09-10 16:09:12', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008148', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OWN', 2369, '2026-09-10 16:09:29', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008149', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 2386, '2026-09-10 16:09:46', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008150', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OWN', 2400, '2026-09-10 16:10:00', 1, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008151', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 2417, '2026-09-10 16:10:17', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008152', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2434, '2026-09-10 16:10:34', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008153', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 2448, '2026-09-10 16:10:48', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008154', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2465, '2026-09-10 16:11:05', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008155', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 2482, '2026-09-10 16:11:22', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008156', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 2496, '2026-09-10 16:11:36', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008157', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 2513, '2026-09-10 16:11:53', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008158', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2530, '2026-09-10 16:12:10', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008159', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 2544, '2026-09-10 16:12:24', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008160', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 2561, '2026-09-10 16:12:41', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008161', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 2578, '2026-09-10 16:12:58', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008162', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OWN', 2592, '2026-09-10 16:13:12', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008163', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 2609, '2026-09-10 16:13:29', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008164', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000103', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 2626, '2026-09-10 16:13:46', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008165', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 2640, '2026-09-10 16:14:00', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008166', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 2657, '2026-09-10 16:14:17', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008167', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 2674, '2026-09-10 16:14:34', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008168', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2688, '2026-09-10 16:14:48', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008169', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2705, '2026-09-10 16:15:05', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008170', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 2722, '2026-09-10 16:15:22', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008171', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2736, '2026-09-10 16:15:36', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008172', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 2753, '2026-09-10 16:15:53', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008173', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 2770, '2026-09-10 16:16:10', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008174', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 2784, '2026-09-10 16:16:24', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008175', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OWN', 2801, '2026-09-10 16:16:41', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008176', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 2818, '2026-09-10 16:16:58', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008177', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 2832, '2026-09-10 16:17:12', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008178', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 2849, '2026-09-10 16:17:29', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008179', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 2866, '2026-09-10 16:17:46', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008180', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 2880, '2026-09-10 16:18:00', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008181', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 2897, '2026-09-10 16:18:17', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008182', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 2914, '2026-09-10 16:18:34', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008183', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000103', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 2928, '2026-09-10 16:18:48', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008184', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 2945, '2026-09-10 16:19:05', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008185', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OWN', 2962, '2026-09-10 16:19:22', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008186', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 2976, '2026-09-10 16:19:36', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008187', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2993, '2026-09-10 16:19:53', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008188', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OWN', 3010, '2026-09-10 16:20:10', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008189', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OWN', 3024, '2026-09-10 16:20:24', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008190', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OWN', 3041, '2026-09-10 16:20:41', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008191', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 3058, '2026-09-10 16:20:58', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008192', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000101', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 3072, '2026-09-10 16:21:12', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008193', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 3089, '2026-09-10 16:21:29', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008194', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OWN', 3106, '2026-09-10 16:21:46', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008195', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 3120, '2026-09-10 16:22:00', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008196', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 3137, '2026-09-10 16:22:17', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008197', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OWN', 3154, '2026-09-10 16:22:34', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008198', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 3168, '2026-09-10 16:22:48', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008199', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 3185, '2026-09-10 16:23:05', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008200', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000101', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 3202, '2026-09-10 16:23:22', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008201', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OWN', 3216, '2026-09-10 16:23:36', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008202', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OWN', 3233, '2026-09-10 16:23:53', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008203', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OWN', 3250, '2026-09-10 16:24:10', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008204', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OWN', 3264, '2026-09-10 16:24:24', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008205', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 3281, '2026-09-10 16:24:41', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008206', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OWN', 3298, '2026-09-10 16:24:58', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008207', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 3312, '2026-09-10 16:25:12', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008208', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 3329, '2026-09-10 16:25:29', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008209', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OWN', 3346, '2026-09-10 16:25:46', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008210', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 3360, '2026-09-10 16:26:00', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008211', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 3377, '2026-09-10 16:26:17', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008212', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 3394, '2026-09-10 16:26:34', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008213', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 3408, '2026-09-10 16:26:48', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008214', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 3425, '2026-09-10 16:27:05', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008215', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 3442, '2026-09-10 16:27:22', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008216', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OWN', 3456, '2026-09-10 16:27:36', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008217', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 3473, '2026-09-10 16:27:53', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008218', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 3490, '2026-09-10 16:28:10', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008219', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 3504, '2026-09-10 16:28:24', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008220', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OWN', 3521, '2026-09-10 16:28:41', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008221', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 3538, '2026-09-10 16:28:58', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008222', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OWN', 3552, '2026-09-10 16:29:12', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008223', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OWN', 3569, '2026-09-10 16:29:29', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008224', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 3586, '2026-09-10 16:29:46', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008225', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 3600, '2026-09-10 16:30:00', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008226', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 3617, '2026-09-10 16:30:17', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008227', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 3634, '2026-09-10 16:30:34', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008228', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 3648, '2026-09-10 16:30:48', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008229', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 3665, '2026-09-10 16:31:05', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008230', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000103', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 3682, '2026-09-10 16:31:22', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008231', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 3696, '2026-09-10 16:31:36', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008232', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 3713, '2026-09-10 16:31:53', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008233', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 3730, '2026-09-10 16:32:10', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008234', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OWN', 3744, '2026-09-10 16:32:24', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008235', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 3761, '2026-09-10 16:32:41', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008236', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 3778, '2026-09-10 16:32:58', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008237', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 3792, '2026-09-10 16:33:12', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008238', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 3809, '2026-09-10 16:33:29', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008239', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 3826, '2026-09-10 16:33:46', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008240', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 3840, '2026-09-10 16:34:00', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008241', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 3857, '2026-09-10 16:34:17', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008242', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 3874, '2026-09-10 16:34:34', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008243', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 3888, '2026-09-10 16:34:48', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008244', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 3905, '2026-09-10 16:35:05', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008245', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 3922, '2026-09-10 16:35:22', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008246', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 3936, '2026-09-10 16:35:36', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008247', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 3953, '2026-09-10 16:35:53', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008248', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 3970, '2026-09-10 16:36:10', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008249', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 3984, '2026-09-10 16:36:24', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008250', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OWN', 4001, '2026-09-10 16:36:41', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008251', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 4018, '2026-09-10 16:36:58', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008252', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 4032, '2026-09-10 16:37:12', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008253', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 4049, '2026-09-10 16:37:29', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008254', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OWN', 4066, '2026-09-10 16:37:46', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008255', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 4080, '2026-09-10 16:38:00', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008256', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 4097, '2026-09-10 16:38:17', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008257', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 4114, '2026-09-10 16:38:34', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008258', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OWN', 4128, '2026-09-10 16:38:48', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008259', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 4145, '2026-09-10 16:39:05', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008260', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 4162, '2026-09-10 16:39:22', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008261', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 4176, '2026-09-10 16:39:36', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008262', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 4193, '2026-09-10 16:39:53', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008263', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 4210, '2026-09-10 16:40:10', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008264', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 4224, '2026-09-10 16:40:24', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008265', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 4241, '2026-09-10 16:40:41', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008266', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 4258, '2026-09-10 16:40:58', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008267', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 4272, '2026-09-10 16:41:12', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008268', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 4289, '2026-09-10 16:41:29', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008269', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OWN', 4306, '2026-09-10 16:41:46', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008270', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OWN', 4320, '2026-09-10 16:42:00', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008271', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 4337, '2026-09-10 16:42:17', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008272', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 4354, '2026-09-10 16:42:34', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008273', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 4368, '2026-09-10 16:42:48', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008274', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 4385, '2026-09-10 16:43:05', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008275', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OWN', 4402, '2026-09-10 16:43:22', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008276', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OWN', 4416, '2026-09-10 16:43:36', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008277', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 4433, '2026-09-10 16:43:53', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008278', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 4450, '2026-09-10 16:44:10', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008279', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 4464, '2026-09-10 16:44:24', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008280', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 4481, '2026-09-10 16:44:41', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008281', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 4498, '2026-09-10 16:44:58', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008282', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OWN', 4512, '2026-09-10 16:45:12', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008283', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OWN', 4529, '2026-09-10 16:45:29', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008284', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OWN', 4546, '2026-09-10 16:45:46', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008285', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 4560, '2026-09-10 16:46:00', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008286', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 4577, '2026-09-10 16:46:17', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008287', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 4594, '2026-09-10 16:46:34', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008288', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 4608, '2026-09-10 16:46:48', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008289', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 4625, '2026-09-10 16:47:05', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008290', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 4642, '2026-09-10 16:47:22', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008291', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 4656, '2026-09-10 16:47:36', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008292', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 4673, '2026-09-10 16:47:53', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008293', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 4690, '2026-09-10 16:48:10', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008294', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 4704, '2026-09-10 16:48:24', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008295', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 4721, '2026-09-10 16:48:41', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008296', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 4738, '2026-09-10 16:48:58', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008297', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 4752, '2026-09-10 16:49:12', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008298', '11111111-1111-1111-1111-000000000047', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 4769, '2026-09-10 16:49:29', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000008299', '11111111-1111-1111-1111-000000000047', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 4786, '2026-09-10 16:49:46', 2, 'APP', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =========================================
-- PARTIDO FINALIZADO CON 500 EVENTOS (CATALOGO V3 / TRELEW)
-- =========================================
INSERT INTO matches (id, date, division_id, opponent_id, status, current_period, clock_elapsed_seconds, clock_paused, clock_updated_at, current_possession, home_score, away_score, started_at, finished_at) VALUES
('11111111-1111-1111-1111-000000000048', '2026-10-17 15:30:00', '11111111-1111-1111-1111-000000000020', '22222222-1111-1111-1111-000000000001', 'FINISHED', 2, 4800, true, CURRENT_TIMESTAMP, 'OWN', 32, 21, '2026-10-17 15:30:00', '2026-10-17 17:15:00');

INSERT INTO matches_players (id, role, division_id, match_id) VALUES
    ('55555555-5555-5555-5555-000000480000', 'TITULAR', '11111111-1111-1111-1111-000000000200', '11111111-1111-1111-1111-000000000048'),
    ('55555555-5555-5555-5555-000000480001', 'TITULAR', '11111111-1111-1111-1111-000000000201', '11111111-1111-1111-1111-000000000048'),
    ('55555555-5555-5555-5555-000000480002', 'TITULAR', '11111111-1111-1111-1111-000000000202', '11111111-1111-1111-1111-000000000048'),
    ('55555555-5555-5555-5555-000000480003', 'TITULAR', '11111111-1111-1111-1111-000000000203', '11111111-1111-1111-1111-000000000048'),
    ('55555555-5555-5555-5555-000000480004', 'TITULAR', '11111111-1111-1111-1111-000000000204', '11111111-1111-1111-1111-000000000048'),
    ('55555555-5555-5555-5555-000000480005', 'TITULAR', '11111111-1111-1111-1111-000000000205', '11111111-1111-1111-1111-000000000048'),
    ('55555555-5555-5555-5555-000000480006', 'TITULAR', '11111111-1111-1111-1111-000000000206', '11111111-1111-1111-1111-000000000048'),
    ('55555555-5555-5555-5555-000000480007', 'TITULAR', '11111111-1111-1111-1111-000000000207', '11111111-1111-1111-1111-000000000048'),
    ('55555555-5555-5555-5555-000000480008', 'TITULAR', '11111111-1111-1111-1111-000000000208', '11111111-1111-1111-1111-000000000048'),
    ('55555555-5555-5555-5555-000000480009', 'TITULAR', '11111111-1111-1111-1111-000000000209', '11111111-1111-1111-1111-000000000048'),
    ('55555555-5555-5555-5555-000000480010', 'TITULAR', '11111111-1111-1111-1111-000000000210', '11111111-1111-1111-1111-000000000048'),
    ('55555555-5555-5555-5555-000000480011', 'TITULAR', '11111111-1111-1111-1111-000000000211', '11111111-1111-1111-1111-000000000048'),
    ('55555555-5555-5555-5555-000000480012', 'TITULAR', '11111111-1111-1111-1111-000000000212', '11111111-1111-1111-1111-000000000048'),
    ('55555555-5555-5555-5555-000000480013', 'TITULAR', '11111111-1111-1111-1111-000000000213', '11111111-1111-1111-1111-000000000048'),
    ('55555555-5555-5555-5555-000000480014', 'TITULAR', '11111111-1111-1111-1111-000000000214', '11111111-1111-1111-1111-000000000048'),
    ('55555555-5555-5555-5555-000000480015', 'SUPLENTE', '11111111-1111-1111-1111-000000000227', '11111111-1111-1111-1111-000000000048'),
    ('55555555-5555-5555-5555-000000480016', 'SUPLENTE', '11111111-1111-1111-1111-000000000228', '11111111-1111-1111-1111-000000000048'),
    ('55555555-5555-5555-5555-000000480017', 'SUPLENTE', '11111111-1111-1111-1111-000000000229', '11111111-1111-1111-1111-000000000048'),
    ('55555555-5555-5555-5555-000000480018', 'SUPLENTE', '11111111-1111-1111-1111-000000000230', '11111111-1111-1111-1111-000000000048'),
    ('55555555-5555-5555-5555-000000480019', 'SUPLENTE', '11111111-1111-1111-1111-000000000231', '11111111-1111-1111-1111-000000000048'),
    ('55555555-5555-5555-5555-000000480020', 'SUPLENTE', '11111111-1111-1111-1111-000000000232', '11111111-1111-1111-1111-000000000048'),
    ('55555555-5555-5555-5555-000000480021', 'SUPLENTE', '11111111-1111-1111-1111-000000000233', '11111111-1111-1111-1111-000000000048'),
    ('55555555-5555-5555-5555-000000480022', 'SUPLENTE', '11111111-1111-1111-1111-000000000234', '11111111-1111-1111-1111-000000000048');

INSERT INTO events (id, match_id, player_id, event_type_id, team_possession, match_time, absolute_match_time, real_time, period, origin, active, attributes, created_at, synchronized_at) VALUES
    ('44444444-4444-4444-4444-000000009000', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 33, 33, '2026-10-17 15:30:33', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009001', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 39, 39, '2026-10-17 15:30:39', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009002', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 72, 72, '2026-10-17 15:31:12', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009003', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 84, 84, '2026-10-17 15:31:24', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009004', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OWN', 93, 93, '2026-10-17 15:31:33', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009005', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OPPONENT', 115, 115, '2026-10-17 15:31:55', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009006', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 126, 126, '2026-10-17 15:32:06', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009007', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 133, 133, '2026-10-17 15:32:13', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009008', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 135, 135, '2026-10-17 15:32:15', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009009', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 162, 162, '2026-10-17 15:32:42', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009010', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440122', 'OPPONENT', 181, 181, '2026-10-17 15:33:01', 1, 'APP', true, '{"infringement": "offside"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009011', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440113', 'OWN', 185, 185, '2026-10-17 15:33:05', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009012', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OPPONENT', 194, 194, '2026-10-17 15:33:14', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009013', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 211, 211, '2026-10-17 15:33:31', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009014', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 218, 218, '2026-10-17 15:33:38', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009015', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 222, 222, '2026-10-17 15:33:42', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009016', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440111', 'OPPONENT', 223, 223, '2026-10-17 15:33:43', 1, 'APP', true, '{"outcome": "won"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009017', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440114', 'OPPONENT', 232, 232, '2026-10-17 15:33:52', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009018', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 238, 238, '2026-10-17 15:33:58', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009019', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OWN', 241, 241, '2026-10-17 15:34:01', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009020', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 253, 253, '2026-10-17 15:34:13', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009021', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440127', 'OPPONENT', 257, 257, '2026-10-17 15:34:17', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009022', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440122', 'OPPONENT', 268, 268, '2026-10-17 15:34:28', 1, 'APP', true, '{"infringement": "offside"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009023', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 277, 277, '2026-10-17 15:34:37', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009024', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OWN', 282, 282, '2026-10-17 15:34:42', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009025', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 287, 287, '2026-10-17 15:34:47', 1, 'APP', true, '{"zone": "center"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009026', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440102', 'OWN', 293, 293, '2026-10-17 15:34:53', 1, 'APP', true, '{"wasSuccessful": true}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009027', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 303, 303, '2026-10-17 15:35:03', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009028', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 309, 309, '2026-10-17 15:35:09', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009029', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 311, 311, '2026-10-17 15:35:11', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009030', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 316, 316, '2026-10-17 15:35:16', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009031', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 320, 320, '2026-10-17 15:35:20', 1, 'APP', true, '{"outcome": "won", "jumpers": 4}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009032', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440110', 'OWN', 322, 322, '2026-10-17 15:35:22', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009033', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 326, 326, '2026-10-17 15:35:26', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009034', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440111', 'OWN', 330, 330, '2026-10-17 15:35:30', 1, 'APP', true, '{"outcome": "won"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009035', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440110', 'OPPONENT', 338, 338, '2026-10-17 15:35:38', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009036', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 342, 342, '2026-10-17 15:35:42', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009037', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440120', 'OWN', 355, 355, '2026-10-17 15:35:55', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009038', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 357, 357, '2026-10-17 15:35:57', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009039', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 368, 368, '2026-10-17 15:36:08', 1, 'APP', true, '{"outcome": "won", "jumpers": 4}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009040', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OPPONENT', 377, 377, '2026-10-17 15:36:17', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009041', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 381, 381, '2026-10-17 15:36:21', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009042', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 383, 383, '2026-10-17 15:36:23', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009043', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OPPONENT', 389, 389, '2026-10-17 15:36:29', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009044', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 397, 397, '2026-10-17 15:36:37', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009045', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440119', 'OWN', 403, 403, '2026-10-17 15:36:43', 1, 'APP', true, '{"errorType": "knock_on"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009046', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 414, 414, '2026-10-17 15:36:54', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009047', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 429, 429, '2026-10-17 15:37:09', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009048', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 432, 432, '2026-10-17 15:37:12', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009049', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440119', 'OWN', 441, 441, '2026-10-17 15:37:21', 1, 'APP', true, '{"errorType": "knock_on"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009050', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440119', 'OPPONENT', 450, 450, '2026-10-17 15:37:30', 1, 'APP', true, '{"errorType": "knock_on"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009051', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440111', 'OPPONENT', 451, 451, '2026-10-17 15:37:31', 1, 'APP', true, '{"outcome": "won"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009052', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 454, 454, '2026-10-17 15:37:34', 1, 'APP', true, '{"outcome": "won", "jumpers": 4}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009053', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440120', 'OPPONENT', 462, 462, '2026-10-17 15:37:42', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009054', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 473, 473, '2026-10-17 15:37:53', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009055', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 474, 474, '2026-10-17 15:37:54', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009056', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 475, 475, '2026-10-17 15:37:55', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009057', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 476, 476, '2026-10-17 15:37:56', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009058', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 478, 478, '2026-10-17 15:37:58', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009059', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 479, 479, '2026-10-17 15:37:59', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009060', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 499, 499, '2026-10-17 15:38:19', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009061', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OWN', 508, 508, '2026-10-17 15:38:28', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009062', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440111', 'OPPONENT', 524, 524, '2026-10-17 15:38:44', 1, 'APP', true, '{"outcome": "won"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009063', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440120', 'OWN', 527, 527, '2026-10-17 15:38:47', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009064', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440109', 'OPPONENT', 537, 537, '2026-10-17 15:38:57', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009065', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 540, 540, '2026-10-17 15:39:00', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009066', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 570, 570, '2026-10-17 15:39:30', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009067', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440113', 'OPPONENT', 589, 589, '2026-10-17 15:39:49', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009068', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 594, 594, '2026-10-17 15:39:54', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009069', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OWN', 607, 607, '2026-10-17 15:40:07', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009070', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OPPONENT', 612, 612, '2026-10-17 15:40:12', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009071', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 615, 615, '2026-10-17 15:40:15', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009072', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OPPONENT', 626, 626, '2026-10-17 15:40:26', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009073', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OWN', 633, 633, '2026-10-17 15:40:33', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009074', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OWN', 634, 634, '2026-10-17 15:40:34', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009075', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440111', 'OWN', 641, 641, '2026-10-17 15:40:41', 1, 'APP', true, '{"outcome": "won"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009076', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 645, 645, '2026-10-17 15:40:45', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009077', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 652, 652, '2026-10-17 15:40:52', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009078', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 696, 696, '2026-10-17 15:41:36', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009079', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 711, 711, '2026-10-17 15:41:51', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009080', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440104', 'OPPONENT', 718, 718, '2026-10-17 15:41:58', 1, 'APP', true, '{"wasSuccessful": true, "distanceMeters": 32}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009081', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 721, 721, '2026-10-17 15:42:01', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009082', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 727, 727, '2026-10-17 15:42:07', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009083', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000103', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 733, 733, '2026-10-17 15:42:13', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009084', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 746, 746, '2026-10-17 15:42:26', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009085', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 751, 751, '2026-10-17 15:42:31', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009086', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OPPONENT', 802, 802, '2026-10-17 15:43:22', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009087', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OPPONENT', 816, 816, '2026-10-17 15:43:36', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009088', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 845, 845, '2026-10-17 15:44:05', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009089', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 873, 873, '2026-10-17 15:44:33', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009090', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000101', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 879, 879, '2026-10-17 15:44:39', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009091', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 888, 888, '2026-10-17 15:44:48', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009092', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 889, 889, '2026-10-17 15:44:49', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009093', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440110', 'OPPONENT', 890, 890, '2026-10-17 15:44:50', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009094', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 911, 911, '2026-10-17 15:45:11', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009095', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 915, 915, '2026-10-17 15:45:15', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009096', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000101', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 926, 926, '2026-10-17 15:45:26', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009097', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 934, 934, '2026-10-17 15:45:34', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009098', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 943, 943, '2026-10-17 15:45:43', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009099', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 950, 950, '2026-10-17 15:45:50', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009100', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 975, 975, '2026-10-17 15:46:15', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009101', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 982, 982, '2026-10-17 15:46:22', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009102', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000103', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 1004, 1004, '2026-10-17 15:46:44', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009103', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440120', 'OWN', 1052, 1052, '2026-10-17 15:47:32', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009104', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440109', 'OPPONENT', 1054, 1054, '2026-10-17 15:47:34', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009105', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1056, 1056, '2026-10-17 15:47:36', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009106', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 1094, 1094, '2026-10-17 15:48:14', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009107', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 1103, 1103, '2026-10-17 15:48:23', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009108', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000103', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 1122, 1122, '2026-10-17 15:48:42', 1, 'APP', true, '{"outcome": "won", "jumpers": 4}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009109', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000103', '550e8400-e29b-41d4-a716-446655440119', 'OWN', 1126, 1126, '2026-10-17 15:48:46', 1, 'APP', true, '{"errorType": "knock_on"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009110', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000103', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1127, 1127, '2026-10-17 15:48:47', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009111', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440128', 'OWN', 1133, 1133, '2026-10-17 15:48:53', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009112', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1134, 1134, '2026-10-17 15:48:54', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009113', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 1149, 1149, '2026-10-17 15:49:09', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009114', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 1168, 1168, '2026-10-17 15:49:28', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009115', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 1183, 1183, '2026-10-17 15:49:43', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009116', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 1186, 1186, '2026-10-17 15:49:46', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009117', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440122', 'OWN', 1193, 1193, '2026-10-17 15:49:53', 1, 'APP', true, '{"infringement": "offside"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009118', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1215, 1215, '2026-10-17 15:50:15', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009119', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 1242, 1242, '2026-10-17 15:50:42', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009120', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000103', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 1243, 1243, '2026-10-17 15:50:43', 1, 'APP', true, '{"outcome": "won", "jumpers": 4}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009121', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 1248, 1248, '2026-10-17 15:50:48', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009122', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 1271, 1271, '2026-10-17 15:51:11', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009123', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 1273, 1273, '2026-10-17 15:51:13', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009124', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1278, 1278, '2026-10-17 15:51:18', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009125', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 1279, 1279, '2026-10-17 15:51:19', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009126', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OPPONENT', 1284, 1284, '2026-10-17 15:51:24', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009127', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440110', 'OWN', 1287, 1287, '2026-10-17 15:51:27', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009128', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 1288, 1288, '2026-10-17 15:51:28', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009129', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 1290, 1290, '2026-10-17 15:51:30', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009130', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440127', 'OWN', 1302, 1302, '2026-10-17 15:51:42', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009131', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1327, 1327, '2026-10-17 15:52:07', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009132', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 1331, 1331, '2026-10-17 15:52:11', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009133', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OWN', 1334, 1334, '2026-10-17 15:52:14', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009134', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 1336, 1336, '2026-10-17 15:52:16', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009135', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 1338, 1338, '2026-10-17 15:52:18', 1, 'APP', true, '{"zone": "left"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009136', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440102', 'OWN', 1339, 1339, '2026-10-17 15:52:19', 1, 'APP', true, '{"wasSuccessful": true}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009137', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 1351, 1351, '2026-10-17 15:52:31', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009138', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 1358, 1358, '2026-10-17 15:52:38', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009139', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440120', 'OWN', 1372, 1372, '2026-10-17 15:52:52', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009140', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OWN', 1396, 1396, '2026-10-17 15:53:16', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009141', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 1398, 1398, '2026-10-17 15:53:18', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009142', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 1399, 1399, '2026-10-17 15:53:19', 1, 'APP', true, '{"outcome": "won", "jumpers": 4}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009143', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 1404, 1404, '2026-10-17 15:53:24', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009144', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440110', 'OPPONENT', 1421, 1421, '2026-10-17 15:53:41', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009145', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000103', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 1439, 1439, '2026-10-17 15:53:59', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009146', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440119', 'OWN', 1442, 1442, '2026-10-17 15:54:02', 1, 'APP', true, '{"errorType": "knock_on"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009147', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 1445, 1445, '2026-10-17 15:54:05', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009148', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 1446, 1446, '2026-10-17 15:54:06', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009149', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 1448, 1448, '2026-10-17 15:54:08', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009150', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 1449, 1449, '2026-10-17 15:54:09', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009151', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OPPONENT', 1456, 1456, '2026-10-17 15:54:16', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009152', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 1458, 1458, '2026-10-17 15:54:18', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009153', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 1490, 1490, '2026-10-17 15:54:50', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009154', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440128', 'OWN', 1513, 1513, '2026-10-17 15:55:13', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009155', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440122', 'OPPONENT', 1518, 1518, '2026-10-17 15:55:18', 1, 'APP', true, '{"infringement": "offside"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009156', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 1523, 1523, '2026-10-17 15:55:23', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009157', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440111', 'OPPONENT', 1534, 1534, '2026-10-17 15:55:34', 1, 'APP', true, '{"outcome": "won"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009158', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 1541, 1541, '2026-10-17 15:55:41', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009159', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OWN', 1548, 1548, '2026-10-17 15:55:48', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009160', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 1565, 1565, '2026-10-17 15:56:05', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009161', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OWN', 1568, 1568, '2026-10-17 15:56:08', 1, 'APP', true, '{"outcome": "won", "jumpers": 4}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009162', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 1626, 1626, '2026-10-17 15:57:06', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009163', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OPPONENT', 1629, 1629, '2026-10-17 15:57:09', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009164', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440120', 'OPPONENT', 1634, 1634, '2026-10-17 15:57:14', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009165', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 1641, 1641, '2026-10-17 15:57:21', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009166', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 1648, 1648, '2026-10-17 15:57:28', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009167', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440110', 'OWN', 1649, 1649, '2026-10-17 15:57:29', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009168', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 1653, 1653, '2026-10-17 15:57:33', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009169', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440122', 'OPPONENT', 1664, 1664, '2026-10-17 15:57:44', 1, 'APP', true, '{"infringement": "offside"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009170', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 1667, 1667, '2026-10-17 15:57:47', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009171', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 1690, 1690, '2026-10-17 15:58:10', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009172', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OWN', 1702, 1702, '2026-10-17 15:58:22', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009173', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 1704, 1704, '2026-10-17 15:58:24', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009174', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 1711, 1711, '2026-10-17 15:58:31', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009175', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 1718, 1718, '2026-10-17 15:58:38', 1, 'APP', true, '{"zone": "right"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009176', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440110', 'OWN', 1727, 1727, '2026-10-17 15:58:47', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009177', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 1732, 1732, '2026-10-17 15:58:52', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009178', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 1740, 1740, '2026-10-17 15:59:00', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009179', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 1744, 1744, '2026-10-17 15:59:04', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009180', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 1754, 1754, '2026-10-17 15:59:14', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009181', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440119', 'OPPONENT', 1756, 1756, '2026-10-17 15:59:16', 1, 'APP', true, '{"errorType": "knock_on"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009182', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440120', 'OWN', 1765, 1765, '2026-10-17 15:59:25', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009183', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1766, 1766, '2026-10-17 15:59:26', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009184', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440110', 'OWN', 1768, 1768, '2026-10-17 15:59:28', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009185', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440114', 'OWN', 1769, 1769, '2026-10-17 15:59:29', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009186', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000101', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 1770, 1770, '2026-10-17 15:59:30', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009187', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 1771, 1771, '2026-10-17 15:59:31', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009188', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1776, 1776, '2026-10-17 15:59:36', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009189', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440122', 'OPPONENT', 1792, 1792, '2026-10-17 15:59:52', 1, 'APP', true, '{"infringement": "offside"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009190', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 1794, 1794, '2026-10-17 15:59:54', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009191', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 1796, 1796, '2026-10-17 15:59:56', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009192', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 1809, 1809, '2026-10-17 16:00:09', 1, 'APP', true, '{"outcome": "won", "jumpers": 4}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009193', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 1818, 1818, '2026-10-17 16:00:18', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009194', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OWN', 1819, 1819, '2026-10-17 16:00:19', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009195', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000101', '550e8400-e29b-41d4-a716-446655440122', 'OWN', 1822, 1822, '2026-10-17 16:00:22', 1, 'APP', true, '{"infringement": "offside"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009196', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 1824, 1824, '2026-10-17 16:00:24', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009197', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 1844, 1844, '2026-10-17 16:00:44', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009198', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440123', 'OPPONENT', 1846, 1846, '2026-10-17 16:00:46', 1, 'APP', true, '{"reason": "Tackle peligroso"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009199', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440104', 'OWN', 1857, 1857, '2026-10-17 16:00:57', 1, 'APP', true, '{"wasSuccessful": true, "distanceMeters": 38}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009200', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 1859, 1859, '2026-10-17 16:00:59', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009201', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440127', 'OWN', 1865, 1865, '2026-10-17 16:01:05', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009202', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1866, 1866, '2026-10-17 16:01:06', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009203', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 1884, 1884, '2026-10-17 16:01:24', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009204', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 1891, 1891, '2026-10-17 16:01:31', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009205', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1892, 1892, '2026-10-17 16:01:32', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009206', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 1899, 1899, '2026-10-17 16:01:39', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009207', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1908, 1908, '2026-10-17 16:01:48', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009208', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 1928, 1928, '2026-10-17 16:02:08', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009209', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440110', 'OPPONENT', 1950, 1950, '2026-10-17 16:02:30', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009210', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 1958, 1958, '2026-10-17 16:02:38', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009211', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 1969, 1969, '2026-10-17 16:02:49', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009212', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 1983, 1983, '2026-10-17 16:03:03', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009213', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 1997, 1997, '2026-10-17 16:03:17', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009214', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 2001, 2001, '2026-10-17 16:03:21', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009215', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OWN', 2016, 2016, '2026-10-17 16:03:36', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009216', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 2031, 2031, '2026-10-17 16:03:51', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009217', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 2045, 2045, '2026-10-17 16:04:05', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009218', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440109', 'OWN', 2057, 2057, '2026-10-17 16:04:17', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009219', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440109', 'OWN', 2071, 2071, '2026-10-17 16:04:31', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009220', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 2078, 2078, '2026-10-17 16:04:38', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009221', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 2084, 2084, '2026-10-17 16:04:44', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009222', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 2086, 2086, '2026-10-17 16:04:46', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009223', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 2096, 2096, '2026-10-17 16:04:56', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009224', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 2098, 2098, '2026-10-17 16:04:58', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009225', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440128', 'OPPONENT', 2106, 2106, '2026-10-17 16:05:06', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009226', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2110, 2110, '2026-10-17 16:05:10', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009227', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440127', 'OWN', 2143, 2143, '2026-10-17 16:05:43', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009228', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 2154, 2154, '2026-10-17 16:05:54', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009229', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 2162, 2162, '2026-10-17 16:06:02', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009230', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000103', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 2166, 2166, '2026-10-17 16:06:06', 1, 'APP', true, '{"outcome": "won", "jumpers": 4}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009231', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440113', 'OPPONENT', 2180, 2180, '2026-10-17 16:06:20', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009232', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 2181, 2181, '2026-10-17 16:06:21', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009233', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 2189, 2189, '2026-10-17 16:06:29', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009234', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 2254, 2254, '2026-10-17 16:07:34', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009235', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440125', 'OPPONENT', 2266, 2266, '2026-10-17 16:07:46', 1, 'APP', true, '{"severity": "minor"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009236', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440113', 'OWN', 2286, 2286, '2026-10-17 16:08:06', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009237', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 2288, 2288, '2026-10-17 16:08:08', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009238', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OPPONENT', 2296, 2296, '2026-10-17 16:08:16', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009239', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 2305, 2305, '2026-10-17 16:08:25', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009240', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 2308, 2308, '2026-10-17 16:08:28', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009241', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440114', 'OWN', 2317, 2317, '2026-10-17 16:08:37', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009242', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440120', 'OWN', 2320, 2320, '2026-10-17 16:08:40', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009243', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 2327, 2327, '2026-10-17 16:08:47', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009244', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 2332, 2332, '2026-10-17 16:08:52', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009245', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 2356, 2356, '2026-10-17 16:09:16', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009246', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 2359, 2359, '2026-10-17 16:09:19', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009247', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 2366, 2366, '2026-10-17 16:09:26', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009248', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2375, 2375, '2026-10-17 16:09:35', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009249', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2381, 2381, '2026-10-17 16:09:41', 1, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009250', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 2414, 2414, '2026-10-17 16:20:14', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009251', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440119', 'OWN', 2429, 2429, '2026-10-17 16:20:29', 2, 'APP', true, '{"errorType": "knock_on"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009252', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440114', 'OWN', 2474, 2474, '2026-10-17 16:21:14', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009253', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2475, 2475, '2026-10-17 16:21:15', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009254', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OPPONENT', 2482, 2482, '2026-10-17 16:21:22', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009255', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 2485, 2485, '2026-10-17 16:21:25', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009256', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 2491, 2491, '2026-10-17 16:21:31', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009257', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OPPONENT', 2517, 2517, '2026-10-17 16:21:57', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009258', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 2523, 2523, '2026-10-17 16:22:03', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009259', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 2557, 2557, '2026-10-17 16:22:37', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009260', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 2559, 2559, '2026-10-17 16:22:39', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009261', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 2562, 2562, '2026-10-17 16:22:42', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009262', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440122', 'OWN', 2564, 2564, '2026-10-17 16:22:44', 2, 'APP', true, '{"infringement": "offside"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009263', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 2568, 2568, '2026-10-17 16:22:48', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009264', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440110', 'OWN', 2576, 2576, '2026-10-17 16:22:56', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009265', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 2579, 2579, '2026-10-17 16:22:59', 2, 'APP', true, '{"outcome": "won", "jumpers": 4}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009266', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 2586, 2586, '2026-10-17 16:23:06', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009267', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000101', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 2587, 2587, '2026-10-17 16:23:07', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009268', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 2589, 2589, '2026-10-17 16:23:09', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009269', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440122', 'OPPONENT', 2603, 2603, '2026-10-17 16:23:23', 2, 'APP', true, '{"infringement": "offside"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009270', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 2621, 2621, '2026-10-17 16:23:41', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009271', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 2622, 2622, '2026-10-17 16:23:42', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009272', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 2626, 2626, '2026-10-17 16:23:46', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009273', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 2661, 2661, '2026-10-17 16:24:21', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009274', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440119', 'OPPONENT', 2665, 2665, '2026-10-17 16:24:25', 2, 'APP', true, '{"errorType": "knock_on"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009275', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440104', 'OPPONENT', 2666, 2666, '2026-10-17 16:24:26', 2, 'APP', true, '{"wasSuccessful": true, "distanceMeters": 28}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009276', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440120', 'OWN', 2677, 2677, '2026-10-17 16:24:37', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009277', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440113', 'OPPONENT', 2684, 2684, '2026-10-17 16:24:44', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009278', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 2685, 2685, '2026-10-17 16:24:45', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009279', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 2724, 2724, '2026-10-17 16:25:24', 2, 'APP', true, '{"outcome": "won", "jumpers": 4}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009280', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 2732, 2732, '2026-10-17 16:25:32', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009281', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 2741, 2741, '2026-10-17 16:25:41', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009282', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 2742, 2742, '2026-10-17 16:25:42', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009283', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440110', 'OWN', 2746, 2746, '2026-10-17 16:25:46', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009284', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OPPONENT', 2751, 2751, '2026-10-17 16:25:51', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009285', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 2753, 2753, '2026-10-17 16:25:53', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009286', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2755, 2755, '2026-10-17 16:25:55', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009287', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OWN', 2758, 2758, '2026-10-17 16:25:58', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009288', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 2783, 2783, '2026-10-17 16:26:23', 2, 'APP', true, '{"outcome": "won", "jumpers": 4}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009289', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440117', 'OPPONENT', 2790, 2790, '2026-10-17 16:26:30', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009290', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 2795, 2795, '2026-10-17 16:26:35', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009291', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 2813, 2813, '2026-10-17 16:26:53', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009292', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OWN', 2822, 2822, '2026-10-17 16:27:02', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009293', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 2828, 2828, '2026-10-17 16:27:08', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009294', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 2831, 2831, '2026-10-17 16:27:11', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009295', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OPPONENT', 2832, 2832, '2026-10-17 16:27:12', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009296', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440110', 'OWN', 2862, 2862, '2026-10-17 16:27:42', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009297', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000101', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2863, 2863, '2026-10-17 16:27:43', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009298', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2907, 2907, '2026-10-17 16:28:27', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009299', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 2917, 2917, '2026-10-17 16:28:37', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009300', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OPPONENT', 2918, 2918, '2026-10-17 16:28:38', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009301', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 2931, 2931, '2026-10-17 16:28:51', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009302', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440111', 'OWN', 2936, 2936, '2026-10-17 16:28:56', 2, 'APP', true, '{"outcome": "won"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009303', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 2944, 2944, '2026-10-17 16:29:04', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009304', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 2954, 2954, '2026-10-17 16:29:14', 2, 'APP', true, '{"outcome": "won", "jumpers": 4}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009305', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 2960, 2960, '2026-10-17 16:29:20', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009306', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440113', 'OWN', 2971, 2971, '2026-10-17 16:29:31', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009307', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440110', 'OWN', 2974, 2974, '2026-10-17 16:29:34', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009308', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 2976, 2976, '2026-10-17 16:29:36', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009309', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440127', 'OPPONENT', 2987, 2987, '2026-10-17 16:29:47', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009310', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 2996, 2996, '2026-10-17 16:29:56', 2, 'APP', true, '{"zone": "center"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009311', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440102', 'OWN', 3006, 3006, '2026-10-17 16:30:06', 2, 'APP', true, '{"wasSuccessful": true}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009312', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440110', 'OPPONENT', 3011, 3011, '2026-10-17 16:30:11', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009313', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440120', 'OWN', 3020, 3020, '2026-10-17 16:30:20', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009314', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 3023, 3023, '2026-10-17 16:30:23', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009315', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 3025, 3025, '2026-10-17 16:30:25', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009316', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 3039, 3039, '2026-10-17 16:30:39', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009317', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 3042, 3042, '2026-10-17 16:30:42', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009318', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 3058, 3058, '2026-10-17 16:30:58', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009319', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 3064, 3064, '2026-10-17 16:31:04', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009320', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OWN', 3071, 3071, '2026-10-17 16:31:11', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009321', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 3072, 3072, '2026-10-17 16:31:12', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009322', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440113', 'OPPONENT', 3086, 3086, '2026-10-17 16:31:26', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009323', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 3114, 3114, '2026-10-17 16:31:54', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009324', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OWN', 3125, 3125, '2026-10-17 16:32:05', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009325', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 3146, 3146, '2026-10-17 16:32:26', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009326', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 3148, 3148, '2026-10-17 16:32:28', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009327', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 3154, 3154, '2026-10-17 16:32:34', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009328', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 3173, 3173, '2026-10-17 16:32:53', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009329', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 3175, 3175, '2026-10-17 16:32:55', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009330', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440110', 'OWN', 3179, 3179, '2026-10-17 16:32:59', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009331', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000101', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 3190, 3190, '2026-10-17 16:33:10', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009332', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 3194, 3194, '2026-10-17 16:33:14', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009333', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OWN', 3202, 3202, '2026-10-17 16:33:22', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009334', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 3225, 3225, '2026-10-17 16:33:45', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009335', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000128', '550e8400-e29b-41d4-a716-446655440126', 'OWN', 3233, 3233, '2026-10-17 16:33:53', 2, 'APP', true, '{"subType": "tactical"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009336', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000130', '550e8400-e29b-41d4-a716-446655440126', 'OWN', 3285, 3285, '2026-10-17 16:34:45', 2, 'APP', true, '{"subType": "tactical"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009337', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440120', 'OWN', 3291, 3291, '2026-10-17 16:34:51', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009338', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440120', 'OWN', 3317, 3317, '2026-10-17 16:35:17', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009339', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 3327, 3327, '2026-10-17 16:35:27', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009340', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 3335, 3335, '2026-10-17 16:35:35', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009341', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 3366, 3366, '2026-10-17 16:36:06', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009342', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OPPONENT', 3373, 3373, '2026-10-17 16:36:13', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009343', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 3380, 3380, '2026-10-17 16:36:20', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009344', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440120', 'OWN', 3381, 3381, '2026-10-17 16:36:21', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009345', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000130', '550e8400-e29b-41d4-a716-446655440111', 'OWN', 3384, 3384, '2026-10-17 16:36:24', 2, 'APP', true, '{"outcome": "won"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009346', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 3387, 3387, '2026-10-17 16:36:27', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009347', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 3393, 3393, '2026-10-17 16:36:33', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009348', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 3395, 3395, '2026-10-17 16:36:35', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009349', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 3398, 3398, '2026-10-17 16:36:38', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009350', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 3422, 3422, '2026-10-17 16:37:02', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009351', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 3432, 3432, '2026-10-17 16:37:12', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009352', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 3440, 3440, '2026-10-17 16:37:20', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009353', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 3445, 3445, '2026-10-17 16:37:25', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009354', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440119', 'OWN', 3446, 3446, '2026-10-17 16:37:26', 2, 'APP', true, '{"errorType": "knock_on"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009355', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OWN', 3456, 3456, '2026-10-17 16:37:36', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009356', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 3500, 3500, '2026-10-17 16:38:20', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009357', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440128', 'OWN', 3525, 3525, '2026-10-17 16:38:45', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009358', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OPPONENT', 3527, 3527, '2026-10-17 16:38:47', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009359', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 3562, 3562, '2026-10-17 16:39:22', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009360', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440123', 'OWN', 3566, 3566, '2026-10-17 16:39:26', 2, 'APP', true, '{"reason": "Infracción reiterada"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009361', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440109', 'OWN', 3571, 3571, '2026-10-17 16:39:31', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009362', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OWN', 3575, 3575, '2026-10-17 16:39:35', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009363', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440120', 'OPPONENT', 3579, 3579, '2026-10-17 16:39:39', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009364', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 3583, 3583, '2026-10-17 16:39:43', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009365', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 3588, 3588, '2026-10-17 16:39:48', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009366', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 3601, 3601, '2026-10-17 16:40:01', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009367', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440109', 'OPPONENT', 3609, 3609, '2026-10-17 16:40:09', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009368', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 3619, 3619, '2026-10-17 16:40:19', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009369', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 3641, 3641, '2026-10-17 16:40:41', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009370', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440110', 'OPPONENT', 3673, 3673, '2026-10-17 16:41:13', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009371', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 3675, 3675, '2026-10-17 16:41:15', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009372', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 3676, 3676, '2026-10-17 16:41:16', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009373', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 3678, 3678, '2026-10-17 16:41:18', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009374', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 3700, 3700, '2026-10-17 16:41:40', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009375', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 3713, 3713, '2026-10-17 16:41:53', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009376', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 3724, 3724, '2026-10-17 16:42:04', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009377', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 3753, 3753, '2026-10-17 16:42:33', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009378', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OWN', 3758, 3758, '2026-10-17 16:42:38', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009379', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OPPONENT', 3767, 3767, '2026-10-17 16:42:47', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009380', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440122', 'OPPONENT', 3769, 3769, '2026-10-17 16:42:49', 2, 'APP', true, '{"infringement": "offside"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009381', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 3773, 3773, '2026-10-17 16:42:53', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009382', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440109', 'OWN', 3778, 3778, '2026-10-17 16:42:58', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009383', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 3781, 3781, '2026-10-17 16:43:01', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009384', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000105', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 3787, 3787, '2026-10-17 16:43:07', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009385', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000131', '550e8400-e29b-41d4-a716-446655440126', 'OWN', 3793, 3793, '2026-10-17 16:43:13', 2, 'APP', true, '{"subType": "tactical"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009386', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 3794, 3794, '2026-10-17 16:43:14', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009387', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000112', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 3796, 3796, '2026-10-17 16:43:16', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009388', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 3807, 3807, '2026-10-17 16:43:27', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009389', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000111', '550e8400-e29b-41d4-a716-446655440128', 'OWN', 3814, 3814, '2026-10-17 16:43:34', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009390', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 3820, 3820, '2026-10-17 16:43:40', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009391', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 3839, 3839, '2026-10-17 16:43:59', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009392', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 3840, 3840, '2026-10-17 16:44:00', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009393', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OWN', 3851, 3851, '2026-10-17 16:44:11', 2, 'APP', true, '{"outcome": "won", "jumpers": 4}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009394', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 3853, 3853, '2026-10-17 16:44:13', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009395', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 3870, 3870, '2026-10-17 16:44:30', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009396', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 3885, 3885, '2026-10-17 16:44:45', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009397', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 3890, 3890, '2026-10-17 16:44:50', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009398', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 3893, 3893, '2026-10-17 16:44:53', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009399', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OWN', 3898, 3898, '2026-10-17 16:44:58', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009400', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440117', 'OWN', 3900, 3900, '2026-10-17 16:45:00', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009401', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 3912, 3912, '2026-10-17 16:45:12', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009402', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 3914, 3914, '2026-10-17 16:45:14', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009403', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 3915, 3915, '2026-10-17 16:45:15', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009404', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440110', 'OWN', 3928, 3928, '2026-10-17 16:45:28', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009405', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000109', '550e8400-e29b-41d4-a716-446655440125', 'OWN', 3935, 3935, '2026-10-17 16:45:35', 2, 'APP', true, '{"severity": "minor"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009406', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000133', '550e8400-e29b-41d4-a716-446655440126', 'OWN', 3937, 3937, '2026-10-17 16:45:37', 2, 'APP', true, '{"subType": "injury"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009407', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440111', 'OWN', 3939, 3939, '2026-10-17 16:45:39', 2, 'APP', true, '{"outcome": "won"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009408', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440114', 'OPPONENT', 3943, 3943, '2026-10-17 16:45:43', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009409', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OWN', 3950, 3950, '2026-10-17 16:45:50', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009410', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000128', '550e8400-e29b-41d4-a716-446655440111', 'OWN', 3951, 3951, '2026-10-17 16:45:51', 2, 'APP', true, '{"outcome": "won"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009411', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000107', '550e8400-e29b-41d4-a716-446655440116', 'OWN', 3972, 3972, '2026-10-17 16:46:12', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009412', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000131', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 3982, 3982, '2026-10-17 16:46:22', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009413', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 3989, 3989, '2026-10-17 16:46:29', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009414', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440127', 'OWN', 3991, 3991, '2026-10-17 16:46:31', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009415', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440122', 'OPPONENT', 3992, 3992, '2026-10-17 16:46:32', 2, 'APP', true, '{"infringement": "offside"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009416', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 3994, 3994, '2026-10-17 16:46:34', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009417', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440114', 'OWN', 4007, 4007, '2026-10-17 16:46:47', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009418', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000108', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 4013, 4013, '2026-10-17 16:46:53', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009419', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000133', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 4031, 4031, '2026-10-17 16:47:11', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009420', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440111', 'OWN', 4039, 4039, '2026-10-17 16:47:19', 2, 'APP', true, '{"outcome": "won"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009421', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000128', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 4046, 4046, '2026-10-17 16:47:26', 2, 'APP', true, '{"outcome": "won", "jumpers": 4}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009422', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000128', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 4082, 4082, '2026-10-17 16:48:02', 2, 'APP', true, '{"outcome": "won", "jumpers": 4}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009423', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440112', 'OWN', 4090, 4090, '2026-10-17 16:48:10', 2, 'APP', true, '{"outcome": "won", "jumpers": 4}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009424', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440113', 'OWN', 4107, 4107, '2026-10-17 16:48:27', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009425', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440101', 'OPPONENT', 4114, 4114, '2026-10-17 16:48:34', 2, 'APP', true, '{"zone": "center"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009426', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440102', 'OPPONENT', 4122, 4122, '2026-10-17 16:48:42', 2, 'APP', true, '{"wasSuccessful": true}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009427', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OPPONENT', 4127, 4127, '2026-10-17 16:48:47', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009428', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 4141, 4141, '2026-10-17 16:49:01', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009429', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 4142, 4142, '2026-10-17 16:49:02', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009430', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 4146, 4146, '2026-10-17 16:49:06', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009431', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OWN', 4166, 4166, '2026-10-17 16:49:26', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009432', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 4197, 4197, '2026-10-17 16:49:57', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009433', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 4199, 4199, '2026-10-17 16:49:59', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009434', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440127', 'OPPONENT', 4200, 4200, '2026-10-17 16:50:00', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009435', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000113', '550e8400-e29b-41d4-a716-446655440122', 'OWN', 4201, 4201, '2026-10-17 16:50:01', 2, 'APP', true, '{"infringement": "offside"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009436', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OPPONENT', 4207, 4207, '2026-10-17 16:50:07', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009437', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 4209, 4209, '2026-10-17 16:50:09', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009438', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440120', 'OWN', 4212, 4212, '2026-10-17 16:50:12', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009439', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 4227, 4227, '2026-10-17 16:50:27', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009440', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000134', '550e8400-e29b-41d4-a716-446655440126', 'OWN', 4245, 4245, '2026-10-17 16:50:45', 2, 'APP', true, '{"subType": "tactical"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009441', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000135', '550e8400-e29b-41d4-a716-446655440126', 'OWN', 4246, 4246, '2026-10-17 16:50:46', 2, 'APP', true, '{"subType": "tactical"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009442', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000102', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 4248, 4248, '2026-10-17 16:50:48', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009443', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 4250, 4250, '2026-10-17 16:50:50', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009444', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 4253, 4253, '2026-10-17 16:50:53', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009445', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 4255, 4255, '2026-10-17 16:50:55', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009446', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 4280, 4280, '2026-10-17 16:51:20', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009447', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440110', 'OPPONENT', 4282, 4282, '2026-10-17 16:51:22', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009448', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 4299, 4299, '2026-10-17 16:51:39', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009449', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000135', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 4303, 4303, '2026-10-17 16:51:43', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009450', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 4311, 4311, '2026-10-17 16:51:51', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009451', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 4329, 4329, '2026-10-17 16:52:09', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009452', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 4333, 4333, '2026-10-17 16:52:13', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009453', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440112', 'OPPONENT', 4343, 4343, '2026-10-17 16:52:23', 2, 'APP', true, '{"outcome": "won", "jumpers": 4}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009454', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 4347, 4347, '2026-10-17 16:52:27', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009455', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 4356, 4356, '2026-10-17 16:52:36', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009456', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440119', 'OWN', 4368, 4368, '2026-10-17 16:52:48', 2, 'APP', true, '{"errorType": "knock_on"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009457', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 4376, 4376, '2026-10-17 16:52:56', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009458', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 4399, 4399, '2026-10-17 16:53:19', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009459', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000104', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 4440, 4440, '2026-10-17 16:54:00', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009460', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000106', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 4445, 4445, '2026-10-17 16:54:05', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009461', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OWN', 4455, 4455, '2026-10-17 16:54:15', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009462', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000130', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 4461, 4461, '2026-10-17 16:54:21', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009463', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000128', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 4464, 4464, '2026-10-17 16:54:24', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009464', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000131', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 4467, 4467, '2026-10-17 16:54:27', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009465', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440104', 'OPPONENT', 4474, 4474, '2026-10-17 16:54:34', 2, 'APP', true, '{"wasSuccessful": true, "distanceMeters": 42}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009466', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 4486, 4486, '2026-10-17 16:54:46', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009467', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440122', 'OPPONENT', 4487, 4487, '2026-10-17 16:54:47', 2, 'APP', true, '{"infringement": "offside"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009468', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440107', 'OPPONENT', 4490, 4490, '2026-10-17 16:54:50', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009469', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OPPONENT', 4510, 4510, '2026-10-17 16:55:10', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009470', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440122', 'OPPONENT', 4518, 4518, '2026-10-17 16:55:18', 2, 'APP', true, '{"infringement": "offside"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009471', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 4519, 4519, '2026-10-17 16:55:19', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009472', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OWN', 4521, 4521, '2026-10-17 16:55:21', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009473', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000130', '550e8400-e29b-41d4-a716-446655440108', 'OWN', 4534, 4534, '2026-10-17 16:55:34', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009474', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440111', 'OPPONENT', 4549, 4549, '2026-10-17 16:55:49', 2, 'APP', true, '{"outcome": "won"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009475', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000130', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 4552, 4552, '2026-10-17 16:55:52', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009476', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 4554, 4554, '2026-10-17 16:55:54', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009477', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000135', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 4562, 4562, '2026-10-17 16:56:02', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009478', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000110', '550e8400-e29b-41d4-a716-446655440104', 'OWN', 4564, 4564, '2026-10-17 16:56:04', 2, 'APP', true, '{"wasSuccessful": true, "distanceMeters": 35}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009479', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000131', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 4568, 4568, '2026-10-17 16:56:08', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009480', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000115', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 4569, 4569, '2026-10-17 16:56:09', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009481', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 4595, 4595, '2026-10-17 16:56:35', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009482', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000130', '550e8400-e29b-41d4-a716-446655440119', 'OWN', 4603, 4603, '2026-10-17 16:56:43', 2, 'APP', true, '{"errorType": "knock_on"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009483', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440127', 'OWN', 4618, 4618, '2026-10-17 16:56:58', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009484', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 4632, 4632, '2026-10-17 16:57:12', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009485', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000133', '550e8400-e29b-41d4-a716-446655440128', 'OWN', 4636, 4636, '2026-10-17 16:57:16', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009486', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000134', '550e8400-e29b-41d4-a716-446655440120', 'OWN', 4644, 4644, '2026-10-17 16:57:24', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009487', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440116', 'OWN', 4655, 4655, '2026-10-17 16:57:35', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009488', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000114', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 4677, 4677, '2026-10-17 16:57:57', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009489', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000128', '550e8400-e29b-41d4-a716-446655440106', 'OWN', 4678, 4678, '2026-10-17 16:57:58', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009490', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000130', '550e8400-e29b-41d4-a716-446655440115', 'OWN', 4679, 4679, '2026-10-17 16:57:59', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009491', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440108', 'OPPONENT', 4693, 4693, '2026-10-17 16:58:13', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009492', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000133', '550e8400-e29b-41d4-a716-446655440101', 'OWN', 4697, 4697, '2026-10-17 16:58:17', 2, 'APP', true, '{"zone": "right"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009493', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 4744, 4744, '2026-10-17 16:59:04', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009494', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440119', 'OPPONENT', 4745, 4745, '2026-10-17 16:59:05', 2, 'APP', true, '{"errorType": "knock_on"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009495', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 4749, 4749, '2026-10-17 16:59:09', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009496', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440115', 'OPPONENT', 4763, 4763, '2026-10-17 16:59:23', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009497', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000133', '550e8400-e29b-41d4-a716-446655440109', 'OWN', 4785, 4785, '2026-10-17 16:59:45', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009498', '11111111-1111-1111-1111-000000000048', '11111111-1111-1111-1111-000000000134', '550e8400-e29b-41d4-a716-446655440107', 'OWN', 4791, 4791, '2026-10-17 16:59:51', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-000000009499', '11111111-1111-1111-1111-000000000048', NULL, '550e8400-e29b-41d4-a716-446655440106', 'OPPONENT', 4794, 4794, '2026-10-17 16:59:54', 2, 'APP', true, '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- RECALCULO DE MARCADORES (Consistencia de Staging)
-- =========================================
-- Actualiza de manera consistente home_score y away_score sumando los eventos puntuables activos
UPDATE matches m
SET 
  home_score = COALESCE((
    SELECT SUM(et.points) 
    FROM events e 
    JOIN event_types et ON e.event_type_id = et.id 
    WHERE e.match_id = m.id 
      AND e.team_possession = 'OWN' 
      AND e.active = true 
      AND et.is_scoring = true
  ), 0),
  away_score = COALESCE((
    SELECT SUM(et.points) 
    FROM events e 
    JOIN event_types et ON e.event_type_id = et.id 
    WHERE e.match_id = m.id 
      AND e.team_possession = 'OPPONENT' 
      AND e.active = true 
      AND et.is_scoring = true
  ), 0);

-- Actualizar hora absoluta (absolute_match_time) para consistencia en staging
UPDATE events
SET absolute_match_time = match_time
WHERE absolute_match_time IS NULL;