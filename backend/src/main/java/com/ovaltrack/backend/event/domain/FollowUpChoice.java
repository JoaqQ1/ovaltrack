package com.ovaltrack.backend.event.domain;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Evento que el analista puede elegir como siguiente al guardar otro (por ejemplo, cómo se juega un penal).
 * {@code preset} pre-llena campos en vivo del evento elegido y evita pedirlos de nuevo.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record FollowUpChoice(String code, String label, Map<String, Object> preset) {
}
