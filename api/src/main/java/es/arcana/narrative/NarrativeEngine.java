package es.arcana.narrative;

import es.arcana.common.Ids;
import es.arcana.common.ReadingContext;
import es.arcana.content.ContentRepository;
import es.arcana.content.LangContent;
import es.arcana.content.model.Fragment;
import es.arcana.content.model.Interaction;
import es.arcana.content.model.LuckyColor;
import es.arcana.content.model.ProvinceDef;
import es.arcana.content.model.ProvinceSheet;
import es.arcana.content.model.ServerLabels;
import es.arcana.narrative.ReadingNarrative.CardNarrative;
import es.arcana.narrative.ReadingNarrative.InteractionPrompt;
import es.arcana.narrative.ReadingNarrative.Line;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.SplittableRandom;
import java.util.function.Function;
import java.util.random.RandomGenerator;

/**
 * Motor narrativo (CONTRACTS §3.4). Determinista dado {@code textSeed} y las cartas: el azar de las cartas lo pone
 * {@code reading} con {@code SecureRandom}; aquí sólo se eligen textos.
 */
@Service
public class NarrativeEngine {

    public static final List<String> INTERACTION_OPTIONS = List.of("si", "no", "skip");

    private static final SecureRandom SEEDS = new SecureRandom();

    private final ContentRepository content;
    private final TimeContext time;
    private final NarrativeOptions options;

    @Autowired
    public NarrativeEngine(ContentRepository content, TimeContext time) {
        this(content, time, NarrativeOptions.DEFAULTS);
    }

    public NarrativeEngine(ContentRepository content, TimeContext time, NarrativeOptions options) {
        this.content = content;
        this.time = time;
        this.options = options;
    }

    /** Entrada del motor. {@code toneSeed} del contexto fija el tono inicial de la sesión. */
    public record ReadingScript(String lang, String family, String spread, List<NarrativeCard> cards,
                                ReadingContext ctx, Collection<String> recentFragmentIds, long textSeed) {
    }

    public ReadingNarrative compose(ReadingScript script) {
        LangContent lc = content.lang(script.lang());
        ReadingContext ctx = ReadingContext.orEmpty(script.ctx());
        RandomGenerator rng = new SplittableRandom(script.textSeed());
        Set<String> used = new LinkedHashSet<>();
        Set<String> recent = script.recentFragmentIds() == null ? Set.of() : new HashSet<>(script.recentFragmentIds());
        Situation reading = new Situation(script.family(), script.spread(), ctx, time.moment(ctx), script.cards(),
                null, -1);
        int n = reading.cards().size();

        Tones tones = new Tones(lc);
        String tone = tones.initial(ctx.toneSeed());
        int moodAt = -1;
        String newTone = null;
        if (n >= 2 && rng.nextDouble() < options.moodChangeProbability()) {
            moodAt = n / 2;
            newTone = tones.other(tone, rng);
        }

        String intro = text(lc, "saludo", tone, reading, used, recent, rng);

        List<CardNarrative> cards = new ArrayList<>(n);
        int interactions = 0;
        String currentTone = tone;
        for (int i = 0; i < n; i++) {
            Situation s = reading.forCard(i);
            if (moodAt >= 0 && i == moodAt) {
                currentTone = newTone;
            }
            List<Line> lines = new ArrayList<>();
            line(lines, "entrada", text(lc, "entrada", currentTone, s, used, recent, rng));
            line(lines, "puente", text(lc, "puente", currentTone, s, used, recent, rng));
            line(lines, "nucleo", nucleo(lc, s, currentTone, rng));
            if (i == 0 && "salud".equals(ctx.tema())) {
                String salud = text(lc, "salud", currentTone, s, used, recent, rng);
                line(lines, "salud", salud != null ? salud : lc.labels().saludFallback());
            }
            line(lines, "personalizacion", text(lc, "personalizacion", currentTone, s, used, recent, rng));
            if (rng.nextDouble() < options.guinoProbability()) {
                line(lines, "guino", text(lc, "guino", currentTone, s, used, recent, rng));
            }
            if (moodAt >= 0 && i == moodAt - 1) {
                // Frase de transición: se elige entre los fragmentos del tono NUEVO (resolución del contrato).
                final String target = newTone;
                String change = select(lc, "cambioHumor", target, s, used, recent, rng, target)
                        .map(f -> render(f.text(), lc, s, target, rng))
                        .orElse(null);
                if (change == null) {
                    moodAt = -1; // sin frase de transición no hay cambio de humor
                } else {
                    lines.add(new Line("cambioHumor", change));
                }
            }
            InteractionPrompt prompt = null;
            if (interactions < options.maxInteractions() && rng.nextDouble() < options.interactionProbability()) {
                prompt = interaction(lc, currentTone, s, used, recent, rng);
                if (prompt != null) {
                    interactions++;
                }
            }
            cards.add(new CardNarrative(currentTone, List.copyOf(lines), prompt));
        }

        String summary = text(lc, "sintesis", currentTone, reading, used, recent, rng);
        String outro = text(lc, "despedida", currentTone, reading, used, recent, rng);
        ServerLabels labels = lc.labels();
        int lucky = 1 + rng.nextInt(99);
        LuckyColor color = Weighted.uniform(labels.luckyColors(), rng).orElse(new LuckyColor("verde botella", "#1f5e3b"));
        String disclaimer = labels.disclaimer() == null ? "Entretenimiento, no consejo profesional." : labels.disclaimer();
        if ("salud".equals(ctx.tema()) && labels.disclaimerSalud() != null) {
            disclaimer = disclaimer + " " + labels.disclaimerSalud();
        }
        return new ReadingNarrative(tone, intro, List.copyOf(cards), summary == null ? "" : summary, lucky, color,
                outro, disclaimer, List.copyOf(used));
    }

