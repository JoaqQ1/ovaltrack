package com.ovaltrack.backend.division.domain.dto.divisioncoachdto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record DivisionCoachCreationDTO(
        @NotNull UUID userId
) {
}