package es.arcana.content;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.LoadingCache;
import es.arcana.common.Ids;
import es.arcana.content.model.CardsI18n;
import es.arcana.content.model.DeckDef;
import es.arcana.content.model.DeckModelDef;
import es.arcana.content.model.Fragment;
import es.arcana.content.model.Interaction;
import es.arcana.content.model.Meaning;
import es.arcana.content.model.PendulumContent;
import es.arcana.content.model.ProvinceDef;
import es.arcana.content.model.ProvinceSheet;
import es.arcana.content.model.ServerLabels;
import es.arcana.content.model.SpreadDef;
import es.arcana.content.model.SpreadI18n;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Pattern;

/**
 * Único punto que lee ficheros de contenido. Al arrancar: elige origen (disco o jar), valida contra los
 * esquemas, informa y (en modo estricto) falla. Después sirve el contenido ya parseado, con caché Caffeine
 * por idioma y fallback a {@code es} por fichero y por clave.
 */
@Component
public class ContentRepository {

    private static final Logger log = LoggerFactory.getLogger(ContentRepository.class);
    private static final Pattern LANG = Pattern.compile("[a-z]{2,3}");
    private static final List<String> FAMILIES = List.of("tarot", "spanish");
    private static final List<String> REQUIRED = List.of("decks/tarot.json", "decks/spanish.json", "spreads.json",
            "provinces.json", "es/cards/tarot.json", "es/cards/spanish.json", "es/spreads.json",
            "es/meanings/tarot.json", "es/meanings/spanish.json", "es/interactions.json", "es/titles.json",
            "es/onboarding.json", "es/pendulum.json");

    private final ContentProperties props;
    private final ContentStore store;
    private final JsonMapper mapper;
    private final ContentReport report = new ContentReport();
    private final Map<String, JsonNode> tree;
    private final Map<String, DeckDef> decks;
    private final List<SpreadDef> spreads;
    private final List<ProvinceDef> provinces;
    private final Set<String> languages;
    private final LoadingCache<String, LangContent> langCache;
    private final Cache<String, Boolean> artCache;

    @org.springframework.beans.factory.annotation.Autowired
    public ContentRepository(ContentProperties props) {
        this(props, createStore(props, ContentRepository.class.getClassLoader()));
    }

    ContentRepository(ContentProperties props, ContentStore store) {
        this.props = props;
        this.store = store;
        this.mapper = JsonMapper.builder()
                .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
                .disable(DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES)
                .build();
        log.info("Cargando contenido desde {}", store.description());

        this.tree = new SchemaValidator(store, mapper).validateAll(report);
        checkRequired();
        this.decks = loadDecks();
        this.spreads = loadSpreads();
        this.provinces = loadProvinces();
        this.languages = detectLanguages();
        checkSemantics();

        this.langCache = Caffeine.newBuilder().maximumSize(32).build(this::buildLang);
        this.artCache = Caffeine.newBuilder().maximumSize(256).expireAfterWrite(Duration.ofMinutes(1)).build();
        LangContent es = langCache.get(Ids.DEFAULT_LANG);
        checkLangSemantics(es);

        reportAndMaybeFail();
    }

    /** Repositorio sobre un directorio (tests y herramientas). */
    public static ContentRepository forDirectory(Path dir, boolean strict) {
        ContentProperties p = new ContentProperties(dir.toString(), strict, null, List.of(), "Europe/Madrid");
        return new ContentRepository(p, new FileSystemContentStore(dir));
    }

    static ContentStore createStore(ContentProperties props, ClassLoader cl) {
        if (props.hasContentDir()) {
            Path dir = Path.of(props.contentDir()).toAbsolutePath().normalize();
            if (Files.isDirectory(dir)) {
                return new FileSystemContentStore(dir);
            }
            String msg = "arcana.content-dir=" + props.contentDir() + " (" + dir + ") no existe o no es un directorio";
            if (props.contentStrict()) {
                throw new ContentException(msg);
            }
            log.warn("{}; se usa el contenido empaquetado en el jar", msg);
        }
        return new ClasspathContentStore(cl);
    }

    // ------------------------------------------------------------------ API pública

    public ContentReport report() {
        return report;
    }

    public String source() {
        return store.description();
    }

    public ZoneId zone() {
        return ZoneId.of(props.zone());
    }

    public List<DeckDef> decks() {
        return FAMILIES.stream().map(decks::get).filter(java.util.Objects::nonNull).toList();
    }

    public Optional<DeckDef> deck(String family) {
        return Optional.ofNullable(family == null ? null : decks.get(family));
    }

