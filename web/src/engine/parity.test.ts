// Paridad EXACTA con el motor Java: mismos casos (__fixtures__/parity-cases.json) ejecutados por el NarrativeEngine y
// el PendulumService reales del backend (__fixtures__/parity-java.json) sobre la misma fixture de contenido.
import { describe, expect, it } from 'vitest';
import { cardName, suitName } from './content';
import { DEFAULT_OPTIONS, NarrativeEngine } from './narrative';
import { PendulumEngine } from './pendulum';
import { SplittableRandom } from './random';
import { EMPTY_CTX, type Ctx, type NarrativeCard } from './situation';
import { FIXED_NOW, fixtureContent } from './testkit';
import cases from './__fixtures__/parity-cases.json';
import java from './__fixtures__/parity-java.json';

const content = fixtureContent();

function ctxOf(c: Record<string, unknown>): Ctx {
  return { ...EMPTY_CTX, ...Object.fromEntries(Object.entries(c).filter(([, v]) => v !== null)) } as Ctx;
}

describe('paridad con el motor Java', () => {
  it('lecturas: mismos textos, tonos, interacciones, suerte e ids con la misma semilla', () => {
    expect(cases.readings.length).toBe(java.readings.length);
    cases.readings.forEach((c, k) => {
      const engine = new NarrativeEngine(content, FIXED_NOW, c.options ?? DEFAULT_OPTIONS);
      const lc = content.lang(c.lang);
      const deck = content.deck(c.family)!;
      const names = lc.cards(c.family);
      const spread = content.spread(c.spread)!;
      const sn = lc.spread(c.spread);
      const cards: NarrativeCard[] = c.cards.map((card, i) => {
        const def = deck.cards.find(x => x.id === card.id)!;
        const pos = spread.positions[i];
        const pi = sn?.positions[pos];
        return {
          def, name: cardName(names, deck.defaultModel, card.id), suitName: suitName(names, def.suit), reversed: card.reversed,
          positionId: pos, positionLabel: pi?.label ?? pos, positionInline: pi?.inline ?? null,
        };
      });
      const out = engine.compose({
        lang: c.lang, family: c.family, spread: c.spread, cards, ctx: ctxOf(c.ctx), recentFragmentIds: c.recent,
        textSeed: BigInt(c.textSeed),
      });
      expect(out, `caso ${k}`).toEqual(java.readings[k]);
    });
  });

  it('péndulo: mismo resultado y frase con la misma semilla', () => {
    const p = new PendulumEngine(content, FIXED_NOW);
    cases.pendulum.forEach((c, k) => {
      const out = p.answer({ mode: c.mode, model: c.model, options: c.options, ctx: ctxOf(c.ctx) }, c.lang,
        new SplittableRandom(BigInt(c.seed)));
      expect(out, `caso ${k}`).toEqual(java.pendulum[k]);
    });
  });
});
