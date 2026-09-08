package com.ovaltrack.backend.match.domain.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.ovaltrack.backend.match.domain.MatchStatus;

public record MatchResponseDTO(
    UUID id,
    LocalDateTime date,
    UUID divisionId,
    String opponent,
    MatchStatus status
) {
}