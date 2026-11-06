package com.ovaltrack.backend.match.domain.dto;

import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;

public record MatchRosterEntryDTO(
        UUID playerId,
        JsonNode number
) {
}
