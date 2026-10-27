-- OvalTrack Data Seeder
-- =========================================

TRUNCATE TABLE events, matches_players, event_types, matches, opponents, division_players, division_coaches, divisions, clubs, users, persons RESTART IDENTITY CASCADE;

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
-- STAGING: Primera vs Trelew Rugby Club
-- Snapshot de la BD del 19/10/2026 16:45 (2 partidos FINISHED, 167 eventos). Plantel de 23: 1-8 forwards, 9-15 backs, 16-21 forwards, 22-23 backs.
-- =========================================

-- =========================================
-- PERSONS (31 filas: 3 de staff + 27 jugadores + 1 admin OvalTrack)
-- =========================================

INSERT INTO persons (id, first_name, last_name, birth_date, contact_email, contact_phone, created_at) VALUES
    ('11111111-1111-1111-1111-000000000001', 'Carlos', 'Administrador', '1980-01-01', 'admin@club.com', '123456789', '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000002', 'Gonzalo', 'Entrenador', '1985-05-10', 'gonzalo@mail.com', '123456789', '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000003', 'Mario', 'Analista', '1982-11-20', 'coach2@ovaltrack.com', '123456789', '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000101', 'Matías', 'Salari', NULL, NULL, NULL, '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000102', 'Joaquín', 'Guerra', NULL, NULL, NULL, '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000103', 'Leonel', 'Llanquitru', NULL, NULL, NULL, '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000104', 'Luciano', 'Belmar', NULL, NULL, NULL, '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000105', 'Matías', 'Iribarra', NULL, NULL, NULL, '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000106', 'Gonzalo', 'Mangini', NULL, NULL, NULL, '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000107', 'Tomas', 'Luffi', NULL, NULL, NULL, '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000108', 'Nazareno', 'Rocha', NULL, NULL, NULL, '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000109', 'Ariel', 'Ferrufino', NULL, NULL, NULL, '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000110', 'Hernán', 'Vera', NULL, NULL, NULL, '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000111', 'Rodrigo', 'Aman', NULL, NULL, NULL, '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000112', 'Francisco', 'Peña', NULL, NULL, NULL, '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000113', 'Bautista', 'Mengoni', NULL, NULL, NULL, '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000114', 'Luciano', 'Balmaceda', NULL, NULL, NULL, '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000115', 'Bautista', 'Guerra', NULL, NULL, NULL, '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000116', 'Esteban', 'Ceballos', NULL, NULL, NULL, '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000117', 'Facundo', 'Gangas', NULL, NULL, NULL, '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000118', 'Alejandro', 'Cañiu', NULL, NULL, NULL, '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000119', 'Rodrigo', 'Silva', NULL, NULL, NULL, '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000120', 'Juan', 'Pistilli', NULL, NULL, NULL, '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000121', 'Manuel', 'Rocha', NULL, NULL, NULL, '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000122', 'Agustín', 'Albornoz', NULL, NULL, NULL, '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000123', 'Bruno', 'Carrizo', NULL, NULL, NULL, '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000124', 'Facundo', 'Soria', NULL, NULL, NULL, '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000125', 'Emiliano', 'Villegas', NULL, NULL, NULL, '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000126', 'Joaquín', 'Devitt', NULL, NULL, NULL, '2026-10-17 17:04:12.744'),
    ('11111111-1111-1111-1111-000000000127', 'Alejo', 'Zotelo', NULL, NULL, NULL, '2026-10-17 17:04:12.744'),
    ('b62a7203-3291-411b-a090-2e5b7e466c35', 'administrador', 'ovaltrack', NULL, 'admin@ovaltrack.com', '0123456789', '2026-10-17 19:04:52.314');


-- =========================================
-- USERS (admin club, entrenador, analista y admin OvalTrack)
-- =========================================

INSERT INTO users (id, login_email, password_hash, role, person_id, active, account_status, created_at) VALUES
    ('11111111-1111-1111-1111-000000000001', 'admin@club.com', '$2a$10$muT5CkR/ijOSgfmjvAWwNuYxVc6bZUKpt2inx5AXux7ukib9X3h6K', 'ADMIN_CLUB', '11111111-1111-1111-1111-000000000001', true, NULL, '2026-10-17 17:04:12.745'),
    ('11111111-1111-1111-1111-000000000002', 'gonzalo@mail.com', '$2a$10$EJRf2jQGFPYWYSL03J6rCe4v9v3dMxeyt/efj17fIzSgCO9Um1ImW', 'COACH_ANALYST', '11111111-1111-1111-1111-000000000002', true, NULL, '2026-10-17 17:04:12.745'),
    ('11111111-1111-1111-1111-000000000003', 'coach2@ovaltrack.com', '$2a$10$rfosuoBOENyuQRIy6eCSX.RVjuk2ZrLtlz7NdGpBlxrqviDJflWiG', 'COACH_ANALYST', '11111111-1111-1111-1111-000000000003', true, NULL, '2026-10-17 17:04:12.745'),
    ('c70c9d49-825f-4a03-9e2d-dfd52d054209', 'admin@ovaltrack.com', '$2a$10$EjrfTag1DZaSFbHLC7f3X.LiN4mPqkLCy69hzDFedyh399yzz01MG', 'ADMIN_OVALTRACK', 'b62a7203-3291-411b-a090-2e5b7e466c35', true, 'ACTIVE', '2026-10-17 19:04:52.322');


-- =========================================
-- CLUBS
-- =========================================

INSERT INTO clubs (id, name, created_at, status, admin_user_id, city, logo_url, contact_email, contact_phone) VALUES
    ('11111111-1111-1111-1111-000000000010', 'Puerto Madryn Rugby Club', '2026-10-17 17:04:12.746', 'ACTIVE', '11111111-1111-1111-1111-000000000001', 'Puerto Madryn', '/argentina-escudo.png', 'contacto@pmrc.com', '123456789');

-- Asociar las personas del club (el admin de OvalTrack no pertenece a ningún club)
UPDATE persons SET club_id = '11111111-1111-1111-1111-000000000010'
WHERE id <> 'b62a7203-3291-411b-a090-2e5b7e466c35';


-- =========================================
-- DIVISIONS
-- =========================================

INSERT INTO divisions (id, name, club_id, created_at, age_category, gender, active) VALUES
    ('11111111-1111-1111-1111-000000000020', 'Primera', '11111111-1111-1111-1111-000000000010', '2026-10-17 17:04:12.747', 'SENIOR', 'MALE', true);


-- =========================================
-- DIVISION_COACHES (Gonzalo entrena; Mario analiza el partido)
-- =========================================

