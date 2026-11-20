package es.arcana.narrative;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.MonthDay;

/** Astronomía «de andar por casa»: estación (hemisferio norte) y fase lunar aproximada. */
public final class Astro {

    /** Luna nueva de referencia: 6 de enero de 2000, 18:14 UTC. */
    private static final Instant REFERENCE_NEW_MOON = Instant.parse("2000-01-06T18:14:00Z");
    /** Mes sinódico medio en días. */
    static final double SYNODIC_MONTH = 29.530588853;
    private static final double OCTANT = SYNODIC_MONTH / 8.0;

    private Astro() {
    }

    /** Estación astronómica aproximada (equinoccios/solsticios en fechas medias). */
    public static String estacion(LocalDate date) {
        MonthDay md = MonthDay.from(date);
        if (md.isBefore(MonthDay.of(3, 20))) {
            return "invierno";
        }
        if (md.isBefore(MonthDay.of(6, 21))) {
            return "primavera";
        }
        if (md.isBefore(MonthDay.of(9, 23))) {
            return "verano";
        }
        if (md.isBefore(MonthDay.of(12, 21))) {
            return "otono";
        }
        return "invierno";
    }

    /** Edad de la luna en días (0 = luna nueva). */
    public static double moonAge(Instant instant) {
        double days = Duration.between(REFERENCE_NEW_MOON, instant).toSeconds() / 86_400.0;
        double age = days % SYNODIC_MONTH;
        return age < 0 ? age + SYNODIC_MONTH : age;
    }

    /**
     * Fase lunar en 4 categorías ({@code nueva|creciente|llena|menguante}): «nueva» y «llena» ocupan el octante
     * centrado en su instante; el resto es creciente o menguante.
     */
    public static String faseLunar(Instant instant) {
        double age = moonAge(instant);
        if (age < OCTANT / 2 || age >= SYNODIC_MONTH - OCTANT / 2) {
            return "nueva";
        }
        double full = SYNODIC_MONTH / 2;
        if (age < full - OCTANT / 2) {
            return "creciente";
        }
        if (age < full + OCTANT / 2) {
            return "llena";
        }
        return "menguante";
    }
}
