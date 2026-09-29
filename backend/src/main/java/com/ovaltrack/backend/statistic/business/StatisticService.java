package com.ovaltrack.backend.statistic.business;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ovaltrack.backend.common.config.exceptions.EntityNotFoundException;
import com.ovaltrack.backend.event.domain.Event;
import com.ovaltrack.backend.event.repository.EventRepository;
import com.ovaltrack.backend.match.business.MatchService;
import com.ovaltrack.backend.match.domain.Match;
import com.ovaltrack.backend.statistic.business.strategy.PeriodStatisticStrategy;
import com.ovaltrack.backend.statistic.domain.dto.PeriodStatisticDTO;

import lombok.RequiredArgsConstructor;

/**
 * Servicio orquestador para el cálculo de estadísticas de partido y período.
 * Delega los cálculos específicos de dominio a las estrategias inyectadas (SRP y OCP).
 */
@Service
@RequiredArgsConstructor
public class StatisticService {

    private final EventRepository eventRepository;
    private final MatchService matchService;
    private final List<PeriodStatisticStrategy> strategies;

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

        PeriodStatisticDTO.Builder builder = PeriodStatisticDTO.builder()
                .matchId(matchId)
                .period(period);

        strategies.forEach(strategy -> strategy.calculate(periodEvents, builder));

        return builder.build();
    }
}
