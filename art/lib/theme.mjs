// Temas de color por modelo. Las ilustraciones sólo usan clases; cada modelo define su CSS.
// Clases de relleno:
//  k tinta · w blanco · p papel · s piel · h pelo castaño · hb rubio · hg canoso · hk negro
//  r rojo · b azul · gn verde · y amarillo · v morado · o naranja · m metal · e tierra · wd madera
//  su sol · g oro · gl oro claro · sk cielo · sy cielo amarillo · sn cielo nocturno · wa agua
//  gr hierba · gr2 verde oscuro · mt montaña · c nube · st piedra · st2 piedra oscura · fl llama
//  rs rosa · dk muy oscuro · lg calzas
// Modificadores: nf sin relleno · ns sin trazo · th trazo fino · tk trazo grueso · sh sombra · hl brillo · ht trama
//  sr trazo rojo · sg trazo oro · sw trazo blanco

export const BASE_FILLS = ['k', 'w', 'p', 's', 'h', 'hb', 'hg', 'hk', 'r', 'b', 'gn', 'y', 'v', 'o', 'm', 'e', 'wd', 'su', 'g', 'gl', 'sk', 'sy', 'sn', 'wa', 'gr', 'gr2', 'mt', 'c', 'st', 'st2', 'fl', 'rs', 'dk', 'lg'];

