package com.ovaltrack.backend.event.domain.dto;

import com.ovaltrack.backend.event.domain.Event;
import com.ovaltrack.backend.event.domain.EventType;
import com.ovaltrack.backend.event.domain.dto.event.EventResponseDTO;

public final class EventDTOMapper {

    private EventDTOMapper() {
    }

    public static EventResponseDTO toResponseDTO(Event event) {
        if (event == null) {
            return null;
        }

        return new EventResponseDTO(
                event.getId(),
                event.getEventType() == null ? null : event.getEventType().getId(),
                event.getMatch() == null ? null : event.getMatch().getId(),
                event.getPlayer() == null ? null : event.getPlayer().getId(),
                event.getTeamPossession(),
                event.getMatchTime(),
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
}