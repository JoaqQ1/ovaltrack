package com.ovaltrack.backend.person.domain.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;

import java.time.LocalDate;

public record PersonUpdateDTO(
    @NotBlank(message = "El nombre es obligatorio")
    String firstName,

    @NotBlank(message = "El apellido es obligatorio")
    String lastName,

    @Past(message = "La fecha de nacimiento debe ser en el pasado")
    LocalDate birthDate,

    @Email(message = "Formato de email de contacto inválido")
    String contactEmail,

    String contactPhone
) {
}
