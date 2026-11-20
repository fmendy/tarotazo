package es.arcana.narrative;

import es.arcana.common.ReadingContext;
import es.arcana.content.ContentRepository;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.ZoneId;
import java.time.ZonedDateTime;

/**
 * Datos de calendario calculados en servidor: {@code estacion} y {@code faseLunar} con la fecha actual; {@code hora}
 * y {@code diaSemana} se toman del contexto si llegan (reloj del navegador) y, si no, del reloj del servidor.
 */
@Component
public class TimeContext {

    private final Clock clock;
    private final ZoneId zone;

    @org.springframework.beans.factory.annotation.Autowired
    public TimeContext(Clock clock, ContentRepository content) {
        this(clock, content.zone());
    }

    public TimeContext(Clock clock, ZoneId zone) {
        this.clock = clock;
        this.zone = zone;
    }

    public ZonedDateTime now() {
        return ZonedDateTime.now(clock).withZoneSameInstant(zone);
    }

    public Moment moment(ReadingContext ctx) {
        ZonedDateTime now = now();
        int hora = ctx != null && ctx.hora() != null ? ctx.hora() : now.getHour();
        int dia = ctx != null && ctx.diaSemana() != null ? ctx.diaSemana() : now.getDayOfWeek().getValue();
        return new Moment(hora, dia, Astro.estacion(now.toLocalDate()), Astro.faseLunar(now.toInstant()));
    }

    /** @param diaSemana ISO 1 = lunes … 7 = domingo */
    public record Moment(int hora, int diaSemana, String estacion, String faseLunar) {
    }
}
