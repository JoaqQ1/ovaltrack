INSERT INTO event_types
(id, name, group_name, category, affects_possession, is_scoring, points,
 requires_player, template_event_fields, created_at)
VALUES
(
    '550e8400-e29b-41d4-a716-446655440101',
    'Try',
    'Ataque',
    'ATTACK',
    true,
    true,
    5,
    true,
    $${
      "wasSuccessful": { "type": "boolean", "required": true },
      "wasConverted": { "type": "boolean", "required": true }
    }$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440102',
    'Penal a los palos',
    'Ataque',
    'ATTACK',
    false,
    true,
    3,
    true,
    $${
      "wasSuccessful": { "type": "boolean", "required": true },
      "distanceMeters": { "type": "number", "required": false }
    }$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440103',
    'Drop gol',
    'Ataque',
    'ATTACK',
    false,
    true,
    3,
    true,
    $${
      "wasSuccessful": { "type": "boolean", "required": true },
      "distanceMeters": { "type": "number", "required": false }
    }$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440104',
    'Tackle completado',
    'Defensa',
    'DEFENSE',
    false,
    false,
    0,
    true,
    $${
      "forcedTurnover": { "type": "boolean", "required": false }
    }$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440105',
    'Tackle fallado',
    'Defensa',
    'DEFENSE',
    false,
    false,
    0,
    true,
    $${
      "failReason": { "type": "string", "required": false }
    }$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440106',
    'Turnover',
    'Cambio de posesión',
    'NEUTRAL',
    true,
    false,
    0,
    false,
    '{
      "turnoverType": {"type": "string", "required":false}
    }'::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440107',
    'Scrum',
    'Formación fija',
    'SET_PIECE',
    false,
    false,
    0,
    false,
    $${
      "scrumResult": { "type": "string", "required": true },
      "resetCount": { "type": "integer", "required": false }
    }$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440108',
    'Line-out',
    'Formación fija',
    'SET_PIECE',
    false,
    false,
    0,
    false,
    $${
      "lineResult": { "type": "string", "required": true }
    }$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440109',
    'Penal / infracción',
    'Neutro',
    'NEUTRAL',
    false,
    false,
    0,
    false,
    $${
      "penaltyType": { "type": "string", "required": false }
    }$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440110',
    'Amonestación',
    'Neutro',
    'NEUTRAL',
    false,
    false,
    0,
    true,
    $${
      "reason": { "type": "string", "required": false },
      "durationMinutes": { "type": "integer", "required": false }
    }$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440111',
    'Expulsión',
    'Neutro',
    'NEUTRAL',
    false,
    false,
    0,
    true,
    $${
      "reason": { "type": "string", "required": false }
    }$$::jsonb,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440112',
    'Lesión',
    'Neutro',
    'NEUTRAL',
    false,
    false,
    0,
    true,
    $${
      "injury": { "type": "string", "required": false }
    }$$::jsonb,
    CURRENT_TIMESTAMP
);
