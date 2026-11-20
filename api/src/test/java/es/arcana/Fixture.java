package es.arcana;

import es.arcana.content.ContentRepository;
import es.arcana.narrative.TimeContext;

import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;

/** Contenido mínimo de prueba (independiente del contenido real que escriben otros equipos). */
public final class Fixture {

    public static final Path DIR = Path.of("src/test/resources/content-fixture");
    public static final ZoneId MADRID = ZoneId.of("Europe/Madrid");

    private static ContentRepository repo;

    private Fixture() {
    }

    public static synchronized ContentRepository repo() {
        if (repo == null) {
            repo = ContentRepository.forDirectory(DIR, true);
        }
        return repo;
    }

    /** Reloj fijo: viernes 20/11/2026 13:00 en Madrid. */
    public static TimeContext time() {
        return new TimeContext(Clock.fixed(Instant.parse("2026-11-20T12:00:00Z"), MADRID), MADRID);
    }
}
