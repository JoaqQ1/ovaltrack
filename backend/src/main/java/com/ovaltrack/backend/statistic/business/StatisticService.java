package com.ovaltrack.backend.statistic.business;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ovaltrack.backend.common.config.exceptions.EntityNotFoundException;
import com.ovaltrack.backend.division.business.DivisionSecurityValidator;
import com.ovaltrack.backend.division.business.DivisionService;
import com.ovaltrack.backend.division.domain.Division;
import com.ovaltrack.backend.event.domain.Event;
import com.ovaltrack.backend.event.repository.EventRepository;
import com.ovaltrack.backend.match.business.MatchService;
import com.ovaltrack.backend.match.domain.Match;
import com.ovaltrack.backend.match.repository.MatchRepository;
import com.ovaltrack.backend.statistic.business.strategy.PeriodStatisticStrategy;
import com.ovaltrack.backend.statistic.domain.dto.DivisionMatchStatisticDTO;
import com.ovaltrack.backend.statistic.domain.dto.DivisionStatisticsDTO;
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
    private final MatchRepository matchRepository;
    private final DivisionService divisionService;
    private final DivisionSecurityValidator divisionSecurityValidator;

    /** Rango por defecto del dashboard cuando no se informa "from". */
    private static final int DEFAULT_RANGE_MONTHS = 3;

    @Transactional(readOnly = true)
    public PeriodStatisticDTO calculatePeriodStatistics(UUID matchId, Integer period) {
        Match match = matchService.findMatchEntityById(matchId);
        if (match == null) {
            throw new EntityNotFoundException("Partido no encontrado");
        }

        return calculate(matchId, period);
    }

    /**
     * Estadísticas de los partidos FINALIZADOS de una división dentro de [from, to] (ambos inclusive).
     * Aplica el mismo modelo de permisos que el resto de la división: el entrenador/analista solo accede
     * a divisiones a las que está asociado, el admin de club a las de su club (si no, AccessDeniedException → 403).
     */
    @Transactional(readOnly = true)
    public DivisionStatisticsDTO calculateDivisionStatistics(
            UUID divisionId, LocalDate from, LocalDate to, Authentication authentication) {
        Division division = divisionService.findDivisionEntityById(divisionId);
        if (division == null) {
            throw new EntityNotFoundException("División no encontrada");
        }
        divisionSecurityValidator.validateCanAccessDivision(division, authentication);

        LocalDate effectiveTo = (to != null) ? to : LocalDate.now();
        LocalDate effectiveFrom = (from != null) ? from : effectiveTo.minusMonths(DEFAULT_RANGE_MONTHS);
        if (effectiveFrom.isAfter(effectiveTo)) {
            throw new IllegalArgumentException("El rango de fechas es inválido: 'from' es posterior a 'to'");
        }

        List<DivisionMatchStatisticDTO> matches = matchRepository
                .findFinishedByDivisionIdAndDateRange(
                        divisionId,
                        effectiveFrom.atStartOfDay(),
                        effectiveTo.plusDays(1).atStartOfDay())
                .stream()
                .map(match -> new DivisionMatchStatisticDTO(
                        match.getId(),
                        match.getDate(),
                        match.getOpponent() != null ? match.getOpponent().getName() : null,
                        calculate(match.getId(), null)))
                .toList();

        return new DivisionStatisticsDTO(division.getId(), division.getName(), effectiveFrom, effectiveTo, matches);
    }

    /** Cálculo común: con período filtra ese período; con null, el partido completo. */
    private PeriodStatisticDTO calculate(UUID matchId, Integer period) {
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
