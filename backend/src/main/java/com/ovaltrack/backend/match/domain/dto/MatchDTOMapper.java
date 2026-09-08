package com.ovaltrack.backend.match.domain.dto;

import com.ovaltrack.backend.match.domain.Match;

public final class MatchDTOMapper {

    private MatchDTOMapper() {
    }

    public static MatchResponseDTO toResponseDTO(Match match) {
        if (match == null) {
            return null;
        }

        return new MatchResponseDTO(
                match.getId(),
                match.getDate(),
                match.getDivision() == null ? null : match.getDivision().getId(),
                match.getOpponent(),
                match.getStatus()
        );
    }
}