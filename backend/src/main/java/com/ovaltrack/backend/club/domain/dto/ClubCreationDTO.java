package com.ovaltrack.backend.club.domain.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ClubCreationDTO(
    @NotBlank(message = "El nombre del club es obligatorio")
    String name,

    @NotNull(message = "El ID del usuario a cargo del club es obligatorio")
    UUID adminUserId,

    @NotBlank (message = "La ciudad del club es obligatoria")
    String city,

    String logoUrl,

    @Email(message = "Formato de email de contacto inválido")
    String contactEmail,

    String contactPhone
) {
}
