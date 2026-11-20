// Propiedad del equipo de animación. Ver docs/CONTRACTS.md §7.
// STUBS provisionales: firmas definitivas, implementación mínima (se sustituye sin cambiar firmas).
import { createElement as h, useEffect, useState, type JSX, type ReactNode } from 'react';

export function useReducedMotion(): boolean {
  const q = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const [r, setR] = useState(!!q?.matches);
  useEffect(() => {
    if (!q) return;
    const f = () => setR(q.matches);
    q.addEventListener('change', f);
    return () => q.removeEventListener('change', f);
  }, [q]);
  return r;
}

function useDoneAfter(ms: number, cb?: () => void) {
  useEffect(() => { const t = setTimeout(() => cb?.(), ms); return () => clearTimeout(t); }, []); // eslint-disable-line
}

export function ShuffleDeck(p: { backImage: string; style: 'riffle' | 'overhand' | 'mesa'; onDone(): void; onMore?(): void; reducedMotion?: boolean }): JSX.Element {
  useDoneAfter(800, p.onDone);
  return h('img', { src: p.backImage, alt: 'Barajando', style: { width: 140 } });
}
export function CutDeck(p: { backImage: string; mode: 'tres' | 'abanico'; onCut(index: 0 | 1 | 2): void }): JSX.Element {
  return h('div', { style: { display: 'flex', gap: 16 } }, ([0, 1, 2] as const).map((i) => h('button', { key: i, onClick: () => p.onCut(i) }, h('img', { src: p.backImage, alt: `Montón ${i + 1}`, style: { width: 90 } }))));
}
export function CardFan(p: { backImage: string; count: number; pick: number; onPicked(indices: number[]): void }): JSX.Element {
  const [sel, setSel] = useState<number[]>([]);
  return h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 2 } }, Array.from({ length: p.count }, (_, i) => h('button', {
    key: i, disabled: sel.includes(i), onClick: () => { const n = [...sel, i]; setSel(n); if (n.length === p.pick) p.onPicked(n); },
  }, h('img', { src: p.backImage, alt: `Carta ${i + 1}`, style: { width: 30 } }))));
}
export function FlipCard(p: { front: string; back: string; flipped: boolean; reversed?: boolean; width?: number; onFlipped?(): void }): JSX.Element {
  useEffect(() => { if (p.flipped) p.onFlipped?.(); }, [p.flipped]); // eslint-disable-line
  return h('img', { src: p.flipped ? p.front : p.back, alt: '', style: { width: p.width ?? 140, transform: p.flipped && p.reversed ? 'rotate(180deg)' : undefined } });
}
export function SpreadBoard(p: { layout: 'single' | 'row' | 'cross' | 'horseshoe' | 'celtic' | 'love'; slots: number; children: ReactNode[] }): JSX.Element {
  return h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' } }, p.children);
}
export function Ambience(_p: { variant: 'humo' | 'velas' | 'estrellas' | 'polvo'; intensity?: number }): JSX.Element {
  return h('div', { 'aria-hidden': true, style: { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: -1 } });
}
export function ScreenTransition(p: { id: string; children: ReactNode }): JSX.Element {
  return h('div', { key: p.id }, p.children);
}
export function TypewriterText(p: { text: string; speed?: number; onDone?(): void }): JSX.Element {
  useDoneAfter(10, p.onDone);
  return h('span', null, p.text);
}
export function DustStamp(p: { trigger: number; label: string }): JSX.Element {
  return h('div', { style: { opacity: p.trigger ? 1 : 0 } }, p.label);
}
export function Chests(p: { onChoose(family: 'tarot' | 'spanish'): void }): JSX.Element {
  return h('div', null, h('button', { onClick: () => p.onChoose('tarot') }, 'Tarot'), h('button', { onClick: () => p.onChoose('spanish') }, 'Baraja española'));
}
export function Carousel3D<T>(p: { items: T[]; render(item: T): ReactNode; onSelect(item: T): void }): JSX.Element {
  return h('div', { style: { display: 'flex', gap: 8, overflowX: 'auto' } }, p.items.map((it, i) => h('button', { key: i, onClick: () => p.onSelect(it) }, p.render(it))));
}
export { playSfx, setMuted, startAmbient, stopAmbient } from './sound';
