package com.ovaltrack.backend.event.domain.dto.event;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import com.ovaltrack.backend.event.domain.EventPossession;

public record EventUpdateDTO(
        UUID eventTypeId,

        UUID playerId,

        EventPossession teamPossession,

        Integer matchTime,

        Integer absoluteMatchTime,

        //LocalDateTime realTime,

        Integer period,

        String origin,

        Map<String, Object> attributes,
        
        LocalDateTime synchronizedAt
) {
}