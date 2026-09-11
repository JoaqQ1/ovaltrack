package com.ovaltrack.backend.user.domain.dto;

import com.ovaltrack.backend.user.domain.UserRole;
import jakarta.validation.constraints.NotNull;

public record UserRoleUpdateDTO(
    @NotNull(message = "El rol es obligatorio")
    UserRole role
) {
}
