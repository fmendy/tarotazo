package es.arcana.content;

import es.arcana.Fixture;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ContentRepositoryTest {

    private static final String COMMON = """
            { "$schema": "https://json-schema.org/draft/2020-12/schema",
              "$id": "https://arcana.tarotazo/schemas/common.schema.json",
              "$defs": { "slug": { "type": "string", "pattern": "^[a-z0-9]+(-[a-z0-9]+)*$" } } }
            """;
    private static final String TITLES = """
            { "$schema": "https://json-schema.org/draft/2020-12/schema",
              "$id": "https://arcana.tarotazo/schemas/titles.schema.json",
              "type": "object", "required": ["titles"],
              "properties": { "titles": { "type": "array", "items": { "type": "object",
                "required": ["id", "anio"],
                "properties": { "id": { "$ref": "common.schema.json#/$defs/slug" }, "anio": { "type": "integer" } } } } } }
            """;

    @Test
    void fixtureCargaEnModoEstricto() {
        ContentRepository repo = Fixture.repo();
        assertThat(repo.report().hasErrors()).isFalse();
        assertThat(repo.decks()).extracting(d -> d.family()).containsExactly("tarot", "spanish");
        assertThat(repo.spreads()).extracting(s -> s.id()).containsExactly("dia", "ppf", "sino", "celta");
        assertThat(repo.languages()).containsExactlyInAnyOrder("es", "ca");
    }

    @Test
    void fallbackDeIdiomaPorFicheroYPorClave() {
        ContentRepository repo = Fixture.repo();
        LangContent ca = repo.lang("ca");
        assertThat(ca.titles().orElseThrow().at("/titles/0/titulo").asString()).isEqualTo("Graduada en Arts Màgiques");
        // ca no tiene onboarding ni cartas: se usan las de es
        assertThat(ca.onboarding()).isPresent();
        assertThat(ca.cards("tarot").cardName("rws", "mayor-16")).isEqualTo("La Torre");
        assertThat(ca.cards("tarot").cardName("marsella", "mayor-01")).isEqualTo("El Mago de Marsella");
        // idioma desconocido -> es
        assertThat(repo.lang("de").lang()).isEqualTo("es");
    }

    @Test
    void interaccionesYEtiquetasConservanElOrdenDelFichero() {
        LangContent es = Fixture.repo().lang("es");
        // determinista entre ejecuciones de la JVM (antes Map.copyOf barajaba el orden de iteración)
        assertThat(es.interactions().keySet()).containsExactly("letra-m", "viaje");
        assertThat(es.labels().signos().get("geminis")).isEqualTo("Géminis");
        assertThat(es.labels().provinciaExtranjero()).isEqualTo("tierras lejanas");
        assertThat(es.labels().luckyColors()).isNotEmpty();
    }

    @Test
    void spanish40ExcluyeOnly48() {
        var spanish = Fixture.repo().deck("spanish").orElseThrow();
        var m = spanish.models().getFirst();
        assertThat(spanish.cardsFor(m)).hasSize(5); // deckSize 5 (no 40): incluye only48
        var m40 = new es.arcana.content.model.DeckModelDef("x", 40, "x", null, null, null, null);
        assertThat(spanish.cardsFor(m40)).hasSize(4);
    }

    private static Path copyFixture(Path target) throws IOException {
        try (Stream<Path> s = Files.walk(Fixture.DIR)) {
            for (Path p : s.toList()) {
                Path dest = target.resolve(Fixture.DIR.relativize(p).toString());
                if (Files.isDirectory(p)) {
                    Files.createDirectories(dest);
                } else {
                    Files.copy(p, dest);
                }
            }
        }
        Files.createDirectories(target.resolve("schemas"));
        Files.writeString(target.resolve("schemas/common.schema.json"), COMMON);
        Files.writeString(target.resolve("schemas/titles.schema.json"), TITLES);
        return target;
    }

    @Test
    void esquemaConRefRelativoValida(@TempDir Path tmp) throws IOException {
        ContentRepository repo = ContentRepository.forDirectory(copyFixture(tmp), true);
        assertThat(repo.report().hasErrors()).isFalse();
    }

    @Test
    void contenidoInvalidoFallaEnEstrictoYAvisaEnDev(@TempDir Path tmp) throws IOException {
        Path dir = copyFixture(tmp);
        Files.writeString(dir.resolve("es/titles.json"), "{ \"titles\": [ { \"id\": \"Mal Id\", \"anio\": \"1987\" } ] }");
        Files.writeString(dir.resolve("es/interactions.json"), "{ esto no es json");

        assertThatThrownBy(() -> ContentRepository.forDirectory(dir, true))
                .isInstanceOf(ContentException.class)
                .hasMessageContaining("no es válido");

        ContentRepository dev = ContentRepository.forDirectory(dir, false);
        assertThat(dev.report().errors()).extracting(ContentReport.Issue::file)
                .contains("es/titles.json", "es/interactions.json");
        assertThat(dev.report().format(10)).contains("titles.schema.json").contains("JSON mal formado");
        // aun así sirve lo que sí es válido
        assertThat(dev.decks()).hasSize(2);
    }

    @Test
    void faltaFicheroObligatorio(@TempDir Path tmp) throws IOException {
        Path dir = copyFixture(tmp);
        Files.delete(dir.resolve("es/pendulum.json"));
        assertThatThrownBy(() -> ContentRepository.forDirectory(dir, true)).isInstanceOf(ContentException.class);
        assertThat(ContentRepository.forDirectory(dir, false).report().errors())
                .anyMatch(i -> i.file().equals("es/pendulum.json") && i.message().contains("falta"));
    }

    @Test
    void schemaPorRuta() {
        assertThat(SchemaValidator.schemaFor("decks/tarot.json")).contains("deck.schema.json");
        assertThat(SchemaValidator.schemaFor("es/cards/tarot.json")).contains("cards-i18n.schema.json");
        assertThat(SchemaValidator.schemaFor("ca/provinces/28.json")).contains("province-sheet.schema.json");
        assertThat(SchemaValidator.schemaFor("es/spreads.json")).contains("spreads-i18n.schema.json");
        assertThat(SchemaValidator.schemaFor("schemas/examples/x.json")).isEmpty();
    }

    @Test
    void resolverDeIdioma() {
        LanguageResolver r = new LanguageResolver(Fixture.repo());
        assertThat(r.resolve(null, null, null)).isEqualTo("es");
        assertThat(r.resolve(null, null, "ca-ES,ca;q=0.9,en;q=0.5")).isEqualTo("ca");
        assertThat(r.resolve(null, null, "de-DE,en;q=0.5")).isEqualTo("es");
        assertThat(r.resolve("es", "ca", "ca")).isEqualTo("es");
        assertThat(r.resolve(null, "ca", "es")).isEqualTo("ca");
        assertThat(r.resolve(null, null, "@@@;;")).isEqualTo("es");
    }
}
