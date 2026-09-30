package com.ovaltrack.backend.statistic.business.strategy;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.ovaltrack.backend.event.domain.Event;
import com.ovaltrack.backend.event.domain.EventPossession;
import com.ovaltrack.backend.event.domain.EventType;
import com.ovaltrack.backend.statistic.domain.dto.PeriodStatisticDTO;

@DisplayName("Tests Unitarios de Estrategias de Estadísticas")
class StrategyUnitTests {

    private Event createEvent(String eventTypeName, EventPossession possession) {
        EventType eventType = new EventType();
        eventType.setName(eventTypeName);

        Event event = new Event();
        event.setId(UUID.randomUUID());
        event.setEventType(eventType);
        event.setTeamPossession(possession);
        event.setActive(true);
        event.setPeriod(1);
        return event;
    }

    @Nested
    @DisplayName("ScoreStatisticStrategy")
    class ScoreStrategyTests {
        private final ScoreStatisticStrategy strategy = new ScoreStatisticStrategy();

        @Test
        @DisplayName("Calcula puntos y conteos para equipo propio y rival")
        void shouldCalculateScoreAccurately() {
            List<Event> events = List.of(
                createEvent("Try", EventPossession.OWN),               // +5 own
                createEvent("Conversión", EventPossession.OWN),        // +2 own
                createEvent("Penal a los palos", EventPossession.OWN), // +3 own
                createEvent("Drop gol", EventPossession.OWN),          // +3 own
                createEvent("Try", EventPossession.OPPONENT),          // +5 opp
                createEvent("Penal a los palos", EventPossession.OPPONENT) // +3 opp
            );

            PeriodStatisticDTO.Builder builder = PeriodStatisticDTO.builder();
            strategy.calculate(events, builder);
            PeriodStatisticDTO dto = builder.build();

            assertEquals(13, dto.ownScore());
            assertEquals(1, dto.ownTries());
            assertEquals(1, dto.ownConversions());
            assertEquals(1, dto.ownPenalties());
            assertEquals(1, dto.ownDropGoals());

            assertEquals(8, dto.opponentScore());
            assertEquals(1, dto.opponentTries());
            assertEquals(0, dto.opponentConversions());
            assertEquals(1, dto.opponentPenalties());
            assertEquals(0, dto.opponentDropGoals());
        }
    }

    @Nested
    @DisplayName("TackleStatisticStrategy")
    class TackleStrategyTests {
        private final TackleStatisticStrategy strategy = new TackleStatisticStrategy();

        @Test
        @DisplayName("Calcula efectividad defensiva con porcentaje redondeado")
        void shouldCalculateTackleEffectiveness() {
            List<Event> events = List.of(
                createEvent("Tackle completado", EventPossession.OWN),
                createEvent("Tackle completado", EventPossession.OWN),
                createEvent("Tackle completado", EventPossession.OWN),
                createEvent("Tackle fallado", EventPossession.OWN)
            );

            PeriodStatisticDTO.Builder builder = PeriodStatisticDTO.builder();
            strategy.calculate(events, builder);
            PeriodStatisticDTO dto = builder.build();

            assertEquals(3, dto.ownTacklesCompleted());
            assertEquals(1, dto.ownTacklesMissed());
            assertEquals(75.0, dto.ownTackleEffectiveness());
        }

        @Test
        @DisplayName("Efectividad es 0.0 cuando no hay tackles registrados")
        void shouldReturnZeroEffectivenessWhenNoTackles() {
            PeriodStatisticDTO.Builder builder = PeriodStatisticDTO.builder();
            strategy.calculate(List.of(), builder);
            PeriodStatisticDTO dto = builder.build();

            assertEquals(0, dto.ownTacklesCompleted());
            assertEquals(0, dto.ownTacklesMissed());
            assertEquals(0.0, dto.ownTackleEffectiveness());
        }
    }

    @Nested
    @DisplayName("TurnoverStatisticStrategy")
    class TurnoverStrategyTests {
        private final TurnoverStatisticStrategy strategy = new TurnoverStatisticStrategy();

