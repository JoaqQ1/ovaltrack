package com.ovaltrack.backend.zone.business;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;

import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.match.domain.Match;
import com.ovaltrack.backend.match.domain.MatchStatus;
import com.ovaltrack.backend.zone.domain.ZoneAssignment;
import com.ovaltrack.backend.zone.domain.dto.ZoneAssignmentCreationDTO;

@DisplayName("ZoneAssignmentValidator: reglas de negocio de las zonas por período")
class ZoneAssignmentValidatorTest {

    private final ZoneAssignmentValidator validator = new ZoneAssignmentValidator();

    private static ZoneAssignmentCreationDTO request(int row, int col, int period, int start, int end) {
        return new ZoneAssignmentCreationDTO(row, col, period, start, end);
    }

    private static ZoneAssignment existing(UUID id, int period, int start, int end) {
        ZoneAssignment zone = new ZoneAssignment();
        zone.setId(id);
        zone.setPeriod(period);
        zone.setStartMinute(start);
        zone.setEndMinute(end);
        zone.setRow(1);
        zone.setCol(1);
        return zone;
    }

    @Nested
    @DisplayName("Estado del partido")
    class MatchStatusRules {

        @Test
        @DisplayName("Un partido FINISHED permite editar zonas")
        void shouldAllowFinishedMatch() {
            Match match = new Match();
            match.setStatus(MatchStatus.FINISHED);

            assertDoesNotThrow(() -> validator.validateMatchEditable(match));
        }

        @ParameterizedTest
        @EnumSource(value = MatchStatus.class, names = "FINISHED", mode = EnumSource.Mode.EXCLUDE)
        @DisplayName("Cualquier estado distinto de FINISHED se rechaza")
        void shouldRejectNotFinishedMatch(MatchStatus status) {
            Match match = new Match();
            match.setStatus(status);

            assertThrows(BusinessException.class, () -> validator.validateMatchEditable(match));
        }
    }

    @Nested
    @DisplayName("Rango de minutos y celda")
    class RangeAndCellRules {

        @Test
        @DisplayName("Una asignación válida del primer tiempo se acepta")
        void shouldAcceptValidFirstHalf() {
            assertDoesNotThrow(() -> validator.validate(request(2, 3, 1, 10, 25), List.of(), null));
        }

        @Test
        @DisplayName("Una asignación válida del segundo tiempo se acepta")
        void shouldAcceptValidSecondHalf() {
            assertDoesNotThrow(() -> validator.validate(request(3, 6, 2, 40, 80), List.of(), null));
        }

        static Stream<Arguments> invalidRanges() {
            return Stream.of(
                    Arguments.of(1, 20, 10),  // inicio mayor que fin
                    Arguments.of(1, 10, 10),  // rango vacío
                    Arguments.of(1, -5, 10),  // minuto negativo
                    Arguments.of(1, 30, 45),  // el 1T no supera el minuto 40
                    Arguments.of(2, 30, 50),  // el 2T no empieza antes del minuto 40
                    Arguments.of(2, 60, 85),  // el 2T no supera el minuto 80
                    Arguments.of(3, 10, 20),  // período inexistente
                    Arguments.of(0, 10, 20)); // período inexistente
        }

        @ParameterizedTest
        @MethodSource("invalidRanges")
        @DisplayName("Los rangos inválidos se rechazan")
        void shouldRejectInvalidRanges(int period, int start, int end) {
            assertThrows(BusinessException.class,
                    () -> validator.validate(request(2, 3, period, start, end), List.of(), null));
        }

        static Stream<Arguments> invalidCells() {
            return Stream.of(
                    Arguments.of(0, 1),
                    Arguments.of(4, 1),
                    Arguments.of(1, 0),
                    Arguments.of(1, 7));
        }

        @ParameterizedTest
        @MethodSource("invalidCells")
        @DisplayName("Las celdas fuera de la grilla 3x6 se rechazan")
        void shouldRejectCellsOutsideTheGrid(int row, int col) {
            assertThrows(BusinessException.class,
                    () -> validator.validate(request(row, col, 1, 10, 25), List.of(), null));
        }
    }

    @Nested
    @DisplayName("Solapamientos")
    class OverlapRules {

        @Test
        @DisplayName("Un rango que se solapa con otro del mismo período se rechaza")
        void shouldRejectOverlapInSamePeriod() {
            List<ZoneAssignment> others = List.of(existing(UUID.randomUUID(), 1, 10, 25));

            assertThrows(BusinessException.class,
                    () -> validator.validate(request(1, 1, 1, 20, 30), others, null));
        }

        @Test
        @DisplayName("El mensaje del solape nombra el tramo en conflicto")
        void shouldNameTheConflictingSegmentInTheMessage() {
            List<ZoneAssignment> others = List.of(existing(UUID.randomUUID(), 1, 10, 25));

            BusinessException error = assertThrows(BusinessException.class,
                    () -> validator.validate(request(1, 1, 1, 20, 30), others, null));

            assertTrue(error.getMessage().contains("1T 10'–25'"), error.getMessage());
        }

        @Test
        @DisplayName("Un rango contenido dentro de otro se rechaza")
        void shouldRejectContainedRange() {
            List<ZoneAssignment> others = List.of(existing(UUID.randomUUID(), 1, 0, 40));

            assertThrows(BusinessException.class,
                    () -> validator.validate(request(1, 1, 1, 10, 20), others, null));
        }

        @Test
        @DisplayName("Rangos contiguos no se consideran solapados")
        void shouldAcceptAdjacentRanges() {
            List<ZoneAssignment> others = List.of(existing(UUID.randomUUID(), 1, 10, 25));

            assertDoesNotThrow(() -> validator.validate(request(1, 1, 1, 25, 40), others, null));
        }

        @Test
        @DisplayName("El mismo rango en otro período es válido")
        void shouldAcceptSameRangeInDifferentPeriod() {
            List<ZoneAssignment> others = List.of(existing(UUID.randomUUID(), 1, 30, 40));

            assertDoesNotThrow(() -> validator.validate(request(1, 1, 2, 40, 60), others, null));
        }

        @Test
        @DisplayName("Al editar, la asignación no se solapa consigo misma")
        void shouldIgnoreTheAssignmentBeingEdited() {
            UUID editedId = UUID.randomUUID();
            List<ZoneAssignment> others = List.of(existing(editedId, 1, 10, 25));

            assertDoesNotThrow(() -> validator.validate(request(3, 5, 1, 10, 25), others, editedId));
        }

        @Test
        @DisplayName("Al editar, sí se rechaza el solape con otra asignación")
        void shouldRejectOverlapWithAnotherWhenEditing() {
            UUID editedId = UUID.randomUUID();
            List<ZoneAssignment> others = List.of(
                    existing(UUID.randomUUID(), 1, 0, 10),
                    existing(editedId, 1, 10, 20));

            assertThrows(BusinessException.class,
                    () -> validator.validate(request(1, 1, 1, 5, 20), others, editedId));
        }
    }
}
