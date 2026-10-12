package com.ovaltrack.backend.event.domain.dto.event;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import com.ovaltrack.backend.event.domain.EventPossession;

public record MatchTimelineEventResponseDTO(
        UUID id,
        UUID eventTypeId,
        String eventTypeName,
        UUID playerId,
        String playerName,
        Integer playerJerseyNumber,
        Integer matchTime,
        LocalDateTime realTime,
        Integer period,
        EventPossession teamPossession,
        String origin,
        Map<String, Object> attributes
) {
}
