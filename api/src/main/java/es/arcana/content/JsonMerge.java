package es.arcana.content;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;

import java.util.Map;

/** Fusión profunda para el fallback de idioma por clave: los objetos se fusionan, el resto lo sustituye el idioma. */
final class JsonMerge {

    private JsonMerge() {
    }

    static JsonNode merge(JsonNode base, JsonNode override) {
        if (base == null || base.isMissingNode() || base.isNull()) {
            return override;
        }
        if (override == null || override.isMissingNode() || override.isNull()) {
            return base;
        }
        if (base.isObject() && override.isObject()) {
            ObjectNode out = ((ObjectNode) base).deepCopy();
            for (Map.Entry<String, JsonNode> e : override.properties()) {
                out.set(e.getKey(), merge(out.get(e.getKey()), e.getValue()));
            }
            return out;
        }
        return override;
    }
}
