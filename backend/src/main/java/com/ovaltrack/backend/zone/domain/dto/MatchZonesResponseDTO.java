package com.ovaltrack.backend.zone.domain.dto;

import java.util.List;

public record MatchZonesResponseDTO(List<ZoneAssignmentResponseDTO> assignments, ZoneSummaryDTO summary) {
}
