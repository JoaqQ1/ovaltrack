package com.ovaltrack.backend.auth.registration.domain.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.ovaltrack.backend.auth.registration.domain.RegistrationRequestStatus;
import com.ovaltrack.backend.user.domain.UserRole;

public record PendingRegistrationRequestDTO(
        UUID requestId,
        UUID userId,
        String email,
        String firstName,
        String lastName,
        UserRole requestedRole,
        UUID clubId,
        String clubName,
        RegistrationRequestStatus status,
        LocalDateTime createdAt) {
}