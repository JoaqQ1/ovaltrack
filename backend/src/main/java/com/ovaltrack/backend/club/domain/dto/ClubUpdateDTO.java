package com.ovaltrack.backend.club.domain.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ClubUpdateDTO(
    @NotBlank(message = "El nombre del club es obligatorio")
    String name,
    
    @NotBlank (message = "La ciudad del club es obligatoria")
    String city,

    String logoUrl,

    @Email(message = "Formato de email de contacto inválido")
    String contactEmail,
    
    String contactPhone
) {
}
