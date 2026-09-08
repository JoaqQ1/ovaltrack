package com.ovaltrack.backend.division.domain.dto.divisiondto;

import com.ovaltrack.backend.division.domain.AgeCategory;
import com.ovaltrack.backend.division.domain.Gender;

public record DivisionUpdateDTO(
    String name,
    AgeCategory ageCategory,
    Gender gender
) {
}