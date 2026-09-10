package com.ovaltrack.backend.event.domain.dto;

import com.ovaltrack.backend.event.domain.Event;

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
}