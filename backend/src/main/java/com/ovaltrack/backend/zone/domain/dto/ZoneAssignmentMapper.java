package com.ovaltrack.backend.zone.domain.dto;

import com.ovaltrack.backend.zone.domain.ZoneAssignment;

public final class ZoneAssignmentMapper {

    private ZoneAssignmentMapper() {
    }

    public static ZoneAssignmentResponseDTO toResponseDTO(ZoneAssignment zone) {
        if (zone == null) {
            return null;
        }

        return new ZoneAssignmentResponseDTO(
                zone.getId(),
                zone.getMatch() == null ? null : zone.getMatch().getId(),
                zone.getPeriod(),
                zone.getStartMinute(),
                zone.getEndMinute(),
                zone.getRow(),
                zone.getCol());
    }

    /** Copia los datos del request sobre la entidad (sin tocar id ni partido). */
    public static void applyTo(ZoneAssignment zone, ZoneAssignmentCreationDTO request) {
        zone.setPeriod(request.period());
        zone.setStartMinute(request.startMinute());
        zone.setEndMinute(request.endMinute());
        zone.setRow(request.row());
        zone.setCol(request.col());
    }
}
