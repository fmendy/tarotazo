package es.arcana.pendulum.web;

import es.arcana.common.Ids;
import es.arcana.common.UnavailableException;
import es.arcana.content.ContentRepository;
import es.arcana.content.LangContent;
import es.arcana.content.LanguageResolver;
import es.arcana.content.model.PendulumContent;
import es.arcana.content.model.ProvinceDef;
import es.arcana.content.model.ProvinceSheet;
import es.arcana.narrative.ProvinceNames;
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

        Map<String, ModelView> models = new LinkedHashMap<>();
        for (String id : Ids.PENDULUM_MODELS) {
            PendulumContent.PendulumModel m = pc.models().get(id);
            if (m != null) {
                models.put(id, new ModelView(resolve(m.nombre(), vars), resolve(m.personalidad(), vars),
                        ritualLines(m.lines(), vars)));
            }
        }
        return new PendulumContentResponse(models, ritualLines(pc.lines(), vars));
    }

    private static Map<String, List<String>> ritualLines(Map<String, List<String>> lines,
                                                          Function<String, Optional<String>> vars) {
        Map<String, List<String>> out = new LinkedHashMap<>();
        for (String k : RITUAL_KEYS) {
            List<String> l = lines.getOrDefault(k, List.of()).stream()
                    .filter(t -> TextRenderer.resolvable(t, SERVER_VARS, vars))
                    .map(t -> resolve(t, vars))
                    .toList();
            if (!l.isEmpty()) {
                out.put(k, l);
            }
        }
        return out;
    }

    /** Variables de servidor que puede usar este contenido (las del §3.2). */
    private static final java.util.Set<String> SERVER_VARS = TextRenderer.SERVER_VARIABLES;

    /**
     * Sustituye las variables de servidor con valor y deja literal lo demás (variables del navegador y las
     * alternativas {@code [a|b]}, que el navegador sortea). Una variable de servidor sin valor se elimina para no
     * enseñar nunca una plantilla sin resolver.
     */
    private static String resolve(String text, Function<String, Optional<String>> vars) {
        if (text == null) {
            return null;
        }
        String out = text;
        for (String v : TextRenderer.variables(text)) {
            Optional<String> value = vars.apply(v);
            if (value.isPresent()) {
                out = out.replace("{" + v + "}", value.get());
            } else if (SERVER_VARS.contains(v)) {
                out = out.replace("{" + v + "}", "").replaceAll("\\s{2,}", " ").trim();
            }
        }
        return out;
    }

    private Function<String, Optional<String>> variables(LangContent lc, String code) {
        Optional<ProvinceSheet> sheet = lc.province(code);
        Optional<ProvinceDef> prov = code == null ? Optional.empty() : content.province(code);
        return name -> switch (name) {
            case "provincia" -> ProvinceNames.provincia(lc.labels(), code, sheet, prov);
            case "comunidad" -> sheet.map(ProvinceSheet::comunidad).or(() -> prov.map(ProvinceDef::comunidad));
            case "gentilicio" -> sheet.map(ProvinceSheet::gentilicio).map(TextRenderer::gentilicio);
            default -> Optional.empty();
        };
    }
}
