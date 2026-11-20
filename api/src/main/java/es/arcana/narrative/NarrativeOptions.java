package es.arcana.narrative;

/** Probabilidades del algoritmo §3.4 (configurables para tests). */
public record NarrativeOptions(double moodChangeProbability, double guinoProbability, double interactionProbability,
                               int maxInteractions) {

    public static final NarrativeOptions DEFAULTS = new NarrativeOptions(0.15, 0.5, 0.25, 3);
}
