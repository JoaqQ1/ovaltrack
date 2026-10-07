package com.ovaltrack.backend.event.domain;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties (ignoreUnknown = true)
public record TemplateField(
    String key, String label, String type, String phase, boolean required,
    List<Option> options, Double min, Double max,
    @JsonProperty ("default") Object defaultValue,
    String effect, String trueLabel, String falseLabel) {

    public record Option(String value, String label) {}
}