package com.ovaltrack.backend.division.domain.dto.divisioncoachdto;

import java.util.UUID;
import jakarta.validation.constraints.NotNull;

public record DivisionCoachCreationDTO(
        @NotNull(message = "El ID de la division es obligatorio")
        UUID divisionId,

        @NotNull(message = "El ID de la persona a asociar es obligatorio")
        UUID personId
) {
}