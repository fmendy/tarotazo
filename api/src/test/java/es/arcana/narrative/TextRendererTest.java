package es.arcana.narrative;

import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.SplittableRandom;
import java.util.function.Function;

import static org.assertj.core.api.Assertions.assertThat;

class TextRendererTest {

    private static final Function<String, Optional<String>> VARS = name -> switch (name) {
        case "provincia" -> Optional.of("Sevilla");
        case "nombre", "inicial", "edad" -> Optional.of("¡FILTRADO!");
        default -> Optional.empty();
    };

    @Test
    void alternativasSorteaTodasLasOpcionesYNadaMas() {
        Set<String> seen = new HashSet<>();
        for (long seed = 0; seed < 300; seed++) {
            seen.add(TextRenderer.render("Mmm… [ojo|cuidado|atención].", new SplittableRandom(seed), VARS));
        }
        assertThat(seen).containsExactlyInAnyOrder("Mmm… ojo.", "Mmm… cuidado.", "Mmm… atención.");
    }

    @Test
    void variosGruposDeAlternativasYUnaSolaOpcion() {
        String out = TextRenderer.render("[a|b] y [c] y [d|e]", new SplittableRandom(1), VARS);
        assertThat(out).matches("[ab] y c y [de]");
    }

    @Test
    void variablesDeClienteQuedanIntactasAunqueHayaValor() {
        String out = TextRenderer.render("{nombre} ({inicial}, {edad}) de {provincia} elige {opcion}",
                new SplittableRandom(1), VARS);
        assertThat(out).isEqualTo("{nombre} ({inicial}, {edad}) de Sevilla elige {opcion}");
    }

    @Test
    void variablesDesconocidasOSinValorSeDejan() {
        assertThat(TextRenderer.render("{inventada} y {plato}", new SplittableRandom(1), VARS))
                .isEqualTo("{inventada} y {plato}");
    }

    @Test
    void resolvableSoloExigeVariablesDeServidor() {
        assertThat(TextRenderer.resolvable("{nombre} de {provincia}", TextRenderer.SERVER_VARIABLES, VARS)).isTrue();
        assertThat(TextRenderer.resolvable("{plato}", TextRenderer.SERVER_VARIABLES, VARS)).isFalse();
        assertThat(TextRenderer.resolvable("{desconocida}", TextRenderer.SERVER_VARIABLES, VARS)).isTrue();
    }

    @Test
    void quitaVariablesDeServidorSinResolverPeroNoLasDelNavegador() {
        assertThat(TextRenderer.stripUnresolvedServerVariables("Hola {nombre}, tu {carta} manda ."))
                .isEqualTo("Hola {nombre}, tu manda.");
        assertThat(TextRenderer.stripUnresolvedServerVariables("{inventada} queda")).isEqualTo("{inventada} queda");
    }

    @Test
    void gentilicioEnMasculinoSingular() {
        assertThat(TextRenderer.gentilicio("sevillano/a")).isEqualTo("sevillano");
        assertThat(TextRenderer.gentilicio("alavés/a")).isEqualTo("alavés");
        assertThat(TextRenderer.gentilicio("ceutí")).isEqualTo("ceutí");
    }

    @Test
    void textoConDolarYBarrasNoRompeElReemplazo() {
        assertThat(TextRenderer.render("Cuesta 5$ \\o/ en {provincia}", new SplittableRandom(1), VARS))
                .isEqualTo("Cuesta 5$ \\o/ en Sevilla");
    }
}
