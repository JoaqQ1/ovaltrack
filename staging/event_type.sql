INSERT INTO event_types
(id, code, name, group_name, category, affects_possession, is_scoring, points,
 requires_player, is_active, show_in_palette, follow_up_event_type_id, template_event_fields, created_at)
VALUES
(
    '550e8400-e29b-41d4-a716-446655440101',
    'TRY',
    'Try',
    'Ataque',
    'ATTACK',
    false,
    true,
    5,
    true,
    true,
    true,
    '550e8400-e29b-41d4-a716-446655440113',
    $$[
      {
        "key": "zone",
        "label": "Zona del campo",
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
    '550e8400-e29b-41d4-a716-446655440113',
    'CONVERSION',
    'Conversión',
    'Ataque',
    'ATTACK',
    true,
    true,
    2,
    true,
    true,
    false,
    NULL,
    $$[
      {
        "key": "wasSuccessful",
        "label": "Resultado",
        "type": "boolean",
        "phase": "live",
        "required": true,
        "effect": "scoring",
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
    '550e8400-e29b-41d4-a716-446655440102',
    'PENALTY_KICK',
    'Penal a los palos',
    'Ataque',
    'ATTACK',
    false,
    true,
    3,
    true,
    true,
    true,
    NULL,
    $$[
      {
        "key": "wasSuccessful",
        "label": "Resultado",
        "type": "boolean",
        "phase": "live",
        "required": true,
        "effect": "scoring",
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
    '550e8400-e29b-41d4-a716-446655440103',
    'DROP_GOAL',
    'Drop gol',
    'Ataque',
    'ATTACK',
    false,
    true,
    3,
    true,
    true,
    true,
    NULL,
    $$[
      {
        "key": "wasSuccessful",
        "label": "Resultado",
        "type": "boolean",
        "phase": "live",
        "required": true,
        "effect": "scoring",
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
    '550e8400-e29b-41d4-a716-446655440104',
    'TACKLE_MADE',
    'Tackle completado',
    'Defensa',
    'DEFENSE',
    false,
    false,
    0,
    true,
    true,
    true,
    NULL,
    $$[
      {
        "key": "forcedTurnover",
        "label": "Forzó turnover",
        "type": "boolean",
        "phase": "post",
        "required": false
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440105',
    'TACKLE_MISSED',
    'Tackle fallado',
    'Defensa',
    'DEFENSE',
    false,
    false,
    0,
    true,
    true,
    true,
    NULL,
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
            "label": "No llegó"
          },
          {
            "value": "bounced_off",
            "label": "Lo superaron"
          },
          {
            "value": "late",
            "label": "Llegó tarde"
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
    '550e8400-e29b-41d4-a716-446655440106',
    'TURNOVER',
    'Turnover',
    'Cambio de posesión',
    'NEUTRAL',
    true,
    false,
    0,
    false,
    true,
    true,
    NULL,
    $$[
      {
        "key": "turnoverType",
        "label": "Tipo de turnover",
        "type": "select",
        "phase": "post",
        "required": false,
        "options": [
          {
            "value": "ruck_steal",
            "label": "Robo en ruck"
          },
          {
            "value": "maul_steal",
            "label": "Robo en maul"
          },
          {
            "value": "interception",
            "label": "Intercepción"
          },
          {
            "value": "knock_on",
            "label": "Pelota caída"
          },
          {
            "value": "kick_regained",
            "label": "Recuperación de patada"
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
    '550e8400-e29b-41d4-a716-446655440107',
    'SCRUM',
    'Scrum',
    'Formación fija',
    'NEUTRAL',
    false,
    false,
    0,
    false,
    true,
    true,
    NULL,
    $$[
      {
        "key": "scrumResult",
        "label": "Resultado",
        "type": "select",
        "phase": "post",
        "required": true,
        "options": [
          {
            "value": "won_own",
            "label": "Ganó su introducción"
          },
          {
            "value": "lost_own",
            "label": "Perdió su introducción"
          },
          {
            "value": "stolen",
            "label": "Robó introducción rival"
          },
          {
            "value": "penalty_for",
            "label": "Penal a favor"
          },
          {
            "value": "penalty_against",
            "label": "Penal en contra"
          }
        ]
      },
      {
        "key": "resetCount",
        "label": "Reinicios",
        "type": "number",
        "phase": "post",
        "required": false,
        "min": 0,
        "max": 5,
        "default": 0
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440108',
    'LINEOUT',
    'Line-out',
    'Formación fija',
    'NEUTRAL',
    false,
    false,
    0,
    false,
    true,
    true,
    NULL,
    $$[
      {
        "key": "lineResult",
        "label": "Resultado",
        "type": "select",
        "phase": "post",
        "required": true,
        "options": [
          {
            "value": "won_clean",
            "label": "Ganado limpio"
          },
          {
            "value": "won_dirty",
            "label": "Ganado sucio"
          },
          {
            "value": "lost",
            "label": "Perdido"
          },
          {
            "value": "stolen",
            "label": "Robado al rival"
          },
          {
            "value": "penalty",
            "label": "Penal"
          }
        ]
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440109',
    'PENALTY_CONCEDED',
    'Penal / infracción',
    'Neutro',
    'NEUTRAL',
    false,
    false,
    0,
    false,
    true,
    true,
    NULL,
    $$[
      {
        "key": "penaltyType",
        "label": "Tipo de infracción",
        "type": "select",
        "phase": "post",
        "required": false,
        "options": [
          {
            "value": "offside",
            "label": "Offside"
          },
          {
            "value": "ruck_maul",
            "label": "Ruck / maul"
          },
          {
            "value": "scrum",
            "label": "Scrum"
          },
          {
            "value": "tackle",
            "label": "Tackle"
          },
          {
            "value": "lineout",
            "label": "Line-out"
          },
          {
            "value": "other",
            "label": "Otra"
          }
        ]
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440110',
    'YELLOW_CARD',
    'Amonestación',
    'Neutro',
    'NEUTRAL',
    false,
    false,
    0,
    true,
    true,
    true,
    NULL,
    $$[
      {
        "key": "reason",
        "label": "Motivo",
        "type": "select",
        "phase": "post",
        "required": false,
        "options": [
          {
            "value": "high_tackle",
            "label": "Tackle alto"
          },
          {
            "value": "dangerous_play",
            "label": "Juego peligroso"
          },
          {
            "value": "dissent",
            "label": "Protesta"
          },
          {
            "value": "repeated_infringement",
            "label": "Infracciones repetidas"
          },
          {
            "value": "other",
            "label": "Otro"
          }
        ]
      },
      {
        "key": "durationMinutes",
        "label": "Minutos de suspensión",
        "type": "number",
        "phase": "post",
        "required": false,
        "min": 1,
        "max": 20,
        "default": 10
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440111',
    'RED_CARD',
    'Expulsión',
    'Neutro',
    'NEUTRAL',
    false,
    false,
    0,
    true,
    true,
    true,
    NULL,
    $$[
      {
        "key": "reason",
        "label": "Motivo",
        "type": "select",
        "phase": "post",
        "required": false,
        "options": [
          {
            "value": "foul_play",
            "label": "Juego sucio"
          },
          {
            "value": "high_tackle",
            "label": "Tackle alto"
          },
          {
            "value": "second_yellow",
            "label": "Segunda amarilla"
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
    '550e8400-e29b-41d4-a716-446655440112',
    'INJURY',
    'Lesión',
    'Neutro',
    'NEUTRAL',
    false,
    false,
    0,
    true,
    true,
    true,
    NULL,
    $$[
      {
        "key": "injury",
        "label": "Zona de la lesión",
        "type": "select",
        "phase": "post",
        "required": false,
        "options": [
          {
            "value": "head",
            "label": "Cabeza / conmoción"
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
          },
          {
            "value": "other",
            "label": "Otra"
          }
        ]
      }
    ]$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440114',
    'SUBSTITUTION',
    'Cambio',
    'Neutro',
    'NEUTRAL',
    false,
    false,
    0,
    true,
    true,
    true,
    NULL,
    $$[]$$::jsonb,
    CURRENT_TIMESTAMP
);
