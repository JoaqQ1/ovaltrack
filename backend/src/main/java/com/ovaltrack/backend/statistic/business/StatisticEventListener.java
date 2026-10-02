package com.ovaltrack.backend.statistic.business;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import com.ovaltrack.backend.match.domain.event.MatchPeriodClosedEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class StatisticEventListener {

    private final StatisticService statisticService;

    @EventListener
    public void handleMatchPeriodClosed(MatchPeriodClosedEvent event) {
        log.info("Evento recibido: Cierre de período {} para el partido {}",
                event.periodClosed(), event.matchId());
        statisticService.calculatePeriodStatistics(event.matchId(), event.periodClosed());
    }
}
