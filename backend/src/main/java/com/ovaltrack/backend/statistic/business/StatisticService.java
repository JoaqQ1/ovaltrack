package com.ovaltrack.backend.statistic.business;

import java.util.Collection;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ovaltrack.backend.common.config.exceptions.EntityNotFoundException;
import com.ovaltrack.backend.event.domain.Event;
import com.ovaltrack.backend.event.domain.EventPossession;
import com.ovaltrack.backend.event.repository.EventRepository;
import com.ovaltrack.backend.match.business.MatchService;
import com.ovaltrack.backend.match.domain.Match;
import com.ovaltrack.backend.statistic.domain.dto.PeriodStatisticDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StatisticService {

    private final EventRepository eventRepository;
    private final MatchService matchService;

    @Transactional(readOnly = true)
    public PeriodStatisticDTO calculatePeriodStatistics(UUID matchId, Integer period) {
        Match match = matchService.findMatchEntityById(matchId);
        if (match == null) {
            throw new EntityNotFoundException("Partido no encontrado");
        }

        Collection<Event> allEvents = eventRepository.findEventsByMatchId(matchId);
        Collection<Event> periodEvents = (period != null)
                ? allEvents.stream().filter(e -> period.equals(e.getPeriod()) && !Boolean.FALSE.equals(e.getActive())).toList()
                : allEvents.stream().filter(e -> !Boolean.FALSE.equals(e.getActive())).toList();

        int ownScore = 0;
        int opponentScore = 0;
        int ownTries = 0;
        int opponentTries = 0;
        int ownConversions = 0;
        int opponentConversions = 0;
        int ownPenalties = 0;
        int opponentPenalties = 0;
        int ownDropGoals = 0;
        int opponentDropGoals = 0;
        int ownTacklesCompleted = 0;
        int ownTacklesMissed = 0;
        int ownTurnoversWon = 0;
        int ownTurnoversLost = 0;
        int ownPenaltiesConceded = 0;
        int opponentPenaltiesConceded = 0;
        int ownYellowCards = 0;
        int opponentYellowCards = 0;
        int ownRedCards = 0;
        int opponentRedCards = 0;
        int scrumsTotal = 0;
        int lineoutsTotal = 0;

        int ownPossessionCount = 0;
        int opponentPossessionCount = 0;

        for (Event event : periodEvents) {
            String typeName = event.getEventType() != null ? event.getEventType().getName() : "";
            EventPossession possession = event.getTeamPossession();

            if (possession == EventPossession.OWN) {
                ownPossessionCount++;
            } else if (possession == EventPossession.OPPONENT) {
                opponentPossessionCount++;
            }

            switch (typeName) {
                case "Try" -> {
                    if (possession == EventPossession.OWN) {
                        ownTries++;
                        ownScore += 5;
                    } else {
                        opponentTries++;
                        opponentScore += 5;
                    }
                }
                case "Penal a los palos" -> {
                    if (possession == EventPossession.OWN) {
                        ownPenalties++;
                        ownScore += 3;
                    } else {
                        opponentPenalties++;
                        opponentScore += 3;
                    }
                }
                case "Drop gol" -> {
                    if (possession == EventPossession.OWN) {
                        ownDropGoals++;
                        ownScore += 3;
                    } else {
                        opponentDropGoals++;
                        opponentScore += 3;
                    }
                }
                case "Tackle completado" -> {
                    if (possession == EventPossession.OWN) {
                        ownTacklesCompleted++;
                    }
                }
                case "Tackle fallado" -> {
                    if (possession == EventPossession.OWN) {
                        ownTacklesMissed++;
                    }
                }
                case "Turnover" -> {
                    if (possession == EventPossession.OWN) {
                        ownTurnoversWon++;
                    } else {
                        ownTurnoversLost++;
                    }
                }
                case "Penal / infracción" -> {
                    if (possession == EventPossession.OWN) {
                        ownPenaltiesConceded++;
                    } else {
                        opponentPenaltiesConceded++;
                    }
                }
                case "Amonestación" -> {
                    if (possession == EventPossession.OWN) {
                        ownYellowCards++;
                    } else {
                        opponentYellowCards++;
                    }
                }
                case "Expulsión" -> {
                    if (possession == EventPossession.OWN) {
                        ownRedCards++;
                    } else {
                        opponentRedCards++;
                    }
                }
                case "Scrum" -> scrumsTotal++;
                case "Line-out" -> lineoutsTotal++;
                default -> {}
            }
        }

        int totalTackles = ownTacklesCompleted + ownTacklesMissed;
        double ownTackleEffectiveness = totalTackles > 0
                ? Math.round(((double) ownTacklesCompleted / totalTackles) * 1000.0) / 10.0
                : 0.0;

        int totalPossession = ownPossessionCount + opponentPossessionCount;
        double ownPossessionPercentage = totalPossession > 0
                ? Math.round(((double) ownPossessionCount / totalPossession) * 1000.0) / 10.0
                : 50.0;

        return new PeriodStatisticDTO(
                matchId,
                period,
                ownScore,
                opponentScore,
                ownTries,
                opponentTries,
                ownConversions,
                opponentConversions,
                ownPenalties,
                opponentPenalties,
                ownDropGoals,
                opponentDropGoals,
                ownTacklesCompleted,
                ownTacklesMissed,
                ownTackleEffectiveness,
                ownTurnoversWon,
                ownTurnoversLost,
                ownPenaltiesConceded,
                opponentPenaltiesConceded,
                ownYellowCards,
                opponentYellowCards,
                ownRedCards,
                opponentRedCards,
                scrumsTotal,
                lineoutsTotal,
                ownPossessionPercentage
        );
    }
}
