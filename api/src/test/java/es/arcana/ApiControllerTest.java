package es.arcana;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.oneOf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "arcana.content-dir=src/test/resources/content-fixture",
        "arcana.content-strict=true",
        "arcana.rate-limit.enabled=false"})
@AutoConfigureMockMvc
class ApiControllerTest {

    @Autowired
    MockMvc mvc;

    private ResultActions postJson(String path, String body) throws Exception {
        return mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private static final String READING = """
            { "deck": "tarot", "model": "rws", "spread": "ppf", "cutIndex": 2, "picks": [0, 3, 5],
              "context": { "signo": "leo", "decada": 30, "numeroVida": 7, "provincia": "41", "tema": "amor",
                           "toneSeed": 123456789, "hora": 23, "diaSemana": 5, "lang": "es" },
              "recentFragmentIds": ["entrada.mistica.001"] }
            """;

    @Test
    void decks() throws Exception {
        mvc.perform(get("/api/v1/decks"))
                .andExpect(status().isOk())
                .andExpect(header().doesNotExist("Set-Cookie"))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].family", is("tarot")))
                .andExpect(jsonPath("$[0].name", is("Tarot de prueba")))
                .andExpect(jsonPath("$[0].defaultModel", is("rws")))
                .andExpect(jsonPath("$[0].models[0].backImage", is("/art/backs/rws.svg")))
                .andExpect(jsonPath("$[0].models[0].previewImage", is("/art/cards/rws/mayor-00.svg")))
                .andExpect(jsonPath("$[0].models[0].imagePattern", is("/art/cards/rws/{cardId}.svg")))
                .andExpect(jsonPath("$[0].models[0].deckSize", is(6)))
                .andExpect(jsonPath("$[0].models[0].available", is(true)))
                .andExpect(jsonPath("$[0].models[1].numerals.mayor-08", is("XI")));
    }