    public List<SpreadDef> spreads() {
        return spreads;
    }

    public Optional<SpreadDef> spread(String id) {
        return spreads.stream().filter(s -> s.id().equals(id)).findFirst();
    }

    public List<ProvinceDef> provinces() {
        return provinces;
    }

    public Optional<ProvinceDef> province(String code) {
        return provinces.stream().filter(p -> p.code().equals(code)).findFirst();
    }

    /** Idiomas con carpeta de contenido (siempre incluye {@code es}). */
    public Set<String> languages() {
        return languages;
    }

    public LangContent lang(String lang) {
        String l = lang != null && languages.contains(lang) ? lang : Ids.DEFAULT_LANG;
        return langCache.get(l);
    }

    /** ¿Existe el arte de un modelo? (sólo se comprueba si hay {@code arcana.art-dir}). */
    public boolean artAvailable(DeckModelDef model) {
        if (props.unavailableModels().contains(model.id())) {
            return false;
        }
        if (!props.hasArtDir() || model.art() == null) {
            return true;
        }
        return artCache.get(model.art(), art -> {
            Path dir = Path.of(props.artDir()).toAbsolutePath().normalize();
            if (!Files.isDirectory(dir)) {
                return true; // sin carpeta de arte no se puede saber: no bloqueamos
            }
            return Files.isRegularFile(dir.resolve("backs").resolve(art + ".svg"))
                    || Files.isDirectory(dir.resolve("cards").resolve(art));
        });
    }

    // ------------------------------------------------------------------ carga neutra

    private void checkRequired() {
        if (tree.isEmpty() && store.listAll().isEmpty()) {
            report.error("(raíz)", "no hay ningún fichero de contenido en " + store.description());
            return;
        }
        for (String r : REQUIRED) {
            if (!store.exists(r)) {
                report.error(r, "falta el fichero obligatorio");
            }
        }
        if (store.list("es/fragments").isEmpty()) {
            report.error("es/fragments/", "no hay ficheros de fragmentos");
        }
    }

    private Map<String, DeckDef> loadDecks() {
        Map<String, DeckDef> out = new HashMap<>();
        for (String f : FAMILIES) {
            bind("decks/" + f + ".json", tree.get("decks/" + f + ".json"), DeckDef.class).ifPresent(d -> {
                if (d.family() != null) {
                    out.put(d.family(), d);
                }
            });
        }
        return Map.copyOf(out);
    }

    private List<SpreadDef> loadSpreads() {
        JsonNode n = tree.get("spreads.json");
        if (n == null || !n.path("spreads").isArray()) {
            return List.of();
        }
        List<SpreadDef> out = new ArrayList<>();
        for (JsonNode s : n.path("spreads")) {
            bind("spreads.json", s, SpreadDef.class).filter(sp -> sp.id() != null).ifPresent(out::add);
        }
        out.sort(Comparator.comparing((SpreadDef s) -> s.order() == null ? Integer.MAX_VALUE : s.order()));
        return List.copyOf(out);
    }

    private List<ProvinceDef> loadProvinces() {
        JsonNode n = tree.get("provinces.json");
        if (n == null || !n.path("provinces").isArray()) {
            return List.of();
        }
        List<ProvinceDef> out = new ArrayList<>();
        for (JsonNode p : n.path("provinces")) {
            bind("provinces.json", p, ProvinceDef.class).filter(pr -> pr.code() != null).ifPresent(out::add);
        }
        return List.copyOf(out);
    }

    private Set<String> detectLanguages() {
        Set<String> out = new TreeSet<>();
        out.add(Ids.DEFAULT_LANG);
        for (String path : tree.keySet()) {
            int slash = path.indexOf('/');
            if (slash > 0 && LANG.matcher(path.substring(0, slash)).matches()) {
                out.add(path.substring(0, slash));
            }
        }
        return Set.copyOf(out);
    }

    private void checkSemantics() {
        for (DeckDef d : decks.values()) {
            String file = "decks/" + d.family() + ".json";
            if (d.model(d.defaultModel()).isEmpty()) {
                report.error(file, "defaultModel '" + d.defaultModel() + "' no está en models");
            }
            Set<String> ids = new HashSet<>();
            d.cards().forEach(c -> {
                if (!ids.add(c.id())) {
                    report.error(file, "carta repetida " + c.id());
                }
            });
            for (DeckModelDef m : d.models()) {
                int n = d.cardsFor(m).size();
                if (m.deckSize() != null && n != m.deckSize()) {
                    report.error(file, "el modelo " + m.id() + " declara deckSize " + m.deckSize() + " pero tiene " + n
                            + " cartas");
                }
            }
        }
        for (SpreadDef s : spreads) {
            if (s.positions().size() != s.maxCards()) {
                report.error("spreads.json", "la tirada " + s.id() + " tiene size " + s.maxCards() + " y "
                        + s.positions().size() + " posiciones");
            }
        }
    }

