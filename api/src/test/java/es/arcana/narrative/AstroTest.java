package es.arcana.narrative;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class AstroTest {

    @Test
    void fasesLunaresConocidas() {
        assertThat(Astro.faseLunar(Instant.parse("2024-04-08T18:21:00Z"))).isEqualTo("nueva"); // eclipse solar
        assertThat(Astro.faseLunar(Instant.parse("2024-04-23T23:49:00Z"))).isEqualTo("llena");
        assertThat(Astro.faseLunar(Instant.parse("2024-04-15T19:13:00Z"))).isEqualTo("creciente"); // cuarto creciente
        assertThat(Astro.faseLunar(Instant.parse("2024-05-01T11:27:00Z"))).isEqualTo("menguante"); // cuarto menguante
    }

    @Test
    void estaciones() {
        assertThat(Astro.estacion(LocalDate.of(2026, 1, 10))).isEqualTo("invierno");
        assertThat(Astro.estacion(LocalDate.of(2026, 4, 1))).isEqualTo("primavera");
        assertThat(Astro.estacion(LocalDate.of(2026, 8, 15))).isEqualTo("verano");
        assertThat(Astro.estacion(LocalDate.of(2026, 11, 20))).isEqualTo("otono");
        assertThat(Astro.estacion(LocalDate.of(2026, 12, 25))).isEqualTo("invierno");
    }
}
