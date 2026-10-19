package com.ovaltrack.backend.event.business;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.event.domain.EventType;
import com.ovaltrack.backend.event.domain.TemplateField;

public final class EventRules {
    private EventRules() {
    }

    private static final Set<String> RESERVED_KEYS = Set.of("playerNumber");

    private static List<TemplateField> safeTemplateFields(EventType type) {
        if (type == null || type.getTemplateEventFields() == null) {
            return List.of();
        }
        return type.getTemplateEventFields();
    }

    private static boolean effectActive(EventType type, String effect, Map<String, Object> attrs) {
        return safeTemplateFields(type).stream()
                .filter(field -> field.effects() != null && field.effects().contains(effect))
                .findFirst()
                .map(field -> attrs == null || !Boolean.FALSE.equals(attrs.get(field.key())))
                .orElse(true);
    }

    public static boolean countsAsScoring(EventType eventType, Map<String, Object> attrs) {
        return Boolean.TRUE.equals(eventType.getIsScoring()) && effectActive(eventType, "scoring", attrs);
    }

    public static void validateAttributes(EventType type, Map<String, Object> attrs) {
        Map<String, Object> attributesMap = attrs == null ? Map.of() : attrs;
        validateUndeclaredKeys(type, attributesMap);

        for (TemplateField field : safeTemplateFields(type)) {
            validateField(field, attributesMap.get(field.key()));
        }
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