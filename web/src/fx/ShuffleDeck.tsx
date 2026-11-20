// Barajado animado con GSAP: riffle, overhand y «mezcla en la mesa».
import gsap from 'gsap';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type JSX } from 'react';
import { CardImage, CARD_RATIO } from './Card';
import { isLowPowerDevice, useLatest, useReducedMotion } from './hooks';
import { playSfx } from './sound';

export type ShuffleStyle = 'riffle' | 'overhand' | 'mesa';

export interface ShuffleDeckProps {
  backImage: string;
  style: ShuffleStyle;
  /** Se llama al terminar cada pasada de barajado (también tras pulsar «más»). */
  onDone(): void;
  /** Se llama al pulsar «más» (la animación se repite). */
  onMore?(): void;
  reducedMotion?: boolean;
  /** Ancho de carta en px (por defecto 110). */
  cardWidth?: number;
  /** Mostrar el botón «más» (por defecto true). */
  showMore?: boolean;
  moreLabel?: string;
  /** Empezar a barajar al montar (por defecto true). */
  autoPlay?: boolean;
  className?: string;
  styleOverride?: CSSProperties;
}

export function ShuffleDeck(p: ShuffleDeckProps): JSX.Element {
  const sysReduced = useReducedMotion();
  const reduced = p.reducedMotion ?? sysReduced;
  const root = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(p.autoPlay === false ? 0 : 1);
  const [busy, setBusy] = useState(false);
  const done = useLatest(p.onDone);
  const N = useMemo(() => (isLowPowerDevice() ? 12 : 18), []);
  const cw = p.cardWidth ?? 110;
  const ch = cw * CARD_RATIO;

  useEffect(() => {
    if (!run) return;
    const el = root.current;
    if (!el) return;
    setBusy(true);
    const cards = Array.from(el.querySelectorAll<HTMLElement>('[data-card]'));
    const finish = () => {
      setBusy(false);
      done.current();
    };
    if (reduced) {
      const t = setTimeout(finish, 450);
      el.animate?.([{ opacity: 1 }, { opacity: 0.6 }, { opacity: 1 }], { duration: 400 });
      return () => clearTimeout(t);
    }
    const ctx = gsap.context(() => {
      const stackY = (i: number) => -i * 0.6;
      const stackX = (i: number) => i * 0.12;
      gsap.set(cards, { x: (i) => stackX(i), y: (i) => stackY(i), rotation: 0, zIndex: (i) => i, transformOrigin: '50% 50%' });
      const tl = gsap.timeline({ onComplete: finish });
      const rnd = gsap.utils.random;

      if (p.style === 'riffle') {
        const half = Math.floor(N / 2);
        const left = cards.slice(0, half);
        const right = cards.slice(half);
        tl.to(left, { x: (i) => -cw * 0.62 + stackX(i), y: (i) => stackY(i) - 6, rotation: -9, duration: 0.35, ease: 'power2.out', stagger: 0.008 }, 0)
          .to(right, { x: (i) => cw * 0.62 + stackX(i), y: (i) => stackY(i) - 6, rotation: 9, duration: 0.35, ease: 'power2.out', stagger: 0.008 }, 0)
          // doblar las esquinas (tensión antes de soltar)
          .to(left, { rotation: -14, y: '-=6', duration: 0.18, ease: 'sine.inOut' }, 0.4)
          .to(right, { rotation: 14, y: '-=6', duration: 0.18, ease: 'sine.inOut' }, 0.4)
          .call(() => playSfx('shuffle'), [], 0.55);
        // intercalar desde abajo, alternando mitades, con arco
        const order: HTMLElement[] = [];
        for (let i = 0; i < Math.max(left.length, right.length); i++) {
          if (left[i]) order.push(left[i]);
          if (right[i]) order.push(right[i]);
        }
        order.forEach((c, k) => {
          const at = 0.58 + k * 0.042;
          tl.set(c, { zIndex: 100 + k }, at).to(
            c,
            {
              keyframes: [
                { x: (c.dataset.side === 'L' ? -1 : 1) * cw * 0.25, y: -ch * 0.12 + stackY(k), rotation: c.dataset.side === 'L' ? -4 : 4, duration: 0.09, ease: 'power1.out' },
                { x: stackX(k) + rnd(-3, 3), y: stackY(k), rotation: rnd(-2.5, 2.5), duration: 0.11, ease: 'power2.in' },
              ],
            },
            at,
          );
        });
        const end = 0.58 + order.length * 0.042 + 0.2;
        // puente y cuadrar el mazo
        tl.to(order, { y: (i) => stackY(i) - 14, scaleY: 0.97, duration: 0.2, ease: 'sine.out', stagger: 0.004 }, end)
          .to(order, { y: (i) => stackY(i), x: (i) => stackX(i), rotation: 0, scaleY: 1, duration: 0.25, ease: 'back.out(2)', stagger: 0.004 }, end + 0.22);
      } else if (p.style === 'overhand') {
        let order = [...cards];
        tl.call(() => playSfx('shuffle', { rate: 1.4, volume: 0.5 }), [], 0);
        // inclinar el mazo en la mano
        tl.to(cards, { rotation: -4, x: (i) => cw * 0.25 + stackX(i), duration: 0.25, ease: 'power2.out' }, 0);
        let t = 0.3;
        for (let r = 0; r < 6; r++) {
          const k = 2 + Math.floor(Math.random() * 3);
          const chunk = order.slice(0, k); // las de abajo del mazo
          order = [...order.slice(k), ...chunk];
          const snap = [...order];
          tl.to(chunk, { y: -ch * 0.55, x: -cw * 0.35, rotation: 6, duration: 0.2, ease: 'power2.out', stagger: 0.01 }, t)
            .call(() => {
              snap.forEach((c, i) => gsap.set(c, { zIndex: i }));
              playSfx('flip', { volume: 0.3, rate: 1.6 });
            }, [], t + 0.2)
            .to(chunk, { y: (i) => stackY(order.length - k + i), x: (i) => cw * 0.25 + stackX(order.length - k + i), rotation: -4 + rnd(-2, 2), duration: 0.2, ease: 'power2.in' }, t + 0.21);
          // el resto del mazo baja para compactar
          tl.to(order.slice(0, order.length - k), { y: (i) => stackY(i), x: (i) => cw * 0.25 + stackX(i), duration: 0.2, ease: 'sine.out' }, t + 0.21);
          t += 0.44;
        }
        tl.to(order, { x: (i) => stackX(i), y: (i) => stackY(i), rotation: 0, duration: 0.3, ease: 'back.out(1.6)' }, t);
      } else {
        // mezcla en la mesa: esparcir, remover y recoger
        const R = Math.min(cw * 1.35, 220);
        tl.call(() => playSfx('shuffle', { rate: 0.6, volume: 0.6 }), [], 0);
        const scatter = () => {
          const a = rnd(0, Math.PI * 2);
          const r = rnd(R * 0.25, R);
          return { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.55, rotation: rnd(-180, 180) };
        };
        tl.to(cards, { x: () => scatter().x, y: () => scatter().y, rotation: () => rnd(-160, 160), duration: 0.55, ease: 'power3.out', stagger: { each: 0.015, from: 'random' } }, 0);
        for (let r = 0; r < 2; r++) {
          tl.to(cards, { x: () => scatter().x, y: () => scatter().y, rotation: `+=${rnd(40, 120)}`, duration: 0.7, ease: 'sine.inOut', stagger: { each: 0.01, from: 'random' } }, 0.6 + r * 0.72);
          tl.call(() => playSfx('shuffle', { rate: 0.5 + r * 0.2, volume: 0.45 }), [], 0.65 + r * 0.72);
        }
        tl.set(cards, { zIndex: () => Math.floor(Math.random() * N) }, 2.1)
          .to(cards, { x: (i) => stackX(i), y: (i) => stackY(i), rotation: () => rnd(-6, 6), duration: 0.45, ease: 'power3.inOut', stagger: { each: 0.02, from: 'edges' } }, 2.1)
          .to(cards, { rotation: 0, duration: 0.2, ease: 'back.out(2)' }, '>-0.05');
      }
    }, el);
    return () => ctx.revert();
  }, [run, p.style, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  const more = () => {
    if (busy) return;
    p.onMore?.();
    setRun((r) => r + 1);
  };

  const stageW = p.style === 'mesa' ? cw * 3.4 : cw * 2.6;
  const stageH = p.style === 'mesa' ? ch * 1.9 : ch * 1.55;
  return (
    <div className={['fx-shuffle', p.className].filter(Boolean).join(' ')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, ...p.styleOverride }}>
      <div ref={root} role="img" aria-label={busy ? 'Barajando las cartas' : 'Mazo barajado'} style={{ position: 'relative', width: stageW, maxWidth: '100%', height: stageH }}>
        {Array.from({ length: N }, (_, i) => (
          <div
            key={i}
            data-card
            data-side={i < N / 2 ? 'L' : 'R'}
            style={{ position: 'absolute', left: '50%', top: '50%', width: cw, height: ch, marginLeft: -cw / 2, marginTop: -ch / 2, willChange: busy ? 'transform' : undefined }}
          >
            <CardImage src={p.backImage} style={{ width: '100%', height: '100%' }} />
          </div>
        ))}
      </div>
      {p.showMore !== false && (
        <button type="button" className="fx-btn" onClick={more} disabled={busy} aria-disabled={busy}>
          {p.moreLabel ?? 'Barajar más'}
        </button>
      )}
    </div>
  );
}
