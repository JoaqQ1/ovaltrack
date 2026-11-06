-- Adds permanent match roster numbers without changing historical event contracts.
ALTER TABLE match_players
    ADD COLUMN IF NOT EXISTS number integer;

ALTER TABLE match_players
    ADD COLUMN IF NOT EXISTS field_status varchar(32);

ALTER TABLE match_players
    ADD COLUMN IF NOT EXISTS field_slot integer;

UPDATE match_players
SET number = COALESCE(number, slot_order + 1)
WHERE number IS NULL;

UPDATE match_players
SET field_status = COALESCE(
        field_status,
        CASE WHEN role = 'TITULAR' THEN 'EN_CANCHA' ELSE 'EN_BANCO' END
    ),
    field_slot = CASE
        WHEN role = 'TITULAR' THEN COALESCE(field_slot, slot_order + 1)
        ELSE NULL
    END;

ALTER TABLE match_players
    ALTER COLUMN number SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_match_players_match_number
    ON match_players (match_id, number);
