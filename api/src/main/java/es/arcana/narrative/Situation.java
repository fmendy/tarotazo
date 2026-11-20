package es.arcana.narrative;

import es.arcana.common.ReadingContext;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Situación contra la que se evalúa un {@code when}: datos de la lectura y, opcionalmente, la carta actual
 * ({@code card == null} para saludo, síntesis, despedida e interacciones de next-line).
 */
public record Situation(String family, String spread, ReadingContext ctx, TimeContext.Moment moment,
                       List<NarrativeCard> cards, NarrativeCard card, int index) {

    public Situation {
        ctx = ReadingContext.orEmpty(ctx);
        cards = cards == null ? List.of() : List.copyOf(cards);
    }

    public Situation forCard(int i) {
        return new Situation(family, spread, ctx, moment, cards, cards.get(i), i);
    }

    public Situation readingLevel() {
        return new Situation(family, spread, ctx, moment, cards, null, -1);
    }

    public String tema() {
        return ctx.temaOrGeneral();
    }

    public NarrativeCard previous() {
        return card != null && index > 0 ? cards.get(index - 1) : null;
    }

    public long mayores() {
        return cards.stream().filter(c -> c.def().isMajor()).count();
    }

    public long figuras() {
        return cards.stream().filter(c -> c.def().isCourt()).count();
    }

    /** Palo con más cartas (al menos 2 y sin empate), o {@code null}. */
    public String suitDominante() {
        Map<String, Long> counts = cards.stream().map(c -> c.def().suit()).filter(Objects::nonNull)
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
        if (counts.isEmpty()) {
            return null;
        }
        List<Map.Entry<String, Long>> sorted = counts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder())).toList();
        long top = sorted.getFirst().getValue();
        if (top < 2 || (sorted.size() > 1 && sorted.get(1).getValue() == top)) {
            return null;
        }
        return sorted.getFirst().getKey();
    }
}
