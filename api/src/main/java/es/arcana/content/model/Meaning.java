package es.arcana.content.model;

import java.util.List;
import java.util.Map;

/** Entrada de {@code {lang}/meanings/{familia}.json} (CONTRACTS §2.3). */
public record Meaning(List<String> keywords, Map<String, List<String>> upright, Map<String, List<String>> reversed) {

    public Meaning {
        keywords = keywords == null ? List.of() : List.copyOf(keywords);
        upright = upright == null ? Map.of() : Map.copyOf(upright);
        reversed = reversed == null ? Map.of() : Map.copyOf(reversed);
    }

    /** Variantes para orientación y tema, con fallback a {@code general}. */
    public List<String> variants(boolean isReversed, String tema) {
        Map<String, List<String>> o = isReversed ? reversed : upright;
        List<String> v = tema == null ? null : o.get(tema);
        if (v == null || v.isEmpty()) {
            v = o.get("general");
        }
        return v == null ? List.of() : v;
    }
}
