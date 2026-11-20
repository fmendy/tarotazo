package es.arcana.content;

import com.networknt.schema.Error;
import com.networknt.schema.Schema;
import com.networknt.schema.SchemaLocation;
import com.networknt.schema.SchemaRegistry;
import com.networknt.schema.SpecificationVersion;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Valida cada fichero de contenido contra su esquema de {@code content/schemas/} (JSON Schema 2020‑12) según la
 * tabla de {@code content/schemas/README.md}.
 */
final class SchemaValidator {

    static final String SCHEMAS_DIR = "schemas/";
    private static final String BASE_IRI = "https://arcana.tarotazo/schemas/";
    private static final int MAX_ERRORS_PER_FILE = 8;

    private static final Pattern LANG = Pattern.compile("[a-z]{2,3}");

    private final ContentStore store;
    private final JsonMapper mapper;
    private final Map<String, String> schemaSources = new HashMap<>();
    private final Map<String, Schema> schemas = new HashMap<>();
    private SchemaRegistry registry;

    SchemaValidator(ContentStore store, JsonMapper mapper) {
        this.store = store;
        this.mapper = mapper;
    }

    /** Esquema que corresponde a una ruta de contenido, o vacío si el fichero no se valida. */
    static Optional<String> schemaFor(String path) {
        String[] p = path.split("/");
        if (p.length == 0 || path.startsWith(SCHEMAS_DIR) || path.startsWith("tools/")) {
            return Optional.empty();
        }
        if (p.length == 2 && p[0].equals("decks")) {
            return Optional.of("deck.schema.json");
        }
        if (p.length == 1) {
            return switch (p[0]) {
                case "spreads.json" -> Optional.of("spreads.schema.json");
                case "provinces.json" -> Optional.of("provinces.schema.json");
                default -> Optional.empty();
            };
        }
        if (!LANG.matcher(p[0]).matches()) {
            return Optional.empty();
        }
        if (p.length == 2) {
            return switch (p[1]) {
                case "spreads.json" -> Optional.of("spreads-i18n.schema.json");
                case "interactions.json" -> Optional.of("interactions.schema.json");
                case "titles.json" -> Optional.of("titles.schema.json");
                case "onboarding.json" -> Optional.of("onboarding.schema.json");
                case "pendulum.json" -> Optional.of("pendulum.schema.json");
                default -> Optional.empty();
            };
        }
        if (p.length == 3) {
            return switch (p[1]) {
                case "cards" -> Optional.of("cards-i18n.schema.json");
                case "meanings" -> Optional.of("meanings.schema.json");
                case "fragments" -> Optional.of("fragments.schema.json");
                case "provinces" -> Optional.of("province-sheet.schema.json");
                default -> Optional.empty();
            };
        }
        return Optional.empty();
    }

    /**
     * Parsea y valida todos los ficheros. Devuelve los árboles parseados (aunque no validen) por ruta.
     */
    Map<String, JsonNode> validateAll(ContentReport report) {
        loadSchemas(report);
        Map<String, JsonNode> parsed = new LinkedHashMap<>();
        for (String path : store.listAll()) {
            if (path.startsWith(SCHEMAS_DIR) || path.startsWith("tools/")) {
                continue;
            }
            report.countFile();
            JsonNode node;
            try {
                node = mapper.readTree(store.read(path).orElseThrow());
            } catch (RuntimeException e) {
                report.error(path, "JSON mal formado: " + firstLine(e.getMessage()));
                continue;
            }
            parsed.put(path, node);
            Optional<String> schemaName = schemaFor(path);
            if (schemaName.isEmpty()) {
                if (!path.endsWith("server-labels.json")) {
                    report.warning(path, "no tiene esquema asociado (no se valida)");
                }
                continue;
            }
            Schema schema = schema(schemaName.get(), report);
            if (schema == null) {
                continue;
            }
            List<Error> errors;
            try {
                errors = schema.validate(node);
            } catch (RuntimeException e) {
                report.error(path, "no se pudo validar con " + schemaName.get() + ": " + firstLine(e.getMessage()));
                continue;
            }
            errors.stream().limit(MAX_ERRORS_PER_FILE).forEach(err -> report.error(path,
                    "no cumple " + schemaName.get() + " en " + err.getInstanceLocation() + ": " + err.getMessage()));
            if (errors.size() > MAX_ERRORS_PER_FILE) {
                report.error(path, "… y " + (errors.size() - MAX_ERRORS_PER_FILE) + " errores de esquema más");
            }
        }
        return parsed;
    }

    private void loadSchemas(ContentReport report) {
        for (String name : store.list(SCHEMAS_DIR)) {
            if (name.endsWith(".schema.json")) {
                store.read(SCHEMAS_DIR + name)
                        .ifPresent(b -> schemaSources.put(name, new String(b, StandardCharsets.UTF_8)));
            }
        }
        if (schemaSources.isEmpty()) {
            report.warning(SCHEMAS_DIR, "no hay esquemas: el contenido no se valida");
        }
        registry = SchemaRegistry.withDefaultDialect(SpecificationVersion.DRAFT_2020_12,
                b -> b.schemas(this::resolveSchemaSource));
    }

    /** Resuelve {@code $ref} y {@code $id} hacia los ficheros locales por su nombre (sin red). */
    private String resolveSchemaSource(String iri) {
        String clean = iri;
        int hash = clean.indexOf('#');
        if (hash >= 0) {
            clean = clean.substring(0, hash);
        }
        String name = clean.substring(clean.lastIndexOf('/') + 1);
        return schemaSources.get(name);
    }

    private Schema schema(String name, ContentReport report) {
        if (schemas.containsKey(name)) {
            return schemas.get(name);
        }
        Schema s = null;
        if (!schemaSources.containsKey(name)) {
            report.warning(SCHEMAS_DIR + name, "esquema no encontrado: los ficheros que lo usan no se validan");
        } else {
            try {
                s = registry.getSchema(SchemaLocation.of(BASE_IRI + name));
                s.initializeValidators();
            } catch (RuntimeException e) {
                report.error(SCHEMAS_DIR + name, "esquema inválido: " + firstLine(e.getMessage()));
                s = null;
            }
        }
        schemas.put(name, s);
        return s;
    }

    private static String firstLine(String s) {
        if (s == null) {
            return "(sin detalle)";
        }
        int nl = s.indexOf('\n');
        return nl < 0 ? s : s.substring(0, nl);
    }
}