    /** Rama de una interacción ({@code POST /readings/next-line}). */
    public Optional<String> nextLine(String lang, String interactionId, String answer, String tone,
                                     ReadingContext ctx) {
        LangContent lc = content.lang(lang);
        Interaction i = lc.interactions().get(interactionId);
        if (i == null) {
            return Optional.empty();
        }
        ReadingContext c = ReadingContext.orEmpty(ctx);
        Situation s = new Situation(null, null, c, time.moment(c), List.of(), null, -1);
        RandomGenerator rng = new SplittableRandom(SEEDS.nextLong());
        String t = tone == null ? "mistica" : tone;
        return Optional.ofNullable(i.branches().forAnswer(answer)).map(text -> TextRenderer.stripUnresolvedServerVariables(render(text, lc, s, t, rng)));
    }

    // ------------------------------------------------------------------ selección

    private static void line(List<Line> lines, String kind, String text) {
        if (text != null && !text.isBlank()) {
            lines.add(new Line(kind, text));
        }
    }

    private String text(LangContent lc, String slot, String tone, Situation s, Set<String> used, Set<String> recent,
                        RandomGenerator rng) {
        return select(lc, slot, tone, s, used, recent, rng, tone)
                .map(f -> render(f.text(), lc, s, tone, rng)).orElse(null);
    }

    /**
     * Filtra por slot, tono y {@code when}, descarta los que usan variables de servidor sin valor, evita los usados
     * en esta lectura y (si se puede) los recientes, y elige por peso.
     */
    Optional<Fragment> select(LangContent lc, String slot, String tone, Situation s, Set<String> used,
                              Set<String> recent, RandomGenerator rng, String varTone) {
        Function<String, Optional<String>> vars = variables(lc, s, varTone, rng);
        List<Fragment> candidates = lc.fragments(slot).stream()
                .filter(f -> f.allowsTone(tone))
                .filter(f -> !used.contains(f.id()))
                .filter(f -> WhenMatcher.matches(f.when(), s))
                .filter(f -> TextRenderer.resolvable(f.text(), TextRenderer.SERVER_VARIABLES, vars))
                .toList();
        List<Fragment> fresh = candidates.stream().filter(f -> !recent.contains(f.id())).toList();
        Optional<Fragment> chosen = Weighted.pick(fresh.isEmpty() ? candidates : fresh, Fragment::effectiveWeight, rng);
        chosen.ifPresent(f -> used.add(f.id()));
        return chosen;
    }

    private InteractionPrompt interaction(LangContent lc, String tone, Situation s, Set<String> used,
                                          Set<String> recent, RandomGenerator rng) {
        Function<String, Optional<String>> vars = variables(lc, s, tone, rng);
        List<Interaction> candidates = lc.interactions().values().stream()
                .filter(i -> i.allowsTone(tone))
                .filter(i -> !used.contains(i.id()))
                .filter(i -> WhenMatcher.matches(i.when(), s))
                .filter(i -> TextRenderer.resolvable(i.prompt(), TextRenderer.SERVER_VARIABLES, vars))
                .toList();
        List<Interaction> fresh = candidates.stream().filter(i -> !recent.contains(i.id())).toList();
        return Weighted.pick(fresh.isEmpty() ? candidates : fresh, Interaction::effectiveWeight, rng)
                .map(i -> {
                    used.add(i.id());
                    return new InteractionPrompt(i.id(), TextRenderer.render(i.prompt(), rng, vars),
                            INTERACTION_OPTIONS);
                })
                .orElse(null);
    }

