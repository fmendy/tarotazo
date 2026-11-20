package es.arcana.reading;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Random;

/** Barajado, corte en tres montones, picks y orientación. El azar viene de {@code SecureRandom}. */
public final class DeckShuffler {

    public static final int PILES = 3;

    private final Random random;

    public DeckShuffler(Random random) {
        this.random = random;
    }

    public record Drawn<T>(T card, boolean reversed) {
    }

    public <T> List<T> shuffle(List<T> deck) {
        List<T> copy = new ArrayList<>(deck);
        Collections.shuffle(copy, random);
        return copy;
    }

    /**
     * Corta el mazo en tres montones consecutivos (el resto se reparte entre los primeros) y pone encima el
     * elegido; los otros dos siguen debajo en su orden.
     */
    public static <T> List<T> cut(List<T> deck, int cutIndex) {
        if (cutIndex < 0 || cutIndex >= PILES) {
            throw new IllegalArgumentException("cutIndex debe estar entre 0 y 2");
        }
        int n = deck.size();
        int base = n / PILES;
        int extra = n % PILES;
        List<List<T>> piles = new ArrayList<>(PILES);
        int start = 0;
        for (int i = 0; i < PILES; i++) {
            int size = base + (i < extra ? 1 : 0);
            piles.add(deck.subList(start, start + size));
            start += size;
        }
        List<T> out = new ArrayList<>(n);
        out.addAll(piles.get(cutIndex));
        for (int i = 0; i < PILES; i++) {
            if (i != cutIndex) {
                out.addAll(piles.get(i));
            }
        }
        return out;
    }

    /** Toma las cartas de los índices del abanico y sortea su orientación. */
    public <T> List<Drawn<T>> draw(List<T> fan, List<Integer> picks, double reversedProbability) {
        if (new HashSet<>(picks).size() != picks.size()) {
            throw new IllegalArgumentException("picks repetidos");
        }
        List<Drawn<T>> out = new ArrayList<>(picks.size());
        for (int idx : picks) {
            if (idx < 0 || idx >= fan.size()) {
                throw new IllegalArgumentException("pick fuera de rango: " + idx);
            }
            out.add(new Drawn<>(fan.get(idx), random.nextDouble() < reversedProbability));
        }
        return out;
    }
}
