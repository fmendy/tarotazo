package es.arcana.content.model;

import java.util.List;
import java.util.Optional;

/** {@code decks/{familia}.json} (CONTRACTS §2.1). */
public record DeckDef(String family, Double reversedProbability, String defaultModel, List<DeckModelDef> models,
                      List<CardDef> cards) {

    public DeckDef {
        models = models == null ? List.of() : List.copyOf(models);
        cards = cards == null ? List.of() : List.copyOf(cards);
    }

    public Optional<DeckModelDef> model(String id) {
        return models.stream().filter(m -> m.id().equals(id)).findFirst();
    }

    /** Probabilidad de carta invertida para un modelo (el modelo puede anular la de la familia). */
    public double reversedProbabilityFor(DeckModelDef model) {
        if (model != null && model.reversedProbability() != null) {
            return model.reversedProbability();
        }
        return reversedProbability == null ? 0.0 : reversedProbability;
    }

    /** Cartas del mazo de un modelo: los de 40 cartas excluyen las marcadas {@code only48}. */
    public List<CardDef> cardsFor(DeckModelDef model) {
        if (model != null && model.deckSize() != null && model.deckSize() == 40) {
            return cards.stream().filter(c -> !c.isOnly48()).toList();
        }
        return cards;
    }
}
