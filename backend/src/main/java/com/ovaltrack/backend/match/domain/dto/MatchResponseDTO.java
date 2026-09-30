package com.ovaltrack.backend.match.domain.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.ovaltrack.backend.match.domain.MatchStatus;
import com.ovaltrack.backend.event.domain.EventPossession;

public record MatchResponseDTO(
    UUID id,
    LocalDateTime date,
    UUID divisionId,
    String opponent,
    MatchStatus status,
    Integer currentPeriod,
    Integer clockElapsedSeconds,
    Boolean clockPaused,
    LocalDateTime clockUpdatedAt,
    EventPossession currentPossession,
    Integer homeScore,
    Integer awayScore,
    LocalDateTime startedAt,
    LocalDateTime finishedAt
) {
}