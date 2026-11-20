package es.arcana.narrative;

import es.arcana.common.ReadingContext;
import es.arcana.content.model.CardDef;
import es.arcana.content.model.When;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class WhenMatcherTest {

    private static final JsonMapper JSON = JsonMapper.builder().build();

    private static final NarrativeCard TORRE = card("mayor-16", "major", null, false, true, "pasado");
    private static final NarrativeCard REINA = card("copas-reina", "minor", "copas", true, false, "presente");
    private static final NarrativeCard AS = card("copas-01", "minor", "copas", false, false, "futuro");

    private static final ReadingContext CTX = new ReadingContext("leo", 40, 7, "41", "amor", 1L, 2, 2, "es");
    private static final TimeContext.Moment MOMENT = new TimeContext.Moment(2, 2, "otono", "menguante");

    private static NarrativeCard card(String id, String arcana, String suit, boolean court, boolean reversed,
                                      String pos) {
        return new NarrativeCard(new CardDef(id, arcana, 0, suit, suit == null ? null : "01", court, false), id,
                suit, reversed, pos, pos, "tu " + pos);
    }

    private static When when(String json) {
        return JSON.readValue(json, When.class);
    }

    private static Situation reading() {
        return new Situation("tarot", "ppf", CTX, MOMENT, List.of(TORRE, REINA, AS), null, -1);
    }

    @Test
    void sinWhenSiempreVale() {
        assertThat(WhenMatcher.matches(null, reading())).isTrue();
        assertThat(WhenMatcher.matches(when("{}"), reading().forCard(0))).isTrue();
    }

    @Test
    void condicionesDeCartaActual() {
        Situation torre = reading().forCard(0);
        Situation reina = reading().forCard(1);
        assertThat(WhenMatcher.matches(when("{\"cardIds\":[\"mayor-16\"]}"), torre)).isTrue();
        assertThat(WhenMatcher.matches(when("{\"cardIds\":[\"mayor-16\"]}"), reina)).isFalse();
        assertThat(WhenMatcher.matches(when("{\"invertida\":true,\"arcana\":\"major\"}"), torre)).isTrue();
        assertThat(WhenMatcher.matches(when("{\"invertida\":true}"), reina)).isFalse();
        assertThat(WhenMatcher.matches(when("{\"suit\":[\"copas\",\"oros\"]}"), reina)).isTrue();
        assertThat(WhenMatcher.matches(when("{\"posicion\":[\"pasado\"],\"primeraCarta\":true}"), torre)).isTrue();
        assertThat(WhenMatcher.matches(when("{\"ultimaCarta\":true}"), torre)).isFalse();
        assertThat(WhenMatcher.matches(when("{\"ultimaCarta\":true}"), reading().forCard(2))).isTrue();
    }

    @Test
    void condicionesDeCartaSinCartaActualMiranTodaLaLectura() {
        assertThat(WhenMatcher.matches(when("{\"cardIds\":[\"copas-01\"]}"), reading())).isTrue();
        assertThat(WhenMatcher.matches(when("{\"posicion\":[\"pasado\"]}"), reading())).isFalse();
    }

    @Test
    void contextoYAndEntreCondiciones() {
        Situation s = reading().forCard(0);
        assertThat(WhenMatcher.matches(when("{\"tema\":[\"amor\"],\"signo\":[\"leo\"],\"provincia\":[\"41\",\"28\"]}"), s)).isTrue();
        assertThat(WhenMatcher.matches(when("{\"tema\":[\"amor\"],\"signo\":[\"aries\"]}"), s)).isFalse();
        assertThat(WhenMatcher.matches(when("{\"decadaMin\":40,\"decadaMax\":50}"), s)).isTrue();
        assertThat(WhenMatcher.matches(when("{\"decadaMin\":50}"), s)).isFalse();
        assertThat(WhenMatcher.matches(when("{\"family\":[\"tarot\"],\"spread\":[\"ppf\"]}"), s)).isTrue();
        assertThat(WhenMatcher.matches(when("{\"family\":[\"spanish\"]}"), s)).isFalse();
    }

    @Test
    void faltaElDatoDelContextoNoSeCumple() {
        Situation s = new Situation("tarot", "ppf", ReadingContext.EMPTY, MOMENT, List.of(TORRE), null, -1).forCard(0);
        assertThat(WhenMatcher.matches(when("{\"decadaMin\":40}"), s)).isFalse();
        assertThat(WhenMatcher.matches(when("{\"signo\":[\"leo\"]}"), s)).isFalse();
        // tema ausente cuenta como "general"
        assertThat(WhenMatcher.matches(when("{\"tema\":[\"general\"]}"), s)).isTrue();
    }

    @Test
    void horasDiaYCalendario() {
        Situation s = reading();
        assertThat(WhenMatcher.matches(when("{\"horaMin\":0,\"horaMax\":6}"), s)).isTrue();
        assertThat(WhenMatcher.matches(when("{\"horaMin\":22,\"horaMax\":4}"), s)).isTrue(); // cruza medianoche
        assertThat(WhenMatcher.matches(when("{\"horaMin\":7,\"horaMax\":20}"), s)).isFalse();
        assertThat(WhenMatcher.matches(when("{\"diaSemana\":[2]}"), s)).isTrue();
        assertThat(WhenMatcher.matches(when("{\"faseLunar\":[\"menguante\"],\"estacion\":[\"otono\"]}"), s)).isTrue();
        assertThat(WhenMatcher.matches(when("{\"faseLunar\":[\"llena\"]}"), s)).isFalse();
    }

    @Test
    void sintesisMayoresPaloDominanteYFiguras() {
        Situation s = reading();
        assertThat(s.mayores()).isEqualTo(1);
        assertThat(s.suitDominante()).isEqualTo("copas");
        assertThat(WhenMatcher.matches(when("{\"mayoresMin\":1,\"suitDominante\":\"copas\",\"figurasMin\":1}"), s)).isTrue();
        assertThat(WhenMatcher.matches(when("{\"mayoresMin\":3}"), s)).isFalse();
        assertThat(WhenMatcher.matches(when("{\"figurasMin\":2}"), s)).isFalse();
        assertThat(WhenMatcher.matches(when("{\"suitDominante\":\"espadas\"}"), s)).isFalse();
    }
}
