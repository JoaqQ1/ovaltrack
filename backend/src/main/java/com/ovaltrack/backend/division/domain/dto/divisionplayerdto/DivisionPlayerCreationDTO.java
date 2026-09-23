package com.ovaltrack.backend.division.domain.dto.divisionplayerdto;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DivisionPlayerCreationDTO(
        @NotNull(message = "El ID de la division es obligatorio")
        UUID divisionId,
        
        UUID personId,

        String firstName,

        String lastName,

        LocalDate birthDate,

        String contactEmail,

        String contactPhone,
        
        Integer jerseyNumber,

        @NotBlank(message = "La posicion del jugador es obligatoria")
        String position
) {
}
