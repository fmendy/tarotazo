package es.arcana.reading.web;

import es.arcana.common.BadRequestException;
import es.arcana.common.ReadingContext;
import es.arcana.content.LanguageResolver;
import es.arcana.narrative.NarrativeEngine;
import es.arcana.ops.UsageMetrics;
import es.arcana.reading.ReadingService;
import es.arcana.reading.web.ReadingDtos.NextLineRequest;
import es.arcana.reading.web.ReadingDtos.NextLineResponse;
import es.arcana.reading.web.ReadingDtos.ReadingRequest;
import es.arcana.reading.web.ReadingDtos.ReadingResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/readings", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "Lecturas", description = "Tiradas de cartas con textos del motor narrativo")
public class ReadingController {

    private final ReadingService readings;
    private final NarrativeEngine narrative;
    private final LanguageResolver langs;
    private final UsageMetrics metrics;

    public ReadingController(ReadingService readings, NarrativeEngine narrative, LanguageResolver langs,
                             UsageMetrics metrics) {
        this.readings = readings;
        this.narrative = narrative;
        this.langs = langs;
        this.metrics = metrics;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Nueva lectura (no se envían nombre, edad exacta ni pregunta)")
    public ReadingResponse read(@Valid @RequestBody ReadingRequest req,
                                @RequestParam(required = false) String lang,
                                @RequestHeader(name = HttpHeaders.ACCEPT_LANGUAGE, required = false) String accept) {
        ReadingContext ctx = ReadingContext.orEmpty(req.context());
        ReadingResponse res = readings.read(req, langs.resolve(lang, ctx.lang(), accept));
        metrics.reading(req.deck(), req.spread());
        return res;
    }

    @PostMapping(path = "/next-line", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Frase siguiente tras responder a una pregunta Sí/No")
    public NextLineResponse nextLine(@Valid @RequestBody NextLineRequest req,
                                     @RequestParam(required = false) String lang,
                                     @RequestHeader(name = HttpHeaders.ACCEPT_LANGUAGE, required = false) String accept) {
        ReadingContext ctx = ReadingContext.orEmpty(req.context());
        String l = langs.resolve(lang, ctx.lang(), accept);
        return narrative.nextLine(l, req.interactionId(), req.answer(), req.tone(), ctx)
                .map(NextLineResponse::new)
                .orElseThrow(() -> new BadRequestException("Interacción desconocida: '" + req.interactionId() + "'"));
    }
}
