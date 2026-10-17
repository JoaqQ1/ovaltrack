-- OvalTrack Data Seeder
-- =========================================

TRUNCATE TABLE events, event_types, matches, division_players, division_coaches, divisions, clubs, users, persons RESTART IDENTITY CASCADE;

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
-- STAGING: Primera vs Trelew Rugby Club (18/10/2026)
-- Sin partidos previos. Plantel de 23: 1-8 forwards, 9-15 backs, 16-21 forwards, 22-23 backs.
-- =========================================

-- =========================================
-- PERSONS (3 de staff + 23 jugadores)
-- =========================================

INSERT INTO persons (id, first_name, last_name, birth_date, contact_email, contact_phone, created_at) VALUES
    -- 1: Administrador del Club
    ('11111111-1111-1111-1111-000000000001', 'Carlos', 'Administrador', '1980-01-01', 'admin@club.com', '123456789', CURRENT_TIMESTAMP),
    -- 2: Entrenador Gonzalo
    ('11111111-1111-1111-1111-000000000002', 'Gonzalo', 'Entrenador', '1985-05-10', 'gonzalo@mail.com', '123456789', CURRENT_TIMESTAMP),
    -- 3: Analista Mario
    ('11111111-1111-1111-1111-000000000003', 'Mario', 'Analista', '1982-11-20', 'coach2@ovaltrack.com', '123456789', CURRENT_TIMESTAMP),
    -- 4 a 26: Plantel de Primera, numerados por camiseta (sin cuenta de usuario)
    ('11111111-1111-1111-1111-000000000101', 'Matías', 'Salari', NULL, NULL, NULL, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000102', 'Facundo', 'Gangas', NULL, NULL, NULL, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000103', 'Juan Manuel', 'Gelvez', NULL, NULL, NULL, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000104', 'Luciano', 'Belmar', NULL, NULL, NULL, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000105', 'Agustín', 'Galarza', NULL, NULL, NULL, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000106', 'Emiliano', 'Villegas', NULL, NULL, NULL, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000107', 'Joaquin', 'Villa', NULL, NULL, NULL, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000108', 'Nazareno', 'Rocha', NULL, NULL, NULL, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000109', 'Joaquin', 'Peroy', NULL, NULL, NULL, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000110', 'Rodrigo', 'Aman', NULL, NULL, NULL, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000111', 'Rodrigo', 'Carrizo', NULL, NULL, NULL, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000112', 'Luciano', 'Balmaceda', NULL, NULL, NULL, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000113', 'Manuel', 'Rocha', NULL, NULL, NULL, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000114', 'Jaime', 'Leiva', NULL, NULL, NULL, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000115', 'Pedro', 'Arbeletche', NULL, NULL, NULL, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000116', 'Lautaro', 'Salinas', NULL, NULL, NULL, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000117', 'Lautaro', 'Villegas', NULL, NULL, NULL, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000118', 'Facundo', 'Soria', NULL, NULL, NULL, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000119', 'Jose', 'Montiquin', NULL, NULL, NULL, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000120', 'Juan', 'Pistilli', NULL, NULL, NULL, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000121', 'Tomas', 'Rolando', NULL, NULL, NULL, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000122', 'Lorenzo', 'Becchi', NULL, NULL, NULL, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-000000000123', 'Agustin', 'Albornoz', NULL, NULL, NULL, CURRENT_TIMESTAMP);


-- =========================================
-- USERS (3 cuentas: admin, entrenador y analista)
-- =========================================

INSERT INTO users (id, login_email, password_hash, role, person_id, active, created_at) VALUES
    -- 1: Admin de Club (password: 'administrador')
    ('11111111-1111-1111-1111-000000000001', 'admin@club.com', '$2a$10$muT5CkR/ijOSgfmjvAWwNuYxVc6bZUKpt2inx5AXux7ukib9X3h6K', 'ADMIN_CLUB', '11111111-1111-1111-1111-000000000001', true, CURRENT_TIMESTAMP),
    -- 2: Entrenador Gonzalo (password: '12345678')
    ('11111111-1111-1111-1111-000000000002', 'gonzalo@mail.com', '$2a$10$EJRf2jQGFPYWYSL03J6rCe4v9v3dMxeyt/efj17fIzSgCO9Um1ImW', 'COACH_ANALYST', '11111111-1111-1111-1111-000000000002', true, CURRENT_TIMESTAMP),
    -- 3: Analista Mario (password: '123456')
    ('11111111-1111-1111-1111-000000000003', 'coach2@ovaltrack.com', '$2a$10$rfosuoBOENyuQRIy6eCSX.RVjuk2ZrLtlz7NdGpBlxrqviDJflWiG', 'COACH_ANALYST', '11111111-1111-1111-1111-000000000003', true, CURRENT_TIMESTAMP);


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
    ('11111111-1111-1111-1111-000000000020', 'Primera', '11111111-1111-1111-1111-000000000010', CURRENT_TIMESTAMP, 'SENIOR', 'MALE', true);


-- =========================================
-- DIVISION_COACHES (Gonzalo entrena; Mario analiza el partido)
-- =========================================

INSERT INTO division_coaches (id, person_id, division_id, start_date, end_date) VALUES
    ('11111111-1111-1111-1111-000000000030', '11111111-1111-1111-1111-000000000002', '11111111-1111-1111-1111-000000000020', '2023-01-01', NULL),
    ('11111111-1111-1111-1111-000000000031', '11111111-1111-1111-1111-000000000003', '11111111-1111-1111-1111-000000000020', '2023-01-01', NULL);


-- =========================================
-- DIVISION_PLAYERS (23 jugadores de Primera)
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
    ('11111111-1111-1111-1111-000000000223', '11111111-1111-1111-1111-000000000123', '11111111-1111-1111-1111-000000000020', 23, 'Back', '2023-01-01', NULL);



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
-- MATCHES (un único partido, mañana 18/10/2026)
-- =========================================

INSERT INTO matches (
  id, date, division_id, opponent_id, status, current_period,
  clock_elapsed_seconds, clock_paused, clock_updated_at,
  current_possession, home_score, away_score, started_at, finished_at
) VALUES
  ('11111111-1111-1111-1111-000000000040', '2026-10-18 16:00:00', '11111111-1111-1111-1111-000000000020', '22222222-1111-1111-1111-000000000001', 'NOT_STARTED', 1, 0, true, NULL, 'OWN', 0, 0, NULL, NULL);




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
    true,
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
    true,
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
    true,
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
    true,
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
    true,
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
        "phase": "live",
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
    true,
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
    true,
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
    true,
    true,
    true,
    NULL,
    'CHOOSE',
    'KEEP',
    $$[]$$::jsonb,
    $$[]$$::jsonb,
    CURRENT_TIMESTAMP
);
