package com.ovaltrack.backend.auth.registration.domain.dto;

import com.ovaltrack.backend.auth.registration.domain.RegistrationRequest;
import com.ovaltrack.backend.auth.registration.domain.RegistrationRequestStatus;
import com.ovaltrack.backend.user.domain.User;
import com.ovaltrack.backend.user.domain.UserRole;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistrationRequestDTO {

    // Credenciales de usuario
    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El formato del email no es válido")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
    private String password;

    @NotNull(message = "El rol solicitado es obligatorio")
    private UserRole requestedRole;

    // Datos personales del solicitante
    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
    private String applicantFirstName;

    @NotBlank(message = "El apellido es obligatorio")
    @Size(max = 100, message = "El apellido no puede superar los 100 caracteres")
    private String applicantLastName;

    @NotNull(message = "La fecha de nacimiento es obligatoria")
    private LocalDate applicantBirthDate;

    // Datos del club (si aplica por el rol)
    @Size(max = 180, message = "El nombre del club no puede superar los 180 caracteres")
    private String requestedClubName;

    @Size(max = 180, message = "La ciudad del club no puede superar los 180 caracteres")
    private String requestedClubCity;

    @Email(message = "El formato del email de contacto del club no es válido")
    @Size(max = 254, message = "El email no puede superar los 254 caracteres")
    private String requestedClubContactEmail;

    @Size(max = 40, message = "El teléfono no puede superar los 40 caracteres")
    private String requestedClubContactPhone;

    private UUID clubId;

    public static RegistrationRequest createRegistrationRequest(
            User user,
            UserRole requestedRole,
            String applicantFirstName,
            String applicantLastName,
            LocalDate applicantBirthDate,
            String requestedClubName,
            String requestedClubCity,
            String requestedClubContactEmail,
            String requestedClubContactPhone,
            UUID clubId) {
        
        return RegistrationRequest.builder()
                .user(user)
                .requestedRole(requestedRole)
                .applicantFirstName(applicantFirstName)
                .applicantLastName(applicantLastName)
                .applicantBirthDate(applicantBirthDate)
                .requestedClubName(requestedClubName)
                .requestedClubCity(requestedClubCity)
                .requestedClubContactEmail(requestedClubContactEmail)
                .requestedClubContactPhone(requestedClubContactPhone)
                .clubId(clubId)
                .status(RegistrationRequestStatus.PENDING)
                .build();
    }
}