    @Test
    void spreadsPorBaraja() throws Exception {
        mvc.perform(get("/api/v1/spreads").param("deck", "spanish"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[1].id", is("ppf")))
                .andExpect(jsonPath("$[1].positions[0].id", is("pasado")))
                .andExpect(jsonPath("$[1].positions[0].label", is("Pasado")));
        mvc.perform(get("/api/v1/spreads").param("deck", "tarot")).andExpect(jsonPath("$", hasSize(4)));
        mvc.perform(get("/api/v1/spreads").param("deck", "uno"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("bad_request")));
    }

    @Test
    void provinciasTitulosYOnboarding() throws Exception {
        mvc.perform(get("/api/v1/provinces"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[1].code", is("41")))
                .andExpect(jsonPath("$[1].gentilicio", is("sevillano/a")))
                .andExpect(jsonPath("$[1].teaser", containsString("Sevilla")));
        mvc.perform(get("/api/v1/titles")).andExpect(status().isOk())
                .andExpect(jsonPath("$.titles[0].id", is("magia-torrelodones")));
        mvc.perform(get("/api/v1/titles").header("Accept-Language", "ca-ES,ca;q=0.9"))
                .andExpect(jsonPath("$.titles[0].titulo", is("Graduada en Arts Màgiques")));
        mvc.perform(get("/api/v1/titles").param("lang", "es").header("Accept-Language", "ca"))
                .andExpect(jsonPath("$.titles[0].titulo", is("Graduada en Artes Mágicas")));
        mvc.perform(get("/api/v1/content/onboarding")).andExpect(status().isOk())
                .andExpect(jsonPath("$.puerta.pregunta", is("¿Eres mayor de edad?")));
    }

    @Test
    void lectura() throws Exception {
        postJson("/api/v1/readings", READING)
                .andExpect(status().isOk())
                .andExpect(header().doesNotExist("Set-Cookie"))
                .andExpect(jsonPath("$.tone", notNullValue()))
                .andExpect(jsonPath("$.spread.id", is("ppf")))
                .andExpect(jsonPath("$.spread.layout", is("row")))
                .andExpect(jsonPath("$.cards", hasSize(3)))
                .andExpect(jsonPath("$.cards[0].position", is("pasado")))
                .andExpect(jsonPath("$.cards[0].image", containsString("/art/cards/rws/")))
                .andExpect(jsonPath("$.cards[0].lines[0].kind", is("entrada")))
                .andExpect(jsonPath("$.summary.luckyColor.hex", notNullValue()))
                .andExpect(jsonPath("$.disclaimer", is("Entretenimiento, no consejo profesional.")))
                .andExpect(jsonPath("$.usedFragmentIds", notNullValue()));
    }

    @Test
    void lecturaSinoAdmiteDeUnaATres() throws Exception {
        postJson("/api/v1/readings", "{\"deck\":\"spanish\",\"spread\":\"sino\",\"cutIndex\":0,\"picks\":[2]}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cards", hasSize(1)))
                .andExpect(jsonPath("$.spread.positions", hasSize(1)))
                .andExpect(jsonPath("$.cards[0].reversed", is(false)));
    }

    @Test
    void lecturas400() throws Exception {
        String[][] cases = {
                {"{\"deck\":\"tarot\",\"spread\":\"ppf\",\"cutIndex\":3,\"picks\":[0,1,2]}", "cutIndex"},
                {"{\"deck\":\"tarot\",\"spread\":\"ppf\",\"cutIndex\":0,\"picks\":[0,1]}", "necesita 3"},
                {"{\"deck\":\"tarot\",\"spread\":\"ppf\",\"cutIndex\":0,\"picks\":[0,1,1]}", "distintos"},
                {"{\"deck\":\"tarot\",\"spread\":\"ppf\",\"cutIndex\":0,\"picks\":[0,1,6]}", "fuera de rango"},
                {"{\"deck\":\"tarot\",\"spread\":\"ppf\",\"cutIndex\":0,\"picks\":[0,1,-1]}", "negativo"},
                {"{\"deck\":\"uno\",\"spread\":\"ppf\",\"cutIndex\":0,\"picks\":[0,1,2]}", "deck"},
                {"{\"deck\":\"tarot\",\"model\":\"castellana\",\"spread\":\"ppf\",\"cutIndex\":0,\"picks\":[0,1,2]}", "modelo"},
                {"{\"deck\":\"spanish\",\"spread\":\"celta\",\"cutIndex\":0,\"picks\":[0,1,2]}", "no está disponible"},
                {"{\"deck\":\"tarot\",\"spread\":\"nada\",\"cutIndex\":0,\"picks\":[0]}", "desconocida"},
                {"{\"deck\":\"tarot\",\"spread\":\"ppf\",\"cutIndex\":0}", "picks"},
                {"{\"deck\":\"tarot\",\"spread\":\"ppf\",\"cutIndex\":0,\"picks\":[0,1,2],\"context\":{\"provincia\":\"99\"}}", "provincia"},
                {"{\"deck\":\"tarot\",\"spread\":\"ppf\",\"cutIndex\":0,\"picks\":[0,1,2],\"context\":{\"diaSemana\":0}}", "diaSemana"},
                {"{\"deck\":\"tarot\",\"spread\":\"ppf\",\"cutIndex\":0,\"picks\":[0,1,2],\"context\":{\"tema\":\"futbol\"}}", "tema"},
                {"{ no es json", "JSON"},
                {"{\"deck\":\"tarot\",\"spread\":\"ppf\",\"cutIndex\":\"dos\",\"picks\":[0,1,2]}", "JSON"},
        };
        for (String[] c : cases) {
            postJson("/api/v1/readings", c[0])
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error", is("bad_request")))
                    .andExpect(jsonPath("$.message", containsString(c[1])));
        }
        mvc.perform(post("/api/v1/readings").contentType(MediaType.TEXT_PLAIN).content("hola"))
                .andExpect(status().isUnsupportedMediaType());
        mvc.perform(get("/api/v1/readings")).andExpect(status().isMethodNotAllowed());
        mvc.perform(get("/api/v1/nada")).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", is("not_found")));
    }

    @Test
    void nextLine() throws Exception {
        postJson("/api/v1/readings/next-line",
                "{\"interactionId\":\"letra-m\",\"answer\":\"si\",\"tone\":\"mistica\",\"context\":{\"provincia\":\"41\"}}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.text", is("Lo sabía, desde Sevilla se nota.")));
        postJson("/api/v1/readings/next-line", "{\"interactionId\":\"letra-m\",\"answer\":\"quizas\"}")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message", containsString("answer")));
        postJson("/api/v1/readings/next-line", "{\"interactionId\":\"no-existe\",\"answer\":\"si\"}")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message", containsString("desconocida")));
    }

    @Test
    void pendulo() throws Exception {
        postJson("/api/v1/pendulum/answer", "{\"mode\":\"sino\",\"model\":\"cuarzo\",\"context\":{\"hora\":12}}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mode", is("sino")))
                .andExpect(jsonPath("$.result.answer", oneOf("si", "no", "duda")))
                .andExpect(jsonPath("$.text", notNullValue()));
        postJson("/api/v1/pendulum/answer", "{\"mode\":\"opciones\",\"options\":3}")
                .andExpect(status().isOk()).andExpect(jsonPath("$.text", is("Elige {opcion}.")));
        postJson("/api/v1/pendulum/answer", "{\"mode\":\"opciones\"}").andExpect(status().isBadRequest());
        postJson("/api/v1/pendulum/answer", "{\"mode\":\"opciones\",\"options\":9}").andExpect(status().isBadRequest());
        postJson("/api/v1/pendulum/answer", "{\"mode\":\"bailar\"}")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error", is("bad_request")));
        postJson("/api/v1/pendulum/answer", "{\"mode\":\"sino\",\"model\":\"tostadora\"}").andExpect(status().isBadRequest());
    }

    @Test
    void contenidoDelPendulo() throws Exception {
        mvc.perform(get("/api/v1/content/pendulum").param("provincia", "41"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.models.chorizo.nombre", is("Chorizo de Sevilla")))
                .andExpect(jsonPath("$.models.chorizo.personalidad", is("Grasiento y sevillano")))
                .andExpect(jsonPath("$.models.chorizo.lines.enfado[0]", is("El chorizo se enrolla.")))
                .andExpect(jsonPath("$.models.chorizo.lines['sino.si']").doesNotExist())
                .andExpect(jsonPath("$.lines.concentrar[0]", is("Concéntrate, que se te nota.")))
                .andExpect(jsonPath("$.lines['calibrar.si']", hasSize(1)))
                .andExpect(jsonPath("$.lines['sino.si']").doesNotExist())
                .andExpect(jsonPath("$.lines.ouija").doesNotExist());
        mvc.perform(get("/api/v1/content/pendulum"))
                .andExpect(jsonPath("$.models.chorizo.nombre", is("Chorizo de {provincia}")));
        mvc.perform(get("/api/v1/content/pendulum").param("provincia", "77"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error", is("bad_request")));
    }

    @Test
    void opsSoloHealthYMetricas() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk()).andExpect(jsonPath("$.status", is("UP")))
                .andExpect(jsonPath("$.components").doesNotExist());
        mvc.perform(get("/actuator/env")).andExpect(status().isNotFound());
        mvc.perform(get("/actuator/beans")).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/docs")).andExpect(status().isOk()).andExpect(jsonPath("$.openapi", notNullValue()));
    }
}
