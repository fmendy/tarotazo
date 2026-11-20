package es.arcana.content;

import es.arcana.content.model.CardsI18n;
import es.arcana.content.model.Fragment;
import es.arcana.content.model.Interaction;
import es.arcana.content.model.Meaning;
import es.arcana.content.model.PendulumContent;
import es.arcana.content.model.ProvinceSheet;
import es.arcana.content.model.ServerLabels;
import es.arcana.content.model.SpreadI18n;
import tools.jackson.databind.JsonNode;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/** Contenido de un idioma ya resuelto con fallback a {@code es}. Inmutable; se cachea con Caffeine. */
public final class LangContent {

    private final String lang;
    private final Map<String, CardsI18n> cards;
    private final Map<String, SpreadI18n> spreads;
    private final Map<String, Map<String, Meaning>> meanings;
    private final List<Fragment> fragments;
    private final Map<String, List<Fragment>> fragmentsBySlot;
    private final Map<String, Interaction> interactions;
    private final Map<String, ProvinceSheet> provinceSheets;
    private final JsonNode titles;
    private final JsonNode onboarding;
    private final JsonNode pendulumRaw;
    private final PendulumContent pendulum;
    private final ServerLabels labels;

    LangContent(String lang, Map<String, CardsI18n> cards, Map<String, SpreadI18n> spreads,
                Map<String, Map<String, Meaning>> meanings, List<Fragment> fragments,
                Map<String, Interaction> interactions, Map<String, ProvinceSheet> provinceSheets, JsonNode titles,
                JsonNode onboarding, JsonNode pendulumRaw, PendulumContent pendulum, ServerLabels labels) {
        this.lang = lang;
        this.cards = Map.copyOf(cards);
        this.spreads = Map.copyOf(spreads);
        this.meanings = Map.copyOf(meanings);
        this.fragments = List.copyOf(fragments);
        this.fragmentsBySlot = fragments.stream().collect(Collectors.groupingBy(Fragment::slot,
                Collectors.collectingAndThen(Collectors.toList(), List::copyOf)));
        this.interactions = Map.copyOf(interactions);
        this.provinceSheets = Map.copyOf(provinceSheets);
        this.titles = titles;
        this.onboarding = onboarding;
        this.pendulumRaw = pendulumRaw;
        this.pendulum = pendulum;
        this.labels = labels;
    }

    public String lang() {
        return lang;
    }

    public CardsI18n cards(String family) {
        return cards.getOrDefault(family, CardsI18n.EMPTY);
    }

    public Optional<SpreadI18n> spread(String id) {
        return Optional.ofNullable(spreads.get(id));
    }

    public Optional<Meaning> meaning(String family, String cardId) {
        return Optional.ofNullable(meanings.getOrDefault(family, Map.of()).get(cardId));
    }

    public List<Fragment> fragments() {
        return fragments;
    }

    public List<Fragment> fragments(String slot) {
        return fragmentsBySlot.getOrDefault(slot, List.of());
    }

    public Map<String, Interaction> interactions() {
        return interactions;
    }

    public Optional<ProvinceSheet> province(String code) {
        return code == null ? Optional.empty() : Optional.ofNullable(provinceSheets.get(code));
    }

    /** {@code {lang}/titles.json} tal cual (o vacío si no existe). */
    public Optional<JsonNode> titles() {
        return Optional.ofNullable(titles);
    }

    /** {@code {lang}/onboarding.json} tal cual (o vacío si no existe). */
    public Optional<JsonNode> onboarding() {
        return Optional.ofNullable(onboarding);
    }

    /** {@code {lang}/pendulum.json} tal cual (o vacío si no existe). */
    public Optional<JsonNode> pendulumRaw() {
        return Optional.ofNullable(pendulumRaw);
    }

    public PendulumContent pendulum() {
        return pendulum;
    }

    public ServerLabels labels() {
        return labels;
    }
}
