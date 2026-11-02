package com.ovaltrack.backend.event.domain.dto.event;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import com.ovaltrack.backend.event.domain.EventPossession;
import com.ovaltrack.backend.zone.domain.ZoneCell;

public record MatchTimelineEventResponseDTO(
        UUID id,
        UUID eventTypeId,
        String eventTypeName,
        UUID playerId,
        String playerName,
        Integer playerJerseyNumber,
        Integer matchTime,
        Integer absoluteMatchTime,
        LocalDateTime realTime,
        Integer period,
        EventPossession teamPossession,
        String origin,
        Map<String, Object> attributes,
        String note,
        ZoneCell zone
) {

    /** Copia del evento con la zona derivada de las asignaciones del partido (null = sin zona). */
    public MatchTimelineEventResponseDTO withZone(ZoneCell zone) {
        return new MatchTimelineEventResponseDTO(id, eventTypeId, eventTypeName, playerId, playerName,
                playerJerseyNumber, matchTime, absoluteMatchTime, realTime, period, teamPossession, origin,
                attributes, note, zone);
    }
}
