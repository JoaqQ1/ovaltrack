package com.ovaltrack.backend.club.domain.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ClubUpdateDTO(
    @NotNull 
    UUID clubId,
    String name,
    String city,
    String logoUrl,
    String contactEmail,
    String contactPhone
) {
}