        @Test
        @DisplayName("Calcula turnovers ganados y perdidos")
        void shouldCalculateTurnovers() {
            List<Event> events = List.of(
                createEvent("Turnover", EventPossession.OWN),
                createEvent("Turnover", EventPossession.OWN),
                createEvent("Turnover", EventPossession.OPPONENT)
            );

            PeriodStatisticDTO.Builder builder = PeriodStatisticDTO.builder();
            strategy.calculate(events, builder);
            PeriodStatisticDTO dto = builder.build();

            assertEquals(2, dto.ownTurnoversWon());
            assertEquals(1, dto.ownTurnoversLost());
        }
    }

    @Nested
    @DisplayName("DisciplineStatisticStrategy")
    class DisciplineStrategyTests {
        private final DisciplineStatisticStrategy strategy = new DisciplineStatisticStrategy();

        @Test
        @DisplayName("Calcula penales concedidos, tarjetas amarillas y rojas")
        void shouldCalculateDiscipline() {
            List<Event> events = List.of(
                createEvent("Penal / infracción", EventPossession.OWN),
                createEvent("Amonestación", EventPossession.OWN),
                createEvent("Penal / infracción", EventPossession.OPPONENT),
                createEvent("Expulsión", EventPossession.OPPONENT)
            );

            PeriodStatisticDTO.Builder builder = PeriodStatisticDTO.builder();
            strategy.calculate(events, builder);
            PeriodStatisticDTO dto = builder.build();

            assertEquals(1, dto.ownPenaltiesConceded());
            assertEquals(1, dto.ownYellowCards());
            assertEquals(0, dto.ownRedCards());

            assertEquals(1, dto.opponentPenaltiesConceded());
            assertEquals(0, dto.opponentYellowCards());
            assertEquals(1, dto.opponentRedCards());
        }
    }

    @Nested
    @DisplayName("SetPieceStatisticStrategy")
    class SetPieceStrategyTests {
        private final SetPieceStatisticStrategy strategy = new SetPieceStatisticStrategy();

        @Test
        @DisplayName("Calcula scrums y line-outs totales")
        void shouldCalculateSetPieces() {
            List<Event> events = List.of(
                createEvent("Scrum", EventPossession.OWN),
                createEvent("Scrum", EventPossession.OPPONENT),
                createEvent("Line-out", EventPossession.OWN)
            );

            PeriodStatisticDTO.Builder builder = PeriodStatisticDTO.builder();
            strategy.calculate(events, builder);
            PeriodStatisticDTO dto = builder.build();

            assertEquals(2, dto.scrumsTotal());
            assertEquals(1, dto.lineoutsTotal());
        }
    }

    @Nested
    @DisplayName("PossessionStatisticStrategy")
    class PossessionStrategyTests {
        private final PossessionStatisticStrategy strategy = new PossessionStatisticStrategy();

        @Test
        @DisplayName("Calcula posesión porcentual")
        void shouldCalculatePossessionPercentage() {
            List<Event> events = List.of(
                createEvent("Try", EventPossession.OWN),
                createEvent("Try", EventPossession.OWN),
                createEvent("Try", EventPossession.OWN),
                createEvent("Try", EventPossession.OPPONENT)
            );

            PeriodStatisticDTO.Builder builder = PeriodStatisticDTO.builder();
            strategy.calculate(events, builder);
            PeriodStatisticDTO dto = builder.build();

            assertEquals(75.0, dto.ownPossessionPercentage());
        }

        @Test
        @DisplayName("Posesión por defecto es 50.0% cuando no hay eventos")
        void shouldDefaultToFiftyPercentWhenNoEvents() {
            PeriodStatisticDTO.Builder builder = PeriodStatisticDTO.builder();
            strategy.calculate(List.of(), builder);
            PeriodStatisticDTO dto = builder.build();

            assertEquals(50.0, dto.ownPossessionPercentage());
        }
    }
}
