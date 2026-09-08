package com.ovaltrack.backend.club.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ClubCreationDTO(

    @NotBlank 
    String name,
    @NotNull
    UUID adminUserId,
    String city,
    String logoUrl,
    String contactEmail,
    String contactPhone
) {
}
