package com.ovaltrack.backend.division.domain.dto.divisiondto;

import com.ovaltrack.backend.division.domain.AgeCategory;
import com.ovaltrack.backend.division.domain.Gender;

import java.time.LocalDateTime;
import java.util.UUID;

public record DivisionResponseDTO(
	UUID id,
	String name,
	UUID clubId,
	LocalDateTime createdAt,
	AgeCategory ageCategory,
	Gender gender,
	Boolean active
) {
}
