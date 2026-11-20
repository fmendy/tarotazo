package es.arcana.content;

import es.arcana.common.BadRequestException;
import es.arcana.common.UnavailableException;
import es.arcana.content.model.CardsI18n;
import es.arcana.content.model.DeckDef;
import es.arcana.content.model.DeckModelDef;
import es.arcana.content.model.SpreadDef;
import es.arcana.content.model.SpreadI18n;
import es.arcana.content.web.CatalogDtos.DeckDto;
import es.arcana.content.web.CatalogDtos.ModelDto;
import es.arcana.content.web.CatalogDtos.PositionDto;
import es.arcana.content.web.CatalogDtos.ProvinceDto;
import es.arcana.content.web.CatalogDtos.SpreadDto;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/** Vistas localizadas del catálogo para los GET del §6. */
@Service
public class CatalogService {

    private final ContentRepository content;

    public CatalogService(ContentRepository content) {
        this.content = content;
    }

    public List<DeckDto> decks(String lang) {
        LangContent lc = content.lang(lang);
        return content.decks().stream().map(d -> deck(d, lc.cards(d.family()))).toList();
    }

    private DeckDto deck(DeckDef d, CardsI18n names) {
        String preview = d.cards().isEmpty() ? null : d.cards().getFirst().id();
        List<ModelDto> models = d.models().stream().map(m -> {
            CardsI18n.ModelI18n mi = names.models().get(m.id());
            int size = m.deckSize() != null ? m.deckSize() : d.cardsFor(m).size();
            return new ModelDto(m.id(), mi == null ? m.id() : mi.name(), mi == null ? null : mi.description(), size,
                    ArtPaths.back(art(m)), preview == null ? null : ArtPaths.card(art(m), preview),
                    ArtPaths.pattern(art(m)), content.artAvailable(m), m.numerals());
        }).toList();
        return new DeckDto(d.family(), names.name() == null ? d.family() : names.name(), names.description(),
                d.defaultModel(), models);
    }

    private static String art(DeckModelDef m) {
        return m.art() == null ? m.id() : m.art();
    }

    public List<SpreadDto> spreads(String deck, String lang) {
        if (deck != null && content.deck(deck).isEmpty()) {
            throw new BadRequestException("Baraja desconocida: '" + deck + "' (usa tarot o spanish)");
        }
        LangContent lc = content.lang(lang);
        return content.spreads().stream()
                .filter(s -> deck == null || s.supports(deck))
                .map(s -> spread(s, lc))
                .toList();
    }

    public SpreadDto spread(SpreadDef s, LangContent lc) {
        SpreadI18n i = lc.spread(s.id()).orElse(null);
        List<PositionDto> positions = s.positions().stream().map(p -> {
            SpreadI18n.PositionI18n pi = i == null ? null : i.positions().get(p);
            return new PositionDto(p, pi == null || pi.label() == null ? p : pi.label());
        }).toList();
        return new SpreadDto(s.id(), i == null ? s.id() : i.name(), i == null ? null : i.description(), s.maxCards(),
                s.minSize(), s.layout(), positions);
    }

    public List<ProvinceDto> provinces(String lang) {
        LangContent lc = content.lang(lang);
        return content.provinces().stream().map(p -> {
            var sheet = lc.province(p.code());
            String teaser = sheet.map(s -> s.chascarrillos().isEmpty() ? null
                    : s.chascarrillos().get(ThreadLocalRandom.current().nextInt(s.chascarrillos().size())))
                    .orElse(null);
            String nombre = sheet.map(s -> s.nombre()).orElse(p.nombre());
            String comunidad = p.comunidad() != null ? p.comunidad() : sheet.map(s -> s.comunidad()).orElse(null);
            return new ProvinceDto(p.code(), nombre, comunidad, sheet.map(s -> s.gentilicio()).orElse(null), p.zona(),
                    teaser);
        }).toList();
    }

    public JsonNode titles(String lang) {
        return content.lang(lang).titles().orElseThrow(() -> new UnavailableException("Contenido no disponible: " + "titles.json"));
    }

    public JsonNode onboarding(String lang) {
        return content.lang(lang).onboarding().orElseThrow(() -> new UnavailableException("Contenido no disponible: " + "onboarding.json"));
    }
}
