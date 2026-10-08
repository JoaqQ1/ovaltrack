package com.ovaltrack.backend.event.domain.dto;

import com.ovaltrack.backend.event.domain.Event;
import com.ovaltrack.backend.event.domain.EventType;
import com.ovaltrack.backend.event.domain.dto.event.EventResponseDTO;
import com.ovaltrack.backend.event.domain.dto.event.MatchTimelineEventResponseDTO;

public final class EventDTOMapper {

    private EventDTOMapper() {
    }

    public static EventResponseDTO toResponseDTO(Event event) {
        if (event == null) {
            return null;
        }

        return new EventResponseDTO(
                event.getId(),
                event.getClientEventId(),
                event.getEventType() == null ? null : event.getEventType().getId(),
                event.getMatch() == null ? null : event.getMatch().getId(),
                event.getPlayer() == null ? null : event.getPlayer().getId(),
                event.getTeamPossession(),
                event.getMatchTime(),
                event.getAbsoluteMatchTime(),
                event.getRealTime(),
                event.getPeriod(),
                event.getOrigin(),
                event.getAttributes(),
                event.getCreatedAt(),
                event.getSynchronizedAt());
    }

    public static EventTypeResponseDTO toResponseDTO(EventType eventType) {
        if (eventType == null) {
            return null;
        }

        return new EventTypeResponseDTO(
                eventType.getId(),
                eventType.getName(),
                eventType.getGroupName(),
                eventType.getCategory(),
                Boolean.TRUE.equals(eventType.getAffectsPossession()),
                Boolean.TRUE.equals(eventType.getIsScoring()),
                eventType.getPoints(),
                Boolean.TRUE.equals(eventType.getRequiresPlayer()),
                eventType.getTemplateEventFields());
    }

    public static MatchTimelineEventResponseDTO toTimelineResponseDTO(Event event) {
        if (event == null) {
            return null;
        }

        String eventTypeName = event.getEventType() != null ? event.getEventType().getName() : null;
        String playerName = null;
        if (event.getPlayer() != null) {
            playerName = (event.getPlayer().getFirstName() + " " + event.getPlayer().getLastName()).trim();
        }

        return new MatchTimelineEventResponseDTO(
                event.getId(),
                event.getEventType() != null ? event.getEventType().getId() : null,
                eventTypeName,
                event.getPlayer() != null ? event.getPlayer().getId() : null,
                playerName,
                null,
                event.getMatchTime(),
                event.getRealTime(),
                event.getPeriod(),
                event.getTeamPossession());
    }
}