package com.ovaltrack.backend.event.business;

import java.util.List;
import java.util.Map;

import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.event.domain.EventType;
import com.ovaltrack.backend.event.domain.TemplateField;

public final class EventRules {
    private EventRules() {}

    public static boolean countsAsScoring(EventType type, Map<String, Object> attrs) {
        if (!Boolean.TRUE.equals(type.getIsScoring())) return false;
        if (type.getTemplateEventFields() == null) return true;
        return type.getTemplateEventFields().stream()
            .filter(f -> "scoring".equals(f.effect()))
            .findFirst()
            .map(f -> attrs == null || !Boolean.FALSE.equals(attrs.get(f.key())))
            .orElse(true);
    }

    public static void validateAttributes(EventType type, Map<String, Object> attrs) {
        Map<String, Object> a = attrs == null ? Map.of() : attrs;
        for (TemplateField f : type.getTemplateEventFields() == null ? List.<TemplateField>of() : type.getTemplateEventFields()) {
            Object v = a.get(f.key());
            if (v == null) {
                if (f.required() && "live".equals(f.phase()))
                    throw new BusinessException("Falta el campo requerido: " + f.label());
                continue;
            }
            switch (f.type()) {
                case "boolean" -> { if (!(v instanceof Boolean)) throw new BusinessException("Valor inválido en " + f.label()); }
                case "number", "jersey" -> { if (!(v instanceof Number)) throw new BusinessException("Valor inválido en " + f.label()); }
                case "select" -> {
                    boolean ok = f.options() != null && f.options().stream().anyMatch(o -> o.value().equals(v));
                    if (!ok) throw new BusinessException("Opción inválida en " + f.label());
                }
                default -> { }
            }
        }
    }
}