    private String nucleo(LangContent lc, Situation s, String tone, RandomGenerator rng) {
        NarrativeCard c = s.card();
        return lc.meaning(s.family(), c.def().id())
                .flatMap(m -> Weighted.uniform(m.variants(c.reversed(), s.tema()), rng))
                .map(t -> render(t, lc, s, tone, rng))
                .orElse(null);
    }

    private String render(String text, LangContent lc, Situation s, String tone, RandomGenerator rng) {
        return TextRenderer.render(text, rng, variables(lc, s, tone, rng));
    }

    // ------------------------------------------------------------------ variables de servidor

    Function<String, Optional<String>> variables(LangContent lc, Situation s, String tone, RandomGenerator rng) {
        ReadingContext ctx = s.ctx();
        ServerLabels labels = lc.labels();
        Optional<ProvinceSheet> sheet = lc.province(ctx.provincia());
        Optional<ProvinceDef> prov = ctx.provincia() == null ? Optional.empty() : content.province(ctx.provincia());
        NarrativeCard card = s.card();
        return name -> switch (name) {
            case "provincia" -> ProvinceNames.provincia(labels, ctx.provincia(), sheet, prov);
            case "comunidad" -> sheet.map(ProvinceSheet::comunidad).or(() -> prov.map(ProvinceDef::comunidad));
            case "gentilicio" -> sheet.map(ProvinceSheet::gentilicio).map(TextRenderer::gentilicio);
            case "plato" -> sheet.flatMap(p -> Weighted.uniform(p.plato(), rng));
            case "fiesta" -> sheet.flatMap(p -> Weighted.uniform(p.fiesta(), rng));
            case "clima" -> sheet.flatMap(p -> Weighted.uniform(p.clima(), rng));
            case "signo" -> label(labels.signos(), ctx.signo());
            case "decada" -> Optional.ofNullable(ctx.decada()).map(String::valueOf);
            case "numeroVida" -> Optional.ofNullable(ctx.numeroVida()).map(String::valueOf);
            case "tema" -> ctx.tema() == null ? Optional.empty() : label(labels.temas(), ctx.tema());
            case "carta" -> card == null ? Optional.empty() : Optional.ofNullable(card.name());
            case "palo" -> card == null ? Optional.empty() : Optional.ofNullable(card.suitName());
            case "posicion" -> card == null ? Optional.empty()
                    : Optional.ofNullable(card.positionInline() != null ? card.positionInline() : card.positionLabel());
            case "cartaAnterior" -> Optional.ofNullable(s.previous()).map(NarrativeCard::name);
            case "hora" -> s.moment() == null ? Optional.empty() : Optional.of(String.valueOf(s.moment().hora()));
            case "diaSemana" -> s.moment() == null ? Optional.empty()
                    : label(labels.dias(), String.valueOf(s.moment().diaSemana()));
            case "estacion" -> s.moment() == null ? Optional.empty() : label(labels.estaciones(), s.moment().estacion());
            case "faseLunar" -> s.moment() == null ? Optional.empty()
                    : label(labels.fasesLunares(), s.moment().faseLunar());
            case "tono" -> tone == null ? Optional.empty() : label(labels.tonos(), tone);
            default -> Optional.empty();
        };
    }

    private static Optional<String> label(Map<String, String> labels, String key) {
        if (key == null) {
            return Optional.empty();
        }
        return Optional.of(labels.getOrDefault(key, key));
    }

    // ------------------------------------------------------------------ tonos

    /** Tonos disponibles en el contenido del idioma (los que tienen algún fragmento propio), con pesos del §1. */
    static final class Tones {
        private final List<String> available;

        Tones(LangContent lc) {
            Set<String> withContent = new HashSet<>();
            lc.fragments().forEach(f -> withContent.addAll(f.tones()));
            List<String> av = Ids.TONE_WEIGHTS.keySet().stream().filter(withContent::contains).toList();
            this.available = av.isEmpty() ? List.copyOf(Ids.TONE_WEIGHTS.keySet()) : av;
        }

        String initial(Long toneSeed) {
            RandomGenerator r = new SplittableRandom(toneSeed != null ? toneSeed : SEEDS.nextLong());
            return Weighted.pick(available, t -> Ids.TONE_WEIGHTS.get(t), r).orElse("mistica");
        }

        String other(String current, RandomGenerator rng) {
            List<String> others = available.stream().filter(t -> !t.equals(current)).toList();
            if (others.isEmpty()) {
                others = Ids.TONE_WEIGHTS.keySet().stream().filter(t -> !t.equals(current)).toList();
            }
            return Weighted.pick(others, t -> Ids.TONE_WEIGHTS.get(t), rng).orElse(current);
        }

        List<String> available() {
            return available;
        }
    }
}
