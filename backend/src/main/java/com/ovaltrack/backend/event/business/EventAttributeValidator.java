package com.ovaltrack.backend.event.business;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.event.domain.EventType;
import com.ovaltrack.backend.event.domain.EventPossession;
import com.ovaltrack.backend.event.domain.TemplateField;

/**
 * Validador especializado en esquemas dinámicos de atributos de jugadas (HU-8.5).
 * Encapsula la validación de claves permitidas, tipos (boolean, number, select)
 * y restricciones de frontera (min, max).
 */
public final class EventAttributeValidator {

    private EventAttributeValidator() {
    }

    private static final Set<String> RESERVED_KEYS = Set.of("playerNumber", "playerOutId", "playerInId");

    public static void validate(EventType type, Map<String, Object> attributes, EventPossession teamPossession) {
        if (type == null) {
            return;
        }

        Map<String, Object> attributesMap = attributes == null ? Map.of() : attributes;
        if (teamPossession == EventPossession.OPPONENT
                && attributesMap.keySet().stream().anyMatch(EventAttributeValidator::isPlayerAttribute)) {
            throw new BusinessException("No se pueden asignar datos de jugador a un evento del equipo rival");
        }
        validateUndeclaredKeys(type, attributesMap);

        for (TemplateField field : safeTemplateFields(type)) {
            if (teamPossession == EventPossession.OPPONENT && isPlayerAttribute(field.key())) {
                continue;
            }
            validateField(field, attributesMap.get(field.key()));
        }
    }

    private static boolean isPlayerAttribute(String key) {
        return RESERVED_KEYS.contains(key)
                || "playerOutNumber".equals(key)
                || "playerInNumber".equals(key);
    }

    private static List<TemplateField> safeTemplateFields(EventType type) {
        if (type == null || type.getTemplateEventFields() == null) {
            return List.of();
        }
        return type.getTemplateEventFields();
    }

    private static void validateUndeclaredKeys(EventType type, Map<String, Object> attributesMap) {
        Set<String> declaredKeys = safeTemplateFields(type).stream()
                .map(TemplateField::key)
                .collect(Collectors.toSet());

        for (String key : attributesMap.keySet()) {
            if (!RESERVED_KEYS.contains(key) && !declaredKeys.contains(key)) {
                throw new BusinessException("Atributo no permitido para este tipo de evento: " + key);
            }
        }
    }

    private static void validateField(TemplateField field, Object value) {
        if (value == null) {
            if (field.required() && "live".equals(field.phase())) {
                throw new BusinessException("Falta el campo requerido: " + field.label());
            }
            return;
        }

        switch (field.type()) {
            case "boolean" -> validateBooleanField(field, value);
            case "number" -> validateNumberField(field, value);
            case "select" -> validateSelectField(field, value);
            default -> {
            }
        }
    }

    private static void validateBooleanField(TemplateField field, Object value) {
        if (!(value instanceof Boolean)) {
            throw new BusinessException("Valor inválido en " + field.label());
        }
    }

    private static void validateNumberField(TemplateField field, Object value) {
        if (!(value instanceof Number num)) {
            throw new BusinessException("Valor inválido en " + field.label());
        }
        if (field.min() != null && num.doubleValue() < field.min()) {
            throw new BusinessException("Valor fuera de rango en " + field.label() + ": mínimo " + field.min());
        }
        if (field.max() != null && num.doubleValue() > field.max()) {
            throw new BusinessException("Valor fuera de rango en " + field.label() + ": máximo " + field.max());
        }
    }

    private static void validateSelectField(TemplateField field, Object value) {
        boolean ok = field.options() != null && field.options().stream().anyMatch(o -> o.value().equals(value));
        if (!ok) {
            throw new BusinessException("Opción inválida en " + field.label());
        }
    }
}
