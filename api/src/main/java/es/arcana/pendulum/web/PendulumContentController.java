package es.arcana.pendulum.web;

import es.arcana.common.Ids;
import es.arcana.common.UnavailableException;
import es.arcana.content.ContentRepository;
import es.arcana.content.LangContent;
import es.arcana.content.LanguageResolver;
import es.arcana.content.model.PendulumContent;
import es.arcana.content.model.ProvinceDef;
import es.arcana.content.model.ProvinceSheet;
import es.arcana.narrative.TextRenderer;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.SplittableRandom;
import java.util.function.Function;

/**
 * {@code GET /api/v1/content/pendulum}: lo que el navegador necesita para la vitrina y el ritual (modelos y frases
 * de calibración/concentración/easter eggs). Las frases de respuesta siguen saliendo de {@code POST /pendulum/answer}.
 */
@RestController
@Validated
@Tag(name = "Péndulo")
public class PendulumContentController {

    /** Claves de {@code lines} que se exponen (sin las de respuesta). */
    public static final List<String> RITUAL_KEYS = List.of("intro", "calibrar.intro", "calibrar.si", "calibrar.no",
            "concentrar", "repetida", "enfado", "medianoche");

    private final ContentRepository content;
    private final LanguageResolver langs;

    public PendulumContentController(ContentRepository content, LanguageResolver langs) {
        this.content = content;
        this.langs = langs;
    }

    public record ModelView(String nombre, String personalidad, Map<String, List<String>> lines) {
    }

    public record PendulumContentResponse(Map<String, ModelView> models, Map<String, List<String>> lines) {
    }

    @GetMapping(path = "/api/v1/content/pendulum", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Vitrina y ritual del péndulo: modelos (nombre, personalidad) y frases de calibración, "
            + "concentración, repetida, enfado y medianoche. {provincia} se resuelve si llega ?provincia=")
    public PendulumContentResponse pendulum(
            @RequestParam(required = false) @Pattern(regexp = Ids.RX_PROVINCE, message = "provincia debe ser un código INE \"01\"…\"52\" o \"XX\"") String provincia,
            @RequestParam(required = false) @Pattern(regexp = Ids.RX_LANG, message = "lang no válido") String lang,
            @RequestHeader(name = HttpHeaders.ACCEPT_LANGUAGE, required = false) String accept) {
        LangContent lc = content.lang(langs.resolve(lang, null, accept));
        if (lc.pendulumRaw().isEmpty()) {
            throw new UnavailableException("Contenido no disponible: pendulum.json");
        }
        PendulumContent pc = lc.pendulum();
        Function<String, Optional<String>> vars = variables(lc, provincia);
        SplittableRandom rng = new SplittableRandom(0); // sin alternativas sorteadas: se devuelven listas completas

        Map<String, ModelView> models = new LinkedHashMap<>();
        for (String id : Ids.PENDULUM_MODELS) {
            PendulumContent.PendulumModel m = pc.models().get(id);
            if (m != null) {
                models.put(id, new ModelView(resolve(m.nombre(), vars, rng), resolve(m.personalidad(), vars, rng),
                        ritualLines(m.lines(), vars, rng)));
            }
        }
        return new PendulumContentResponse(models, ritualLines(pc.lines(), vars, rng));
    }

    private static Map<String, List<String>> ritualLines(Map<String, List<String>> lines,
                                                          Function<String, Optional<String>> vars,
                                                          SplittableRandom rng) {
        Map<String, List<String>> out = new LinkedHashMap<>();
        for (String k : RITUAL_KEYS) {
            List<String> l = lines.get(k);
            if (l != null && !l.isEmpty()) {
                out.put(k, l.stream().map(t -> resolve(t, vars, rng)).toList());
            }
        }
        return out;
    }

    /** Sólo sustituye variables de provincia; deja literal todo lo demás (incluidas las alternativas [a|b]). */
    private static String resolve(String text, Function<String, Optional<String>> vars, SplittableRandom rng) {
        if (text == null) {
            return null;
        }
        String out = text;
        for (String v : TextRenderer.variables(text)) {
            Optional<String> value = vars.apply(v);
            if (value.isPresent()) {
                out = out.replace("{" + v + "}", value.get());
            }
        }
        return out;
    }

    private Function<String, Optional<String>> variables(LangContent lc, String code) {
        if (code == null) {
            return name -> Optional.empty();
        }
        Optional<ProvinceSheet> sheet = lc.province(code);
        Optional<ProvinceDef> prov = content.province(code);
        return name -> switch (name) {
            case "provincia" -> sheet.map(ProvinceSheet::nombre).or(() -> prov.map(ProvinceDef::nombre));
            case "comunidad" -> sheet.map(ProvinceSheet::comunidad).or(() -> prov.map(ProvinceDef::comunidad));
            case "gentilicio" -> sheet.map(ProvinceSheet::gentilicio).map(TextRenderer::gentilicio);
            default -> Optional.empty();
        };
    }
}
