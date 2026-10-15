package com.ovaltrack.backend.match.domain.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record MatchUpdateDTO(
    @NotNull(message = "La fecha del partido es obligatoria")
    LocalDateTime date,

    @NotNull(message = "El ID del equipo rival es obligatorio")
    UUID opponentId
) {
}