// Mapa SVG de provincias cargado INLINE desde /art/map/spain.svg (CONTRACTS §8).
// Cada provincia: <path id="prov-28" data-code="28" data-name="Madrid">. Hover, zoom, brillo
// al seleccionar y accesible con teclado (Tab + Intro/Espacio).
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchSvgText, sanitizeSvg } from '../lib/svg';
import { bboxCenter } from '../lib/pendulumGeom';

export interface MapApi {
  /** Centro de la provincia en coords 0..1 de un CUADRADO donde el mapa se dibuja centrado (meet). */
  centerOf(code: string): { x: number; y: number } | null;
}

/** Pasa coords 0..1 del viewBox a coords 0..1 de un cuadrado con el mapa centrado. */
export function toSquare(p: { x: number; y: number }, aspect: number): { x: number; y: number } {
  return aspect >= 1 ? { x: p.x, y: 0.5 + (p.y - 0.5) / aspect } : { x: 0.5 + (p.x - 0.5) * aspect, y: p.y };
}

export function SpainMap(p: {
  selected?: string | null;
  onSelect?(code: string, name: string): void;
  onHover?(code: string | null, name: string | null): void;
  interactive?: boolean;
  zoomable?: boolean;
  onReady?(api: MapApi | null): void;
  label?: string;
}) {
  const { t } = useTranslation();
  const host = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const baseVB = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'missing'>('loading');
  const [zoom, setZoom] = useState(1);
  const cb = useRef(p);
  cb.current = p;
  const interactive = p.interactive !== false;

  useEffect(() => {
    let alive = true;
    void fetchSvgText('/art/map/spain.svg').then((txt) => {
      if (!alive || !host.current) return;
      const svg = txt ? sanitizeSvg(txt) : null;
      if (!svg) { setStatus('missing'); cb.current.onReady?.(null); return; }
      const node = document.importNode(svg, true) as SVGSVGElement;
      node.classList.add('spainmap__svg');
      node.setAttribute('role', 'group');
      node.setAttribute('aria-label', cb.current.label ?? t('province.mapLabel'));
      node.removeAttribute('width'); node.removeAttribute('height');
      host.current.replaceChildren(node);
      svgRef.current = node;
      const vb = node.viewBox?.baseVal;
      baseVB.current = vb && vb.width ? { x: vb.x, y: vb.y, width: vb.width, height: vb.height } : null;
      if (!baseVB.current) {
        try { const b = node.getBBox(); baseVB.current = { x: b.x, y: b.y, width: b.width, height: b.height }; node.setAttribute('viewBox', `${b.x} ${b.y} ${b.width} ${b.height}`); } catch { /* jsdom */ }
      }
      node.querySelectorAll<SVGElement>('[data-code]').forEach((el) => {
        const code = el.getAttribute('data-code')!;
        const name = el.getAttribute('data-name') ?? code;
        el.classList.add('prov');
        if (interactive) {
          el.setAttribute('tabindex', '0');
          el.setAttribute('role', 'button');
          el.setAttribute('aria-label', name);
          el.addEventListener('click', () => cb.current.onSelect?.(code, name));
          el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cb.current.onSelect?.(code, name); }
          });
          const enter = () => cb.current.onHover?.(code, name);
          const leave = () => cb.current.onHover?.(null, null);
          el.addEventListener('mouseenter', enter); el.addEventListener('focus', enter);
          el.addEventListener('mouseleave', leave); el.addEventListener('blur', leave);
        } else {
          el.setAttribute('aria-hidden', 'true');
        }
      });
      setStatus('ok');
      cb.current.onReady?.({
        centerOf(code) {
          const el = node.querySelector<SVGGraphicsElement>(`[data-code="${CSS.escape(code)}"]`);
          if (!el || !baseVB.current) return null;
          try {
            const vb = baseVB.current;
            return toSquare(bboxCenter(el.getBBox(), vb), vb.width / vb.height);
          } catch { return null; }
        },
      });
    });
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // al seleccionar, acerca un poco la cámara
  useEffect(() => {
    if (p.selected && p.selected !== 'XX' && p.zoomable !== false) setZoom((z) => Math.max(z, 1.8));
  }, [p.selected]); // eslint-disable-line react-hooks/exhaustive-deps

  // selección: clase de brillo + zoom hacia la provincia
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.querySelectorAll('.prov.is-selected').forEach((n) => { n.classList.remove('is-selected'); n.removeAttribute('aria-pressed'); });
    if (p.selected) {
      const el = svg.querySelector<SVGGraphicsElement>(`[data-code="${CSS.escape(p.selected)}"]`);
      if (el) {
        el.classList.add('is-selected'); el.setAttribute('aria-pressed', 'true');
        // Se pasa al final para que el brillo quede encima; mover el nodo le quita el foco,
        // así que se lo devolvemos (QA-05).
        const hadFocus = document.activeElement === el;
        el.parentNode?.appendChild(el);
        if (hadFocus) (el as unknown as HTMLElement).focus({ preventScroll: true });
      }
    }
    applyZoom();
  }, [p.selected, status, zoom]); // eslint-disable-line react-hooks/exhaustive-deps

  function applyZoom() {
    const svg = svgRef.current, base = baseVB.current;
    if (!svg || !base || p.zoomable === false) return;
    let cx = base.x + base.width / 2, cy = base.y + base.height / 2;
    if (p.selected && zoom > 1) {
      const el = svg.querySelector<SVGGraphicsElement>(`[data-code="${CSS.escape(p.selected)}"]`);
      try { if (el) { const b = el.getBBox(); cx = b.x + b.width / 2; cy = b.y + b.height / 2; } } catch { /* nada */ }
    }
    const w = base.width / zoom, h = base.height / zoom;
    const x = Math.min(Math.max(base.x, cx - w / 2), base.x + base.width - w);
    const y = Math.min(Math.max(base.y, cy - h / 2), base.y + base.height - h);
    svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
  }

  return (
    <div className={'spainmap spainmap--' + status + (interactive ? ' is-interactive' : '')}>
      <div ref={host} className="spainmap__host" />
      {status === 'missing' && <p className="spainmap__missing">{t('province.mapMissing')}</p>}
      {status === 'ok' && p.zoomable !== false && (
        <div className="spainmap__zoom" role="group" aria-label="Zoom">
          <button className="iconbtn" onClick={() => setZoom((z) => Math.min(4, z * 1.6))} aria-label={t('province.zoomIn')}>+</button>
          <button className="iconbtn" onClick={() => setZoom((z) => Math.max(1, z / 1.6))} aria-label={t('province.zoomOut')}>−</button>
          <button className="iconbtn" onClick={() => setZoom(1)} aria-label={t('province.zoomReset')}>⤢</button>
        </div>
      )}
    </div>
  );
}
