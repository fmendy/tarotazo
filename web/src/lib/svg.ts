// Carga de SVG propios para insertarlos inline (mapa). Se sanea: sin scripts ni manejadores.

export function sanitizeSvg(text: string): SVGSVGElement | null {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const svg = doc.documentElement;
  if (!svg || svg.nodeName.toLowerCase() !== 'svg' || doc.getElementsByTagName('parsererror').length) return null;
  svg.querySelectorAll('script, foreignObject, iframe').forEach((n) => n.remove());
  const all = [svg, ...Array.from(svg.querySelectorAll('*'))];
  for (const el of all) {
    for (const attr of Array.from(el.attributes)) {
      const n = attr.name.toLowerCase();
      const v = attr.value.trim().toLowerCase();
      if (n.startsWith('on')) el.removeAttribute(attr.name);
      if ((n === 'href' || n === 'xlink:href') && !v.startsWith('#') && !v.startsWith('/')) el.removeAttribute(attr.name);
    }
  }
  return svg as unknown as SVGSVGElement;
}

const cache = new Map<string, Promise<string | null>>();
export function fetchSvgText(url: string): Promise<string | null> {
  if (!cache.has(url)) {
    cache.set(url, fetch(url, { credentials: 'omit' })
      .then((r) => (r.ok && (r.headers.get('content-type') ?? '').includes('svg') ? r.text() : r.ok ? r.text() : null))
      .then((t) => (t && t.includes('<svg') ? t : null))
      .catch(() => null));
  }
  return cache.get(url)!;
}
