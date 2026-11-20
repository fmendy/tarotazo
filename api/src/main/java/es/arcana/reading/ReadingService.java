package es.arcana.reading;

import es.arcana.common.BadRequestException;
import es.arcana.common.ReadingContext;
import es.arcana.common.UnavailableException;
import es.arcana.content.ArtPaths;
import es.arcana.content.CatalogService;
import es.arcana.content.ContentRepository;
import es.arcana.content.LangContent;
import es.arcana.content.model.CardDef;
import es.arcana.content.model.CardsI18n;
import es.arcana.content.model.DeckDef;
import es.arcana.content.model.DeckModelDef;
import es.arcana.content.model.SpreadDef;
import es.arcana.content.model.SpreadI18n;
import es.arcana.content.web.CatalogDtos.PositionDto;
import es.arcana.content.web.CatalogDtos.SpreadDto;
import es.arcana.narrative.NarrativeCard;
import es.arcana.narrative.NarrativeEngine;
import es.arcana.narrative.ReadingNarrative;
import es.arcana.reading.web.ReadingDtos.CardView;
import es.arcana.reading.web.ReadingDtos.InteractionView;
import es.arcana.reading.web.ReadingDtos.LineView;
import es.arcana.reading.web.ReadingDtos.ReadingRequest;
import es.arcana.reading.web.ReadingDtos.ReadingResponse;
import es.arcana.reading.web.ReadingDtos.SpreadView;
import es.arcana.reading.web.ReadingDtos.Summary;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;

/** Lectura completa: baraja con {@code SecureRandom}, corta, toma los picks, sortea orientación y compone textos. */
@Service
public class ReadingService {

    private final ContentRepository content;
    private final CatalogService catalog;
    private final NarrativeEngine narrative;
    private final SecureRandom random = new SecureRandom();
    private final DeckShuffler shuffler = new DeckShuffler(random);

    public ReadingService(ContentRepository content, CatalogService catalog, NarrativeEngine narrative) {
        this.content = content;
        this.catalog = catalog;
        this.narrative = narrative;
    }

    public ReadingResponse read(ReadingRequest req, String lang) {
        DeckDef deck = content.deck(req.deck())
                .orElseThrow(() -> new UnavailableException("Baraja no disponible: " + req.deck()));
        String modelId = req.model() == null ? deck.defaultModel() : req.model();
        DeckModelDef model = deck.model(modelId)
                .orElseThrow(() -> new BadRequestException("El modelo '" + modelId + "' no es de la baraja " + req.deck()));
        SpreadDef spread = content.spread(req.spread())
                .orElseThrow(() -> new BadRequestException("Tirada desconocida: '" + req.spread() + "'"));
        if (!spread.supports(deck.family())) {
            throw new BadRequestException("La tirada '" + spread.id() + "' no está disponible para la baraja " + deck.family());
        }
        List<Integer> picks = req.picks();
        int min = spread.minCards();
        int max = spread.maxCards();
        if (picks.size() < min || picks.size() > max) {
            throw new BadRequestException(min == max
                    ? "La tirada '" + spread.id() + "' necesita " + max + " picks"
                    : "La tirada '" + spread.id() + "' admite entre " + min + " y " + max + " picks");
        }
        if (new HashSet<>(picks).size() != picks.size()) {
            throw new BadRequestException("picks deben ser distintos");
        }
        List<CardDef> cards = deck.cardsFor(model);
        for (int p : picks) {
            if (p >= cards.size()) {
                throw new BadRequestException("pick fuera de rango: " + p + " (el abanico tiene " + cards.size()
                        + " cartas, índices 0.." + (cards.size() - 1) + ")");
            }
        }

        List<CardDef> fan = DeckShuffler.cut(shuffler.shuffle(cards), req.cutIndex());
        List<DeckShuffler.Drawn<CardDef>> drawn = shuffler.draw(fan, picks, deck.reversedProbabilityFor(model));

        LangContent lc = content.lang(lang);
        CardsI18n names = lc.cards(deck.family());
        SpreadI18n spreadNames = lc.spread(spread.id()).orElse(null);
        List<NarrativeCard> ncards = new ArrayList<>(drawn.size());
        for (int i = 0; i < drawn.size(); i++) {
            CardDef c = drawn.get(i).card();
            String pos = spread.positions().get(i);
            SpreadI18n.PositionI18n pi = spreadNames == null ? null : spreadNames.positions().get(pos);
            ncards.add(new NarrativeCard(c, names.cardName(model.id(), c.id()), names.suitName(c.suit()),
                    drawn.get(i).reversed(), pos, pi == null ? pos : pi.label(), pi == null ? null : pi.inline()));
        }

        ReadingContext ctx = ReadingContext.orEmpty(req.context());
        ReadingNarrative story = narrative.compose(new NarrativeEngine.ReadingScript(lang, deck.family(), spread.id(),
                ncards, ctx, req.recentFragmentIds(), random.nextLong()));

        String art = model.art() == null ? model.id() : model.art();
        List<CardView> views = new ArrayList<>(ncards.size());
        for (int i = 0; i < ncards.size(); i++) {
            NarrativeCard c = ncards.get(i);
            ReadingNarrative.CardNarrative cn = story.cards().get(i);
            views.add(new CardView(c.positionId(), c.def().id(), c.name(), c.reversed(), ArtPaths.card(art, c.def().id()),
                    cn.tone(), cn.lines().stream().map(l -> new LineView(l.kind(), l.text())).toList(),
                    cn.interaction() == null ? null
                            : new InteractionView(cn.interaction().id(), cn.interaction().prompt(), cn.interaction().options())));
        }
        SpreadDto sd = catalog.spread(spread, lc);
        List<PositionDto> usedPositions = sd.positions().subList(0, ncards.size());
        return new ReadingResponse(story.tone(), new SpreadView(sd.id(), sd.name(), sd.layout(), usedPositions),
                story.intro(), views, new Summary(story.summary(), story.luckyNumber(), story.luckyColor()),
                story.outro(), story.disclaimer(), story.usedFragmentIds());
    }
}
