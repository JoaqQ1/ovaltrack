package com.ovaltrack.backend.division.domain.dto.divisiondto;

import com.ovaltrack.backend.division.domain.AgeCategory;
import com.ovaltrack.backend.division.domain.Gender;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record DivisionCreationDTO(
    UUID clubId,

    @NotBlank 
    String name,
	
    @NotNull
    AgeCategory ageCategory,
	
    @NotNull
    Gender gender
) {
}
