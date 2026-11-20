package es.arcana.content.web;

import es.arcana.content.CatalogService;
import es.arcana.content.LanguageResolver;
import es.arcana.content.web.CatalogDtos.DeckDto;
import es.arcana.content.web.CatalogDtos.ProvinceDto;
import es.arcana.content.web.CatalogDtos.SpreadDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;

import java.util.List;

@RestController
@Validated
@RequestMapping(path = "/api/v1", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "Contenido", description = "Barajas, tiradas, provincias, diplomas y textos del navegador")
public class ContentController {

    private final CatalogService catalog;
    private final LanguageResolver langs;

    public ContentController(CatalogService catalog, LanguageResolver langs) {
        this.catalog = catalog;
        this.langs = langs;
    }

    @GetMapping("/decks")
    @Operation(summary = "Barajas y modelos con sus imágenes")
    public List<DeckDto> decks(@RequestParam(required = false) @Pattern(regexp = "[a-z]{2,3}", message = "lang no válido") String lang,
                               @RequestHeader(name = HttpHeaders.ACCEPT_LANGUAGE, required = false) String accept) {
        return catalog.decks(langs.resolve(lang, null, accept));
    }

    @GetMapping("/spreads")
    @Operation(summary = "Tiradas disponibles (opcionalmente para una baraja)")
    public List<SpreadDto> spreads(
            @RequestParam(required = false) @Pattern(regexp = "tarot|spanish", message = "deck debe ser tarot o spanish") String deck,
            @RequestParam(required = false) @Pattern(regexp = "[a-z]{2,3}", message = "lang no válido") String lang,
            @RequestHeader(name = HttpHeaders.ACCEPT_LANGUAGE, required = false) String accept) {
        return catalog.spreads(deck, langs.resolve(lang, null, accept));
    }

    @GetMapping("/provinces")
    @Operation(summary = "Provincias con un chascarrillo de muestra")
    public List<ProvinceDto> provinces(@RequestParam(required = false) @Pattern(regexp = "[a-z]{2,3}", message = "lang no válido") String lang,
                                       @RequestHeader(name = HttpHeaders.ACCEPT_LANGUAGE, required = false) String accept) {
        return catalog.provinces(langs.resolve(lang, null, accept));
    }

    @GetMapping("/titles")
    @Operation(summary = "Diplomas de la vidente (titles.json tal cual)")
    public JsonNode titles(@RequestParam(required = false) @Pattern(regexp = "[a-z]{2,3}", message = "lang no válido") String lang,
                           @RequestHeader(name = HttpHeaders.ACCEPT_LANGUAGE, required = false) String accept) {
        return catalog.titles(langs.resolve(lang, null, accept));
    }

    @GetMapping("/content/onboarding")
    @Operation(summary = "Reacciones del onboarding (onboarding.json tal cual; se resuelven en el navegador)")
    public JsonNode onboarding(@RequestParam(required = false) @Pattern(regexp = "[a-z]{2,3}", message = "lang no válido") String lang,
                               @RequestHeader(name = HttpHeaders.ACCEPT_LANGUAGE, required = false) String accept) {
        return catalog.onboarding(langs.resolve(lang, null, accept));
    }

    @GetMapping("/content/pendulum")
    @Operation(summary = "Frases del péndulo (pendulum.json tal cual): calibrar, enfado, intro… para el navegador",
            description = "Extensión aditiva al §6: las frases de calibración/enfado no tienen endpoint propio.")
    public JsonNode pendulum(@RequestParam(required = false) @Pattern(regexp = "[a-z]{2,3}", message = "lang no válido") String lang,
                             @RequestHeader(name = HttpHeaders.ACCEPT_LANGUAGE, required = false) String accept) {
        return catalog.pendulum(langs.resolve(lang, null, accept));
    }
}
