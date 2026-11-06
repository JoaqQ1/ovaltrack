-- Adds permanent match roster numbers without changing historical event contracts.
ALTER TABLE matches_players
    ADD COLUMN IF NOT EXISTS slot_order integer;

ALTER TABLE matches_players
    ADD COLUMN IF NOT EXISTS number integer;

ALTER TABLE matches_players
    ADD COLUMN IF NOT EXISTS field_status varchar(32);

ALTER TABLE matches_players
    ADD COLUMN IF NOT EXISTS field_slot integer;

WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY match_id, role ORDER BY id) - 1 AS new_order
    FROM matches_players
    WHERE slot_order IS NULL
)
UPDATE matches_players mp
SET slot_order = ranked.new_order
FROM ranked
WHERE mp.id = ranked.id
  AND mp.slot_order IS NULL;

UPDATE matches_players
SET number = COALESCE(number,
    CASE WHEN role = 'TITULAR' THEN slot_order + 1 ELSE slot_order + 16 END)
WHERE number IS NULL;

UPDATE matches_players
SET field_status = COALESCE(
        field_status,
        CASE WHEN role = 'TITULAR' THEN 'EN_CANCHA' ELSE 'EN_BANCO' END
    ),
    field_slot = CASE
        WHEN role = 'TITULAR' THEN COALESCE(field_slot, slot_order + 1)
        ELSE NULL
    END;

ALTER TABLE matches_players
    ALTER COLUMN number SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_match_players_match_number
    ON matches_players (match_id, number);

UPDATE events e
SET player_id = NULL
WHERE e.event_type_id IN (SELECT id FROM event_types WHERE code = 'SUBSTITUTION');

DO $$
DECLARE
    match_row RECORD;
    event_row RECORD;
    outgoing_id UUID;
    incoming_id UUID;
    outgoing_slot INTEGER;
BEGIN
    FOR match_row IN SELECT id FROM matches LOOP
        UPDATE matches_players
        SET field_status = CASE WHEN role = 'TITULAR' THEN 'EN_CANCHA' ELSE 'EN_BANCO' END,
            field_slot = CASE WHEN role = 'TITULAR' THEN slot_order + 1 ELSE NULL END
        WHERE match_id = match_row.id;

        FOR event_row IN
            SELECT e.*
            FROM events e
            JOIN event_types et ON et.id = e.event_type_id
            WHERE e.match_id = match_row.id
              AND e.active = TRUE
              AND e.team_possession = 'OWN'
              AND et.code = 'SUBSTITUTION'
            ORDER BY e.absolute_match_time NULLS LAST, e.real_time NULLS LAST,
                     e.created_at NULLS LAST, e.id
        LOOP
            SELECT mp.id INTO outgoing_id
            FROM matches_players mp
            JOIN division_players dp ON dp.id = mp.division_id
            WHERE mp.match_id = match_row.id
              AND (
                (event_row.attributes ? 'playerOutId'
                 AND dp.person_id = (event_row.attributes->>'playerOutId')::uuid)
                OR (NOT event_row.attributes ? 'playerOutId'
                    AND mp.number = (event_row.attributes->>'playerOutNumber')::integer)
              )
            LIMIT 1;

            SELECT mp.id INTO incoming_id
            FROM matches_players mp
            JOIN division_players dp ON dp.id = mp.division_id
            WHERE mp.match_id = match_row.id
              AND (
                (event_row.attributes ? 'playerInId'
                 AND dp.person_id = (event_row.attributes->>'playerInId')::uuid)
                OR (NOT event_row.attributes ? 'playerInId'
                    AND mp.number = (event_row.attributes->>'playerInNumber')::integer)
              )
            LIMIT 1;

            IF outgoing_id IS NULL OR incoming_id IS NULL THEN
                CONTINUE;
            END IF;

            SELECT field_slot INTO outgoing_slot
            FROM matches_players
            WHERE id = outgoing_id AND field_status = 'EN_CANCHA';

            IF outgoing_slot IS NULL THEN
                CONTINUE;
            END IF;

            UPDATE matches_players
            SET field_status = 'EN_BANCO', field_slot = NULL
            WHERE id = outgoing_id;
            UPDATE matches_players
            SET field_status = 'EN_CANCHA', field_slot = outgoing_slot
            WHERE id = incoming_id;
        END LOOP;
    END LOOP;
END $$;
