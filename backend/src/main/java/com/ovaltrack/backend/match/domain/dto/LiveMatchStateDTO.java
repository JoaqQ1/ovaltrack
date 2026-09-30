package com.ovaltrack.backend.match.domain.dto;

import com.ovaltrack.backend.event.domain.EventPossession;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record LiveMatchStateDTO(
    @NotNull
    @Min(0)
    Integer clockElapsedSeconds,

    @NotNull
    Boolean clockPaused,

    @NotNull
    EventPossession currentPossession,

    @NotNull
    @Min(0)
    Integer homeScore,

    @NotNull
    @Min(0)
    Integer awayScore
) {
}
