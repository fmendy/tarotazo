// Port de es.arcana.content.CatalogService y es.arcana.reading.ReadingService.
import { DeckShuffler, cut } from './deck';
import { EngineError } from './errors';
import {
  cardName, cardsFor, deckModel, maxCards, minCards, reversedProbabilityFor, suitName, type ContentSet, type LangContent,
} from './content';
import type { NarrativeEngine } from './narrative';
import { seed64 } from './random';
import type { NarrativeCard } from './situation';
import type { DeckDef, DeckModelDef, EngineDeck, EngineProvince, EngineSpread, ReadingResponse, SpreadDef } from './types';
import type { ValidReading } from './validation';

const art = (m: DeckModelDef) => m.art ?? m.id;
export const artBack = (a: string) => `/art/backs/${a}.svg`;
export const artCard = (a: string, cardId: string) => `/art/cards/${a}/${cardId}.svg`;
export const artPattern = (a: string) => `/art/cards/${a}/{cardId}.svg`;

export interface CatalogOptions {
  /** ¿Hay arte para este modelo? (en el backend: arcana.art-dir / unavailable-models). Por defecto, sí. */
  artAvailable?: (model: DeckModelDef) => boolean;
  random: () => number;
}

export class CatalogService {
  constructor(private readonly content: ContentSet, private readonly opts: CatalogOptions) {}

  decks(lang: string): EngineDeck[] {
    const lc = this.content.lang(lang);
    return this.content.decks().map(d => this.deck(d, lc));
  }

  private deck(d: DeckDef, lc: LangContent): EngineDeck {
    const names = lc.cards(d.family);
    const preview = d.cards.length ? d.cards[0].id : null;
    const models = d.models.map(m => {
      const mi = names.models[m.id];
      const size = m.deckSize ?? cardsFor(d, m).length;
      return {
        id: m.id,
        name: mi?.name ?? m.id,
        description: mi?.description ?? null,
        deckSize: size,
        backImage: artBack(art(m)),
        previewImage: preview === null ? null : artCard(art(m), preview),
        imagePattern: artPattern(art(m)),
        available: this.opts.artAvailable ? this.opts.artAvailable(m) : true,
        numerals: { ...(m.numerals ?? {}) },
      };
    });
    return {
      family: d.family as EngineDeck['family'], name: names.name ?? d.family, description: names.description ?? null,
      defaultModel: d.defaultModel, models,
    };
  }

  spreads(deck: string | undefined, lang: string): EngineSpread[] {
    if (deck !== undefined && !this.content.deck(deck)) {
      throw EngineError.badRequest(`Baraja desconocida: '${deck}' (usa tarot o spanish)`);
    }
    const lc = this.content.lang(lang);
    return this.content.spreads().filter(s => deck === undefined || s.families.includes(deck)).map(s => this.spread(s, lc));
  }

  spread(s: SpreadDef, lc: LangContent): EngineSpread {
    const i = lc.spread(s.id);
    const positions = s.positions.map(p => ({ id: p, label: i?.positions[p]?.label ?? p }));
    return {
      id: s.id, name: i?.name ?? s.id, description: i?.description ?? null, size: maxCards(s), minSize: s.minSize ?? null,
      layout: s.layout as EngineSpread['layout'], positions,
    };
  }

  provinces(lang: string): EngineProvince[] {
    const lc = this.content.lang(lang);
    return this.content.provinces().map(p => {
      const sheet = lc.province(p.code);
      const ch = sheet?.chascarrillos ?? [];
      const teaser = ch.length ? ch[Math.min(ch.length - 1, Math.floor(this.opts.random() * ch.length))] : null;
      return {
        code: p.code,
        nombre: sheet ? sheet.nombre : p.nombre,
        comunidad: p.comunidad !== null ? p.comunidad : (sheet?.comunidad ?? null),
        gentilicio: sheet ? sheet.gentilicio : null,
        zona: p.zona ?? null,
        teaser,
      };
    });
  }

  titles(lang: string): unknown {
    const t = this.content.lang(lang).titles;
    if (t === null) throw EngineError.unavailable('Contenido no disponible: titles.json');
    return t;
  }

