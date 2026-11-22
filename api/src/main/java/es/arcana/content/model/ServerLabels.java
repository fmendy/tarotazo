package es.arcana.content.model;

import java.util.List;
import java.util.Map;

/**
 * Textos que necesita el servidor y que no están en el contrato de contenido (nombres visibles de signos,
 * días, estaciones, fases, tonos y temas; colores de la suerte; descargos). Fuente única:
 * {@code content/{lang}/server-labels.json} (obligatorio en {@code es}; otros idiomas, fallback por clave a {@code es}).
 * Es el mismo fichero que usa el motor de la app sin conexión ({@code web/src/engine}).
 *
 * @param provinciaExtranjero valor de {@code {provincia}} para el código {@code XX}
 * @param provinciaDesconocida valor de {@code {provincia}} cuando no llega provincia
 */
public record ServerLabels(Map<String, String> signos, Map<String, String> dias, Map<String, String> estaciones,
                           Map<String, String> fasesLunares, Map<String, String> tonos, Map<String, String> temas,
                           Map<String, String> respuestas, List<LuckyColor> luckyColors, String disclaimer,
                           String disclaimerSalud, String saludFallback,
                           String provinciaExtranjero, String provinciaDesconocida) {

    public ServerLabels {
        signos = nn(signos);
        dias = nn(dias);
        estaciones = nn(estaciones);
        fasesLunares = nn(fasesLunares);
        tonos = nn(tonos);
        temas = nn(temas);
        respuestas = nn(respuestas);
        luckyColors = luckyColors == null ? List.of() : List.copyOf(luckyColors);
    }

    private static Map<String, String> nn(Map<String, String> m) {
        return m == null ? Map.of() : Map.copyOf(m);
    }
}
