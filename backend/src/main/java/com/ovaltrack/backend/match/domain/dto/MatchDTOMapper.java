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
                match.getStatus(),
                match.getCurrentPeriod() != null ? match.getCurrentPeriod() : 1,
                match.getClockElapsedSeconds() != null ? match.getClockElapsedSeconds() : 0,
                match.getClockPaused() != null ? match.getClockPaused() : true,
                match.getClockUpdatedAt(),
                match.getCurrentPossession(),
                match.getHomeScore() != null ? match.getHomeScore() : 0,
                match.getAwayScore() != null ? match.getAwayScore() : 0,
                match.getStartedAt(),
                match.getFinishedAt()
        );
    }
}