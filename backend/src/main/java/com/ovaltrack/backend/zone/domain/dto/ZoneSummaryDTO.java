package com.ovaltrack.backend.zone.domain.dto;

import java.util.List;

/** Conteo de eventos por celda de la cancha y cantidad de eventos que no caen en ninguna zona. */
public record ZoneSummaryDTO(List<ZoneCellCountDTO> cells, int unzonedEventCount) {

    public record ZoneCellCountDTO(int row, int col, int eventCount) {
    }
}
