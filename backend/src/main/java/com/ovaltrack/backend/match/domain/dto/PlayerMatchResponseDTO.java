package com.ovaltrack.backend.match.domain.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record PlayerMatchResponseDTO(
    UUID matchId,
    LocalDateTime date,
    String opponentName,
    String divisionName,
    Integer homeScore,
    Integer awayScore
) {
}
