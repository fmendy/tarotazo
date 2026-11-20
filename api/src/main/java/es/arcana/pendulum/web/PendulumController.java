package es.arcana.pendulum.web;

import es.arcana.common.ReadingContext;
import es.arcana.content.LanguageResolver;
import es.arcana.ops.UsageMetrics;
import es.arcana.pendulum.PendulumService;
import es.arcana.pendulum.web.PendulumDtos.PendulumRequest;
import es.arcana.pendulum.web.PendulumDtos.PendulumResponse;
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
@RequestMapping(path = "/api/v1/pendulum", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "Péndulo", description = "El Oráculo Oscilante")
public class PendulumController {

    private final PendulumService pendulum;
    private final LanguageResolver langs;
    private final UsageMetrics metrics;

    public PendulumController(PendulumService pendulum, LanguageResolver langs, UsageMetrics metrics) {
        this.pendulum = pendulum;
        this.langs = langs;
        this.metrics = metrics;
    }

    @PostMapping(path = "/answer", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Respuesta del péndulo según modo (la pregunta y las opciones nunca se envían)")
    public PendulumResponse answer(@Valid @RequestBody PendulumRequest req,
                                   @RequestParam(required = false) String lang,
                                   @RequestHeader(name = HttpHeaders.ACCEPT_LANGUAGE, required = false) String accept) {
        ReadingContext ctx = ReadingContext.orEmpty(req.context());
        PendulumResponse res = pendulum.answer(req, langs.resolve(lang, ctx.lang(), accept));
        metrics.pendulum(req.mode());
        return res;
    }
}
