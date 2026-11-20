package es.arcana.content.model;

import java.util.Map;

public record DeckModelDef(String id, Integer deckSize, String art, String minors, String pattern,
                           Map<String, String> numerals, Double reversedProbability) {

    public DeckModelDef {
        numerals = numerals == null ? Map.of() : Map.copyOf(numerals);
    }
}
