package es.arcana.narrative;

import es.arcana.Fixture;
import es.arcana.common.ReadingContext;
import es.arcana.content.ContentRepository;
import es.arcana.content.model.CardDef;
import es.arcana.content.model.DeckDef;
import es.arcana.narrative.NarrativeEngine.ReadingScript;
import es.arcana.narrative.ReadingNarrative.Line;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

class NarrativeEngineTest {

    private static final ContentRepository REPO = Fixture.repo();
    private static final NarrativeOptions NO_MOOD = new NarrativeOptions(0, 1, 0, 3);

    private static NarrativeEngine engine(NarrativeOptions o) {
        return new NarrativeEngine(REPO, Fixture.time(), o);
    }

    private static NarrativeCard card(String id, boolean reversed, String pos) {
        DeckDef tarot = REPO.deck("tarot").orElseThrow();
        CardDef def = tarot.cards().stream().filter(c -> c.id().equals(id)).findFirst().orElseThrow();
        return new NarrativeCard(def, REPO.lang("es").cards("tarot").cardName("rws", id),
                REPO.lang("es").cards("tarot").suitName(def.suit()), reversed, pos, pos, "tu " + pos);
    }

    private static List<NarrativeCard> threeCards() {
        return List.of(card("copas-01", false, "pasado"), card("espadas-02", false, "presente"),
                card("copas-reina", false, "futuro"));
    }

    private static ReadingContext ctx(String tema, String provincia, long toneSeed) {
        return new ReadingContext("leo", 30, 7, provincia, tema, toneSeed, 23, 5, "es");
    }

    private static ReadingScript script(List<NarrativeCard> cards, ReadingContext ctx, List<String> recent, long seed) {
        return new ReadingScript("es", "tarot", "ppf", cards, ctx, recent, seed);
    }

    private static Stream<String> allTexts(ReadingNarrative r) {
        return Stream.concat(Stream.of(r.intro(), r.summary(), r.outro()),
                r.cards().stream().flatMap(c -> c.lines().stream()).map(Line::text));
    }

    @Test
    void estructuraPorCartaYOrden() {
        ReadingNarrative r = engine(NO_MOOD).compose(script(threeCards(), ctx("amor", "28", 1), List.of(), 7));
        assertThat(r.cards()).hasSize(3);
        for (var c : r.cards()) {
            assertThat(c.lines()).extracting(Line::kind)
                    .containsExactly("entrada", "puente", "nucleo", "personalizacion", "guino");
        }
        // núcleo según tema y orientación
        assertThat(r.cards().getFirst().lines().get(2).text()).isEqualTo("copas-01 derecha amor");
        assertThat(r.disclaimer()).isEqualTo("Entretenimiento, no consejo profesional.");
        assertThat(r.luckyNumber()).isBetween(1, 99);
        assertThat(r.luckyColor().hex()).startsWith("#");
    }

    @Test
    void deterministaConLaMismaSemilla() {
        var a = engine(NarrativeOptions.DEFAULTS).compose(script(threeCards(), ctx("amor", "28", 5), List.of(), 99));
        var b = engine(NarrativeOptions.DEFAULTS).compose(script(threeCards(), ctx("amor", "28", 5), List.of(), 99));
        assertThat(a).isEqualTo(b);
    }

    @Test
    void variablesDeClienteIntactasYDeServidorSustituidas() {
        ReadingNarrative r = engine(NO_MOOD).compose(script(threeCards(), ctx("general", "28", 1), List.of(), 3));
        List<String> texts = allTexts(r).toList();
        assertThat(texts).anyMatch(t -> t.contains("{nombre}"));
        assertThat(texts).filteredOn(t -> t.startsWith("Perso ")).allMatch(t -> t.contains("{nombre}, {inicial}, {edad}"));
        assertThat(texts).filteredOn(t -> t.startsWith("Puente")).allMatch(t -> t.contains("en tu ") && !t.contains("{posicion}"));
        assertThat(texts).noneMatch(t -> t.contains("[") || t.contains("{posicion}") || t.contains("{provincia}"));
    }

    @Test
    void condicionWhenElegidaConVariablesDeProvincia() {
        // fragmento con when.provincia=41 y peso enorme: en Sevilla sale, con plato sustituido
        ReadingNarrative r = engine(NO_MOOD).compose(script(threeCards(), ctx("general", "41", 1), List.of(), 3));
        assertThat(allTexts(r)).contains("Desde Sevilla (Andalucía) huele a el salmorejo.");
        ReadingNarrative madrid = engine(NO_MOOD).compose(script(threeCards(), ctx("general", "28", 1), List.of(), 3));
        assertThat(madrid.usedFragmentIds()).doesNotContain("personalizacion.comun.provincia");
    }

    @Test
    void cartaConcretaEInvertida() {
        var cards = List.of(card("mayor-16", false, "pasado"), card("copas-01", true, "presente"));
        ReadingNarrative r = engine(NO_MOOD).compose(script(cards, ctx("general", null, 1), List.of(), 1));
        assertThat(r.cards().get(0).lines().getFirst().text()).isEqualTo("¡La Torre! Tranquilidad: es cambio.");
        assertThat(r.cards().get(1).lines().getFirst().text()).isEqualTo("Uy, al revés.");
        assertThat(r.cards().get(1).lines().get(2).text()).startsWith("copas-01 invertida general");
    }

