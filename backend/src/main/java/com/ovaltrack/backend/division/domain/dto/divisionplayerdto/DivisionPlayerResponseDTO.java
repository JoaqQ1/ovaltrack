package com.ovaltrack.backend.division.domain.dto.divisionplayerdto;

import java.time.LocalDate;
import java.util.UUID;

public record DivisionPlayerResponseDTO(
    UUID id,
    UUID userId,
    UUID divisionId,
    Integer jerseyNumber,
    String position,
    LocalDate startDate,
    LocalDate endDate
) {
}