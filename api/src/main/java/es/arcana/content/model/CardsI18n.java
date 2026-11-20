package es.arcana.content.model;

import java.util.Map;

/** {@code {lang}/cards/{familia}.json}: nombres visibles. */
public record CardsI18n(String family, String name, String description, Map<String, NameDescription> suits,
                        Map<String, ModelI18n> models, Map<String, String> cards) {

    public static final CardsI18n EMPTY = new CardsI18n(null, null, null, null, null, null);

    public CardsI18n {
        suits = suits == null ? Map.of() : Map.copyOf(suits);
        models = models == null ? Map.of() : Map.copyOf(models);
        cards = cards == null ? Map.of() : Map.copyOf(cards);
    }

    public record NameDescription(String name, String description) {
    }

    public record ModelI18n(String name, String description, Map<String, String> cardNames) {
        public ModelI18n {
            cardNames = cardNames == null ? Map.of() : Map.copyOf(cardNames);
        }
    }

    /** Nombre de una carta en un modelo (Marsella puede renombrar), o el id si falta. */
    public String cardName(String modelId, String cardId) {
        ModelI18n m = modelId == null ? null : models.get(modelId);
        if (m != null && m.cardNames().containsKey(cardId)) {
            return m.cardNames().get(cardId);
        }
        return cards.getOrDefault(cardId, cardId);
    }

    public String suitName(String suit) {
        if (suit == null) {
            return null;
        }
        NameDescription nd = suits.get(suit);
        return nd == null || nd.name() == null ? suit : nd.name();
    }
}
