// Modelos visuales de péndulo: material, brillo y dibujo procedural en canvas 2D.
// Si existe `/art/pendulums/{id}.svg` se usa esa imagen en lugar del dibujo procedural.

export type PendulumModelId = 'cuarzo' | 'amatista' | 'laton' | 'obsidiana' | 'madera' | 'camara' | 'llave' | 'anillo' | 'chorizo';

export interface PendulumLook {
  id: PendulumModelId;
  name: string;
  shape: 'crystal' | 'cone' | 'drop' | 'chamber' | 'key' | 'ring' | 'sausage';
  light: string;
  mid: string;
  dark: string;
  glow: string;
  /** 0..1: intensidad del halo. */
  glowStrength: number;
  /** 0..1: brillo especular. */
  specular: number;
  chain: 'silver' | 'gold' | 'cord' | 'string';
  /** Tono del vaivén (rate de playSfx('swing')). */
  swingRate: number;
}

export const PENDULUM_LOOKS: Record<PendulumModelId, PendulumLook> = {
  cuarzo: { id: 'cuarzo', name: 'Cuarzo', shape: 'crystal', light: '#ffffff', mid: '#d7e9f7', dark: '#8fb1cc', glow: '#cfe8ff', glowStrength: 0.55, specular: 1, chain: 'silver', swingRate: 1.15 },
  amatista: { id: 'amatista', name: 'Amatista', shape: 'crystal', light: '#f1dcff', mid: '#a96ee0', dark: '#4f1d7d', glow: '#c79bff', glowStrength: 0.6, specular: 0.9, chain: 'silver', swingRate: 1.05 },
  laton: { id: 'laton', name: 'Latón', shape: 'cone', light: '#fff1b8', mid: '#d9a640', dark: '#7c5510', glow: '#ffd27a', glowStrength: 0.35, specular: 0.85, chain: 'gold', swingRate: 0.95 },
  obsidiana: { id: 'obsidiana', name: 'Obsidiana', shape: 'crystal', light: '#8d86a3', mid: '#2b2636', dark: '#07060a', glow: '#8a7dff', glowStrength: 0.3, specular: 1, chain: 'silver', swingRate: 0.85 },
  madera: { id: 'madera', name: 'Madera', shape: 'drop', light: '#e7b884', mid: '#b47a45', dark: '#5f3518', glow: '#ffb36b', glowStrength: 0.12, specular: 0.25, chain: 'cord', swingRate: 0.8 },
  camara: { id: 'camara', name: 'Cámara egipcia', shape: 'chamber', light: '#ffe6a3', mid: '#c99a3e', dark: '#5e4113', glow: '#ffcf6b', glowStrength: 0.45, specular: 0.8, chain: 'gold', swingRate: 0.9 },
  llave: { id: 'llave', name: 'Llave del trastero', shape: 'key', light: '#f3df9a', mid: '#b8933a', dark: '#5a4415', glow: '#ffe08a', glowStrength: 0.2, specular: 0.7, chain: 'string', swingRate: 1.25 },
  anillo: { id: 'anillo', name: 'Anillo de la abuela', shape: 'ring', light: '#fff4c2', mid: '#e2b443', dark: '#80570c', glow: '#ff6b8a', glowStrength: 0.4, specular: 1, chain: 'string', swingRate: 1.3 },
  chorizo: { id: 'chorizo', name: 'Chorizo', shape: 'sausage', light: '#e0604f', mid: '#a3291f', dark: '#4e0d08', glow: '#ff7b5c', glowStrength: 0.15, specular: 0.45, chain: 'string', swingRate: 0.7 },
};

export function getLook(id: string): PendulumLook {
  return PENDULUM_LOOKS[id as PendulumModelId] ?? PENDULUM_LOOKS.cuarzo;
}

type Ctx = CanvasRenderingContext2D;

