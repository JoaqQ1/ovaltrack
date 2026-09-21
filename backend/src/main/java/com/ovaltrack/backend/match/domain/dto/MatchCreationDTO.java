package com.ovaltrack.backend.match.domain.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MatchCreationDTO(
    @NotNull(message = "El ID de la division asociada al partido es obligatorio")
    UUID divisionId,

    @NotNull(message = "La fecha del partido es obligatoria")
    LocalDateTime date,

    @NotBlank(message = "El nombre del equipo rival es obligatorio")
    String opponent

) {
}