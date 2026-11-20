package es.arcana.content.model;

import java.util.List;

/** Fragmento narrativo (CONTRACTS §3.1). */
public record Fragment(String id, String slot, List<String> tones, Double weight, When when, String text) {

    public Fragment {
        tones = tones == null ? List.of() : List.copyOf(tones);
    }

    public double effectiveWeight() {
        return weight == null || weight <= 0 ? 1.0 : weight;
    }

    public boolean allowsTone(String tone) {
        return tones.isEmpty() || tones.contains(tone);
    }
}
