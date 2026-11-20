package es.arcana.content.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

/** Entrada de {@code {lang}/spreads.json}. */
public record SpreadI18n(String name, @JsonProperty("short") String shortName, String description,
                         Map<String, PositionI18n> positions) {

    public SpreadI18n {
        positions = positions == null ? Map.of() : Map.copyOf(positions);
    }

    public record PositionI18n(String label, String inline, String hint) {
    }
}
