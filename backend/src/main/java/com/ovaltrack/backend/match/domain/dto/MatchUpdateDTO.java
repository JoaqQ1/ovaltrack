package com.ovaltrack.backend.match.domain.dto;

import java.time.LocalDateTime;

import com.ovaltrack.backend.match.domain.MatchStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MatchUpdateDTO(
    @NotNull LocalDateTime date,
    @NotBlank String opponent,  //TODO: debate whether to change opponent
    @NotNull MatchStatus status
) {
}