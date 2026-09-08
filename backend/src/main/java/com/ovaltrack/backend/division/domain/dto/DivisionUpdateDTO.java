package com.ovaltrack.backend.division.domain.dto;

import com.ovaltrack.backend.division.domain.AgeCategory;
import com.ovaltrack.backend.division.domain.Gender;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record DivisionUpdateDTO(
	@NotNull 
    UUID divisionId,

    @NotBlank 
    String name,
	
    @NotNull
    AgeCategory ageCategory,
	
    @NotNull
    Gender gender
) {
}