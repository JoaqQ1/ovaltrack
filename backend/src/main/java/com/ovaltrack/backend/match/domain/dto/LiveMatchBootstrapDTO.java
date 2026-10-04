package com.ovaltrack.backend.match.domain.dto;

import java.util.Collection;

import com.ovaltrack.backend.event.domain.dto.EventTypeResponseDTO;
import com.ovaltrack.backend.event.domain.dto.event.EventResponseDTO;

public record LiveMatchBootstrapDTO(
    MatchResponseDTO match,
    Collection<EventResponseDTO> events,
    Collection<EventTypeResponseDTO> eventTypes
) {
}