    private void checkLangSemantics(LangContent es) {
        Set<String> ids = new HashSet<>();
        for (String file : store.list("es/fragments")) {
            JsonNode n = tree.get("es/fragments/" + file);
            if (n == null) {
                continue;
            }
            for (JsonNode f : n.path("fragments")) {
                String id = f.path("id").asString("");
                if (!id.isEmpty() && !ids.add(id)) {
                    report.error("es/fragments/" + file, "id de fragmento repetido: " + id);
                }
            }
        }
        for (ProvinceDef p : provinces) {
            if (es.province(p.code()).isEmpty()) {
                report.warning("es/provinces/" + p.code() + ".json", "falta la ficha de la provincia");
            }
        }
        for (DeckDef d : decks.values()) {
            for (var c : d.cards()) {
                if (es.meaning(d.family(), c.id()).isEmpty()) {
                    report.warning("es/meanings/" + d.family() + ".json", "falta el significado de " + c.id());
                }
            }
        }
        for (String slot : List.of("entrada", "puente", "personalizacion", "guino", "sintesis", "saludo",
                "despedida", "salud", "cambioHumor")) {
            if (es.fragments(slot).isEmpty()) {
                report.warning("es/fragments/", "no hay fragmentos del slot '" + slot + "'");
            }
        }
    }

    private void reportAndMaybeFail() {
        String summary = report.format(60);
        if (report.hasErrors()) {
            if (props.contentStrict()) {
                log.error("{}", summary);
                throw new ContentException("El contenido no es válido (" + report.errors().size()
                        + " errores) y arcana.content-strict=true. Primer error: " + report.errors().getFirst()
                        + ". Revisa el log o ejecuta 'node content/tools/validate.mjs'.");
            }
            log.warn("{}\n  (arcana.content-strict=false: se arranca igualmente; en prod esto impide el arranque)",
                    summary);
        } else if (!report.warnings().isEmpty()) {
            log.warn("{}", summary);
        } else {
            log.info("{}", summary);
        }
        log.info("Contenido listo: barajas={}, tiradas={}, provincias={}, idiomas={}", decks.keySet(),
                spreads.size(), provinces.size(), languages);
    }

    // ------------------------------------------------------------------ idiomas

    private LangContent buildLang(String lang) {
        boolean es = Ids.DEFAULT_LANG.equals(lang);
        Map<String, CardsI18n> cards = new HashMap<>();
        Map<String, Map<String, Meaning>> meanings = new HashMap<>();
        for (String f : FAMILIES) {
            String rel = "cards/" + f + ".json";
            bind(lang + "/" + rel, merged(lang, rel), CardsI18n.class).ifPresent(c -> cards.put(f, c));
            meanings.put(f, bindMap(lang + "/meanings/" + f + ".json", merged(lang, "meanings/" + f + ".json"),
                    Meaning.class));
        }
        Map<String, SpreadI18n> spreadsI18n = bindMap(lang + "/spreads.json",
                merged(lang, "spreads.json").path("spreads"), SpreadI18n.class);

        List<Fragment> fragments = fragmentsFor(lang, es);

        String interactionsFile = !es && tree.containsKey(lang + "/interactions.json") ? lang : Ids.DEFAULT_LANG;
        Map<String, Interaction> interactions = new LinkedHashMap<>();
        for (JsonNode i : node(interactionsFile + "/interactions.json").path("interactions")) {
            bind(interactionsFile + "/interactions.json", i, Interaction.class)
                    .filter(x -> x.id() != null && x.branches() != null)
                    .ifPresent(x -> interactions.put(x.id(), x));
        }

        Map<String, ProvinceSheet> sheets = new HashMap<>();
        Set<String> sheetFiles = new TreeSet<>(store.list(Ids.DEFAULT_LANG + "/provinces"));
        if (!es) {
            sheetFiles.addAll(store.list(lang + "/provinces"));
        }
        for (String file : sheetFiles) {
            String path = !es && tree.containsKey(lang + "/provinces/" + file) ? lang + "/provinces/" + file
                    : Ids.DEFAULT_LANG + "/provinces/" + file;
            bind(path, tree.get(path), ProvinceSheet.class).filter(s -> s.code() != null)
                    .ifPresent(s -> sheets.put(s.code(), s));
        }

        JsonNode titles = nullIfMissing(merged(lang, "titles.json"));
        JsonNode onboarding = nullIfMissing(merged(lang, "onboarding.json"));
        JsonNode pendulumRaw = nullIfMissing(merged(lang, "pendulum.json"));
        PendulumContent pendulum = pendulumRaw == null ? PendulumContent.EMPTY
                : bind(lang + "/pendulum.json", pendulumRaw, PendulumContent.class).orElse(PendulumContent.EMPTY);

        JsonNode labelsNode = JsonMerge.merge(defaults(Ids.DEFAULT_LANG), es ? null : defaults(lang));
        labelsNode = JsonMerge.merge(labelsNode, merged(lang, "server-labels.json"));
        ServerLabels labels = bind("server-labels", labelsNode, ServerLabels.class)
                .orElse(new ServerLabels(null, null, null, null, null, null, null, null, null, null, null));

        return new LangContent(lang, cards, spreadsI18n, meanings, fragments, interactions, sheets, titles, onboarding,
                pendulumRaw, pendulum, labels);
    }

