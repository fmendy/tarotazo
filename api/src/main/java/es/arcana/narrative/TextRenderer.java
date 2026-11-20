package es.arcana.narrative;

import es.arcana.common.Ids;

import java.util.LinkedHashSet;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.random.RandomGenerator;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Mini‑sintaxis del §3.2: {@code [a|b|c]} (alternativa sorteada, sin anidar) y {@code {variable}}.
 * Las variables del navegador ({@code {nombre}}, {@code {inicial}}, {@code {edad}}, {@code {opcion}}) se dejan
 * intactas; las desconocidas también.
 */
public final class TextRenderer {

    /** Variables que resuelve el servidor (CONTRACTS §3.2). */
    public static final Set<String> SERVER_VARIABLES = Set.of("provincia", "comunidad", "gentilicio", "plato",
            "fiesta", "clima", "signo", "decada", "numeroVida", "tema", "carta", "palo", "posicion", "cartaAnterior",
            "hora", "diaSemana", "estacion", "faseLunar", "tono");

    private static final Pattern ALTERNATIVE = Pattern.compile("\\[([^\\[\\]]*)]");
    private static final Pattern VARIABLE = Pattern.compile("\\{([A-Za-z][A-Za-z0-9_]*)}");

    private TextRenderer() {
    }

    /** Variables usadas por un texto. */
    public static Set<String> variables(String text) {
        Set<String> out = new LinkedHashSet<>();
        if (text != null) {
            Matcher m = VARIABLE.matcher(text);
            while (m.find()) {
                out.add(m.group(1));
            }
        }
        return out;
    }

    /**
     * ¿Puede el servidor renderizar el texto? Sí si todas sus variables de servidor tienen valor (las de
     * navegador y las desconocidas no cuentan).
     */
    public static boolean resolvable(String text, Set<String> serverVariables,
                                     Function<String, Optional<String>> vars) {
        for (String v : variables(text)) {
            if (serverVariables.contains(v) && vars.apply(v).isEmpty()) {
                return false;
            }
        }
        return true;
    }

    public static String render(String text, RandomGenerator rng, Function<String, Optional<String>> vars) {
        if (text == null) {
            return null;
        }
        String withAlternatives = chooseAlternatives(text, rng);
        Matcher m = VARIABLE.matcher(withAlternatives);
        StringBuilder sb = new StringBuilder();
        while (m.find()) {
            String name = m.group(1);
            String replacement = Ids.CLIENT_VARIABLES.contains(name) ? m.group() : vars.apply(name).orElse(m.group());
            m.appendReplacement(sb, Matcher.quoteReplacement(replacement));
        }
        m.appendTail(sb);
        return sb.toString();
    }

    static String chooseAlternatives(String text, RandomGenerator rng) {
        Matcher m = ALTERNATIVE.matcher(text);
        StringBuilder sb = new StringBuilder();
        while (m.find()) {
            String[] options = m.group(1).split("\\|", -1);
            String chosen = options[options.length == 1 ? 0 : rng.nextInt(options.length)];
            m.appendReplacement(sb, Matcher.quoteReplacement(chosen));
        }
        m.appendTail(sb);
        return sb.toString();
    }
}
