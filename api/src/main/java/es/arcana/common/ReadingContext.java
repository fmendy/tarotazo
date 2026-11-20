package es.arcana.common;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;

/**
 * Contexto anónimo que manda el navegador (CONTRACTS §6). Nunca contiene nombre, edad exacta ni pregunta.
 *
 * @param diaSemana ISO‑8601: 1 = lunes … 7 = domingo.
 */
public record ReadingContext(
        @Pattern(regexp = Ids.RX_SIGNO, message = "signo desconocido") String signo,
        @Min(value = 10, message = "decada fuera de rango") @Max(value = 120, message = "decada fuera de rango") Integer decada,
        @Min(value = 1, message = "numeroVida fuera de rango") @Max(value = 33, message = "numeroVida fuera de rango") Integer numeroVida,
        @Pattern(regexp = Ids.RX_PROVINCE, message = "provincia debe ser un código INE \"01\"…\"52\" o \"XX\"") String provincia,
        @Pattern(regexp = Ids.RX_TEMA, message = "tema desconocido") String tema,
        Long toneSeed,
        @Min(value = 0, message = "hora fuera de rango") @Max(value = 23, message = "hora fuera de rango") Integer hora,
        @Min(value = 1, message = "diaSemana debe ser 1 (lunes) … 7 (domingo)") @Max(value = 7, message = "diaSemana debe ser 1 (lunes) … 7 (domingo)") Integer diaSemana,
        @Pattern(regexp = Ids.RX_LANG, message = "lang no válido") String lang) {

    public static final ReadingContext EMPTY = new ReadingContext(null, null, null, null, null, null, null, null, null);

    public static ReadingContext orEmpty(ReadingContext c) {
        return c == null ? EMPTY : c;
    }

    public String temaOrGeneral() {
        return tema == null ? "general" : tema;
    }
}
