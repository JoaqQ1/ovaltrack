package com.ovaltrack.backend.user.domain.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.ovaltrack.backend.user.domain.UserRole;

public record UserResponseDTO(
    UUID id,
    String email,
    UserRole role,
    Boolean active,
    UUID personId,
    String firstName,
    String lastName,
    LocalDateTime createdAt
) {
}
