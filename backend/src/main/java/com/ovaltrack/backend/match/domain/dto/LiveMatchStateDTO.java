package com.ovaltrack.backend.match.domain.dto;

import com.ovaltrack.backend.event.domain.EventPossession;
import jakarta.validation.constraints.NotNull;

public record LiveMatchStateDTO(
    @NotNull
    Integer clockElapsedSeconds,

    @NotNull
    Boolean clockPaused,

    @NotNull
    EventPossession currentPossession
) {
}