  onboarding(lang: string): unknown {
    const o = this.content.lang(lang).onboarding;
    if (o === null) throw EngineError.unavailable('Contenido no disponible: onboarding.json');
    return o;
  }
}

export class ReadingService {
  private readonly shuffler: DeckShuffler;

  constructor(
    private readonly content: ContentSet,
    private readonly catalog: CatalogService,
    private readonly narrative: NarrativeEngine,
    private readonly random: () => number,
  ) {
    this.shuffler = new DeckShuffler(random);
  }

  read(req: ValidReading, lang: string): ReadingResponse {
    const deck = this.content.deck(req.deck);
    if (!deck) throw EngineError.unavailable(`Baraja no disponible: ${req.deck}`);
    const modelId = req.model ?? deck.defaultModel;
    const model = deckModel(deck, modelId);
    if (!model) throw EngineError.badRequest(`El modelo '${modelId}' no es de la baraja ${req.deck}`);
    const spread = this.content.spread(req.spread);
    if (!spread) throw EngineError.badRequest(`Tirada desconocida: '${req.spread}'`);
    if (!spread.families.includes(deck.family)) {
      throw EngineError.badRequest(`La tirada '${spread.id}' no está disponible para la baraja ${deck.family}`);
    }
    const picks = req.picks;
    const min = minCards(spread);
    const max = maxCards(spread);
    if (picks.length < min || picks.length > max) {
      throw EngineError.badRequest(min === max
        ? `La tirada '${spread.id}' necesita ${max} picks`
        : `La tirada '${spread.id}' admite entre ${min} y ${max} picks`);
    }
    if (new Set(picks).size !== picks.length) throw EngineError.badRequest('picks deben ser distintos');
    const cards = cardsFor(deck, model);
    for (const p of picks) {
      if (p >= cards.length) {
        throw EngineError.badRequest(`pick fuera de rango: ${p} (el abanico tiene ${cards.length} cartas, índices 0..${cards.length - 1})`);
      }
    }

    const fan = cut(this.shuffler.shuffle(cards), req.cutIndex);
    const drawn = this.shuffler.draw(fan, picks, reversedProbabilityFor(deck, model));

    const lc = this.content.lang(lang);
    const names = lc.cards(deck.family);
    const spreadNames = lc.spread(spread.id);
    const ncards: NarrativeCard[] = drawn.map((d, i) => {
      const pos = spread.positions[i];
      const pi = spreadNames?.positions[pos];
      return {
        def: d.card, name: cardName(names, model.id, d.card.id), suitName: suitName(names, d.card.suit), reversed: d.reversed,
        positionId: pos, positionLabel: pi?.label ?? pos, positionInline: pi?.inline ?? null,
      };
    });

    const story = this.narrative.compose({
      lang, family: deck.family, spread: spread.id, cards: ncards, ctx: req.ctx, recentFragmentIds: req.recentFragmentIds,
      textSeed: seed64(this.random),
    });

    const a = art(model);
    const sd = this.catalog.spread(spread, lc);
    return {
      tone: story.tone,
      spread: { id: sd.id, name: sd.name, layout: sd.layout, positions: sd.positions.slice(0, ncards.length) },
      intro: story.intro as string,
      cards: ncards.map((c, i) => {
        const cn = story.cards[i];
        return {
          position: c.positionId, cardId: c.def.id, name: c.name, reversed: c.reversed, image: artCard(a, c.def.id),
          tone: cn.tone, lines: cn.lines.map(l => ({ kind: l.kind, text: l.text })),
          interaction: cn.interaction === null ? null
            : { id: cn.interaction.id, prompt: cn.interaction.prompt, options: cn.interaction.options as ('si' | 'no' | 'skip')[] },
        };
      }),
      summary: { text: story.summary, luckyNumber: story.luckyNumber, luckyColor: story.luckyColor },
      outro: story.outro as string,
      disclaimer: story.disclaimer,
      usedFragmentIds: story.usedFragmentIds,
    };
  }
}
