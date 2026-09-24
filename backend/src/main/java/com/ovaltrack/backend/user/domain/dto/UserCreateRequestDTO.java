package com.ovaltrack.backend.user.domain.dto;

import java.time.LocalDate;
import java.util.UUID;

import com.ovaltrack.backend.user.domain.UserRole;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UserCreateRequestDTO(
    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El formato de email es inválido")
    String email,

    String loginEmail,

    @NotBlank(message = "La contraseña es obligatoria")
    String password,

    @NotNull(message = "El rol es obligatorio")
    UserRole role,

    UUID personId,

    String firstName,

    String lastName,

    LocalDate birthDate,

    UUID clubId,

    Boolean active
) {
    public String getEffectiveEmail() {
        return (email != null && !email.isBlank()) ? email : loginEmail;
    }
}
