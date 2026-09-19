package com.ovaltrack.backend.event.domain.dto;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import com.ovaltrack.backend.event.domain.EventCategory;

public record EventTypeResponseDTO(
    UUID id,

    String name,

    String groupName,

    EventCategory category,

    boolean affectsPossession,

    boolean isScoring,

    Integer points,

    boolean requiresPlayer,

    Map<String,Object> templateEventFields,
    
    LocalDateTime createdAt
) {
}
