package com.ovaltrack.backend.division.domain.dto.divisiondto;

import com.ovaltrack.backend.division.domain.AgeCategory;
import com.ovaltrack.backend.division.domain.Gender;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record DivisionCreationDTO(
    UUID clubId,

    @NotBlank(message = "El nombre de la division es obligatorio")
    String name,

    @NotNull(message = "La categoria del club es obligatoria")
    AgeCategory ageCategory,

    @NotNull(message = "El genero de la division es obligatorio")
    Gender gender
) {
}
