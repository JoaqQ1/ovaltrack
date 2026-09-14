package com.ovaltrack.backend.division.domain.dto.divisionplayerdto;

import jakarta.validation.constraints.NotBlank;

public record DivisionPlayerUpdateDTO(
    Integer jerseyNumber,
    
    @NotBlank(message = "La posicion de la persona es obligatoria")
    String position
) {
}