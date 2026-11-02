package com.ovaltrack.backend.zone.domain.dto;

import jakarta.validation.constraints.NotNull;

/** Datos para crear o modificar una asignación de zona (se reutiliza para POST y PUT). */
public record ZoneAssignmentCreationDTO(
        @NotNull(message = "La fila es obligatoria") Integer row,
        @NotNull(message = "La columna es obligatoria") Integer col,
        @NotNull(message = "El período es obligatorio") Integer period,
        @NotNull(message = "El minuto de inicio es obligatorio") Integer startMinute,
        @NotNull(message = "El minuto de fin es obligatorio") Integer endMinute) {
}