INSERT INTO division_coaches (id, person_id, division_id, start_date, end_date) VALUES
    ('11111111-1111-1111-1111-000000000030', '11111111-1111-1111-1111-000000000002', '11111111-1111-1111-1111-000000000020', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000031', '11111111-1111-1111-1111-000000000003', '11111111-1111-1111-1111-000000000020', '2023-01-01', NULL);


-- =========================================
-- DIVISION_PLAYERS (27 jugadores de Primera: 23 convocables + 4 adicionales del plantel)
-- =========================================

INSERT INTO division_players (id, person_id, division_id, jersey_number, position, start_date, end_date) VALUES
    ('11111111-1111-1111-1111-000000000201', '11111111-1111-1111-1111-000000000101', '11111111-1111-1111-1111-000000000020', 1, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000202', '11111111-1111-1111-1111-000000000102', '11111111-1111-1111-1111-000000000020', 2, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000203', '11111111-1111-1111-1111-000000000103', '11111111-1111-1111-1111-000000000020', 3, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000204', '11111111-1111-1111-1111-000000000104', '11111111-1111-1111-1111-000000000020', 4, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000205', '11111111-1111-1111-1111-000000000105', '11111111-1111-1111-1111-000000000020', 5, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000206', '11111111-1111-1111-1111-000000000106', '11111111-1111-1111-1111-000000000020', 6, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000207', '11111111-1111-1111-1111-000000000107', '11111111-1111-1111-1111-000000000020', 7, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000208', '11111111-1111-1111-1111-000000000108', '11111111-1111-1111-1111-000000000020', 8, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000209', '11111111-1111-1111-1111-000000000109', '11111111-1111-1111-1111-000000000020', 9, 'Back', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000210', '11111111-1111-1111-1111-000000000110', '11111111-1111-1111-1111-000000000020', 10, 'Back', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000211', '11111111-1111-1111-1111-000000000111', '11111111-1111-1111-1111-000000000020', 11, 'Back', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000212', '11111111-1111-1111-1111-000000000112', '11111111-1111-1111-1111-000000000020', 12, 'Back', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000213', '11111111-1111-1111-1111-000000000113', '11111111-1111-1111-1111-000000000020', 13, 'Back', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000214', '11111111-1111-1111-1111-000000000114', '11111111-1111-1111-1111-000000000020', 14, 'Back', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000215', '11111111-1111-1111-1111-000000000115', '11111111-1111-1111-1111-000000000020', 15, 'Back', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000216', '11111111-1111-1111-1111-000000000116', '11111111-1111-1111-1111-000000000020', 16, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000217', '11111111-1111-1111-1111-000000000117', '11111111-1111-1111-1111-000000000020', 17, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000218', '11111111-1111-1111-1111-000000000118', '11111111-1111-1111-1111-000000000020', 18, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000219', '11111111-1111-1111-1111-000000000119', '11111111-1111-1111-1111-000000000020', 19, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000220', '11111111-1111-1111-1111-000000000120', '11111111-1111-1111-1111-000000000020', 20, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000221', '11111111-1111-1111-1111-000000000121', '11111111-1111-1111-1111-000000000020', 21, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000222', '11111111-1111-1111-1111-000000000122', '11111111-1111-1111-1111-000000000020', 22, 'Back', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000223', '11111111-1111-1111-1111-000000000123', '11111111-1111-1111-1111-000000000020', 23, 'Back', '2023-01-01', NULL),

    ('11111111-1111-1111-1111-000000000224', '11111111-1111-1111-1111-000000000124', '11111111-1111-1111-1111-000000000020', 24, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000225', '11111111-1111-1111-1111-000000000125', '11111111-1111-1111-1111-000000000020', 25, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000226', '11111111-1111-1111-1111-000000000126', '11111111-1111-1111-1111-000000000020', 26, 'Forward', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000227', '11111111-1111-1111-1111-000000000127', '11111111-1111-1111-1111-000000000020', 27, 'Back', '2023-01-01', NULL);


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
-- MATCHES (2 partidos, ambos FINISHED, vs Trelew Rugby Club)
-- =========================================

INSERT INTO matches (id, date, division_id, opponent_id, status, current_period, clock_elapsed_seconds, clock_paused, clock_updated_at, current_possession, home_score, away_score, started_at, finished_at) VALUES
    ('24a0cbdc-4667-4099-b16f-abc64f388345', '2026-10-17 16:07:00.000', '11111111-1111-1111-1111-000000000020', '22222222-1111-1111-1111-000000000001', 'FINISHED', 2, 5367, true, '2026-10-17 20:50:50.294', 'OWN', 17, 43, '2026-10-17 19:08:47.833', '2026-10-17 20:50:50.470'),
    ('11111111-1111-1111-1111-000000000040', '2026-10-18 16:00:00.000', '11111111-1111-1111-1111-000000000020', '22222222-1111-1111-1111-000000000001', 'FINISHED', 2, 85973, true, '2026-10-18 16:58:10.369', 'OPPONENT', 3, 0, '2026-10-17 17:05:11.270', '2026-10-17 19:05:57.168');


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
 requires_player, is_active, show_in_palette, follow_up_event_type_id, actor, possession_after, follow_up_choices, template_event_fields, stat_view, created_at)
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
    $$["basic", "intermediate"]$$::jsonb,
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
    $$["basic", "intermediate"]$$::jsonb,
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
    $$["basic", "intermediate"]$$::jsonb,
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
    $$["basic", "intermediate"]$$::jsonb,
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
    $$["basic", "intermediate"]$$::jsonb,
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
    $$[]$$::jsonb,
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
    $$[]$$::jsonb,
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
    $$[]$$::jsonb,
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
    $$["intermediate"]$$::jsonb,
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
    $$["intermediate"]$$::jsonb,
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
            "value": "opp_possession",
            "label": "Perdida",
            "possession": "OTHER"
          },
          {
            "value": "retained",
            "label": "Recuperada",
            "possession": "KEEP"
          },

          {
            "value": "out_in_full",
            "label": "Directa afuera",
            "possession": "OTHER"
          },
          {
            "value": "50/22",
            "label": "50/22",
            "possession": "KEEP"
          }
        ]
      }
    ]$$::jsonb,
    $$["intermediate"]$$::jsonb,
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
    false,
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
            "label": "Sale directo",
            "possession": "KEEP",
            "followUps":[
              {
                "code": "LINEOUT"
              }
            ]
          },
          {
            "value": "lost_onw",
            "label": "Recupera rival",
            "possession": "OTHER"
          },
          {
            "value": "won",
            "label": "Recupera propio",
            "possession": "KEEP"
          }
        ]
      }
    ]$$::jsonb,
    $$["intermediate"]$$::jsonb,
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
                "code": "PENALTY_CONCEDED"
              }
            ]
          },
          {
            "value": "penalty_against",
            "label": "Penal en contra",
            "possession": "OTHER",
            "followUps": [
              {
                "code": "PENALTY_CONCEDED"
              }
            ]
          }
        ]
      }
    ]$$::jsonb,
    $$["intermediate"]$$::jsonb,
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
    $$["intermediate"]$$::jsonb,
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
    $$[]$$::jsonb,
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
    $$[]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440129',
    'QUICK_PLAY',
    'Jugada rapida',
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
        "key": "quickPlayOutcome",
        "label": "Resultado",
        "type": "boolean",
        "phase": "post",
        "required": false,
        "trueLabel": "Postivo",
        "falseLabel": "Negativo"
      }
    ]$$::jsonb,
    $$["intermediate"]$$::jsonb,
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
    $$[]$$::jsonb,
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
    $$[]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440117',
    'TURNOVER_WON',
    'Turnover',
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
            "label": "Arrancón de pelota"
          },
          {
            "value": "interception",
            "label": "Intercepción"
          },
          {
            "value": "other",
            "label": "Otro"
          },
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
          },
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
    $$["intermediate"]$$::jsonb,
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
    false,
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
    $$[]$$::jsonb,
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
    false,
    true,
    true,
    NULL,
    'CHOOSE',
    'OTHER',
    $$[{"code": "PENALTY_KICK"}, {"code": "KICK_TO_TOUCH"}, {"code": "SCRUM"}, {"code": "QUICK_PLAY"}]$$::jsonb,
    $$[
      {
        "key": "penaltyType",
        "label": "Infracción",
        "type": "select",
        "phase": "post",
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
    $$["basic", "intermediate"]$$::jsonb,
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
    $$["basic", "intermediate"]$$::jsonb,
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
    $$["basic", "intermediate"]$$::jsonb,
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
    $$["basic", "intermediate"]$$::jsonb,
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
    $$["basic", "intermediate"]$$::jsonb,
    CURRENT_TIMESTAMP
);


-- =========================================
-- MATCHES_PLAYERS (convocatoria: 46 filas = 2 partidos x 23; los 4 jugadores adicionales no integran estas convocatorias)
-- =========================================

INSERT INTO matches_players (id, role, division_id, match_id) VALUES
    ('4d99b258-692a-4245-920e-b548abb15283', 'TITULAR', '11111111-1111-1111-1111-000000000201', '11111111-1111-1111-1111-000000000040'),
    ('f8c5e86b-e6f6-4c6b-87b4-c0b926fdd81d', 'TITULAR', '11111111-1111-1111-1111-000000000202', '11111111-1111-1111-1111-000000000040'),
    ('3fb92fbb-6303-487b-aeb4-3395b24bf0fa', 'TITULAR', '11111111-1111-1111-1111-000000000203', '11111111-1111-1111-1111-000000000040'),
    ('aa675eb8-be06-47ec-aa79-95336e847a79', 'TITULAR', '11111111-1111-1111-1111-000000000204', '11111111-1111-1111-1111-000000000040'),
    ('a86a6ec8-f12f-47ed-9165-d705527c93e0', 'TITULAR', '11111111-1111-1111-1111-000000000205', '11111111-1111-1111-1111-000000000040'),
    ('a17efbda-9ed4-46e4-9c40-7c0e52523e5e', 'TITULAR', '11111111-1111-1111-1111-000000000206', '11111111-1111-1111-1111-000000000040'),
    ('0899126b-6186-4aae-b485-659bb83728ba', 'TITULAR', '11111111-1111-1111-1111-000000000207', '11111111-1111-1111-1111-000000000040'),
    ('05537938-d4f4-4be3-b41e-89819205a0a9', 'TITULAR', '11111111-1111-1111-1111-000000000208', '11111111-1111-1111-1111-000000000040'),
    ('4563b25c-c0c6-4427-8435-31e6e4db474e', 'TITULAR', '11111111-1111-1111-1111-000000000209', '11111111-1111-1111-1111-000000000040'),
    ('f4f949d6-4ed1-411f-8065-48eed7c47145', 'TITULAR', '11111111-1111-1111-1111-000000000210', '11111111-1111-1111-1111-000000000040'),
    ('234d98b2-c677-49f7-95f2-083a1a69662e', 'TITULAR', '11111111-1111-1111-1111-000000000211', '11111111-1111-1111-1111-000000000040'),
    ('5fe97c71-8406-4a6f-9e8c-d225cb8ad15c', 'TITULAR', '11111111-1111-1111-1111-000000000212', '11111111-1111-1111-1111-000000000040'),
    ('40fdae8d-90f1-4bf6-b11e-ce174fb56a8f', 'TITULAR', '11111111-1111-1111-1111-000000000213', '11111111-1111-1111-1111-000000000040'),
    ('f60659b9-3e27-4d58-94dd-6c96d0bceff2', 'TITULAR', '11111111-1111-1111-1111-000000000214', '11111111-1111-1111-1111-000000000040'),
    ('69e7f239-1d64-40cd-a8b3-c80c2311c3db', 'TITULAR', '11111111-1111-1111-1111-000000000215', '11111111-1111-1111-1111-000000000040'),
    ('1456c7cf-97f9-47ec-b863-9f2795d18adc', 'SUPLENTE', '11111111-1111-1111-1111-000000000216', '11111111-1111-1111-1111-000000000040'),
    ('47923278-c0b9-437c-ad01-80173786ffce', 'SUPLENTE', '11111111-1111-1111-1111-000000000217', '11111111-1111-1111-1111-000000000040'),
    ('cfea35cc-f7f3-4be4-abdf-072fdf2e9e66', 'SUPLENTE', '11111111-1111-1111-1111-000000000218', '11111111-1111-1111-1111-000000000040'),
    ('33f7219c-03c9-4326-8f2f-828668d9184a', 'SUPLENTE', '11111111-1111-1111-1111-000000000219', '11111111-1111-1111-1111-000000000040'),
    ('a81f6ed8-1af7-4970-a6d6-ccbf860d44ae', 'SUPLENTE', '11111111-1111-1111-1111-000000000220', '11111111-1111-1111-1111-000000000040'),
    ('13bef1b5-9523-4c98-9e90-981f9271fe95', 'SUPLENTE', '11111111-1111-1111-1111-000000000221', '11111111-1111-1111-1111-000000000040'),
    ('c861b695-d6de-4698-a709-b0bf9691096e', 'SUPLENTE', '11111111-1111-1111-1111-000000000222', '11111111-1111-1111-1111-000000000040'),
    ('f6456c6a-402c-4846-8717-5a2b9c03c50c', 'SUPLENTE', '11111111-1111-1111-1111-000000000223', '11111111-1111-1111-1111-000000000040'),
    ('7cb9b794-6c76-4170-8f4f-ad6c7ca92281', 'TITULAR', '11111111-1111-1111-1111-000000000201', '24a0cbdc-4667-4099-b16f-abc64f388345'),
    ('d27b5d34-715a-47ee-9e62-dae653e255a6', 'TITULAR', '11111111-1111-1111-1111-000000000202', '24a0cbdc-4667-4099-b16f-abc64f388345'),
    ('e49abde5-3073-4028-a460-713e7477951b', 'TITULAR', '11111111-1111-1111-1111-000000000203', '24a0cbdc-4667-4099-b16f-abc64f388345'),
    ('c3ee0e34-2bed-4c96-8304-b65e3e63c254', 'TITULAR', '11111111-1111-1111-1111-000000000204', '24a0cbdc-4667-4099-b16f-abc64f388345'),
    ('5d78ab30-da1c-4b62-b8c8-7c1089ac5280', 'TITULAR', '11111111-1111-1111-1111-000000000205', '24a0cbdc-4667-4099-b16f-abc64f388345'),
    ('6802ff65-17aa-41ac-bb72-61c70122c75c', 'TITULAR', '11111111-1111-1111-1111-000000000206', '24a0cbdc-4667-4099-b16f-abc64f388345'),
    ('bf4ba7f9-c78a-40a2-95d5-7f7843863884', 'TITULAR', '11111111-1111-1111-1111-000000000207', '24a0cbdc-4667-4099-b16f-abc64f388345'),
    ('a7a81e66-b81c-42f7-9833-8f5728f3c895', 'TITULAR', '11111111-1111-1111-1111-000000000208', '24a0cbdc-4667-4099-b16f-abc64f388345'),
    ('81918007-c9a9-43a6-be68-77e1e2e8c3d9', 'TITULAR', '11111111-1111-1111-1111-000000000209', '24a0cbdc-4667-4099-b16f-abc64f388345'),
    ('9a61a507-0993-42e8-a72c-3de4272931d0', 'TITULAR', '11111111-1111-1111-1111-000000000210', '24a0cbdc-4667-4099-b16f-abc64f388345'),
    ('b2f25cb5-7cd9-436a-94eb-9023edd9b78b', 'TITULAR', '11111111-1111-1111-1111-000000000211', '24a0cbdc-4667-4099-b16f-abc64f388345'),
    ('c0f37e44-4c52-482f-b095-d4fd162fab1f', 'TITULAR', '11111111-1111-1111-1111-000000000212', '24a0cbdc-4667-4099-b16f-abc64f388345'),
    ('6df8d25d-5f3f-4435-bef7-efc82a2a0a58', 'TITULAR', '11111111-1111-1111-1111-000000000213', '24a0cbdc-4667-4099-b16f-abc64f388345'),
    ('f2ca60ee-4042-44d8-8a62-ac974237243e', 'TITULAR', '11111111-1111-1111-1111-000000000214', '24a0cbdc-4667-4099-b16f-abc64f388345'),
    ('acb0adc4-5468-4a59-ad33-9ad15bb8ab68', 'TITULAR', '11111111-1111-1111-1111-000000000215', '24a0cbdc-4667-4099-b16f-abc64f388345'),
    ('b48660f6-0f48-4251-9202-4095c32506c2', 'SUPLENTE', '11111111-1111-1111-1111-000000000216', '24a0cbdc-4667-4099-b16f-abc64f388345'),
    ('11dbea7c-deb1-4e79-b2da-11970948e1b3', 'SUPLENTE', '11111111-1111-1111-1111-000000000217', '24a0cbdc-4667-4099-b16f-abc64f388345'),
    ('d2955557-c89b-4935-982a-6677e2b16e45', 'SUPLENTE', '11111111-1111-1111-1111-000000000218', '24a0cbdc-4667-4099-b16f-abc64f388345'),
    ('93bdd4ee-be23-405a-a179-e1756c8aa5a5', 'SUPLENTE', '11111111-1111-1111-1111-000000000219', '24a0cbdc-4667-4099-b16f-abc64f388345'),
    ('d5eb4604-28df-4b53-89b5-918873b16e86', 'SUPLENTE', '11111111-1111-1111-1111-000000000220', '24a0cbdc-4667-4099-b16f-abc64f388345'),
    ('964e6586-03f5-4984-963c-99753321317a', 'SUPLENTE', '11111111-1111-1111-1111-000000000221', '24a0cbdc-4667-4099-b16f-abc64f388345'),
    ('11ea507c-53e0-4aca-9e78-45cecab595fa', 'SUPLENTE', '11111111-1111-1111-1111-000000000222', '24a0cbdc-4667-4099-b16f-abc64f388345'),
    ('7757e9c1-5a77-4cde-87a1-d7fec4164637', 'SUPLENTE', '11111111-1111-1111-1111-000000000223', '24a0cbdc-4667-4099-b16f-abc64f388345');
-- =========================================
-- EVENTS (167 eventos: 152 del partido 24a0cbdc… y 15 del 11111111…0040)
-- =========================================

INSERT INTO events (id, match_id, event_type_id, player_id, period, match_time, absolute_match_time, real_time, team_possession, attributes, origin, active, client_event_id, created_at, synchronized_at) VALUES
    ('0d4ed899-df2b-42d4-bd3d-6a10a27fc871', '11111111-1111-1111-1111-000000000040', '550e8400-e29b-41d4-a716-446655440110', '11111111-1111-1111-1111-000000000105', 1, 65, 65, '2026-10-17 17:06:17.235', 'OWN', '{"kickType": "up_under", "playerNumber": 5}'::jsonb, 'live-capture', true, '489682fd-9ffb-40d4-8c8b-53510ba20da0', '2026-10-17 17:06:17.279', '2026-10-17 17:06:17.274'),
    ('2792bf28-38c9-45eb-aa3e-e9cd2b01b363', '11111111-1111-1111-1111-000000000040', '550e8400-e29b-41d4-a716-446655440110', '11111111-1111-1111-1111-000000000109', 1, 152, 152, '2026-10-17 17:07:43.333', 'OWN', '{"kickType": "tactical", "playerNumber": 9}'::jsonb, 'live-capture', true, 'd02d6d5e-11f3-4898-a231-62d324a771be', '2026-10-17 17:07:43.362', '2026-10-17 17:07:43.360'),
    ('b1977aef-cc8c-4782-83ab-787ae75d284e', '11111111-1111-1111-1111-000000000040', '550e8400-e29b-41d4-a716-446655440110', '11111111-1111-1111-1111-000000000104', 1, 242, 242, '2026-10-17 17:09:13.654', 'OWN', '{"kickType": "up_under", "playerNumber": 4}'::jsonb, 'live-capture', true, 'ac7500ce-6f78-4c91-8fbc-da35d68be631', '2026-10-17 17:09:13.687', '2026-10-17 17:09:13.685'),
    ('51b9a6f4-6196-45af-a068-dde72ad9b34f', '11111111-1111-1111-1111-000000000040', '550e8400-e29b-41d4-a716-446655440110', NULL, 1, 426, 428, '2026-10-17 17:12:19.736', 'OPPONENT', '{"outcome": "opp_possession", "playerNumber": 4}'::jsonb, 'live-capture', true, '931be833-ca23-415c-9da8-2949e191481c', '2026-10-17 17:12:19.754', '2026-10-17 17:12:19.753'),
    ('5ce7a5ea-722c-4603-9339-528acee5b788', '11111111-1111-1111-1111-000000000040', '550e8400-e29b-41d4-a716-446655440122', NULL, 1, 505, 507, '2026-10-17 17:13:38.458', 'OPPONENT', '{"penaltyType": "offside", "playerNumber": 5}'::jsonb, 'live-capture', true, 'cd283e88-e286-46f3-bc86-02a1a3e382f4', '2026-10-17 17:13:38.480', '2026-10-17 17:13:38.479'),
    ('3be402d8-cfb2-4420-818d-f056a4d31462', '11111111-1111-1111-1111-000000000040', '550e8400-e29b-41d4-a716-446655440104', '11111111-1111-1111-1111-000000000110', 1, 510, 512, '2026-10-17 17:13:43.349', 'OWN', '{"playerNumber": 10, "wasSuccessful": true}'::jsonb, 'live-capture', true, 'b6a99249-28bb-40b1-a82d-baedb376f6c8', '2026-10-17 17:13:43.375', '2026-10-17 17:13:43.373'),
    ('a308d767-4614-4296-9726-948c1a96b639', '11111111-1111-1111-1111-000000000040', '550e8400-e29b-41d4-a716-446655440120', '11111111-1111-1111-1111-000000000112', 1, 529, 530, '2026-10-17 17:14:02.268', 'OWN', '{"playerNumber": 12, "receptionQuality": "contested_won"}'::jsonb, 'live-capture', true, '58bbb5a6-3d35-4db0-a982-1cc9607be30c', '2026-10-17 17:14:02.293', '2026-10-17 17:14:02.291'),
    ('dea5b59b-ba43-4a80-bfd5-b27909590f40', '11111111-1111-1111-1111-000000000040', '550e8400-e29b-41d4-a716-446655440120', '11111111-1111-1111-1111-000000000113', 1, 538, 539, '2026-10-17 17:14:11.255', 'OWN', '{"playerNumber": 13, "receptionQuality": "contested_won"}'::jsonb, 'live-capture', true, '25c0d597-fed8-4230-b56e-1e0c9a313a15', '2026-10-17 17:14:11.283', '2026-10-17 17:14:11.281'),
    ('169114b2-daea-4497-90f3-3a8589862040', '11111111-1111-1111-1111-000000000040', '550e8400-e29b-41d4-a716-446655440120', NULL, 1, 592, 595, '2026-10-17 17:15:06.458', 'OPPONENT', '{"receptionQuality": "contested_won"}'::jsonb, 'live-capture', true, 'cc6801ac-c471-401c-9aa1-443e601db20d', '2026-10-17 17:15:06.481', '2026-10-17 17:15:06.481'),
    ('23d3c1ff-ba3d-4a2e-9bc3-6bc8bdb50db4', '11111111-1111-1111-1111-000000000040', '550e8400-e29b-41d4-a716-446655440120', NULL, 1, 596, 599, '2026-10-17 17:15:10.688', 'OPPONENT', '{"receptionQuality": "fumbled"}'::jsonb, 'live-capture', true, 'ba60e223-2604-409d-951f-17e4f1006468', '2026-10-17 17:15:10.708', '2026-10-17 17:15:10.708'),
    ('6de3a0bb-b1a9-4a07-b276-3adba6a30f52', '11111111-1111-1111-1111-000000000040', '550e8400-e29b-41d4-a716-446655440120', NULL, 1, 599, 601, '2026-10-17 17:15:13.174', 'OWN', '{"receptionQuality": "clean_mark"}'::jsonb, 'live-capture', true, 'a6e41584-dba8-4159-ae49-84b3a318537a', '2026-10-17 17:15:13.196', '2026-10-17 17:15:13.196'),
    ('d01ea7d5-d54a-47ec-91e7-7774d2df55bb', '11111111-1111-1111-1111-000000000040', '550e8400-e29b-41d4-a716-446655440120', NULL, 1, 600, 603, '2026-10-17 17:15:14.401', 'OWN', '{"receptionQuality": "contested_won"}'::jsonb, 'live-capture', true, '92bd7a1f-aea1-4529-8df1-33d96a1a12b4', '2026-10-17 17:15:14.439', '2026-10-17 17:15:14.438'),
    ('66b21fe0-f37c-43ec-b2ce-b91a521b6f2e', '11111111-1111-1111-1111-000000000040', '550e8400-e29b-41d4-a716-446655440120', NULL, 1, 601, 604, '2026-10-17 17:15:16.073', 'OWN', '{"receptionQuality": "fumbled"}'::jsonb, 'live-capture', true, 'a562bcb2-c929-41fc-a935-7af79924f4ff', '2026-10-17 17:15:16.103', '2026-10-17 17:15:16.102'),
    ('fc933ab9-a894-45d9-ae9f-f5d2d224422b', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 1, 16, 16, '2026-10-17 19:09:03.961', 'OWN', '{"lineResult": "lost"}'::jsonb, 'live-capture', true, 'c98778fc-d6a8-4d2e-ae72-15782cca80ae', '2026-10-17 19:09:04.025', '2026-10-17 19:09:04.018'),
    ('0f5f1814-99ae-4407-a1cd-6f3fc34dab12', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440122', NULL, 1, 50, 50, '2026-10-17 19:09:38.657', 'OWN', '{"penaltyType": "side_entry"}'::jsonb, 'live-capture', true, 'f5991201-2692-4759-83a4-f4b0c396dd6a', '2026-10-17 19:09:38.687', '2026-10-17 19:09:38.685'),
    ('ccb594f9-fb43-4b4f-b2e1-fd71629a74ae', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440128', NULL, 1, 57, 57, '2026-10-17 19:09:45.685', 'OPPONENT', '{"kind": "penalty_touch", "playerNumber": 10}'::jsonb, 'live-capture', true, '72f77134-6a18-4267-9d86-6c3d32125017', '2026-10-17 19:09:45.708', '2026-10-17 19:09:45.707'),
    ('333df087-35fa-4447-80e4-00ac37e7d887', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 1, 71, 71, '2026-10-17 19:09:59.621', 'OPPONENT', '{"lineResult": "won_clean"}'::jsonb, 'live-capture', true, '6dc5fcff-2aca-4445-932f-bf724da35d65', '2026-10-17 19:09:59.660', '2026-10-17 19:09:59.659'),
    ('b2e6bb64-54b8-416e-8c55-20f6d587b4cd', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440110', NULL, 1, 142, 142, '2026-10-17 19:11:10.723', 'OWN', '{"outcome": "opp_possession"}'::jsonb, 'live-capture', true, '5372cec4-561c-40a1-a936-43bf2abea325', '2026-10-17 19:11:10.742', '2026-10-17 19:11:10.740'),
    ('816b4979-7b30-4a21-b62b-2be626ca5eeb', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440122', NULL, 1, 236, 236, '2026-10-17 19:12:44.225', 'OPPONENT', '{"penaltyType": "holding_on"}'::jsonb, 'live-capture', true, '62b81443-707a-4190-829a-2b24c2318a2d', '2026-10-17 19:12:44.278', '2026-10-17 19:12:44.276'),
    ('663620bd-51aa-487c-b8e1-ba65e41a7e3e', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440128', '11111111-1111-1111-1111-000000000110', 1, 244, 244, '2026-10-17 19:12:52.103', 'OWN', '{"kind": "penalty_touch", "playerNumber": 10}'::jsonb, 'live-capture', true, 'e842c36e-bbd7-425e-bf02-99080f1a2ba5', '2026-10-17 19:12:52.135', '2026-10-17 19:12:52.133'),
    ('b349ff8b-3e74-46f1-8034-5a160f7ac5a3', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 1, 258, 258, '2026-10-17 19:13:06.574', 'OWN', '{"lineResult": "penalty_against"}'::jsonb, 'live-capture', true, '3ac1af9f-796d-48ba-986a-ddc1163534fb', '2026-10-17 19:13:06.610', '2026-10-17 19:13:06.607'),
    ('9b1188d9-b9c0-488e-91f0-50405c118a70', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440111', NULL, 1, 271, 271, '2026-10-17 19:13:19.615', 'OPPONENT', '{"scrumResult": "won_clean"}'::jsonb, 'live-capture', true, 'bce2f2d9-946e-407b-b47d-427b404a4848', '2026-10-17 19:13:19.648', '2026-10-17 19:13:19.646'),
    ('268519e9-fb87-4821-b61b-d36e809a4a63', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440101', NULL, 1, 281, 281, '2026-10-17 19:13:29.828', 'OPPONENT', '{"zone": "left"}'::jsonb, 'live-capture', true, '0476f0cd-b26b-47d1-8cd0-6c97f3ca570d', '2026-10-17 19:13:29.849', '2026-10-17 19:13:29.847'),
    ('2ed4f014-11e3-4063-809d-4b76b591a46c', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440102', NULL, 1, 337, 337, '2026-10-17 19:14:25.112', 'OPPONENT', '{"wasSuccessful": false}'::jsonb, 'live-capture', true, '1c04fc88-56a1-4492-b0a6-ae82d0e1571e', '2026-10-17 19:14:25.143', '2026-10-17 19:14:25.141'),
    ('ce96ce37-e347-44d9-a527-32bf68d4d0f4', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440113', '11111111-1111-1111-1111-000000000110', 1, 372, 372, '2026-10-17 19:15:00.481', 'OWN', '{"outcome": "received_clean", "playerNumber": 10}'::jsonb, 'live-capture', true, 'c6df7b78-01d5-45ea-97ac-79fbaddb9ca4', '2026-10-17 19:15:00.502', '2026-10-17 19:15:00.500'),
    ('16457158-73a2-4dfe-85ce-230f42d8b75c', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440111', NULL, 1, 434, 434, '2026-10-17 19:16:02.759', 'OWN', '{"scrumResult": "won_clean"}'::jsonb, 'live-capture', true, 'c876c450-9779-496f-884f-e1dd040f7b2b', '2026-10-17 19:16:02.789', '2026-10-17 19:16:02.787'),
    ('8137b9a0-0c17-4986-83b6-9fc24d523ef3', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 1, 499, 499, '2026-10-17 19:17:07.388', 'OPPONENT', '{"lineResult": "won_clean"}'::jsonb, 'live-capture', true, 'b02178dd-6330-4de5-b02f-c28d89a3fd84', '2026-10-17 19:17:07.421', '2026-10-17 19:17:07.419'),
    ('f8860a64-dec6-4e15-985e-9ab7a1e0383d', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440109', NULL, 1, 503, 503, '2026-10-17 19:17:11.324', 'OPPONENT', NULL, 'live-capture', true, 'c4e33682-cbb3-4ebf-bd70-61341c947aad', '2026-10-17 19:17:11.352', '2026-10-17 19:17:11.350'),
    ('1ccf0cf7-7a24-4a5b-8773-f8897db68d46', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440109', NULL, 1, 508, 508, '2026-10-17 19:17:16.246', 'OPPONENT', NULL, 'live-capture', true, '2e0e7e76-afec-46de-98b1-70f843edbdc8', '2026-10-17 19:17:16.265', '2026-10-17 19:17:16.264'),
    ('0e479d93-9d65-4b29-8707-6a5dfeb7f46d', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440122', NULL, 1, 536, 536, '2026-10-17 19:17:43.880', 'OWN', '{"penaltyType": "offside"}'::jsonb, 'live-capture', true, '72f020a4-3796-46c3-8335-c44f1a38711a', '2026-10-17 19:17:43.924', '2026-10-17 19:17:43.922'),
    ('f9a5f63b-5a6d-4350-bde6-98d16b9d0f09', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 1, 604, 604, '2026-10-17 19:18:52.632', 'OPPONENT', '{"lineResult": "won_clean"}'::jsonb, 'live-capture', true, '9f201871-4862-4c2c-9511-4fb34f111ac7', '2026-10-17 19:18:52.647', '2026-10-17 19:18:52.646'),
    ('7acb7a02-806a-4cfd-add3-e76beaa0cf97', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440101', NULL, 1, 672, 672, '2026-10-17 19:20:00.240', 'OPPONENT', '{"zone": "right"}'::jsonb, 'live-capture', true, 'bd9ab090-5869-4178-a7fa-13a580f13df9', '2026-10-17 19:20:00.270', '2026-10-17 19:20:00.267'),
    ('9a4135bd-7e33-485e-aecc-f422a8268ce3', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440102', NULL, 1, 712, 712, '2026-10-17 19:20:40.649', 'OPPONENT', '{"playerNumber": 15, "wasSuccessful": false}'::jsonb, 'live-capture', true, 'dfa8a427-de6b-4e55-91ba-c31c8d282e13', '2026-10-17 19:20:40.673', '2026-10-17 19:20:40.671'),
    ('59760b74-a068-4ef2-a429-25ba124e6db2', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440113', '11111111-1111-1111-1111-000000000110', 1, 736, 755, '2026-10-17 19:21:22.923', 'OWN', '{"outcome": "received_clean", "playerNumber": 10}'::jsonb, 'live-capture', true, '8f04775d-e35a-4375-81d1-780f7146d208', '2026-10-17 19:21:22.982', '2026-10-17 19:21:22.979'),
    ('d2efb71d-b0dd-4043-b55b-b3652caca725', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440110', NULL, 1, 745, 764, '2026-10-17 19:21:31.970', 'OPPONENT', '{"outcome": "out_in_full"}'::jsonb, 'live-capture', true, 'db2bdacc-c1ae-4a53-84a2-a1dc4b5c7b10', '2026-10-17 19:21:32.004', '2026-10-17 19:21:32.003'),
    ('addbb3ab-64f1-420b-8ef8-52d85ae5a3a4', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 1, 758, 776, '2026-10-17 19:21:44.262', 'OWN', '{"lineResult": "stolen"}'::jsonb, 'live-capture', true, 'c0aaac52-8207-4506-b98e-093ce77f5bad', '2026-10-17 19:21:44.293', '2026-10-17 19:21:44.291'),
    ('94e0741f-fe2f-4238-a140-d89be7d1460b', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 1, 822, 840, '2026-10-17 19:22:48.491', 'OPPONENT', '{"lineResult": "won_clean"}'::jsonb, 'live-capture', true, 'db2b6786-fcff-43f2-8172-a3330d3e5498', '2026-10-17 19:22:48.521', '2026-10-17 19:22:48.520'),
    ('86d12c3b-a92e-40eb-9f0a-97d048c29de5', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440122', NULL, 1, 840, 859, '2026-10-17 19:23:06.877', 'OPPONENT', '{"penaltyType": "side_entry"}'::jsonb, 'live-capture', true, 'f153332c-543c-4343-a180-5ad52e010b51', '2026-10-17 19:23:06.894', '2026-10-17 19:23:06.892'),
    ('6623b0d0-b93d-4872-9331-7adf83a3fe39', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 1, 868, 887, '2026-10-17 19:23:35.068', 'OWN', '{"lineResult": "won_clean"}'::jsonb, 'live-capture', true, 'ca8635cf-c440-4bc7-ad5c-02c4666a3dea', '2026-10-17 19:23:35.098', '2026-10-17 19:23:35.096'),
    ('96dd4fcc-dd82-40f8-bf56-85e94f96089d', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440111', NULL, 1, 945, 963, '2026-10-17 19:24:51.632', 'OPPONENT', '{"scrumResult": "won_clean"}'::jsonb, 'live-capture', true, '07877dbb-3f24-4976-b311-13a1ae6b96fc', '2026-10-17 19:24:51.666', '2026-10-17 19:24:51.664'),
    ('62affbc0-e10f-4ac8-9d2b-6e65c2a46bc2', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 1, 804, 823, '2026-10-17 19:22:30.984', 'OWN', '{"lineResult": "won_clean"}'::jsonb, 'live-capture', false, '1d40a228-7802-4762-8c06-334f1e109024', '2026-10-17 19:22:31.012', '2026-10-17 19:22:40.052'),
    ('6f5f94f1-6192-44c4-ac68-0940c0644184', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440128', NULL, 1, 848, 867, '2026-10-17 19:23:15.020', 'OWN', '{"kind": "penalty_touch"}'::jsonb, 'live-capture', true, '4e3b7dcf-52c3-4e70-9d08-e844774c2f6a', '2026-10-17 19:23:15.047', '2026-10-17 19:23:15.046'),
    ('7497a102-ee66-4104-98ea-f2dd2292af66', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440109', NULL, 1, 949, 967, '2026-10-17 19:24:55.294', 'OPPONENT', NULL, 'live-capture', true, 'f0483485-73b0-4738-9698-73bbb22f4a39', '2026-10-17 19:24:55.320', '2026-10-17 19:24:55.319'),
    ('27f8c773-5b46-48c4-ac7a-aa25d0e2e7ca', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440101', NULL, 1, 957, 975, '2026-10-17 19:25:03.230', 'OPPONENT', '{"zone": "center", "playerNumber": 8}'::jsonb, 'live-capture', true, '71b1a155-2588-4b03-8d9f-58053355d9ca', '2026-10-17 19:25:03.243', '2026-10-17 19:25:03.242'),
    ('2a0a3e21-1a15-4732-b8e7-d28e0f755252', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440102', NULL, 1, 985, 1003, '2026-10-17 19:25:31.134', 'OPPONENT', '{"playerNumber": 15, "wasSuccessful": true}'::jsonb, 'live-capture', true, 'deae0cab-2d3d-4d2a-ba9b-a09c6c5bff1d', '2026-10-17 19:25:31.164', '2026-10-17 19:25:31.162'),
    ('e64ad6a3-90cc-49f5-af87-030cdba93cb4', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440113', NULL, 1, 1024, 1042, '2026-10-17 19:26:10.244', 'OWN', '{"outcome": "received_clean"}'::jsonb, 'live-capture', true, 'b41418fe-5747-46c2-8869-cf4418f7ae70', '2026-10-17 19:26:10.277', '2026-10-17 19:26:10.276'),
    ('77d1cc01-abf8-41b6-9ea1-aa4cec5bc8b0', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 1, 1069, 1087, '2026-10-17 19:26:55.291', 'OWN', '{"lineResult": "won_clean"}'::jsonb, 'live-capture', false, '64170d60-c613-4b85-a2b3-962e74e1edbd', '2026-10-17 19:26:55.321', '2026-10-17 19:27:05.143'),
    ('17e603b0-c85b-46ca-a32e-5b7f66c5dc10', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 1, 1097, 1115, '2026-10-17 19:27:23.524', 'OWN', '{"lineResult": "penalty_against"}'::jsonb, 'live-capture', true, '21151ed0-8021-4962-a45c-46a8b61718fc', '2026-10-17 19:27:23.555', '2026-10-17 19:27:23.553'),
    ('bc4a7d05-27ad-4c88-bf72-fd3c3fb479e4', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440111', NULL, 1, 1111, 1130, '2026-10-17 19:27:37.947', 'OPPONENT', '{"scrumResult": "won_clean"}'::jsonb, 'live-capture', true, '46573d72-3a83-479f-9a7f-768d8ec1d403', '2026-10-17 19:27:37.976', '2026-10-17 19:27:37.975'),
    ('74abb56c-74b7-4891-8951-1899b29e146c', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440111', NULL, 1, 1208, 1227, '2026-10-17 19:29:15.058', 'OWN', '{"scrumResult": "won_clean"}'::jsonb, 'live-capture', true, '686d83b2-9234-422a-b434-bbb56c33ba32', '2026-10-17 19:29:15.087', '2026-10-17 19:29:15.086'),
    ('1c8c87a6-6620-46b0-90fa-4425d08a2f13', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440110', NULL, 1, 1218, 1237, '2026-10-17 19:29:25.110', 'OWN', '{"outcome": "out_in_full"}'::jsonb, 'live-capture', true, '96652771-060f-4c71-bc7e-88ae0cb3e7e4', '2026-10-17 19:29:25.140', '2026-10-17 19:29:25.139'),
    ('4c2840bb-3ae6-4147-8f14-bad215ff763b', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 1, 1240, 1258, '2026-10-17 19:29:46.808', 'OPPONENT', '{"lineResult": "won_clean"}'::jsonb, 'live-capture', true, '2c0b6167-7701-4b66-9ed7-e80b0b0e6a1e', '2026-10-17 19:29:46.834', '2026-10-17 19:29:46.833'),
    ('4259a0a4-3c84-46be-9580-8a94e614d9c1', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440122', NULL, 1, 1342, 1360, '2026-10-17 19:31:28.456', 'OWN', '{"penaltyType": "high_tackle"}'::jsonb, 'live-capture', true, 'e3c1cee1-7976-4c05-ba2c-7ce45a89091c', '2026-10-17 19:31:28.480', '2026-10-17 19:31:28.478'),
    ('0a50db10-acf2-4262-9902-8bef47a65173', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440111', NULL, 1, 1389, 1407, '2026-10-17 19:32:15.704', 'OPPONENT', '{"scrumResult": "won_clean"}'::jsonb, 'live-capture', false, '02ea4a15-4f21-46c3-9101-939ae0c0d84f', '2026-10-17 19:32:15.731', '2026-10-17 19:32:21.440'),
    ('3acd4d52-bedd-4d99-acdc-b876389aa706', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440111', NULL, 1, 1401, 1419, '2026-10-17 19:32:27.797', 'OPPONENT', '{"scrumResult": "penalty_for"}'::jsonb, 'live-capture', true, 'dadc66dc-3e7e-4873-8333-41ccd02ea331', '2026-10-17 19:32:27.825', '2026-10-17 19:32:27.824'),
    ('1c6cc3ab-3dcf-4dc2-883c-65f37484772f', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440128', NULL, 1, 1414, 1432, '2026-10-17 19:32:40.423', 'OPPONENT', '{"kind": "penalty_touch"}'::jsonb, 'live-capture', true, 'd7e611b5-fcdf-4990-94e6-71d95b9380bb', '2026-10-17 19:32:40.445', '2026-10-17 19:32:40.444'),
    ('0ef9e8cb-c07e-41f9-bb8c-ed5561152dd1', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440122', NULL, 1, 1480, 1498, '2026-10-17 19:33:46.546', 'OWN', '{"penaltyType": "holding_on"}'::jsonb, 'live-capture', true, 'dc0d427b-c406-46a5-b121-1aaf22374bbc', '2026-10-17 19:33:46.571', '2026-10-17 19:33:46.570'),
    ('a3a27695-1755-4ca1-8f2d-bd27566c0493', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440128', NULL, 1, 1483, 1501, '2026-10-17 19:33:49.691', 'OPPONENT', '{"kind": "penalty_touch"}'::jsonb, 'live-capture', true, 'e4cd2594-78ce-4ceb-b393-b27ff46c5a47', '2026-10-17 19:33:49.717', '2026-10-17 19:33:49.713'),
    ('d430f6b6-4d6e-4baa-8d35-0b6e9f7c0c56', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 1, 1505, 1523, '2026-10-17 19:34:11.802', 'OWN', '{"lineResult": "won_clean"}'::jsonb, 'live-capture', true, 'b9281d12-665f-4aba-b99a-2f8c4e29cbe2', '2026-10-17 19:34:11.828', '2026-10-17 19:34:11.827'),
    ('02da8979-0a13-4949-8f52-29ed77f13328', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440101', '11111111-1111-1111-1111-000000000108', 1, 1591, 1610, '2026-10-17 19:35:37.881', 'OWN', '{"zone": "center", "playerNumber": 8}'::jsonb, 'live-capture', false, '14755b6a-6560-41d5-b23c-a11ab35831c9', '2026-10-17 19:35:37.935', '2026-10-17 19:36:03.322'),
    ('5f432660-fe91-46cf-972f-1468f104ef0b', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440101', '11111111-1111-1111-1111-000000000108', 1, 1626, 1645, '2026-10-17 19:36:13.445', 'OWN', '{"zone": "center", "playerNumber": 8}'::jsonb, 'live-capture', true, 'e16e1651-8943-417a-be6a-21fc1783e31d', '2026-10-17 19:36:13.461', '2026-10-17 19:36:13.460'),
    ('8f41afd8-caed-4ee5-a339-ffa00f9b52fb', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440102', '11111111-1111-1111-1111-000000000115', 1, 1634, 1653, '2026-10-17 19:36:21.477', 'OWN', '{"playerNumber": 15, "wasSuccessful": true}'::jsonb, 'live-capture', true, 'dbd1e47b-45bc-4307-929a-21c039ef3d26', '2026-10-17 19:36:21.509', '2026-10-17 19:36:21.507'),
    ('abb49554-70d3-49f5-9c50-5d18e03ca1d5', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440110', NULL, 1, 1685, 1704, '2026-10-17 19:37:12.785', 'OPPONENT', '{"outcome": "opp_possession"}'::jsonb, 'live-capture', true, '9c8f21a2-1d5f-4cf7-bf3f-babbfa0f5d97', '2026-10-17 19:37:12.815', '2026-10-17 19:37:12.814'),
    ('fba9a95b-ee2f-4fcd-a4fd-9c1242e79871', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440109', NULL, 1, 1750, 1769, '2026-10-17 19:38:17.292', 'OPPONENT', NULL, 'live-capture', true, '1be0b9a5-d667-49c4-b7cf-da229a5cee5c', '2026-10-17 19:38:17.330', '2026-10-17 19:38:17.329'),
    ('59accf18-2fa5-4fce-b8b8-88dee2e3e1be', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440101', NULL, 1, 1768, 1787, '2026-10-17 19:38:35.297', 'OPPONENT', '{"zone": "left"}'::jsonb, 'live-capture', true, 'e7fc97d6-85d7-4c00-a6d4-b2bdc697ce24', '2026-10-17 19:38:35.325', '2026-10-17 19:38:35.324'),
    ('6b3bc139-df73-4564-94ec-56fbf2bf1851', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440102', NULL, 1, 1797, 1816, '2026-10-17 19:39:04.708', 'OPPONENT', '{"wasSuccessful": true}'::jsonb, 'live-capture', true, '56dd349c-9a0d-4ec4-80a2-44a610e9800d', '2026-10-17 19:39:04.731', '2026-10-17 19:39:04.730'),
    ('c321283e-17ca-4625-931d-cc5ea96b8843', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440113', NULL, 1, 1832, 1851, '2026-10-17 19:39:39.649', 'OWN', '{"outcome": "received_clean"}'::jsonb, 'live-capture', true, 'e3528565-e740-4008-9536-72e18354175f', '2026-10-17 19:39:39.685', '2026-10-17 19:39:39.684'),
    ('3b2b70be-dc8b-4845-a32c-c9c1cfc6bcb7', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440110', NULL, 1, 1845, 1864, '2026-10-17 19:39:52.539', 'OPPONENT', '{"outcome": "out_in_full"}'::jsonb, 'live-capture', true, '30cf2332-d2bd-4df3-b0f8-7209e492bffd', '2026-10-17 19:39:52.568', '2026-10-17 19:39:52.567'),
    ('a4099269-0fb1-4edf-90f4-e892212e8470', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 1, 1868, 1887, '2026-10-17 19:40:15.511', 'OWN', '{"lineResult": "won_clean"}'::jsonb, 'live-capture', false, '4dd67b4d-e890-42c7-809a-e8025e32466b', '2026-10-17 19:40:15.543', '2026-10-17 19:40:29.715'),
    ('a10a32ed-976d-4e6c-8bba-ab278b78a8b6', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 1, 1889, 1908, '2026-10-17 19:40:36.474', 'OWN', '{"lineResult": "penalty_against"}'::jsonb, 'live-capture', true, '981d4b3f-75fe-46b4-867d-43632da702a9', '2026-10-17 19:40:36.502', '2026-10-17 19:40:36.501'),
    ('7ed9326f-2ca1-4ecb-9bf4-99a796913cc7', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440128', NULL, 1, 1901, 1920, '2026-10-17 19:40:48.673', 'OPPONENT', '{"kind": "penalty_touch"}'::jsonb, 'live-capture', true, 'b4a5e716-b40b-4171-bc18-e832a988ee05', '2026-10-17 19:40:48.703', '2026-10-17 19:40:48.701'),
    ('67419d35-51bf-47af-a9b7-07b1640666b6', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 1, 1931, 1950, '2026-10-17 19:41:18.389', 'OWN', '{"lineResult": "won_clean"}'::jsonb, 'live-capture', true, 'eb2fa1dd-bff3-4cef-a7ca-0404c8410549', '2026-10-17 19:41:18.416', '2026-10-17 19:41:18.415'),
    ('576f0252-cae4-4faf-9689-8e0ef1c2e877', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440122', NULL, 1, 1970, 1990, '2026-10-17 19:41:58.039', 'OPPONENT', '{"penaltyType": "offside"}'::jsonb, 'live-capture', true, '1fa1bbd0-1403-4505-8469-b8d85d601f83', '2026-10-17 19:41:58.066', '2026-10-17 19:41:58.065'),
    ('59e2aa19-b9b2-47a6-abee-785a7d0c7739', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440128', NULL, 1, 1975, 1994, '2026-10-17 19:42:02.638', 'OWN', '{"kind": "penalty_touch"}'::jsonb, 'live-capture', true, 'e12bf0a9-4f19-4565-b4d8-41de6c94e5e9', '2026-10-17 19:42:02.661', '2026-10-17 19:42:02.660'),
    ('76dc9c3c-99a2-4197-a700-2c1f90ffd7c5', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 1, 2000, 2020, '2026-10-17 19:42:28.070', 'OWN', '{"lineResult": "won_clean"}'::jsonb, 'live-capture', false, 'ff166a1c-e410-4d38-a39e-cc1ce8389828', '2026-10-17 19:42:28.098', '2026-10-17 19:43:00.477'),
    ('2934a722-fda7-40e9-956f-74a888838123', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 1, 2038, 2057, '2026-10-17 19:43:05.203', 'OWN', '{"lineResult": "penalty_against"}'::jsonb, 'live-capture', false, 'ed734daf-c62a-47f1-8593-fde568e623ed', '2026-10-17 19:43:05.252', '2026-10-17 19:43:27.488'),
    ('2b7898e2-4332-4ba9-aa6a-426e54162802', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 1, 2074, 2094, '2026-10-17 19:43:41.925', 'OWN', '{"lineResult": "stolen"}'::jsonb, 'live-capture', true, 'f2f05b27-1f1b-491c-ab68-a1c5e277a8e8', '2026-10-17 19:43:41.959', '2026-10-17 19:43:41.958'),
    ('77f5411e-b12e-4a2f-a037-9acec8568e08', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440110', NULL, 1, 2082, 2101, '2026-10-17 19:43:49.187', 'OPPONENT', '{"outcome": "out_in_full"}'::jsonb, 'live-capture', true, '42a1c7f8-c93f-4e70-a92c-2225b53a503c', '2026-10-17 19:43:49.214', '2026-10-17 19:43:49.212'),
    ('6db6b6f8-789d-4dcb-a26a-9067662a7a87', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 1, 2088, 2107, '2026-10-17 19:43:55.766', 'OWN', '{"lineResult": "lost"}'::jsonb, 'live-capture', true, 'e1c0b4e6-0e7a-4d4b-8d5c-e99e033eb56f', '2026-10-17 19:43:55.793', '2026-10-17 19:43:55.792'),
    ('757d3167-3be7-485e-be82-cf4fe9b14ea8', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440109', NULL, 1, 2096, 2115, '2026-10-17 19:44:03.781', 'OPPONENT', NULL, 'live-capture', true, 'dee47cca-f474-485a-ae76-f6bc734f9cd0', '2026-10-17 19:44:03.804', '2026-10-17 19:44:03.803'),
    ('91e05c0c-d54a-4266-9966-a670b4958167', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440122', NULL, 1, 2340, 2469, '2026-10-17 19:49:57.399', 'OPPONENT', '{"penaltyType": "holding_on"}'::jsonb, 'live-capture', true, 'b457a55d-c59d-42a8-9418-c9ab839a06f0', '2026-10-17 19:49:57.413', '2026-10-17 19:49:57.412'),
    ('bedb4ea6-1fa9-42c9-b53a-2e08dcfcccd6', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440111', NULL, 1, 2384, 2513, '2026-10-17 19:50:41.689', 'OWN', '{"scrumResult": "won_clean"}'::jsonb, 'live-capture', true, '0670b402-d1c6-4c97-a5c8-fe1187a125d1', '2026-10-17 19:50:41.714', '2026-10-17 19:50:41.713'),
    ('a802f37d-a1e7-4e66-beea-b426d466a029', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440101', '11111111-1111-1111-1111-000000000110', 1, 2399, 2528, '2026-10-17 19:50:56.811', 'OWN', '{"zone": "left", "playerNumber": 10}'::jsonb, 'live-capture', true, '3f9b4bbe-ee9e-4583-90ff-5df2846a9a8b', '2026-10-17 19:50:56.826', '2026-10-17 19:50:56.825'),
    ('6a8384bb-794b-4e17-a6ce-0bda04236646', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440113', NULL, 2, 3186, 3426, '2026-10-17 20:05:54.038', 'OPPONENT', '{"outcome": "regained_attack"}'::jsonb, 'live-capture', false, 'dbe42bcc-23ca-4cb2-8285-debf04a90eb9', '2026-10-17 20:05:54.167', '2026-10-17 20:06:26.844'),
    ('3c8b42c3-827d-4d8f-97b7-6b37fefbd06c', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440122', NULL, 1, 2138, 2157, '2026-10-17 19:44:45.329', 'OWN', '{"penaltyType": "holding_on"}'::jsonb, 'live-capture', true, '6013f173-2d26-4255-a74f-34a63d50b56b', '2026-10-17 19:44:45.357', '2026-10-17 19:44:45.355'),
    ('04813272-23b1-4b3d-b84d-cb67376efeeb', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440111', NULL, 1, 2163, 2182, '2026-10-17 19:45:10.376', 'OPPONENT', '{"scrumResult": "penalty_for"}'::jsonb, 'live-capture', true, '99764f36-6d13-411a-b878-4a797ad176db', '2026-10-17 19:45:10.402', '2026-10-17 19:45:10.400'),
    ('99b5f2ab-fa7f-426d-949e-b03c1c09f7f4', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440126', '11111111-1111-1111-1111-000000000103', 1, 2255, 2347, '2026-10-17 19:47:55.074', 'OWN', '{"playerNumber": 3}'::jsonb, 'live-capture', true, '8209ecaa-8ffb-4605-8b05-76dc6efca711', '2026-10-17 19:47:55.090', '2026-10-17 19:47:55.089'),
    ('32108a69-5e97-41e8-ac57-cdf30ca0aaf7', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440111', NULL, 1, 2255, 2376, '2026-10-17 19:48:24.565', 'OWN', '{"scrumResult": "penalty_for"}'::jsonb, 'live-capture', true, '5de920dd-badc-4c54-9557-e537a47759ef', '2026-10-17 19:48:24.593', '2026-10-17 19:48:24.592'),
    ('2d1a824a-03c8-4d3c-9637-a546aa2dce3b', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440113', NULL, 2, 3225, 3464, '2026-10-17 20:06:32.718', 'OPPONENT', '{"outcome": "received_clean"}'::jsonb, 'live-capture', false, '3d7ef2b2-0598-44c2-85f7-c1c69e545a80', '2026-10-17 20:06:32.859', '2026-10-17 20:06:51.682'),
    ('57a0d980-8506-4c0f-a837-2cd59f2b55ac', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440113', NULL, 2, 3251, 3490, '2026-10-17 20:06:58.773', 'OPPONENT', '{"outcome": "regained_attack"}'::jsonb, 'live-capture', true, '777ec1e6-9e65-4a2a-a61f-4197e47e6d6b', '2026-10-17 20:06:58.816', '2026-10-17 20:06:58.815'),
    ('e5e35c29-ba52-430c-a656-b67ca0ac4d4f', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440111', NULL, 2, 3256, 3496, '2026-10-17 20:07:04.016', 'OWN', '{"scrumResult": "won_clean"}'::jsonb, 'live-capture', true, '2c2d68ea-c54f-41f3-b121-96fdee0aee03', '2026-10-17 20:07:04.054', '2026-10-17 20:07:04.053'),
    ('25dbec95-1065-4cd1-a3ea-a0d33b76c04f', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440109', NULL, 2, 3260, 3499, '2026-10-17 20:07:07.235', 'OWN', NULL, 'live-capture', true, 'cf34c9ff-3d19-4c3f-81e2-81a9384328a2', '2026-10-17 20:07:07.272', '2026-10-17 20:07:07.271'),
    ('d153a9de-8007-48c6-a518-060d363b9e4d', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440122', NULL, 2, 3282, 3554, '2026-10-17 20:08:02.643', 'OPPONENT', '{"penaltyType": "high_tackle"}'::jsonb, 'live-capture', true, '80fcc6de-9845-4ced-afec-db622b2c3948', '2026-10-17 20:08:02.681', '2026-10-17 20:08:02.680'),
    ('a7a2989a-d4e2-49c7-b6bb-7b90b05826c1', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440111', NULL, 2, 3317, 3600, '2026-10-17 20:08:48.033', 'OWN', '{"scrumResult": "won_clean"}'::jsonb, 'live-capture', true, 'e28ddd2d-cea0-4e6d-93f8-c74812183561', '2026-10-17 20:08:48.075', '2026-10-17 20:08:48.074'),
    ('08f8044f-48a2-4794-ae7d-4652b0659ef0', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440111', NULL, 2, 3373, 3656, '2026-10-17 20:09:44.164', 'OPPONENT', '{"scrumResult": "won_clean"}'::jsonb, 'live-capture', true, 'a8495707-9fba-480e-b752-dd882c586950', '2026-10-17 20:09:44.202', '2026-10-17 20:09:44.201'),
    ('4a85d6d3-c193-43cf-87a7-442fa94cf61e', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440122', NULL, 2, 3375, 3781, '2026-10-17 20:11:49.369', 'OWN', '{"penaltyType": "offside"}'::jsonb, 'live-capture', true, '02e9f707-515c-4f01-aa3f-668c6a163f19', '2026-10-17 20:11:49.430', '2026-10-17 20:11:49.429'),
    ('b10c9f04-e1ea-4881-85c4-741304ba9f7b', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440111', NULL, 2, 3375, 3802, '2026-10-17 20:12:10.253', 'OPPONENT', '{"scrumResult": "won_clean"}'::jsonb, 'live-capture', true, '42869bd9-6df8-49ac-b364-ff9bb8adcf25', '2026-10-17 20:12:10.334', '2026-10-17 20:12:10.333'),
    ('2cb40725-b1e8-4289-8582-f3dc90920bc8', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440122', NULL, 2, 3375, 3847, '2026-10-17 20:12:55.629', 'OPPONENT', '{"penaltyType": "side_entry"}'::jsonb, 'live-capture', true, '42f2227d-256d-4959-9a95-1ab4032d7326', '2026-10-17 20:12:55.675', '2026-10-17 20:12:55.673'),
    ('2c1074a7-2a01-438b-bd98-aff84ecc2f08', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440128', NULL, 2, 3375, 3854, '2026-10-17 20:13:02.708', 'OWN', '{"kind": "penalty_touch"}'::jsonb, 'live-capture', true, 'dd190dee-975a-415c-80d1-b0b6aba616b6', '2026-10-17 20:13:02.746', '2026-10-17 20:13:02.745'),
    ('77ece904-2e6a-4a11-b721-43d50d1ec583', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 2, 3390, 3876, '2026-10-17 20:13:24.151', 'OWN', '{"lineResult": "won_clean"}'::jsonb, 'live-capture', true, '823c888b-bb95-43e9-bbcf-3c588a429815', '2026-10-17 20:13:24.194', '2026-10-17 20:13:24.193'),
    ('b96c6703-07a3-40b6-9a39-a6dc982fd7f1', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440122', NULL, 2, 3452, 3937, '2026-10-17 20:14:25.698', 'OWN', '{"penaltyType": "offside"}'::jsonb, 'live-capture', true, 'd09fcf67-5621-4d15-a750-05f89ed32155', '2026-10-17 20:14:25.738', '2026-10-17 20:14:25.737'),
    ('a194dd25-3fee-43f2-b296-43f62efd9334', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440111', NULL, 2, 3542, 4028, '2026-10-17 20:15:56.356', 'OWN', '{"scrumResult": "reset"}'::jsonb, 'live-capture', true, 'a4fffdcc-acb5-45d2-897d-8b04684cbce7', '2026-10-17 20:15:56.399', '2026-10-17 20:15:56.399'),
    ('43028091-1b63-499f-97bf-07278389d05f', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440111', NULL, 2, 3572, 4057, '2026-10-17 20:16:25.534', 'OWN', '{"scrumResult": "won_clean"}'::jsonb, 'live-capture', true, 'ee690c7c-4dfb-4fe1-b415-eff0c09d701f', '2026-10-17 20:16:25.555', '2026-10-17 20:16:25.555'),
    ('01b2671b-dcde-4396-9cb6-22154830d02a', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440110', NULL, 2, 3575, 4060, '2026-10-17 20:16:28.666', 'OWN', '{"outcome": "opp_possession"}'::jsonb, 'live-capture', true, '5798d5bd-2134-4bb6-9ea4-f59df59d919c', '2026-10-17 20:16:28.706', '2026-10-17 20:16:28.705'),
    ('a59394b7-3b82-431a-b211-838e0e1adb84', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440110', NULL, 2, 3606, 4091, '2026-10-17 20:16:59.786', 'OWN', '{"outcome": "opp_possession"}'::jsonb, 'live-capture', true, 'ea2da54d-c42a-4602-b52a-a10d88de9fed', '2026-10-17 20:16:59.822', '2026-10-17 20:16:59.822'),
    ('c472deb3-2388-4c4f-b1e6-fca1cf87ce5a', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440111', NULL, 2, 3687, 4172, '2026-10-17 20:18:20.614', 'OWN', '{"scrumResult": "penalty_against"}'::jsonb, 'live-capture', true, '3d67706c-4d50-42f4-ab95-547f55d17c88', '2026-10-17 20:18:20.654', '2026-10-17 20:18:20.654'),
    ('2b97e11c-4f8a-4c55-ab4c-f46ed8fbb165', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440101', NULL, 2, 3719, 4204, '2026-10-17 20:18:52.519', 'OPPONENT', '{"zone": "right"}'::jsonb, 'live-capture', true, '502c4895-2925-4643-a09f-aa8618e68699', '2026-10-17 20:18:52.569', '2026-10-17 20:18:52.568'),
    ('47367576-7637-4c4e-a47c-44756bb138ea', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440102', NULL, 2, 3760, 4245, '2026-10-17 20:19:33.603', 'OPPONENT', '{"wasSuccessful": false}'::jsonb, 'live-capture', true, 'afc06a5e-a00b-4499-bd0e-cc6873fa94cc', '2026-10-17 20:19:33.637', '2026-10-17 20:19:33.636'),
    ('2256e660-290b-4b6a-ae1c-d68f6fab9fb3', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440113', '11111111-1111-1111-1111-000000000115', 2, 3796, 4281, '2026-10-17 20:20:09.613', 'OWN', '{"outcome": "received_clean", "playerNumber": 15}'::jsonb, 'live-capture', true, 'e4e5deca-8f7f-4096-9340-11dc865504e3', '2026-10-17 20:20:09.665', '2026-10-17 20:20:09.663'),
    ('33b2df09-a86c-4820-a4d3-3672d4572b66', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440109', NULL, 2, 3801, 4287, '2026-10-17 20:20:15.478', 'OPPONENT', NULL, 'live-capture', true, '260fe7a7-8779-4e8b-a198-25d9a6aac4f9', '2026-10-17 20:20:15.514', '2026-10-17 20:20:15.513'),
    ('efe27d2f-2110-4534-b16e-2f822aea30f2', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440101', NULL, 2, 3839, 4325, '2026-10-17 20:20:52.860', 'OPPONENT', '{"zone": "center"}'::jsonb, 'live-capture', true, '1cf0417a-a440-4fac-90e4-a28617cf2038', '2026-10-17 20:20:52.900', '2026-10-17 20:20:52.899'),
    ('04bc4695-93b1-4400-8ba1-5e35923f7736', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440102', NULL, 2, 3862, 4347, '2026-10-17 20:21:15.553', 'OPPONENT', '{"wasSuccessful": true}'::jsonb, 'live-capture', true, 'a7105af7-8763-4d25-a0f8-32e9de44d168', '2026-10-17 20:21:15.597', '2026-10-17 20:21:15.596'),
    ('4b6390b3-1047-4890-bf9d-96f186c59e25', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440113', NULL, 2, 3911, 4396, '2026-10-17 20:22:04.707', 'OWN', '{"outcome": "received_clean"}'::jsonb, 'live-capture', true, '49bc7d3a-6fb6-49c9-8f47-8e5be2946214', '2026-10-17 20:22:04.747', '2026-10-17 20:22:04.746'),
    ('8088b3b0-4fa6-46dc-849e-97df19b5718e', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440110', NULL, 2, 3915, 4401, '2026-10-17 20:22:09.239', 'OPPONENT', '{"outcome": "out_in_full"}'::jsonb, 'live-capture', true, '174de772-3e4c-439d-b7ef-39b67b36398a', '2026-10-17 20:22:09.278', '2026-10-17 20:22:09.277'),
    ('5ca5512c-f7ea-465d-9ec3-f80ddea00bc6', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 2, 3933, 4418, '2026-10-17 20:22:26.750', 'OWN', '{"lineResult": "won_clean"}'::jsonb, 'live-capture', true, 'de2398b2-0d08-47ce-9b9d-1cf0259146cf', '2026-10-17 20:22:26.790', '2026-10-17 20:22:26.789'),
    ('418b867f-df31-40c5-aa28-58a18c0bb254', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440123', NULL, 2, 3986, 4471, '2026-10-17 20:23:19.550', 'OPPONENT', '{"reason": "cynical_foul"}'::jsonb, 'live-capture', true, 'a509e4e2-1826-44cf-a612-7ae7c3ea7430', '2026-10-17 20:23:19.575', '2026-10-17 20:23:19.574'),
    ('f6945b96-c0f9-4d51-8ab5-9956759e2680', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440122', NULL, 2, 3962, 4448, '2026-10-17 20:22:56.057', 'OPPONENT', '{"penaltyType": "offside"}'::jsonb, 'live-capture', false, '3a2e73a1-2726-4741-a87c-5fdbc535b05d', '2026-10-17 20:22:56.094', '2026-10-17 20:23:22.690'),
    ('28acbd01-45de-4ddc-9419-532a730bdda5', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 2, 4040, 4526, '2026-10-17 20:24:14.005', 'OWN', '{"lineResult": "won_clean"}'::jsonb, 'live-capture', true, '03b14571-efa5-4891-b67b-ba6d5ce16613', '2026-10-17 20:24:14.047', '2026-10-17 20:24:14.046'),
    ('4aa4b444-6f77-48a5-a1d4-ff02a2662e98', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440101', NULL, 2, 4048, 4534, '2026-10-17 20:24:21.867', 'OWN', '{"zone": "left"}'::jsonb, 'live-capture', true, 'fb1e5c6d-efb1-470c-8d5c-d72de3b5ac84', '2026-10-17 20:24:21.899', '2026-10-17 20:24:21.898'),
    ('e4bab5fc-12dd-4272-8e61-c1a1e2790e8a', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440102', '11111111-1111-1111-1111-000000000115', 2, 4084, 4570, '2026-10-17 20:24:58.330', 'OWN', '{"playerNumber": 15, "wasSuccessful": false}'::jsonb, 'live-capture', true, '5d4854e7-8a6a-496e-8239-8bd6652545d0', '2026-10-17 20:24:58.382', '2026-10-17 20:24:58.380'),
    ('ec9c3932-e96c-4b53-a4b0-676e47943d31', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440113', NULL, 2, 4136, 4622, '2026-10-17 20:25:50.257', 'OPPONENT', '{"outcome": "regained_attack"}'::jsonb, 'live-capture', true, '810d763a-fc25-47f9-b036-6a912c4838a9', '2026-10-17 20:25:50.290', '2026-10-17 20:25:50.289'),
    ('dab1a9c1-b860-4912-8549-935f433f6952', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440128', '11111111-1111-1111-1111-000000000115', 2, 4264, 4749, '2026-10-17 20:27:57.783', 'OWN', '{"kind": "penalty_touch", "playerNumber": 15}'::jsonb, 'live-capture', true, '372f2f0c-f024-40a3-ba9e-7446dda00562', '2026-10-17 20:27:57.830', '2026-10-17 20:27:57.829'),
    ('72a29692-28b0-4586-8d23-b8a9e6eb51aa', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440110', NULL, 2, 4293, 4779, '2026-10-17 20:28:27.450', 'OPPONENT', '{"outcome": "out_in_full"}'::jsonb, 'live-capture', true, 'f5cf72b5-df43-471a-a883-de2b81ac2a1f', '2026-10-17 20:28:27.489', '2026-10-17 20:28:27.488'),
    ('e68fa5ca-84fb-4279-983b-a736abc75531', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 2, 4317, 4803, '2026-10-17 20:28:51.340', 'OWN', '{"lineResult": "won_clean"}'::jsonb, 'live-capture', true, 'c26c94fb-4363-4847-8f8a-871bf39b5766', '2026-10-17 20:28:51.381', '2026-10-17 20:28:51.380'),
    ('669ec3c6-1606-4db9-a07b-298834479fd6', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440122', NULL, 2, 4383, 4869, '2026-10-17 20:29:57.040', 'OPPONENT', '{"penaltyType": "offside"}'::jsonb, 'live-capture', true, 'cbd645ce-da95-4a45-87be-a6eb57b5c843', '2026-10-17 20:29:57.075', '2026-10-17 20:29:57.074'),
    ('91061946-13c7-4eaf-9c54-8caa4716a750', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440122', NULL, 2, 4452, 4937, '2026-10-17 20:31:05.694', 'OWN', '{"penaltyType": "side_entry"}'::jsonb, 'live-capture', true, 'd9f22aae-e756-495c-a5fd-5e022be608b7', '2026-10-17 20:31:05.740', '2026-10-17 20:31:05.739'),
    ('eebc8376-4f57-40aa-acac-b69815fc9ab4', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440128', NULL, 2, 4460, 4945, '2026-10-17 20:31:13.639', 'OPPONENT', '{"kind": "penalty_touch"}'::jsonb, 'live-capture', true, '0ed7dfb8-e842-46f7-961e-7959d58c1577', '2026-10-17 20:31:13.682', '2026-10-17 20:31:13.680'),
    ('696a4f7e-e103-4cc4-9ae9-683750192e01', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 2, 4495, 4980, '2026-10-17 20:31:48.667', 'OPPONENT', '{"lineResult": "penalty_against"}'::jsonb, 'live-capture', true, '26ed2c3f-a4c4-4591-88d2-4fc1cd08368b', '2026-10-17 20:31:48.714', '2026-10-17 20:31:48.712'),
    ('9134146b-33e3-4186-9fff-6f34372b9f20', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440101', NULL, 2, 4615, 5101, '2026-10-17 20:33:49.366', 'OPPONENT', '{"zone": "center"}'::jsonb, 'live-capture', true, 'bdbbb55a-157e-466e-8456-931b80a4c92f', '2026-10-17 20:33:49.400', '2026-10-17 20:33:49.399'),
    ('98841f97-b21f-4fd1-bb7f-d7c1d9d4ca60', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440111', NULL, 2, 4181, 4667, '2026-10-17 20:26:34.852', 'OWN', '{"scrumResult": "reset"}'::jsonb, 'live-capture', true, '43b8f1ee-a81e-4df6-b2fd-73dcc0504321', '2026-10-17 20:26:34.874', '2026-10-17 20:26:34.873'),
    ('abf84c34-046d-4f63-ab92-35e59f8c204f', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440111', NULL, 2, 4213, 4698, '2026-10-17 20:27:06.549', 'OWN', '{"scrumResult": "won_clean"}'::jsonb, 'live-capture', true, '9e43fda2-dbc4-400a-8377-63784e8f8316', '2026-10-17 20:27:06.592', '2026-10-17 20:27:06.591'),
    ('dbd44f46-6601-4c75-856b-1599c20e09cd', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440122', NULL, 2, 4252, 4738, '2026-10-17 20:27:46.244', 'OPPONENT', '{"penaltyType": "side_entry"}'::jsonb, 'live-capture', true, 'd5354757-743c-49c3-a11f-163e51659287', '2026-10-17 20:27:46.265', '2026-10-17 20:27:46.264'),
    ('844efaa7-bbfc-472f-90a6-64f5cf34f6ee', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 2, 4291, 4777, '2026-10-17 20:28:24.925', 'OWN', '{"lineResult": "stolen"}'::jsonb, 'live-capture', true, 'ad22a6ff-ce23-4bd0-8e25-e25fca75bac4', '2026-10-17 20:28:24.953', '2026-10-17 20:28:24.953'),
    ('d47c61f9-c8c9-4fbc-aee4-5521eb6bbfb7', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440128', NULL, 2, 4396, 4881, '2026-10-17 20:30:09.620', 'OWN', '{"kind": "penalty_touch"}'::jsonb, 'live-capture', true, 'ac77cbcb-898b-4fe7-a163-d2bf8b2e38ac', '2026-10-17 20:30:09.660', '2026-10-17 20:30:09.659'),
    ('c273a759-5592-45ca-a6a8-0a842857ca39', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 2, 4418, 4903, '2026-10-17 20:30:31.794', 'OWN', '{"lineResult": "won_dirty"}'::jsonb, 'live-capture', true, '9ce40357-07dc-4085-a796-655306777d76', '2026-10-17 20:30:31.837', '2026-10-17 20:30:31.836'),
    ('51d7a97b-6203-478b-ae52-b5ae3eee6148', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440122', NULL, 2, 4523, 5009, '2026-10-17 20:32:17.203', 'OWN', '{"penaltyType": "holding_on"}'::jsonb, 'live-capture', true, 'afd5b1c3-af30-432f-8873-e978553ceea0', '2026-10-17 20:32:17.239', '2026-10-17 20:32:17.238'),
    ('cac16e16-1b5f-44ba-aaa1-efa7ef5b5b6d', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440128', NULL, 2, 4535, 5021, '2026-10-17 20:32:29.313', 'OPPONENT', '{"kind": "penalty_touch"}'::jsonb, 'live-capture', true, 'a8f4d6b1-fee2-4bb4-9ba9-62d9ff35c4c8', '2026-10-17 20:32:29.349', '2026-10-17 20:32:29.348'),
    ('d42c57a2-dd27-4f70-bb27-9b38ee2b60b8', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 2, 4563, 5049, '2026-10-17 20:32:57.189', 'OPPONENT', '{"lineResult": "won_clean"}'::jsonb, 'live-capture', true, '909fb632-406d-45ef-acd2-43b883f7f148', '2026-10-17 20:32:57.226', '2026-10-17 20:32:57.225'),
    ('4d73b98c-99f6-4f6d-8b45-c3fce5af3c88', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440109', NULL, 2, 4611, 5096, '2026-10-17 20:33:44.642', 'OPPONENT', NULL, 'live-capture', true, '2603af41-f12d-45c6-9ff3-14b29b5a6c35', '2026-10-17 20:33:44.682', '2026-10-17 20:33:44.681'),
    ('366e9773-8397-4046-ad04-fcf8064d9af4', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440102', NULL, 2, 4644, 5130, '2026-10-17 20:34:18.280', 'OPPONENT', '{"playerNumber": 15, "wasSuccessful": true}'::jsonb, 'live-capture', true, 'dd6cce09-efe2-4489-8aec-5f3a87c45cf1', '2026-10-17 20:34:18.312', '2026-10-17 20:34:18.311'),
    ('0706f54a-b7f8-499e-a56f-5712911de60e', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440113', NULL, 2, 4688, 5173, '2026-10-17 20:35:01.597', 'OWN', '{"outcome": "received_clean"}'::jsonb, 'live-capture', true, '42265dcd-f282-4ee5-8cc8-347f60034f7e', '2026-10-17 20:35:01.639', '2026-10-17 20:35:01.638'),
    ('77c001ec-e397-4c22-a4d6-affdfce03d2c', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440110', NULL, 2, 4693, 5179, '2026-10-17 20:35:07.495', 'OPPONENT', '{"outcome": "out_in_full"}'::jsonb, 'live-capture', true, 'c574fd3e-baef-4ab2-82a2-2ec7faa6577e', '2026-10-17 20:35:07.535', '2026-10-17 20:35:07.534'),
    ('4b774604-9f6e-4b6e-bf19-0418bcede344', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440112', NULL, 2, 4721, 5206, '2026-10-17 20:35:34.757', 'OWN', '{"lineResult": "won_clean"}'::jsonb, 'live-capture', true, 'd496b1b3-ca1a-44d7-99ee-7748f1ddb4e4', '2026-10-17 20:35:34.797', '2026-10-17 20:35:34.796'),
    ('86a154a4-c2e4-45ad-8a6c-5040d5b00110', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440122', NULL, 2, 4758, 5244, '2026-10-17 20:36:12.347', 'OWN', '{"penaltyType": "holding_on"}'::jsonb, 'live-capture', true, 'c6719c2e-79c7-42f5-a572-0cee5c7d4725', '2026-10-17 20:36:12.381', '2026-10-17 20:36:12.380'),
    ('f29ab027-9476-4f76-a984-6217fb8d88c3', '24a0cbdc-4667-4099-b16f-abc64f388345', '550e8400-e29b-41d4-a716-446655440109', NULL, 2, 4770, 5256, '2026-10-17 20:36:23.955', 'OPPONENT', NULL, 'live-capture', true, 'dfee8a28-1bd0-4504-b7f7-061304738d81', '2026-10-17 20:36:23.995', '2026-10-17 20:36:23.995');