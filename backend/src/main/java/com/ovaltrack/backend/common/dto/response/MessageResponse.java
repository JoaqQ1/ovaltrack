package com.ovaltrack.backend.common.dto.response;

/**
 * Cuerpo estándar para errores y para respuestas que solo informan un resultado
 * (ej. aprobar, eliminar), sin un recurso que devolver.
 */
public record MessageResponse(String message) {
}
