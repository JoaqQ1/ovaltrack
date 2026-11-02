package com.ovaltrack.backend.zone.business;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.match.domain.Match;
import com.ovaltrack.backend.match.domain.MatchStatus;
import com.ovaltrack.backend.zone.domain.ZoneAssignment;
import com.ovaltrack.backend.zone.domain.dto.ZoneAssignmentCreationDTO;

/** Reglas de negocio de las asignaciones de zona. No accede a datos: recibe todo lo que necesita. */
@Component
public class ZoneAssignmentValidator {

    public void validateMatchEditable(Match match) {
        if (match.getStatus() != MatchStatus.FINISHED) {
            throw new BusinessException("Las zonas solo se pueden editar en partidos finalizados");
        }
    }

    /**
     * @param others     asignaciones ya existentes del partido
     * @param ignoredId  asignación que se está editando (no se compara contra sí misma); null al crear
     */
    public void validate(ZoneAssignmentCreationDTO request, List<ZoneAssignment> others, UUID ignoredId) {
        validateCell(request);
        validateRange(request);
        validateNoOverlap(request, others, ignoredId);
    }

    private void validateCell(ZoneAssignmentCreationDTO request) {
        if (!ZoneGrid.isValidCell(request.row(), request.col())) {
            throw new BusinessException(
                    "La celda debe estar dentro de la grilla de %d filas y %d columnas".formatted(ZoneGrid.ROWS, ZoneGrid.COLS));
        }
    }

    private void validateRange(ZoneAssignmentCreationDTO request) {
        int period = request.period();
        if (period < 1 || period > ZoneGrid.PERIODS) {
            throw new BusinessException("El período debe ser 1 o 2");
        }
        if (request.startMinute() >= request.endMinute()) {
            throw new BusinessException("El minuto de inicio debe ser menor al minuto de fin");
        }
        int allowedStart = ZoneGrid.periodStartMinute(period);
        int allowedEnd = ZoneGrid.periodEndMinute(period);
        if (request.startMinute() < allowedStart || request.endMinute() > allowedEnd) {
            throw new BusinessException(
                    "El rango del período %d debe estar entre el minuto %d y el minuto %d".formatted(period, allowedStart, allowedEnd));
        }
    }

    private void validateNoOverlap(ZoneAssignmentCreationDTO request, List<ZoneAssignment> others, UUID ignoredId) {
        others.stream()
                .filter(other -> ignoredId == null || !ignoredId.equals(other.getId()))
                .filter(other -> other.getPeriod().equals(request.period()))
                .filter(other -> request.startMinute() < other.getEndMinute() && other.getStartMinute() < request.endMinute())
                .findFirst()
                .ifPresent(other -> {
                    throw new BusinessException("El tramo se solapa con el tramo %dT %d'–%d' ya asignado"
                            .formatted(other.getPeriod(), other.getStartMinute(), other.getEndMinute()));
                });
    }
}