export const THEMES = {
  rws: {
    id: 'rws',
    line: '#24140f', lw: 4.5, thin: 2.4,
    paper: '#f6ecd6', paperEdge: '#e2cfa6', frame: '#24140f', accent: '#b8893a', label: '#24140f', labelBg: '#fbf4e3',
    fills: {
      k: '#24140f', w: '#fbf7ec', p: '#f6ecd6', s: '#f3cfae', h: '#6b3e22', hb: '#e8bd52', hg: '#e1ddd5', hk: '#2b2224',
      r: '#c8402f', b: '#3f74b6', gn: '#4f8f3d', y: '#f2c94c', v: '#7b4d9f', o: '#e8913a', m: '#a3acb6', e: '#8c5a33', wd: '#a86d34',
      su: '#f9d84e', g: '#dca84a', gl: '#f3d68a', sk: '#a7d0ea', sy: '#f5d978', sn: '#25336a', wa: '#64a5d3', gr: '#86b85a', gr2: '#4d7c37',
      mt: '#c3ccd6', c: '#f7f4ee', st: '#c5b9a3', st2: '#958a77', fl: '#f08a2c', rs: '#e8a1aa', dk: '#2b1d33', lg: '#f2c94c',
    },
    hatch: 0.22,
  },
  marsella: {
    id: 'marsella',
    line: '#1a1410', lw: 5.5, thin: 2.8,
    paper: '#efe2c4', paperEdge: '#d9c497', frame: '#1a1410', accent: '#c8392b', label: '#1a1410', labelBg: '#efe2c4',
    fills: {
      k: '#1a1410', w: '#f4ead3', p: '#efe2c4', s: '#f0c8a0', h: '#e9b23a', hb: '#e9b23a', hg: '#f4ead3', hk: '#1a1410',
      r: '#c8392b', b: '#2f63a8', gn: '#3e8a5a', y: '#eeb631', v: '#2f63a8', o: '#e07a2b', m: '#7fb1c9', e: '#c8392b', wd: '#eeb631',
      su: '#eeb631', g: '#eeb631', gl: '#f3cf6d', sk: '#7fb1c9', sy: '#eeb631', sn: '#2f63a8', wa: '#2f63a8', gr: '#3e8a5a', gr2: '#3e8a5a',
      mt: '#7fb1c9', c: '#f4ead3', st: '#e9d49d', st2: '#c8392b', fl: '#c8392b', rs: '#f0a98f', dk: '#1a1410', lg: '#c8392b',
    },
    hatch: 0.0,
  },
  neon: {
    id: 'neon',
    line: '#ff4fd8', lw: 3.6, thin: 2,
    paper: '#0c0716', paperEdge: '#1a0f2e', frame: '#38f3ff', accent: '#ff4fd8', label: '#38f3ff', labelBg: '#0c0716',
    fills: {
      k: '#0c0716', w: '#1c1230', p: '#0c0716', s: '#2a1840', h: '#3a1452', hb: '#3a3010', hg: '#2c2c3c', hk: '#120a1e',
      r: '#3a0d2c', b: '#0d2340', gn: '#0d3324', y: '#3a3010', v: '#2a0f45', o: '#3a1a08', m: '#1d2330', e: '#24140e', wd: '#24140e',
      su: '#4a3a08', g: '#3a2c08', gl: '#4a3a10', sk: '#100a24', sy: '#160c2a', sn: '#0a0618', wa: '#071c33', gr: '#0b2418', gr2: '#081a12',
      mt: '#141030', c: '#1a1430', st: '#16122a', st2: '#100c20', fl: '#4a1a08', rs: '#3a1230', dk: '#06030c', lg: '#2a0f45',
    },
    strokes: { r: '#ff4f7b', b: '#4fa3ff', gn: '#4fff9b', y: '#ffe94f', su: '#ffe94f', g: '#ffd34f', gl: '#ffe58a', v: '#c04fff', o: '#ff9a4f', wa: '#38f3ff', s: '#ff9ad8', fl: '#ff7a2f', sk: '#7a4fff', mt: '#7a4fff', gr: '#4fff9b', gr2: '#4fff9b', c: '#b8a6ff', w: '#f0e6ff', m: '#9ad0ff', hg: '#d0d0ff', hb: '#ffe94f', h: '#ff7ad8', e: '#ff9a4f', wd: '#ff9a4f', st: '#9a8aff', st2: '#9a8aff', rs: '#ff9ad8', sy: '#c04fff', sn: '#4fa3ff', lg: '#c04fff' },
    glow: true,
    hatch: 0,
  },
  gatos: {
    id: 'gatos',
    line: '#2d1b2e', lw: 4.5, thin: 2.4,
    paper: '#fbeede', paperEdge: '#f1d6bd', frame: '#2d1b2e', accent: '#e07a5f', label: '#2d1b2e', labelBg: '#fff6ea',
    fills: {
      k: '#2d1b2e', w: '#fffaf2', p: '#fbeede', s: '#f2a65a', h: '#7a4b2a', hb: '#f2c46d', hg: '#e8e2dc', hk: '#3b2f3a',
      r: '#e07a5f', b: '#5b8fb9', gn: '#81b29a', y: '#f2cc8f', v: '#9d7bb0', o: '#f2a65a', m: '#b8b8c8', e: '#a0704c', wd: '#c08552',
      su: '#ffd56b', g: '#e6b450', gl: '#f6d98e', sk: '#b9dcef', sy: '#ffe3a3', sn: '#3d405b', wa: '#7fb7d9', gr: '#a7c98a', gr2: '#6f9a5c',
      mt: '#d4d0e0', c: '#ffffff', st: '#d8c8b0', st2: '#a8987e', fl: '#ef8a3c', rs: '#f4a7b2', dk: '#3d2b3d', lg: '#e07a5f',
    },
    hatch: 0.12,
    cats: true,
  },
  acuarela: {
    id: 'acuarela',
    line: '#4a3b52', lw: 2.6, thin: 1.6,
    paper: '#fbf7ef', paperEdge: '#efe6d6', frame: '#8a7a96', accent: '#c79a5b', label: '#3e3046', labelBg: '#fbf7ef',
    fills: {
      k: '#4a3b52', w: '#fffdf8', p: '#fbf7ef', s: '#f5d5c0', h: '#9a6a4a', hb: '#efcf86', hg: '#e8e4ec', hk: '#4a3b52',
      r: '#e08a8a', b: '#8ab4e0', gn: '#9cc8a0', y: '#f5dc8a', v: '#b9a0d8', o: '#f2b580', m: '#c8ccd8', e: '#c09a7a', wd: '#d0a678',
      su: '#fbe08a', g: '#e8c27a', gl: '#f5deaa', sk: '#c8e0f2', sy: '#fbe6b0', sn: '#6a78b0', wa: '#9ccbe8', gr: '#b8d8a0', gr2: '#8ab890',
      mt: '#d8dcec', c: '#ffffff', st: '#e0d4c4', st2: '#c0b0a0', fl: '#f5a070', rs: '#f2b8c4', dk: '#6a5a78', lg: '#b9a0d8',
    },
    hatch: 0,
    watercolor: true,
  },
  pixel: {
    id: 'pixel',
    line: '#1b1028', lw: 5, thin: 3,
    paper: '#2a1e3e', paperEdge: '#1b1028', frame: '#f7d26a', accent: '#f7d26a', label: '#f7d26a', labelBg: '#1b1028',
    fills: {
      k: '#1b1028', w: '#f4f0e8', p: '#2a1e3e', s: '#f2b48a', h: '#8a4b2a', hb: '#f7d26a', hg: '#c8c8d8', hk: '#2a2030',
      r: '#e0433a', b: '#3a7ad8', gn: '#3aa84a', y: '#f7d26a', v: '#8a4ad8', o: '#f08a2a', m: '#9aa8c0', e: '#9a5a2a', wd: '#b8742a',
      su: '#fbe25a', g: '#f0b43a', gl: '#fbe08a', sk: '#6ac0f0', sy: '#f7d26a', sn: '#2a2a6a', wa: '#3a8ae0', gr: '#6ac84a', gr2: '#2a8a3a',
      mt: '#a8b8d0', c: '#f4f0e8', st: '#b8a890', st2: '#7a6a5a', fl: '#f05a2a', rs: '#f08aa8', dk: '#140a20', lg: '#3a7ad8',
    },
    hatch: 0,
  },
  // ---- baraja española ----
  castellana: {
    id: 'castellana',
    line: '#1e1612', lw: 4.2, thin: 2.2,
    paper: '#fbf6ea', paperEdge: '#eadfc6', frame: '#1e1612', accent: '#c0392b', label: '#1e1612', labelBg: '#fbf6ea',
    fills: {
      k: '#1e1612', w: '#fffcf4', p: '#fbf6ea', s: '#f4cfae', h: '#5a3420', hb: '#e9b84a', hg: '#ece8e0', hk: '#1e1612',
      r: '#c9302c', b: '#2f5fa8', gn: '#3d8b4a', y: '#f0bf3a', v: '#7a3f8f', o: '#e47f2e', m: '#aab4c0', e: '#9a5a2e', wd: '#b4733a',
      su: '#f6d04a', g: '#e8b23a', gl: '#f6d98a', sk: '#a7d0ea', sy: '#f5d978', sn: '#25336a', wa: '#64a5d3', gr: '#86b85a', gr2: '#3d8b4a',
      mt: '#c3ccd6', c: '#f7f4ee', st: '#c5b9a3', st2: '#958a77', fl: '#f08a2c', rs: '#e8a1aa', dk: '#2b1d33', lg: '#c9302c',
    },
    hatch: 0,
  },
  catalana: {
    id: 'catalana',
    line: '#2a1d14', lw: 4.6, thin: 2.4,
    paper: '#f2e6cc', paperEdge: '#dcc8a0', frame: '#2a1d14', accent: '#2f6b4a', label: '#2a1d14', labelBg: '#f2e6cc',
    fills: {
      k: '#2a1d14', w: '#fbf3e0', p: '#f2e6cc', s: '#efc39c', h: '#3a2418', hb: '#d8a23a', hg: '#e4dccc', hk: '#2a1d14',
      r: '#b8322a', b: '#2a4f8a', gn: '#2f6b4a', y: '#e0a830', v: '#5a2f6a', o: '#d0702a', m: '#98a4ac', e: '#8a4a26', wd: '#9a6030',
      su: '#e8c040', g: '#d89a2a', gl: '#eec872', sk: '#98bcd4', sy: '#e8cc78', sn: '#22305a', wa: '#5a90b8', gr: '#7aa058', gr2: '#2f6b4a',
      mt: '#b8bcc4', c: '#f4efe4', st: '#c0b090', st2: '#8a7c66', fl: '#e07a2a', rs: '#dc9a98', dk: '#2a1d24', lg: '#2a4f8a',
    },
    hatch: 0.16,
  },
  ilustrada: {
    id: 'ilustrada',
    line: '#2b1a2e', lw: 4.2, thin: 2.2,
    paper: '#f7ecd8', paperEdge: '#e6d0aa', frame: '#5a1f72', accent: '#d4a24c', label: '#3b1450', labelBg: '#fbf4e6',
    fills: {
      k: '#2b1a2e', w: '#fffaf0', p: '#f7ecd8', s: '#f1c9a5', h: '#6b3e22', hb: '#f0cf7a', hg: '#e8e2da', hk: '#2b1a2e',
      r: '#a3213a', b: '#2f5f9e', gn: '#2f8f83', y: '#f0cf7a', v: '#5a1f72', o: '#e2603b', m: '#aab0c0', e: '#8a5a32', wd: '#a86d34',
      su: '#ffd56b', g: '#d4a24c', gl: '#f0cf7a', sk: '#b9cfe8', sy: '#f8dca0', sn: '#20305e', wa: '#5f9fcf', gr: '#8cb86a', gr2: '#2f8f83',
      mt: '#c8c4dc', c: '#fffaf0', st: '#cdbca9', st2: '#9a8a78', fl: '#ffb347', rs: '#e6a3a8', dk: '#2a0f3a', lg: '#5a1f72',
    },
    hatch: 0.16,
  },
};

