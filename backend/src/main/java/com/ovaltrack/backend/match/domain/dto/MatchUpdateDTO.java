package com.ovaltrack.backend.match.domain.dto;

import java.time.LocalDateTime;

import com.ovaltrack.backend.match.domain.MatchStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MatchUpdateDTO(
    @NotNull(message = "La fecha del partido es obligatoria")
    LocalDateTime date,

    @NotBlank(message = "El nombre del equipo rival es obligatorio")
    String opponent,  //TODO: debate whether to change opponent

    @NotNull(message = "El estado del partido es obligatorio")
    MatchStatus status
) {
}