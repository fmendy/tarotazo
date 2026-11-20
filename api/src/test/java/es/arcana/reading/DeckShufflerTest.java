package es.arcana.reading;

import org.junit.jupiter.api.Test;

import java.security.SecureRandom;
import java.util.HashSet;
import java.util.List;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DeckShufflerTest {

    private final DeckShuffler shuffler = new DeckShuffler(new SecureRandom());

    private static List<Integer> range(int n) {
        return IntStream.range(0, n).boxed().toList();
    }

    @Test
    void barajarEsUnaPermutacion() {
        List<Integer> deck = range(78);
        List<Integer> s = shuffler.shuffle(deck);
        assertThat(s).hasSize(78).containsExactlyInAnyOrderElementsOf(deck);
        assertThat(deck).isEqualTo(range(78)); // no muta el original
    }

    @Test
    void distribucionUniformeDeLaPrimeraCarta() {
        int n = 6;
        int trials = 60_000;
        int[] counts = new int[n];
        for (int i = 0; i < trials; i++) {
            counts[shuffler.shuffle(range(n)).getFirst()]++;
        }
        double expected = trials / (double) n;
        double chi2 = 0;
        for (int c : counts) {
            chi2 += (c - expected) * (c - expected) / expected;
            assertThat(c).isBetween((int) (expected * 0.93), (int) (expected * 1.07));
        }
        assertThat(chi2).isLessThan(20.5); // gl=5, p≈0.001
    }

    @Test
    void corteEnTresMontonesPoneEncimaElElegido() {
        List<Integer> deck = range(10); // montones [0..3] [4..6] [7..9]
        assertThat(DeckShuffler.cut(deck, 0)).isEqualTo(deck);
        assertThat(DeckShuffler.cut(deck, 1)).containsExactly(4, 5, 6, 0, 1, 2, 3, 7, 8, 9);
        assertThat(DeckShuffler.cut(deck, 2)).containsExactly(7, 8, 9, 0, 1, 2, 3, 4, 5, 6);
        assertThat(DeckShuffler.cut(range(78), 2)).hasSize(78).containsExactlyInAnyOrderElementsOf(range(78));
        assertThatThrownBy(() -> DeckShuffler.cut(deck, 3)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void picksDistintosYOrientacionSegunProbabilidad() {
        List<Integer> fan = range(40);
        var drawn = shuffler.draw(fan, List.of(5, 17, 39), 0.0);
        assertThat(drawn).extracting(DeckShuffler.Drawn::card).containsExactly(5, 17, 39);
        assertThat(drawn).noneMatch(DeckShuffler.Drawn::reversed);
        assertThat(shuffler.draw(fan, List.of(1, 2), 1.0)).allMatch(DeckShuffler.Drawn::reversed);

        int reversed = 0;
        int total = 30_000;
        for (int i = 0; i < total / 3; i++) {
            reversed += (int) shuffler.draw(fan, List.of(0, 1, 2), 0.3).stream().filter(DeckShuffler.Drawn::reversed).count();
        }
        assertThat(reversed / (double) total).isBetween(0.28, 0.32);

        assertThatThrownBy(() -> shuffler.draw(fan, List.of(1, 1), 0.3)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> shuffler.draw(fan, List.of(40), 0.3)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void lecturasCompletasSacanCartasDistintas() {
        for (int i = 0; i < 200; i++) {
            var fan = DeckShuffler.cut(shuffler.shuffle(range(78)), i % 3);
            var drawn = shuffler.draw(fan, List.of(0, 1, 2, 3, 4, 5, 6, 7, 8, 9), 0.3);
            assertThat(new HashSet<>(drawn.stream().map(DeckShuffler.Drawn::card).toList())).hasSize(10);
        }
    }
}
