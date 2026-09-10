package com.ovaltrack.backend.division.domain.dto.divisionplayerdto;

import java.util.UUID;
import jakarta.validation.constraints.NotNull;

public record DivisionPlayerCreationDTO(
        @NotNull UUID divisionId,
        @NotNull UUID personId,
        Integer jerseyNumber,
        String position) {
}