package com.ovaltrack.backend.match.domain.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.ovaltrack.backend.match.domain.MatchStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MatchCreationDTO(
    @NotNull 
    LocalDateTime date,

    @NotNull
    UUID divisionId,

    @NotBlank
    String opponent

    //@NotNull
    //MatchStatus status
) {
}