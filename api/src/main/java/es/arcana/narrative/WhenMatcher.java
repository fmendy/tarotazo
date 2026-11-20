package es.arcana.narrative;

import es.arcana.content.model.When;

import java.util.List;
import java.util.function.Predicate;

/**
 * Evalúa condiciones {@code when} (CONTRACTS §3.1): todas AND, listas OR. Las condiciones de carta
 * ({@code invertida, arcana, cardIds, suit}) sin carta actual se cumplen si alguna carta de la lectura las cumple;
 * {@code posicion, primeraCarta, ultimaCarta} exigen carta actual. Si falta el dato del contexto, no se cumple.
 */
public final class WhenMatcher {

    private WhenMatcher() {
    }

    public static boolean matches(When w, Situation s) {
        if (w == null) {
            return true;
        }
        var ctx = s.ctx();
        var m = s.moment();
        return in(w.tema(), s.tema())
                && (w.invertida() == null || anyCard(s, c -> c.reversed() == w.invertida()))
                && (w.arcana() == null || anyCard(s, c -> c.def().isMajor() == "major".equals(w.arcana())))
                && (w.cardIds() == null || anyCard(s, c -> w.cardIds().contains(c.def().id())))
                && (w.suit() == null || anyCard(s, c -> c.def().suit() != null && w.suit().contains(c.def().suit())))
                && in(w.family(), s.family())
                && in(w.spread(), s.spread())
                && (w.posicion() == null || (s.card() != null && w.posicion().contains(s.card().positionId())))
                && (w.decadaMin() == null || (ctx.decada() != null && ctx.decada() >= w.decadaMin()))
                && (w.decadaMax() == null || (ctx.decada() != null && ctx.decada() <= w.decadaMax()))
                && horaOk(w.horaMin(), w.horaMax(), m == null ? null : m.hora())
                && (w.mayoresMin() == null || s.mayores() >= w.mayoresMin())
                && (w.figurasMin() == null || s.figuras() >= w.figurasMin())
                && (w.suitDominante() == null || w.suitDominante().equals(s.suitDominante()))
                && in(w.provincia(), ctx.provincia())
                && in(w.signo(), ctx.signo())
                && (w.diaSemana() == null || (m != null && w.diaSemana().contains(m.diaSemana())))
                && in(w.faseLunar(), m == null ? null : m.faseLunar())
                && in(w.estacion(), m == null ? null : m.estacion())
                && (w.primeraCarta() == null || (s.card() != null && (s.index() == 0) == w.primeraCarta()))
                && (w.ultimaCarta() == null
                    || (s.card() != null && (s.index() == s.cards().size() - 1) == w.ultimaCarta()));
    }

    private static <T> boolean in(List<T> allowed, T value) {
        return allowed == null || (value != null && allowed.contains(value));
    }

    private static boolean anyCard(Situation s, Predicate<NarrativeCard> p) {
        return s.card() != null ? p.test(s.card()) : s.cards().stream().anyMatch(p);
    }

    /** Rango de horas inclusivo; si min &gt; max cruza la medianoche (22–4). */
    static boolean horaOk(Integer min, Integer max, Integer hora) {
        if (min == null && max == null) {
            return true;
        }
        if (hora == null) {
            return false;
        }
        if (min != null && max != null) {
            return min <= max ? hora >= min && hora <= max : hora >= min || hora <= max;
        }
        return min != null ? hora >= min : hora <= max;
    }
}
