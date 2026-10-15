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

    public static boolean countsAsScoring(EventType type, Map<String, Object> attrs) {
        if (!Boolean.TRUE.equals(type.getIsScoring()))
            return false;
        if (type.getTemplateEventFields() == null)
            return true;
        return type.getTemplateEventFields().stream()
                .filter(f -> "scoring".equals(f.effect()))
                .findFirst()
                .map(f -> attrs == null || !Boolean.FALSE.equals(attrs.get(f.key())))
                .orElse(true);
    }

    public static void validateAttributes(EventType type, Map<String, Object> attrs) {
        Map<String, Object> a = attrs == null ? Map.of() : attrs;

        Set<String> declared = (type.getTemplateEventFields() == null ? List.<TemplateField>of()
                : type.getTemplateEventFields())
                .stream().map(TemplateField::key).collect(Collectors.toSet());

        for (String key : a.keySet()) {
            if (!RESERVED_KEYS.contains(key) && !declared.contains(key)) {
                throw new BusinessException("Atributo no permitido para este tipo de evento: " + key);
            }
        }
        for (TemplateField f : type.getTemplateEventFields() == null ? List.<TemplateField>of()
                : type.getTemplateEventFields()) {
            Object v = a.get(f.key());
            if (v == null) {
                if (f.required() && "live".equals(f.phase()))
                    throw new BusinessException("Falta el campo requerido: " + f.label());
                continue;
            }
            switch (f.type()) {
                case "boolean" -> {
                    if (!(v instanceof Boolean))
                        throw new BusinessException("Valor inválido en " + f.label());
                }
                case "number"-> {
                    if (!(v instanceof Number))
                        throw new BusinessException("Valor inválido en " + f.label());
                }
                case "select" -> {
                    boolean ok = f.options() != null && f.options().stream().anyMatch(o -> o.value().equals(v));
                    if (!ok)
                        throw new BusinessException("Opción inválida en " + f.label());
                }
                default -> {
                }
            }
        }
    }
}