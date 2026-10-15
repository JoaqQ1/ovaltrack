package com.ovaltrack.backend.match.domain.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record MatchCreationDTO(
    @NotNull(message = "El ID de la division asociada al partido es obligatorio")
    UUID divisionId,

    @NotNull(message = "La fecha del partido es obligatoria")
    LocalDateTime date,

    @NotNull(message = "El ID del equipo rival es obligatorio")
    UUID opponentId
) {
}