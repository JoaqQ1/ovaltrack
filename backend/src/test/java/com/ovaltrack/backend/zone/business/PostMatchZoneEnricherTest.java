package com.ovaltrack.backend.zone.business;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.ovaltrack.backend.event.domain.dto.event.MatchTimelineEventResponseDTO;
import com.ovaltrack.backend.zone.domain.ZoneAssignment;
import com.ovaltrack.backend.zone.domain.ZoneCell;
import com.ovaltrack.backend.zone.repository.ZoneAssignmentRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("PostMatchZoneEnricher: vincula eventos del post-partido con su zona")
class PostMatchZoneEnricherTest {

    @Mock private ZoneAssignmentRepository zoneAssignmentRepository;

    private MatchTimelineEventResponseDTO event(int period, int minute) {
        return new MatchTimelineEventResponseDTO(UUID.randomUUID(), UUID.randomUUID(), "Tackle completado", null, null,
                null, minute * 60, null, null, period, null, "post_capture", null, null, null);
    }

    private ZoneAssignment assignment(int period, int start, int end, int row, int col) {
        ZoneAssignment zone = new ZoneAssignment();
        zone.setPeriod(period);
        zone.setStartMinute(start);
        zone.setEndMinute(end);
        zone.setRow(row);
        zone.setCol(col);
        return zone;
    }

    @Test
    @DisplayName("Asigna la zona a los eventos dentro del rango y deja null a los demás")
    void shouldSetZoneOnlyOnCoveredEvents() {
        UUID matchId = UUID.randomUUID();
        when(zoneAssignmentRepository.findByMatchIdOrderByPeriodAscStartMinuteAsc(matchId))
                .thenReturn(List.of(assignment(1, 10, 25, 2, 3)));
        PostMatchZoneEnricher enricher = new PostMatchZoneEnricher(zoneAssignmentRepository, new EventZoneResolver());

        List<MatchTimelineEventResponseDTO> result = enricher.enrich(matchId, List.of(event(1, 15), event(1, 30)));

        assertEquals(new ZoneCell(2, 3), result.get(0).zone());
        assertNull(result.get(1).zone());
    }

    @Test
    @DisplayName("Sin asignaciones todos los eventos quedan sin zona y se conservan sus datos")
    void shouldKeepEventsUntouchedWithoutAssignments() {
        UUID matchId = UUID.randomUUID();
        when(zoneAssignmentRepository.findByMatchIdOrderByPeriodAscStartMinuteAsc(matchId)).thenReturn(List.of());
        PostMatchZoneEnricher enricher = new PostMatchZoneEnricher(zoneAssignmentRepository, new EventZoneResolver());
        MatchTimelineEventResponseDTO original = event(2, 50);

        MatchTimelineEventResponseDTO enriched = enricher.enrich(matchId, List.of(original)).get(0);

        assertNull(enriched.zone());
        assertEquals(original.id(), enriched.id());
        assertEquals(original.matchTime(), enriched.matchTime());
    }
}
