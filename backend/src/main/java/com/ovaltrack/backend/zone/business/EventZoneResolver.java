package com.ovaltrack.backend.zone.business;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.ovaltrack.backend.zone.domain.ZoneAssignment;
import com.ovaltrack.backend.zone.domain.ZoneCell;

/**
 * Deriva la zona de un evento comparando su minuto de juego contra las asignaciones del partido.
 * Es puro: no accede a datos ni persiste nada, la zona nunca se guarda en el evento.
 */
@Component
public class EventZoneResolver {

    private static final int SECONDS_PER_MINUTE = 60;

    /** Rango semiabierto: el inicio es inclusivo y el fin exclusivo, así los límites no son ambiguos. */
    public Optional<ZoneCell> resolve(Integer period, Integer matchTimeSeconds, List<ZoneAssignment> assignments) {
        if (period == null || matchTimeSeconds == null) {
            return Optional.empty();
        }

        return assignments.stream()
                .filter(zone -> zone.getPeriod().equals(period))
                .filter(zone -> zone.getStartMinute() * SECONDS_PER_MINUTE <= matchTimeSeconds
                        && matchTimeSeconds < zone.getEndMinute() * SECONDS_PER_MINUTE)
                .findFirst()
                .map(zone -> new ZoneCell(zone.getRow(), zone.getCol()));
    }
}
