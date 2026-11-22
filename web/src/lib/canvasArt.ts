// Imágenes generadas EN LOCAL con canvas (compartir y diploma). Nunca se suben a ningún sitio.
// En la app Android se guardan en la caché de la app y se abre la hoja de compartir del sistema.
import { isNative, shareImageNative } from './native';

export interface ShareData {
  title: string;
  spreadName: string;
  cards: { name: string; position: string; reversed: boolean }[];
  luckyNumber: number;
  luckyColor: { name: string; hex: string };
  labels: { lucky: string; color: string; reversed: string; footer: string; disclaimer: string };
  name?: string | null; // sólo si el usuario lo marca
}

export interface DiplomaData {
  heading: string;   // «Diploma»
  title: string;     // «Licenciado/a en Barajar con Estilo»
  grantedTo: string; // «se concede a»
  name: string;
  center: string;
  signature: string;
  date: string;
  seal: string;
}

function css(name: string, fallback: string): string {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  } catch { return fallback; }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number): number {
  const words = text.split(/\s+/);
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y);
      line = w; y += lh;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, y);
  return y + lh;
}

function stars(ctx: CanvasRenderingContext2D, w: number, h: number, n: number, color: string) {
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const x = ((i * 7919) % 1000) / 1000 * w;
    const y = ((i * 104729) % 1000) / 1000 * h;
    ctx.globalAlpha = 0.25 + ((i * 31) % 70) / 100;
    ctx.beginPath(); ctx.arc(x, y, 1 + (i % 3), 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawShareImage(canvas: HTMLCanvasElement, d: ShareData) {
  const W = 1080, H = 1350;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const bg = css('--c-bg', '#140a1f'), ink = css('--c-ink', '#f4e9d8'), gold = css('--c-gold', '#d4a24c'), acc = css('--c-accent', '#8e3b8f');
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, bg); g.addColorStop(1, acc);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  stars(ctx, W, H, 140, ink);
  ctx.strokeStyle = gold; ctx.lineWidth = 6; ctx.strokeRect(36, 36, W - 72, H - 72);
  ctx.textAlign = 'center'; ctx.fillStyle = gold;
  ctx.font = 'bold 88px Georgia, serif';
  ctx.fillText(d.title, W / 2, 170);
  ctx.fillStyle = ink; ctx.font = 'italic 44px Georgia, serif';
  ctx.fillText(d.name ? `${d.spreadName} · ${d.name}` : d.spreadName, W / 2, 250);
  // cartas
  const n = d.cards.length;
  const cols = Math.min(n, 5), rows = Math.ceil(n / cols);
  const cw = Math.min(170, (W - 160) / cols - 20), ch = cw * 12 / 7;
  let y0 = 310;
  d.cards.forEach((c, i) => {
    const r = Math.floor(i / cols), col = i % cols;
    const inRow = Math.min(cols, n - r * cols);
    const x = W / 2 - (inRow * (cw + 20) - 20) / 2 + col * (cw + 20);
    const y = y0 + r * (ch + 90);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x + 6, y + 6, cw, ch);
    ctx.fillStyle = ink; ctx.fillRect(x, y, cw, ch);
    ctx.strokeStyle = gold; ctx.lineWidth = 4; ctx.strokeRect(x + 8, y + 8, cw - 16, ch - 16);
    ctx.fillStyle = bg; ctx.font = 'bold 22px Georgia, serif';
    ctx.save(); ctx.translate(x + cw / 2, y + ch / 2); if (c.reversed) ctx.rotate(Math.PI);
    wrap(ctx, c.name, 0, -20, cw - 30, 26);
    ctx.restore();
    ctx.fillStyle = ink; ctx.font = '22px Georgia, serif';
    ctx.fillText(c.position + (c.reversed ? ` (${d.labels.reversed})` : ''), x + cw / 2, y + ch + 34);
  });
  y0 += rows * (ch + 90) + 40;
  ctx.fillStyle = gold; ctx.font = 'bold 54px Georgia, serif';
  ctx.fillText(`${d.labels.lucky}: ${d.luckyNumber}`, W / 2, Math.min(y0, H - 300));
  const cy = Math.min(y0 + 90, H - 210);
  ctx.fillStyle = d.luckyColor.hex; ctx.beginPath(); ctx.arc(W / 2 - 220, cy - 16, 32, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = ink; ctx.font = '42px Georgia, serif'; ctx.textAlign = 'left';
  ctx.fillText(`${d.labels.color}: ${d.luckyColor.name}`, W / 2 - 170, cy);
  ctx.textAlign = 'center'; ctx.font = '28px Georgia, serif'; ctx.fillStyle = gold;
  ctx.fillText(d.labels.footer, W / 2, H - 120);
  ctx.fillStyle = ink; ctx.font = 'italic 24px Georgia, serif';
  ctx.fillText(d.labels.disclaimer, W / 2, H - 75);
}

export function drawDiploma(canvas: HTMLCanvasElement, d: DiplomaData) {
  const W = 1600, H = 1130;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const paper = '#f3e6c4', ink = '#3a2412', gold = css('--c-gold', '#d4a24c'), red = '#8b1d1d';
  ctx.fillStyle = paper; ctx.fillRect(0, 0, W, H);
  // manchas de pergamino
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(150,110,50,${0.02 + (i % 5) / 100})`;
    ctx.beginPath(); ctx.arc((i * 337) % W, (i * 211) % H, 40 + (i * 13) % 120, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = gold; ctx.lineWidth = 18; ctx.strokeRect(30, 30, W - 60, H - 60);
  ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.strokeRect(62, 62, W - 124, H - 124);
  ctx.setLineDash([6, 10]); ctx.strokeRect(80, 80, W - 160, H - 160); ctx.setLineDash([]);
  ctx.textAlign = 'center'; ctx.fillStyle = ink;
  ctx.font = 'bold 40px Georgia, serif'; ctx.fillText(d.center.toUpperCase(), W / 2, 190);
  ctx.font = 'bold 120px Georgia, serif'; ctx.fillStyle = red; ctx.fillText(d.heading, W / 2, 340);
  ctx.fillStyle = ink; ctx.font = 'italic 40px Georgia, serif'; ctx.fillText(d.grantedTo, W / 2, 430);
  ctx.font = 'bold 96px Georgia, serif'; ctx.fillText(d.name, W / 2, 560, W - 300);
  ctx.beginPath(); ctx.moveTo(400, 590); ctx.lineTo(W - 400, 590); ctx.stroke();
  ctx.font = '52px Georgia, serif'; wrap(ctx, d.title, W / 2, 690, W - 400, 60);
  ctx.font = 'italic 30px Georgia, serif'; ctx.textAlign = 'left';
  ctx.fillText(d.date, 200, H - 200);
  ctx.textAlign = 'right'; ctx.fillText(d.signature, W - 200, H - 200);
  ctx.beginPath(); ctx.moveTo(W - 560, H - 240); ctx.lineTo(W - 200, H - 240); ctx.stroke();
  // sello
  ctx.save(); ctx.translate(W / 2, H - 220); ctx.rotate(-0.2);
  ctx.strokeStyle = red; ctx.fillStyle = 'rgba(139,29,29,.12)'; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.arc(0, 0, 110, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 90, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = red; ctx.textAlign = 'center'; ctx.font = 'bold 26px Georgia, serif';
  wrap(ctx, d.seal, 0, -10, 160, 30);
  ctx.restore();
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((res) => {
    try { canvas.toBlob((b) => res(b), 'image/png'); } catch { res(null); }
  });
}

export async function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const blob = await canvasToBlob(canvas);
  if (!blob) return;
  if (isNative()) { await shareImageNative(blob, filename, filename); return; }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Usa Web Share con fichero si existe; si no, descarga. */
export async function shareCanvas(canvas: HTMLCanvasElement, filename: string, text: string): Promise<'shared' | 'downloaded'> {
  const blob = await canvasToBlob(canvas);
  if (blob && isNative()) { await shareImageNative(blob, filename, text); return 'shared'; }
  if (blob && typeof navigator !== 'undefined' && 'canShare' in navigator) {
    const file = new File([blob], filename, { type: 'image/png' });
    try {
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text });
        return 'shared';
      }
    } catch { /* cancelado o no soportado */ }
  }
  await downloadCanvas(canvas, filename);
  return 'downloaded';
}
