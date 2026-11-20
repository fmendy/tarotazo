// Tableros que se dibujan bajo el péndulo. Todos usan viewBox 0 0 1000 1000 (= coords 0..1).
import { useTranslation } from 'react-i18next';
import { ARC_CX, ARC_CY, ARC_R, CHAKRA_IDS, OUIJA_ROWS, arcPoint, chakraPoint, ouijaPoint, sectorAngle } from '../../lib/pendulumGeom';
import { SpainMap, type MapApi } from '../../components/SpainMap';
import type { PendulumMode } from '../../lib/types';

const S = 1000;
const txt = { fill: 'var(--c-gold-light, #f0cf7a)', fontFamily: 'var(--f-title, serif)', textAnchor: 'middle' as const, dominantBaseline: 'middle' as const };

function ArcSectors(p: { labels: string[]; highlight?: number | null }) {
  const n = p.labels.length;
  const cx = ARC_CX * S, cy = ARC_CY * S, r = ARC_R * S * 1.25;
  return (
    <g>
      {p.labels.map((label, i) => {
        const a0 = Math.PI - (i * Math.PI) / n, a1 = Math.PI - ((i + 1) * Math.PI) / n;
        const d = `M${cx},${cy} L${cx + r * Math.cos(a0)},${cy - r * Math.sin(a0)} A${r},${r} 0 0 1 ${cx + r * Math.cos(a1)},${cy - r * Math.sin(a1)} Z`;
        const lp = arcPoint(sectorAngle(i, n), ARC_R * 1.02);
        return (
          <g key={i}>
            <path d={d} fill={p.highlight === i ? 'rgba(240,207,122,.35)' : i % 2 ? 'rgba(90,31,114,.55)' : 'rgba(59,20,80,.55)'} stroke="var(--c-gold, #d4a24c)" strokeWidth={3} />
            <text x={lp.x * S} y={lp.y * S} {...txt} fontSize={n > 4 ? 34 : 42} transform={`rotate(${90 - (sectorAngle(i, n) * 180) / Math.PI} ${lp.x * S} ${lp.y * S})`}>
              {label.length > 14 ? label.slice(0, 13) + '…' : label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export function Board(p: {
  mode: PendulumMode;
  yesAxis: 'vertical' | 'horizontal';
  options: string[];
  highlight: number | null;
  spelled: string;
  chakraLevels: Record<string, number>;
  mapSelected: string | null;
  onMapReady(api: MapApi | null): void;
}) {
  const { t } = useTranslation();
  const label = t('pendulum.boardLabel') + ': ' + t(`pendulum.modes.${p.mode}`);
  if (p.mode === 'mapa') {
    return (
      <div className="pboard pboard--map" aria-label={label}>
        <SpainMap interactive={false} zoomable={false} selected={p.mapSelected} onReady={p.onMapReady} label={label} />
      </div>
    );
  }
  return (
    <svg className="pboard" viewBox={`0 0 ${S} ${S}`} role="img" aria-label={label}>
      <rect x={10} y={10} width={S - 20} height={S - 20} rx={40} fill="rgba(20,10,31,.6)" stroke="var(--c-gold, #d4a24c)" strokeWidth={4} />
      {p.mode === 'sino' && (() => {
        const yesV = p.yesAxis === 'vertical';
        const si = t('pendulum.sino.si'), no = t('pendulum.sino.no');
        return (
          <g>
            <line x1={500} y1={80} x2={500} y2={920} stroke="var(--c-gold, #d4a24c)" strokeWidth={4} strokeDasharray="12 10" />
            <line x1={80} y1={500} x2={920} y2={500} stroke="var(--c-gold, #d4a24c)" strokeWidth={4} strokeDasharray="12 10" />
            <circle cx={500} cy={500} r={160} fill="none" stroke="var(--c-accent-text, #e59ae0)" strokeWidth={3} />
            <text x={500} y={60} {...txt} fontSize={48}>{yesV ? si : no}</text>
            <text x={500} y={950} {...txt} fontSize={48}>{yesV ? si : no}</text>
            <text x={70} y={500} {...txt} fontSize={48} transform="rotate(-90 70 500)">{yesV ? no : si}</text>
            <text x={930} y={500} {...txt} fontSize={48} transform="rotate(90 930 500)">{yesV ? no : si}</text>
            <text x={500} y={700} {...txt} fontSize={34}>{t('pendulum.sino.duda')}</text>
          </g>
        );
      })()}
      {p.mode === 'tablero' && <ArcSectors labels={t('pendulum.board', { returnObjects: true }) as string[]} highlight={p.highlight} />}
      {p.mode === 'opciones' && <ArcSectors labels={p.options.length >= 2 ? p.options : ['?', '?']} highlight={p.highlight} />}
      {p.mode === 'porcentaje' && (
        <g>
          <path d={`M${(ARC_CX - ARC_R * 1.2) * S},${ARC_CY * S} A${ARC_R * 1.2 * S},${ARC_R * 1.2 * S} 0 0 1 ${(ARC_CX + ARC_R * 1.2) * S},${ARC_CY * S}`}
            fill="none" stroke="var(--c-gold, #d4a24c)" strokeWidth={60} strokeOpacity={0.35} />
          {Array.from({ length: 11 }, (_, i) => {
            const a = Math.PI - (i / 10) * Math.PI;
            const pt = arcPoint(a, ARC_R * 1.2), lp = arcPoint(a, ARC_R * 0.92);
            return (
              <g key={i}>
                <circle cx={pt.x * S} cy={pt.y * S} r={8} fill="var(--c-gold-light, #f0cf7a)" />
                <text x={lp.x * S} y={lp.y * S} {...txt} fontSize={30}>{i * 10}</text>
              </g>
            );
          })}
          {p.highlight !== null && (() => { const pt = arcPoint(Math.PI - (p.highlight / 100) * Math.PI, ARC_R * 1.2); return <circle cx={pt.x * S} cy={pt.y * S} r={26} fill="var(--c-flame, #ffe08a)" />; })()}
        </g>
      )}
      {p.mode === 'ouija' && (
        <g>
          <text x={200} y={120} {...txt} fontSize={56}>{t('pendulum.sino.si')}</text>
          <text x={800} y={120} {...txt} fontSize={56}>{t('pendulum.sino.no')}</text>
          {OUIJA_ROWS.flatMap((row) => Array.from(row)).map((ch) => {
            const pt = ouijaPoint(ch)!;
            const lit = p.spelled.includes(ch);
            return <text key={ch} x={pt.x * S} y={pt.y * S} {...txt} fontSize={52} fill={lit ? 'var(--c-flame, #ffe08a)' : txt.fill} opacity={lit ? 1 : 0.8}>{ch}</text>;
          })}
          <text x={500} y={930} {...txt} fontSize={60} letterSpacing={12}>{p.spelled}</text>
        </g>
      )}
      {p.mode === 'chakras' && (
        <g>
          <ellipse cx={500} cy={170} rx={80} ry={95} fill="rgba(229,154,224,.18)" stroke="var(--c-gold, #d4a24c)" strokeWidth={3} />
          <path d="M500,265 C380,280 330,330 320,460 L300,700 L380,700 L390,560 L410,960 L480,960 L500,640 L520,960 L590,960 L610,560 L620,700 L700,700 L680,460 C670,330 620,280 500,265 Z"
            fill="rgba(229,154,224,.18)" stroke="var(--c-gold, #d4a24c)" strokeWidth={3} />
          {CHAKRA_IDS.map((id, i) => {
            const pt = chakraPoint(i);
            const lvl = p.chakraLevels[id];
            const hues = ['#d33', '#f80', '#fd0', '#3c6', '#39f', '#63c', '#c6f'];
            return (
              <g key={id}>
                <circle cx={pt.x * S} cy={pt.y * S} r={lvl === undefined ? 22 : 18 + lvl / 5} fill={hues[i]} opacity={lvl === undefined ? 0.5 : 0.95} />
                <text x={pt.x * S + 150} y={pt.y * S} {...txt} fontSize={28} textAnchor="start">
                  {t(`pendulum.chakras.${id}`)}{lvl !== undefined ? ` ${lvl}%` : ''}
                </text>
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
}
