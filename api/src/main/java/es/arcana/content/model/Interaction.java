package es.arcana.content.model;

import java.util.List;

/** Pregunta Sí/No con ramas (CONTRACTS §3.3). */
public record Interaction(String id, List<String> tones, Double weight, When when, String prompt,
                          Branches branches) {

    public Interaction {
        tones = tones == null ? List.of() : List.copyOf(tones);
    }

    public record Branches(String si, String no, String skip) {
        public String forAnswer(String answer) {
            return switch (answer) {
                case "si" -> si;
                case "no" -> no;
                default -> skip;
            };
        }
    }

    public double effectiveWeight() {
        return weight == null || weight <= 0 ? 1.0 : weight;
    }

    public boolean allowsTone(String tone) {
        return tones.isEmpty() || tones.contains(tone);
    }
}
