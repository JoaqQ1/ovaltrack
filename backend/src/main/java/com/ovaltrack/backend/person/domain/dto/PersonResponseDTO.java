package com.ovaltrack.backend.person.domain.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record PersonResponseDTO(
    UUID id,
    String firstName,
    String lastName,
    LocalDate birthDate,
    String contactEmail,
    String contactPhone,
    LocalDateTime createdAt
) {
}
