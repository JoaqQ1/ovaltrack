package com.ovaltrack.backend.match.domain.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.ovaltrack.backend.match.domain.MatchPlayerRole;

public record PlayerMatchResponseDTO(
    UUID matchId,
    LocalDateTime date,
    String opponentName,
    String divisionName,
    Integer homeScore,
    Integer awayScore,
    MatchPlayerRole role
) {
}
