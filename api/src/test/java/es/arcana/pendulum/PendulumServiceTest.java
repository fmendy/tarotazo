package es.arcana.pendulum;

import es.arcana.Fixture;
import es.arcana.common.BadRequestException;
import es.arcana.common.ReadingContext;
import es.arcana.pendulum.web.PendulumDtos.PendulumRequest;
import es.arcana.pendulum.web.PendulumDtos.PendulumResponse;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.SplittableRandom;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PendulumServiceTest {

    private final PendulumService service = new PendulumService(Fixture.repo(), Fixture.time());
    private static final ReadingContext AFTERNOON = new ReadingContext(null, null, null, null, null, null, 17, 3, "es");

    private PendulumResponse ask(String mode, String model, Integer options, long seed) {
        return service.answer(new PendulumRequest(mode, model, options, AFTERNOON), "es", new SplittableRandom(seed));
    }

    @Test
    void sinoReparteSiNoYDuda() {
        Set<Object> answers = new HashSet<>();
        for (long s = 0; s < 300; s++) {
            PendulumResponse r = ask("sino", null, null, s);
            answers.add(r.result().get("answer"));
            assertThat(r.text()).isNotBlank();
        }
        assertThat(answers).containsExactlyInAnyOrder("si", "no", "duda");
    }

    @Test
    void lineasDelModeloSustituyenALasGenerales() {
        for (long s = 0; s < 100; s++) {
            PendulumResponse r = ask("sino", "chorizo", null, s);
            if ("si".equals(r.result().get("answer"))) {
                assertThat(r.text()).isEqualTo("El chorizo dice que sí.");
            }
            PendulumResponse g = ask("sino", "cuarzo", null, s);
            if ("si".equals(g.result().get("answer"))) {
                assertThat(g.text()).isEqualTo("Sí: SÍ.");
            }
        }
    }

    @Test
    void tableroPorcentajeYOuija() {
        for (long s = 0; s < 200; s++) {
            assertThat((Integer) ask("tablero", null, null, s).result().get("sector")).isBetween(0, 4);
            PendulumResponse p = ask("porcentaje", null, null, s);
            int v = (Integer) p.result().get("value");
            assertThat(v).isBetween(0, 100);
            assertThat(p.text()).isEqualTo("Un " + v + " %.");
            PendulumResponse o = ask("ouija", null, null, s);
            assertThat(o.result().get("word")).isIn("AMOR", "PIZZA");
            assertThat(o.text()).isEqualTo("Deletrea " + o.result().get("word") + ".");
        }
    }

    @Test
    void mapaNuncaEligeExtranjeroYRellenaProvincia() {
        for (long s = 0; s < 100; s++) {
            PendulumResponse r = ask("mapa", null, null, s);
            assertThat(r.result().get("provincia")).isIn("28", "41");
            assertThat(r.text()).matches("Tus llaves están en (Madrid|Sevilla)\\.");
        }
    }

    @Test
    void opcionesDevuelveIndiceYDejaOpcionSinResolver() {
        for (long s = 0; s < 100; s++) {
            PendulumResponse r = ask("opciones", null, 4, s);
            assertThat((Integer) r.result().get("index")).isBetween(0, 3);
            assertThat(r.text()).isEqualTo("Elige {opcion}.");
        }
        assertThatThrownBy(() -> ask("opciones", null, null, 1)).isInstanceOf(BadRequestException.class);
    }

    @Test
    @SuppressWarnings("unchecked")
    void chakrasConNivelEInforme() {
        PendulumResponse r = ask("chakras", null, null, 1);
        List<Map<String, Object>> levels = (List<Map<String, Object>>) r.result().get("levels");
        assertThat(levels).extracting(m -> m.get("id")).containsExactly("raiz", "corona");
        for (Map<String, Object> l : levels) {
            assertThat((Integer) l.get("nivel")).isBetween(0, 100);
            assertThat((String) l.get("informe")).endsWith("al " + l.get("nivel") + " %.");
        }
        assertThat(r.text()).isEqualTo("Línea chakras.intro");
    }

    @Test
    void aMedianocheBrillaMas() {
        ReadingContext midnight = new ReadingContext(null, null, null, null, null, null, 0, 3, "es");
        PendulumResponse r = service.answer(new PendulumRequest("tablero", null, null, midnight), "es",
                new SplittableRandom(1));
        assertThat(r.text()).endsWith("Es medianoche y brillo.");
    }
}