/** Dibuja la lenteja en coordenadas locales: punto de enganche en (0,0), cuelga hacia +y, alto `s`. */
export function drawBob(c: Ctx, look: PendulumLook, s: number): void {
  const L = look;
  const lin = (x0: number, x1: number) => {
    const g = c.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, L.dark);
    g.addColorStop(0.35, L.light);
    g.addColorStop(0.55, L.mid);
    g.addColorStop(1, L.dark);
    return g;
  };
  c.lineJoin = 'round';
  switch (L.shape) {
    case 'crystal': {
      const w = s * 0.24;
      // casquillo
      c.fillStyle = '#c9c9d2';
      c.fillRect(-w * 0.35, 0, w * 0.7, s * 0.08);
      // prisma hexagonal con punta
      const top = s * 0.08;
      const body = s * 0.58;
      c.beginPath();
      c.moveTo(-w, top + s * 0.06);
      c.lineTo(-w * 0.5, top);
      c.lineTo(w * 0.5, top);
      c.lineTo(w, top + s * 0.06);
      c.lineTo(w, body);
      c.lineTo(0, s);
      c.lineTo(-w, body);
      c.closePath();
      c.fillStyle = lin(-w, w);
      c.fill();
      // facetas
      c.globalAlpha = 0.45;
      c.strokeStyle = L.light;
      c.lineWidth = Math.max(1, s * 0.012);
      c.beginPath();
      c.moveTo(-w * 0.5, top);
      c.lineTo(-w * 0.4, body);
      c.lineTo(0, s);
      c.moveTo(w * 0.5, top);
      c.lineTo(w * 0.4, body);
      c.lineTo(0, s);
      c.moveTo(-w, body);
      c.lineTo(-w * 0.4, body);
      c.moveTo(w, body);
      c.lineTo(w * 0.4, body);
      c.stroke();
      c.globalAlpha = 1;
      break;
    }
    case 'cone': {
      const w = s * 0.3;
      c.beginPath();
      c.ellipse(0, s * 0.12, w * 0.55, s * 0.1, 0, Math.PI, 0);
      c.lineTo(w, s * 0.22);
      c.lineTo(0, s);
      c.lineTo(-w, s * 0.22);
      c.closePath();
      c.fillStyle = lin(-w, w);
      c.fill();
      c.fillStyle = L.dark;
      c.globalAlpha = 0.5;
      for (let i = 0; i < 3; i++) c.fillRect(-w * (1 - i * 0.12) * 0.98, s * (0.26 + i * 0.05), 2 * w * (1 - i * 0.12) * 0.98, s * 0.012);
      c.globalAlpha = 1;
      break;
    }
    case 'drop': {
      const w = s * 0.3;
      c.beginPath();
      c.moveTo(0, s * 0.04);
      c.bezierCurveTo(w * 1.5, s * 0.3, w * 1.1, s * 0.9, 0, s);
      c.bezierCurveTo(-w * 1.1, s * 0.9, -w * 1.5, s * 0.3, 0, s * 0.04);
      c.fillStyle = lin(-w, w);
      c.fill();
      c.save();
      c.clip();
      c.strokeStyle = L.dark;
      c.globalAlpha = 0.35;
      c.lineWidth = Math.max(1, s * 0.01);
      for (let i = 1; i < 7; i++) {
        c.beginPath();
        c.ellipse(-w * 0.2, s * 0.62, w * 0.16 * i, s * 0.07 * i, 0.2, 0, Math.PI * 2);
        c.stroke();
      }
      c.restore();
      c.globalAlpha = 1;
      break;
    }
    case 'chamber': {
      const w = s * 0.24;
      c.fillStyle = lin(-w, w);
      c.beginPath();
      c.moveTo(-w * 0.3, 0);
      c.lineTo(w * 0.3, 0);
      c.lineTo(w, s * 0.25);
      c.lineTo(w, s * 0.6);
      c.lineTo(0, s);
      c.lineTo(-w, s * 0.6);
      c.lineTo(-w, s * 0.25);
      c.closePath();
      c.fill();
      // anillos
      c.fillStyle = L.dark;
      for (let i = 0; i < 4; i++) c.fillRect(-w, s * (0.24 + i * 0.1), 2 * w, s * 0.018);
      // ventana de la cámara (hueco)
      c.fillStyle = 'rgba(0,0,0,0.55)';
      c.beginPath();
      c.ellipse(0, s * 0.44, w * 0.35, s * 0.08, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = L.glow;
      c.globalAlpha = 0.6;
      c.beginPath();
      c.arc(0, s * 0.44, s * 0.025, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;
      break;
    }
    case 'key': {
      const r = s * 0.17;
      c.lineWidth = s * 0.07;
      c.strokeStyle = lin(-r, r);
      c.beginPath();
      c.arc(0, r + s * 0.02, r, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = lin(-s * 0.05, s * 0.05);
      c.fillRect(-s * 0.035, r * 2, s * 0.07, s * 0.62);
      // paletón
      c.fillRect(0, s * 0.78, s * 0.16, s * 0.06);
      c.fillRect(0, s * 0.9, s * 0.12, s * 0.06);
      c.fillRect(s * 0.08, s * 0.84, s * 0.05, s * 0.06);
      break;
    }
    case 'ring': {
      const r = s * 0.3;
      const cy = s * 0.55;
      c.lineWidth = s * 0.08;
      c.strokeStyle = lin(-r, r);
      c.beginPath();
      c.ellipse(0, cy, r, r * 0.95, 0, 0, Math.PI * 2);
      c.stroke();
      // engaste y piedra
      c.fillStyle = L.mid;
      c.fillRect(-s * 0.09, cy - r - s * 0.1, s * 0.18, s * 0.08);
      const g = c.createRadialGradient(-s * 0.03, cy - r - s * 0.13, 1, 0, cy - r - s * 0.11, s * 0.1);
      g.addColorStop(0, '#ffd0dc');
      g.addColorStop(0.5, '#e0204f');
      g.addColorStop(1, '#5a0018');
      c.fillStyle = g;
      c.beginPath();
      c.arc(0, cy - r - s * 0.12, s * 0.085, 0, Math.PI * 2);
      c.fill();
      break;
    }
    case 'sausage': {
      const w = s * 0.17;
      c.fillStyle = '#d9c7a0';
      c.fillRect(-1, 0, 2, s * 0.08);
      c.beginPath();
      c.moveTo(-w * 0.4, s * 0.08);
      c.quadraticCurveTo(w * 1.4, s * 0.1, w * 1.1, s * 0.5);
      c.quadraticCurveTo(w * 0.9, s * 0.95, -w * 0.1, s);
      c.quadraticCurveTo(-w * 0.8, s * 0.95, -w * 0.6, s * 0.5);
      c.quadraticCurveTo(-w * 1.2, s * 0.12, -w * 0.4, s * 0.08);
      c.fillStyle = lin(-w, w);
      c.fill();
      // grasa
      c.fillStyle = '#f4d7c7';
      c.globalAlpha = 0.75;
      const dots = [[0.1, 0.3], [-0.3, 0.45], [0.4, 0.55], [0, 0.7], [-0.2, 0.85], [0.5, 0.35], [0.2, 0.9]];
      dots.forEach(([dx, dy]) => {
        c.beginPath();
        c.ellipse(dx * w, dy * s, s * 0.018, s * 0.012, 0.6, 0, Math.PI * 2);
        c.fill();
      });
      c.globalAlpha = 1;
      // atadura
      c.strokeStyle = '#efe2c0';
      c.lineWidth = Math.max(1, s * 0.015);
      c.beginPath();
      c.moveTo(-w * 0.5, s * 0.1);
      c.lineTo(w * 0.5, s * 0.12);
      c.stroke();
      break;
    }
  }
}

/** Sprite pre-renderizado de la lenteja (enganche arriba en el centro). */
export function makeBobSprite(look: PendulumLook, s: number, dpr: number, img?: HTMLImageElement | null): { canvas: HTMLCanvasElement; ox: number; oy: number; w: number; h: number } {
  const pad = Math.ceil(s * 0.15);
  const w = Math.ceil(s * 0.9 + pad * 2);
  const h = Math.ceil(s + pad * 2);
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(w * dpr);
  canvas.height = Math.ceil(h * dpr);
  const c = canvas.getContext('2d');
  if (c) {
    c.scale(dpr, dpr);
    c.translate(w / 2, pad);
    if (img && img.naturalWidth > 0) {
      const ar = img.naturalWidth / img.naturalHeight;
      const ih = s;
      const iw = Math.min(s * 0.9, ih * ar);
      c.drawImage(img, -iw / 2, 0, iw, iw / ar);
    } else {
      drawBob(c, look, s);
    }
  }
  return { canvas, ox: w / 2, oy: pad, w, h };
}
