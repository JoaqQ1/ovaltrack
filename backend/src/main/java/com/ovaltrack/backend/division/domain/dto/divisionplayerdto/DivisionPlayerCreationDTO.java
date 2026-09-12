package com.ovaltrack.backend.division.domain.dto.divisionplayerdto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DivisionPlayerCreationDTO(
        @NotNull(message = "El ID de la division es obligatorio")
        UUID divisionId,
        
        @NotNull(message = "El ID de la persona a asociar es obligatorio")
        UUID personId,
        
        Integer jerseyNumber,

        @NotBlank (message = "La posicion del jugador es obligatoria")
        String position
) {
}