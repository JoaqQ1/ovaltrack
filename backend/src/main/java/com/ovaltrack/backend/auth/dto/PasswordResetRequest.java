package com.ovaltrack.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record PasswordResetRequest(
    @NotBlank(message = "El email no puede estar vacío") 
    @Email(message = "El formato del email es inválido")
    String email
) {

}