/** CSS de un tema, con ámbito en la clase raíz (m-{id}) para que varias cartas inline no choquen. */
export function themeCss(T) {
  const S = `.m-${T.id}`;
  const rules = [];
  rules.push(`${S} .L{stroke:${T.line};stroke-width:${T.lw};stroke-linejoin:round;stroke-linecap:round}`);
  for (const [k, v] of Object.entries(T.fills)) {
    const st = T.strokes?.[k];
    rules.push(`${S} .${k}{fill:${v}${st ? `;stroke:${st}` : ''}}`);
  }
  rules.push(`${S} .nf{fill:none}${S} .ns{stroke:none}${S} .th{stroke-width:${T.thin}}${S} .tk{stroke-width:${T.lw * 1.8}}`);
  rules.push(`${S} .sh{fill:${T.line};opacity:.16;stroke:none}${S} .hl{fill:#fff;opacity:.38;stroke:none}`);
  rules.push(`${S} .ht{fill:url(#ht-${T.id});stroke:none}`);
  rules.push(`${S} .sr{stroke:${T.fills.r};fill:none}${S} .sg{stroke:${T.fills.g};fill:none}${S} .sw{stroke:${T.fills.w};fill:none}`);
  if (T.glow) rules.push(`${S} .L{filter:url(#glow-${T.id})}`);
  return rules.join('');
}

export function themeDefs(T) {
  let d = `<pattern id="ht-${T.id}" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0V9" stroke="${T.line}" stroke-width="2.2" opacity="${T.hatch || 0.2}"/></pattern>`;
  if (T.glow) d += `<filter id="glow-${T.id}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  if (T.watercolor) d += `<filter id="wc-${T.id}" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation="0.6"/></filter>`;
  return d;
}
