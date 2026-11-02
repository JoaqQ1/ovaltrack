package com.ovaltrack.backend.zone.domain.dto;

import java.util.UUID;

public record ZoneAssignmentResponseDTO(
        UUID id,
        UUID matchId,
        Integer period,
        Integer startMinute,
        Integer endMinute,
        Integer row,
        Integer col) {
}
