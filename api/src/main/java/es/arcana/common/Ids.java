package es.arcana.common;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Identificadores compartidos (CONTRACTS §1). */
public final class Ids {

    private Ids() {
    }

    public static final String DEFAULT_LANG = "es";

    public static final Set<String> FAMILIES = Set.of("tarot", "spanish");

    public static final Set<String> TEMAS = Set.of("general", "amor", "trabajo", "dinero", "salud");

    /** Tonos con su peso por defecto, en orden estable. */
    public static final Map<String, Integer> TONE_WEIGHTS;

    static {
        Map<String, Integer> m = new LinkedHashMap<>();
        m.put("mistica", 25);
        m.put("abuela", 20);
        m.put("teletienda", 15);
        m.put("ironica", 20);
        m.put("dramatica", 10);
        m.put("coach", 10);
        TONE_WEIGHTS = java.util.Collections.unmodifiableMap(m);
    }

    public static final List<String> SIGNOS = List.of("aries", "tauro", "geminis", "cancer", "leo", "virgo",
            "libra", "escorpio", "sagitario", "capricornio", "acuario", "piscis");

    public static final List<String> PENDULUM_MODELS = List.of("cuarzo", "amatista", "laton", "obsidiana", "madera",
            "camara", "llave", "anillo", "chorizo");

    public static final List<String> PENDULUM_MODES = List.of("sino", "tablero", "porcentaje", "ouija", "mapa",
            "opciones", "chakras");

    /** Variables que resuelve sólo el navegador: el servidor las deja intactas. */
    public static final Set<String> CLIENT_VARIABLES = Set.of("nombre", "inicial", "edad", "opcion");

    // Regex reutilizables para Bean Validation
    public static final String RX_FAMILY = "tarot|spanish";
    public static final String RX_SLUG = "[a-z0-9]+(-[a-z0-9]+)*";
    public static final String RX_TEMA = "general|amor|trabajo|dinero|salud";
    public static final String RX_TONE = "mistica|abuela|teletienda|ironica|dramatica|coach";
    public static final String RX_SIGNO = "aries|tauro|geminis|cancer|leo|virgo|libra|escorpio|sagitario|capricornio|acuario|piscis";
    public static final String RX_PROVINCE = "0[1-9]|[1-4][0-9]|5[0-2]|XX";
    public static final String RX_LANG = "[a-z]{2,3}";
    public static final String RX_PENDULUM_MODEL = "cuarzo|amatista|laton|obsidiana|madera|camara|llave|anillo|chorizo";
    public static final String RX_PENDULUM_MODE = "sino|tablero|porcentaje|ouija|mapa|opciones|chakras";
}
