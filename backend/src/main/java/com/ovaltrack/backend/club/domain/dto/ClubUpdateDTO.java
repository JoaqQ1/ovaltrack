package com.ovaltrack.backend.club.domain.dto;

import jakarta.validation.constraints.NotBlank;

public record ClubUpdateDTO(
    @NotBlank
    String name,
    String city,
    String logoUrl,
    String contactEmail,
    String contactPhone
) {
}
