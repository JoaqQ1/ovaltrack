package com.ovaltrack.backend.event.domain.dto;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import com.ovaltrack.backend.event.domain.EventPossession;

import jakarta.validation.constraints.NotNull;

public record EventCreationDTO(
        @NotNull 
        UUID eventTypeId,
        
        @NotNull
        UUID matchId,
        
        UUID playerId,
        EventPossession teamPossession,
        Integer matchTime,
        LocalDateTime realTime,
        Integer period,
        String origin,
        Map<String, Object> attributes
        //LocalDateTime synchronizedAt
) {
}