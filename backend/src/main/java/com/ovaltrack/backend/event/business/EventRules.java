package com.ovaltrack.backend.event.business;

import java.util.List;
import java.util.Map;

import com.ovaltrack.backend.event.domain.EventType;
import com.ovaltrack.backend.event.domain.TemplateField;

public final class EventRules {
    private EventRules() {
    }

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
        EventAttributeValidator.validate(type, attrs, null);
    }
}