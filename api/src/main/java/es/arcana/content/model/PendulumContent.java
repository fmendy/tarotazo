package es.arcana.content.model;

import java.util.List;
import java.util.Map;

/** {@code {lang}/pendulum.json} (CONTRACTS §4). */
public record PendulumContent(Map<String, List<String>> lines, Map<String, PendulumModel> models,
                              List<String> ouijaWords, List<Chakra> chakras) {

    public static final PendulumContent EMPTY = new PendulumContent(null, null, null, null);

    public PendulumContent {
        lines = lines == null ? Map.of() : Map.copyOf(lines);
        models = models == null ? Map.of() : Map.copyOf(models);
        ouijaWords = ouijaWords == null ? List.of() : List.copyOf(ouijaWords);
        chakras = chakras == null ? List.of() : List.copyOf(chakras);
    }

    public record PendulumModel(String nombre, String personalidad, Map<String, List<String>> lines) {
        public PendulumModel {
            lines = lines == null ? Map.of() : Map.copyOf(lines);
        }
    }

    public record Chakra(String id, String nombre, List<String> informes) {
        public Chakra {
            informes = informes == null ? List.of() : List.copyOf(informes);
        }
    }

    /** Frases de una clave para un péndulo: las del modelo sustituyen a las generales. */
    public List<String> linesFor(String model, String key) {
        PendulumModel m = model == null ? null : models.get(model);
        if (m != null) {
            List<String> own = m.lines().get(key);
            if (own != null && !own.isEmpty()) {
                return own;
            }
        }
        return lines.getOrDefault(key, List.of());
    }
}
