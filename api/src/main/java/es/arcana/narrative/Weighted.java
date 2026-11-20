package es.arcana.narrative;

import java.util.List;
import java.util.Optional;
import java.util.function.ToDoubleFunction;
import java.util.random.RandomGenerator;

/** Elección ponderada. */
public final class Weighted {

    private Weighted() {
    }

    public static <T> Optional<T> pick(List<T> items, ToDoubleFunction<T> weight, RandomGenerator rng) {
        if (items.isEmpty()) {
            return Optional.empty();
        }
        double total = 0;
        for (T t : items) {
            total += Math.max(0, weight.applyAsDouble(t));
        }
        if (total <= 0) {
            return Optional.of(items.get(rng.nextInt(items.size())));
        }
        double r = rng.nextDouble() * total;
        for (T t : items) {
            r -= Math.max(0, weight.applyAsDouble(t));
            if (r < 0) {
                return Optional.of(t);
            }
        }
        return Optional.of(items.getLast());
    }

    public static <T> Optional<T> uniform(List<T> items, RandomGenerator rng) {
        return items == null || items.isEmpty() ? Optional.empty() : Optional.of(items.get(rng.nextInt(items.size())));
    }
}
