package com.ovaltrack.backend.auth.dto;

import com.ovaltrack.backend.user.domain.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record RegistroRequest(
    @NotBlank(message = "El email no puede estar vacío")
    @Email(message = "Formato de email inválido")
    String email,

    @NotBlank(message = "La contraseña no puede estar vacía")
    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    String password,

    @NotBlank(message = "El nombre es obligatorio")
    String firstName,

    @NotBlank(message = "El apellido es obligatorio")
    String lastName,

    @Past(message = "La fecha de nacimiento debe ser en el pasado")
    LocalDate birthDate,

    @NotNull(message = "El rol es obligatorio")
    UserRole role
) {
}