    @Test
    void noRepiteDentroDeLaLecturaNiLosRecientes() {
        NarrativeEngine e = engine(NO_MOOD);
        for (long seed = 0; seed < 50; seed++) {
            ReadingNarrative first = e.compose(script(threeCards(), ctx("general", null, 1), List.of(), seed));
            assertThat(new HashSet<>(first.usedFragmentIds())).hasSameSizeAs(first.usedFragmentIds());
            // excluyendo los usados (hay suficientes alternativas) la segunda lectura no repite ninguno
            List<String> recentEntradas = first.usedFragmentIds().stream()
                    .filter(id -> id.startsWith("entrada.") || id.startsWith("puente.")).toList();
            ReadingNarrative second = e.compose(script(threeCards(), ctx("general", null, 1), recentEntradas, seed + 1000));
            assertThat(second.usedFragmentIds()).doesNotContainAnyElementsOf(recentEntradas);
        }
    }

    @Test
    void siSeAgotanLosRecientesSeReutilizanAntesQueQuedarseSinTexto() {
        // Todos los saludos de la fixture son "recientes": aun así hay saludo.
        List<String> allSaludos = REPO.lang("es").fragments("saludo").stream().map(f -> f.id()).toList();
        ReadingNarrative r = engine(NO_MOOD).compose(script(threeCards(), ctx("general", null, 1), allSaludos, 1));
        assertThat(r.intro()).isNotBlank();
    }

    @Test
    void temaSaludAnadeDescargo() {
        ReadingNarrative r = engine(NO_MOOD).compose(script(threeCards(), ctx("salud", null, 1), List.of(), 1));
        assertThat(r.cards().getFirst().lines()).extracting(Line::kind).contains("salud");
        assertThat(r.disclaimer()).contains("médico");
    }

    @Test
    void cambioDeHumorAMitadDeLectura() {
        ReadingNarrative r = engine(new NarrativeOptions(1, 0, 0, 3))
                .compose(script(threeCards(), ctx("general", null, 1), List.of(), 1));
        String initial = r.tone();
        assertThat(r.cards().get(0).tone()).isEqualTo(initial);
        assertThat(r.cards().get(0).lines().getLast().kind()).isEqualTo("cambioHumor");
        assertThat(r.cards().get(1).tone()).isNotEqualTo(initial);
        assertThat(r.cards().get(2).tone()).isEqualTo(r.cards().get(1).tone());
        assertThat(r.cards().get(0).lines().getLast().text()).doesNotContain("{tono}");
    }

    @Test
    void tonoInicialDependeDeToneSeedYSoloDeTonosConContenido() {
        Set<String> tones = new HashSet<>();
        for (long s = 0; s < 200; s++) {
            tones.add(engine(NO_MOOD).compose(script(threeCards(), ctx("general", null, s), List.of(), 1)).tone());
        }
        assertThat(tones).containsExactlyInAnyOrder("mistica", "abuela");
        String a = engine(NO_MOOD).compose(script(threeCards(), ctx("general", null, 42), List.of(), 1)).tone();
        String b = engine(NO_MOOD).compose(script(threeCards(), ctx("general", null, 42), List.of(), 2)).tone();
        assertThat(a).isEqualTo(b);
    }

    @Test
    void sintesisConMayoresPaloYFiguras() {
        var majors = List.of(card("mayor-00", false, "pasado"), card("mayor-01", false, "presente"),
                card("mayor-16", false, "futuro"));
        assertThat(engine(NO_MOOD).compose(script(majors, ctx("general", null, 1), List.of(), 1)).summary())
                .isEqualTo("Muchos arcanos mayores: momento trascendente.");
        var copas = List.of(card("copas-01", false, "pasado"), card("copas-reina", false, "presente"),
                card("mayor-00", false, "futuro"));
        assertThat(engine(NO_MOOD).compose(script(copas, ctx("general", null, 1), List.of(), 1)).summary())
                .isEqualTo("Las copas mandan.");
    }

    @Test
    void interaccionesComoMaximoTres() {
        List<NarrativeCard> many = new ArrayList<>();
        String[] ids = {"mayor-00", "mayor-01", "mayor-16", "copas-01", "copas-reina", "espadas-02"};
        for (String id : ids) {
            many.add(card(id, false, "pasado"));
        }
        ReadingNarrative r = engine(new NarrativeOptions(0, 0, 1, 3))
                .compose(script(many, ctx("general", null, 1), List.of(), 1));
        long n = r.cards().stream().filter(c -> c.interaction() != null).count();
        // sólo hay 2 interacciones en la fixture y no se repiten
        assertThat(n).isEqualTo(2);
        assertThat(r.cards().getFirst().interaction().options()).containsExactly("si", "no", "skip");
    }

    @Test
    void nextLineDevuelveLaRamaConVariables() {
        NarrativeEngine e = engine(NO_MOOD);
        assertThat(e.nextLine("es", "letra-m", "si", "mistica", ctx("amor", "41", 1)))
                .contains("Lo sabía, desde Sevilla se nota.");
        assertThat(e.nextLine("es", "letra-m", "no", null, ReadingContext.EMPTY)).contains("Pues aparecerá, {nombre}.");
        assertThat(e.nextLine("es", "no-existe", "si", null, null)).isEmpty();
    }

    @Test
    void fallbackDeIdiomaPorSlot() {
        ReadingNarrative ca = engine(NO_MOOD).compose(new ReadingScript("ca", "tarot", "ppf", threeCards(),
                ctx("general", null, 1), List.of(), 1));
        assertThat(ca.intro()).isEqualTo("Bon dia."); // el slot saludo existe en ca
        assertThat(ca.cards().getFirst().lines().getFirst().text()).startsWith("Entrada "); // entrada cae a es
    }
}
