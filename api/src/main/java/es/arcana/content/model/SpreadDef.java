package es.arcana.content.model;

import java.util.List;

/** {@code spreads.json} (CONTRACTS §2.2). */
public record SpreadDef(String id, Integer size, Integer minSize, List<String> families, List<String> positions,
                        String layout, Integer order, Integer phase) {

    public SpreadDef {
        families = families == null ? List.of() : List.copyOf(families);
        positions = positions == null ? List.of() : List.copyOf(positions);
    }

    public int maxCards() {
        return size != null ? size : positions.size();
    }

    public int minCards() {
        return minSize != null ? minSize : maxCards();
    }

    public boolean supports(String family) {
        return families.contains(family);
    }
}
