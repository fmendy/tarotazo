package es.arcana.pendulum;

import es.arcana.common.BadRequestException;
import es.arcana.common.ReadingContext;
import es.arcana.content.ContentRepository;
import es.arcana.content.LangContent;
import es.arcana.content.model.PendulumContent;
import es.arcana.content.model.ProvinceDef;
import es.arcana.content.model.ProvinceSheet;
import es.arcana.content.model.ServerLabels;
import es.arcana.narrative.TextRenderer;
import es.arcana.narrative.TimeContext;
import es.arcana.narrative.Weighted;
import es.arcana.pendulum.web.PendulumDtos.PendulumRequest;
import es.arcana.pendulum.web.PendulumDtos.PendulumResponse;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.SplittableRandom;
import java.util.function.Function;
import java.util.random.RandomGenerator;

/** El Oráculo Oscilante: resultado por modo (azar) + frase del péndulo. */
@Service
public class PendulumService {

    /** Probabilidades del modo sino. */
    static final double P_SI = 0.45;
    static final double P_NO = 0.45;

    private final ContentRepository content;
    private final TimeContext time;
    private final SecureRandom seeds = new SecureRandom();

    public PendulumService(ContentRepository content, TimeContext time) {
        this.content = content;
        this.time = time;
    }

    public PendulumResponse answer(PendulumRequest req, String lang) {
        return answer(req, lang, new SplittableRandom(seeds.nextLong()));
    }

    PendulumResponse answer(PendulumRequest req, String lang, RandomGenerator rng) {
        LangContent lc = content.lang(lang);
        PendulumContent pc = lc.pendulum();
        ReadingContext ctx = ReadingContext.orEmpty(req.context());
        Map<String, String> extra = new HashMap<>();
        Map<String, Object> result = new LinkedHashMap<>();
        String key;
        String provinceCode = ctx.provincia();

        switch (req.mode()) {
            case "sino" -> {
                double r = rng.nextDouble();
                String a = r < P_SI ? "si" : r < P_SI + P_NO ? "no" : "duda";
                result.put("answer", a);
                extra.put("respuesta", lc.labels().respuestas().getOrDefault(a, a));
                key = "sino." + a;
            }
            case "tablero" -> {
                int sector = rng.nextInt(5);
                result.put("sector", sector);
                extra.put("respuesta", lc.labels().respuestas().getOrDefault("tablero." + sector, String.valueOf(sector)));
                key = "tablero." + sector;
            }
            case "porcentaje" -> {
                int value = rng.nextInt(101);
                result.put("value", value);
                extra.put("porcentaje", String.valueOf(value));
                key = "porcentaje." + (value >= 67 ? "alto" : value >= 34 ? "medio" : "bajo");
            }
            case "ouija" -> {
                String word = Weighted.uniform(pc.ouijaWords(), rng).orElse("SI");
                result.put("word", word);
                extra.put("palabra", word);
                key = "ouija";
            }
            case "mapa" -> {
                List<ProvinceDef> real = content.provinces().stream().filter(p -> !"XX".equals(p.code())).toList();
                ProvinceDef p = Weighted.uniform(real, rng)
                        .orElseThrow(() -> new BadRequestException("No hay provincias cargadas"));
                result.put("provincia", p.code());
                provinceCode = p.code();
                key = "mapa";
            }
            case "opciones" -> {
                if (req.options() == null) {
                    throw new BadRequestException("options es obligatorio en modo opciones (2–6)");
                }
                result.put("index", rng.nextInt(req.options()));
                key = "opciones";
            }
            case "chakras" -> {
                List<Map<String, Object>> levels = new ArrayList<>();
                for (PendulumContent.Chakra c : pc.chakras()) {
                    int nivel = rng.nextInt(101);
                    String informe = Weighted.uniform(c.informes(), rng)
                            .map(t -> TextRenderer.render(t, rng, v -> v.equals("nivel")
                                    ? Optional.of(String.valueOf(nivel)) : Optional.empty()))
                            .orElse(null);
                    Map<String, Object> l = new LinkedHashMap<>();
                    l.put("id", c.id());
                    l.put("nivel", nivel);
                    l.put("informe", informe);
                    levels.add(l);
                }
                result.put("levels", levels);
                key = "chakras.intro";
            }
            default -> throw new BadRequestException("mode desconocido: " + req.mode());
        }

        TimeContext.Moment moment = time.moment(ctx);
        Function<String, Optional<String>> vars = variables(lc, ctx, moment, provinceCode, extra, rng);
        String text = line(pc, req.model(), key, vars, rng);
        if (moment.hora() == 0) {
            String midnight = line(pc, req.model(), "medianoche", vars, rng);
            if (!midnight.isEmpty()) {
                text = text.isEmpty() ? midnight : text + " " + midnight;
            }
        }
        return new PendulumResponse(req.mode(), result, text);
    }

    private static String line(PendulumContent pc, String model, String key, Function<String, Optional<String>> vars,
                               RandomGenerator rng) {
        List<String> candidates = pc.linesFor(model, key).stream()
                .filter(t -> TextRenderer.resolvable(t, TextRenderer.SERVER_VARIABLES, vars))
                .toList();
        return Weighted.uniform(candidates, rng).map(t -> TextRenderer.render(t, rng, vars)).orElse("");
    }

    private Function<String, Optional<String>> variables(LangContent lc, ReadingContext ctx, TimeContext.Moment m,
                                                         String provinceCode, Map<String, String> extra,
                                                         RandomGenerator rng) {
        ServerLabels labels = lc.labels();
        Optional<ProvinceSheet> sheet = lc.province(provinceCode);
        Optional<ProvinceDef> prov = provinceCode == null ? Optional.empty() : content.province(provinceCode);
        return name -> {
            if (extra.containsKey(name)) {
                return Optional.of(extra.get(name));
            }
            return switch (name) {
                case "provincia" -> sheet.map(ProvinceSheet::nombre).or(() -> prov.map(ProvinceDef::nombre));
                case "comunidad" -> sheet.map(ProvinceSheet::comunidad).or(() -> prov.map(ProvinceDef::comunidad));
                case "gentilicio" -> sheet.map(ProvinceSheet::gentilicio).map(TextRenderer::gentilicio);
                case "plato" -> sheet.flatMap(s -> Weighted.uniform(s.plato(), rng));
                case "fiesta" -> sheet.flatMap(s -> Weighted.uniform(s.fiesta(), rng));
                case "clima" -> sheet.flatMap(s -> Weighted.uniform(s.clima(), rng));
                case "signo" -> Optional.ofNullable(ctx.signo()).map(s -> labels.signos().getOrDefault(s, s));
                case "decada" -> Optional.ofNullable(ctx.decada()).map(String::valueOf);
                case "numeroVida" -> Optional.ofNullable(ctx.numeroVida()).map(String::valueOf);
                case "hora" -> Optional.of(String.valueOf(m.hora()));
                case "diaSemana" -> Optional.of(labels.dias().getOrDefault(String.valueOf(m.diaSemana()),
                        String.valueOf(m.diaSemana())));
                case "estacion" -> Optional.of(labels.estaciones().getOrDefault(m.estacion(), m.estacion()));
                case "faseLunar" -> Optional.of(labels.fasesLunares().getOrDefault(m.faseLunar(), m.faseLunar()));
                default -> Optional.empty();
            };
        };
    }
}