    /**
     * Fragmentos de un idioma. Fallback por slot: si el idioma tiene algún fragmento de un slot se usan sólo los
     * suyos (no se mezclan idiomas en una frase); si no tiene ninguno, se usan los de {@code es}.
     */
    private List<Fragment> fragmentsFor(String lang, boolean es) {
        List<Fragment> base = readFragments(Ids.DEFAULT_LANG);
        if (es) {
            return base;
        }
        List<Fragment> own = readFragments(lang);
        Set<String> ownSlots = new HashSet<>();
        own.forEach(f -> ownSlots.add(f.slot()));
        List<Fragment> out = new ArrayList<>(own);
        base.stream().filter(f -> !ownSlots.contains(f.slot())).forEach(out::add);
        return out;
    }

    private List<Fragment> readFragments(String lang) {
        List<Fragment> out = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (String file : store.list(lang + "/fragments")) {
            String path = lang + "/fragments/" + file;
            for (JsonNode f : node(path).path("fragments")) {
                bind(path, f, Fragment.class)
                        .filter(x -> x.id() != null && x.slot() != null && x.text() != null)
                        .filter(x -> seen.add(x.id()))
                        .ifPresent(out::add);
            }
        }
        return out;
    }

    private JsonNode merged(String lang, String rel) {
        JsonNode base = tree.get(Ids.DEFAULT_LANG + "/" + rel);
        JsonNode own = Ids.DEFAULT_LANG.equals(lang) ? null : tree.get(lang + "/" + rel);
        JsonNode m = JsonMerge.merge(base, own);
        return m == null ? mapper.missingNode() : m;
    }

    private JsonNode node(String path) {
        JsonNode n = tree.get(path);
        return n == null ? mapper.missingNode() : n;
    }

    private JsonNode defaults(String lang) {
        try (InputStream in = ContentRepository.class.getClassLoader()
                .getResourceAsStream("arcana-defaults/" + lang + ".json")) {
            return in == null ? null : mapper.readTree(in);
        } catch (IOException | RuntimeException e) {
            log.warn("No se pudieron leer los textos por defecto de '{}': {}", lang, e.getMessage());
            return null;
        }
    }

    private static JsonNode nullIfMissing(JsonNode n) {
        return n == null || n.isMissingNode() || n.isNull() ? null : n;
    }

    private <T> Optional<T> bind(String file, JsonNode node, Class<T> type) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return Optional.empty();
        }
        try {
            return Optional.ofNullable(mapper.treeToValue(node, type));
        } catch (RuntimeException e) {
            log.warn("Se ignora una entrada de {} que no encaja con {}: {}", file, type.getSimpleName(),
                    firstLine(e.getMessage()));
            return Optional.empty();
        }
    }

    private <T> Map<String, T> bindMap(String file, JsonNode node, Class<T> type) {
        Map<String, T> out = new LinkedHashMap<>();
        if (node != null && node.isObject()) {
            for (Map.Entry<String, JsonNode> e : node.properties()) {
                if (!e.getKey().startsWith("$")) {
                    bind(file, e.getValue(), type).ifPresent(v -> out.put(e.getKey(), v));
                }
            }
        }
        return out;
    }

    private static String firstLine(String s) {
        if (s == null) {
            return "";
        }
        int nl = s.indexOf('\n');
        return nl < 0 ? s : s.substring(0, nl);
    }
}
