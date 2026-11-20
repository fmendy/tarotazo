// Página de demostración de todos los componentes de animación (no enrutada).
// Verla en desarrollo: `npm run dev` y abrir http://localhost:5173/src/fx/playground.html
import { useState, type JSX, type ReactNode } from 'react';
import {
  Ambience, CardFan, CardImage, Carousel3D, Chests, CutDeck, DustStamp, FlipCard, ScreenTransition, ShuffleDeck, SpreadBoard,
  TypewriterText, playSfx, setMuted, setReducedMotion, startAmbient, stopAmbient, useReducedMotion,
  type AmbienceVariant, type SfxName, type ShuffleStyle, type SpreadLayout,
} from './index';
import { Pendulum, PENDULUM_LOOKS, type PendulumMode, type PendulumTarget } from '../pendulum';

const BACK = '/art/backs/rws.svg';
const FRONT = (id: string) => `/art/cards/rws/${id}.svg`;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ position: 'relative', margin: '24px 0', padding: 16, borderRadius: 12, border: '1px solid rgba(212,162,76,.35)', background: 'rgba(20,10,31,.55)' }}>
      <h2 style={{ margin: '0 0 12px', fontSize: 18, color: 'var(--c-gold,#d4a24c)' }}>{title}</h2>
      {children}
    </section>
  );
}
const Row = ({ children }: { children: ReactNode }) => <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 12 }}>{children}</div>;
const Btn = (p: { onClick(): void; children: ReactNode; on?: boolean }) => (
  <button type="button" className="fx-btn" onClick={p.onClick} style={p.on ? { background: 'rgba(212,162,76,.45)' } : undefined}>{p.children}</button>
);

const LABELS: Record<SpreadLayout, string[]> = {
  single: ['Consejo'],
  row: ['Pasado', 'Presente', 'Futuro'],
  cross: ['Situación', 'Obstáculo', 'Pasado', 'Futuro', 'Resultado'],
  horseshoe: ['Pasado', 'Presente', 'Futuro', 'Consejo', 'Entorno', 'Obstáculos', 'Resultado'],
  celtic: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
  love: ['Tú', 'La otra persona', 'Lo que os une', 'Lo que os separa', 'Consejo', 'Futuro'],
};
const CARDS = ['mayor-00', 'mayor-13', 'copas-reina', 'espadas-10', 'oros-01', 'bastos-sota', 'mayor-16', 'mayor-19', 'copas-02', 'mayor-08'];

/** Tablero semicircular SÍ · PROBABLE · QUIZÁ · POCO PROBABLE · NO. Devuelve el punto (0..1) de cada sector. */
const SECTORS = ['SÍ', 'PROBABLE', 'QUIZÁ', 'POCO PROB.', 'NO'];
const sectorPoint = (k: number) => {
  const a = Math.PI * (1 - (k + 0.5) / 5);
  return { x: 0.5 + Math.cos(a) * 0.34, y: 0.62 - Math.sin(a) * 0.34 };
};
function BoardSemicircle() {
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }} aria-hidden>
      <rect x="1" y="1" width="98" height="98" rx="4" fill="#2a1638" stroke="#d4a24c" strokeOpacity=".5" />
      {SECTORS.map((s, k) => {
        const a0 = Math.PI * (1 - k / 5);
        const a1 = Math.PI * (1 - (k + 1) / 5);
        const R = 44;
        const cx = 50;
        const cy = 62;
        const pt = sectorPoint(k);
        return (
          <g key={s}>
            <path d={`M${cx},${cy} L${cx + R * Math.cos(a0)},${cy - R * Math.sin(a0)} A${R},${R} 0 0 1 ${cx + R * Math.cos(a1)},${cy - R * Math.sin(a1)} Z`} fill={k % 2 ? '#3b1d5c' : '#4a2470'} stroke="#d4a24c" strokeOpacity=".6" strokeWidth=".4" />
            <text x={pt.x * 100} y={pt.y * 100 - 9} fontSize="4" fill="#f4e9d8" textAnchor="middle">{s}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function Playground(): JSX.Element {
  const reduced = useReducedMotion();
  const [muted, setMute] = useState(false);
  const [screen, setScreen] = useState(0);
  const [amb, setAmb] = useState<AmbienceVariant>('estrellas');
  const [shuffle, setShuffle] = useState<ShuffleStyle>('riffle');
  const [shuffleKey, setShuffleKey] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const say = (s: string) => setLog((l) => [s, ...l].slice(0, 6));
  const [cutMode, setCutMode] = useState<'tres' | 'abanico'>('tres');
  const [cutKey, setCutKey] = useState(0);
  const [fanKey, setFanKey] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [rev, setRev] = useState(false);
  const [layout, setLayout] = useState<SpreadLayout>('celtic');
  const [dealt, setDealt] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [twKey, setTwKey] = useState(0);
  const [stamp, setStamp] = useState(0);
  const [chestKey, setChestKey] = useState(0);
  const [ambOn, setAmbOn] = useState(false);
  // péndulo
  const [model, setModel] = useState('cuarzo');
  const [mode, setMode] = useState<PendulumMode>('sino');
  const [target, setTarget] = useState<PendulumTarget | null>(null);
  const [yesAxis] = useState<'vertical' | 'horizontal'>(() => (Math.random() < 0.5 ? 'vertical' : 'horizontal'));
  const [angry, setAngry] = useState(false);
  const [midnight, setMidnight] = useState(false);
  const [tilt, setTilt] = useState(false);

  const slots = LABELS[layout].length;
  const cards = Array.from({ length: slots }, (_, i) =>
    i < dealt ? (
      <FlipCard key={i} front={FRONT(CARDS[i % CARDS.length])} back={BACK} flipped={i < revealed} reversed={i % 3 === 1} alt={CARDS[i % CARDS.length]} onClick={() => setRevealed((r) => Math.max(r, i + 1))} />
    ) : null,
  );

  return (
    <div style={{ position: 'relative', minHeight: '100vh', color: 'var(--c-ink,#f4e9d8)', background: 'var(--c-bg,#140a1f)', fontFamily: 'system-ui, sans-serif', zIndex: 0, isolation: 'isolate' }}>
      <Ambience variant={amb} intensity={1} />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '16px 16px 80px' }}>
        <h1 style={{ margin: '8px 0', color: 'var(--c-gold,#d4a24c)' }}>Tarotazo · Playground de animación</h1>
        <Row>
          <Btn on={muted} onClick={() => { setMuted(!muted); setMute(!muted); }}>{muted ? 'Sonido: off' : 'Sonido: on'}</Btn>
          <Btn on={reduced} onClick={() => setReducedMotion(!reduced)}>Movimiento reducido: {reduced ? 'sí' : 'no'}</Btn>
          <Btn onClick={() => setReducedMotion(null)}>Reducido: seguir al sistema</Btn>
        </Row>
        <div aria-live="polite" style={{ fontSize: 12, opacity: 0.8, minHeight: 18 }}>{log.join(' · ')}</div>

        <Section title="Ambience (capa de fondo)">
          <Row>{(['humo', 'velas', 'estrellas', 'polvo'] as const).map((v) => <Btn key={v} on={amb === v} onClick={() => setAmb(v)}>{v}</Btn>)}</Row>
        </Section>

        <Section title="Sonidos (Web Audio)">
          <Row>
            {(['shuffle', 'flip', 'candle', 'bell', 'chime', 'stamp', 'swing'] as SfxName[]).map((s) => <Btn key={s} onClick={() => playSfx(s)}>{s}</Btn>)}
            <Btn on={ambOn} onClick={() => { if (ambOn) stopAmbient(); else startAmbient(); setAmbOn(!ambOn); }}>ambiente «concentrarme»</Btn>
          </Row>
        </Section>

        <Section title="ScreenTransition">
          <Row><Btn onClick={() => setScreen((s) => s + 1)}>Siguiente pantalla</Btn></Row>
          <ScreenTransition id={String(screen)} variant={(['mist', 'curtain', 'card'] as const)[screen % 3]}>
            <div style={{ padding: 24, borderRadius: 8, background: 'rgba(142,59,143,.3)' }}>Pantalla {screen + 1} ({(['mist', 'curtain', 'card'] as const)[screen % 3]})</div>
          </ScreenTransition>
        </Section>

        <Section title="TypewriterText">
          <Row><Btn onClick={() => setTwKey((k) => k + 1)}>Otra frase</Btn></Row>
          <TypewriterText
            key={twKey}
            as="p"
            text={['Mmm… veo, veo… una carta. Y otra. ¡Ojo, que vienen más!', 'Uy, cuanto más barajas, más secretos sacas, cariño.', 'Las Vanesas siempre llegan tarde a su destino… pero llegan.'][twKey % 3]}
            onDone={() => say('typewriter: fin')}
          />
        </Section>

        <Section title="ShuffleDeck">
          <Row>
            {(['riffle', 'overhand', 'mesa'] as const).map((s) => <Btn key={s} on={shuffle === s} onClick={() => { setShuffle(s); setShuffleKey((k) => k + 1); }}>{s}</Btn>)}
          </Row>
          <ShuffleDeck key={shuffleKey} backImage={BACK} style={shuffle} onDone={() => say(`barajado (${shuffle}) terminado`)} onMore={() => say('más')} />
        </Section>

        <Section title="CutDeck">
          <Row>
            {(['tres', 'abanico'] as const).map((m) => <Btn key={m} on={cutMode === m} onClick={() => { setCutMode(m); setCutKey((k) => k + 1); }}>{m}</Btn>)}
            <Btn onClick={() => setCutKey((k) => k + 1)}>Reiniciar</Btn>
          </Row>
          <CutDeck key={cutKey} backImage={BACK} mode={cutMode} onCut={(i) => say(`corte: ${i}`)} />
        </Section>

        <Section title="CardFan (elige 3 de 78)">
          <Row><Btn onClick={() => setFanKey((k) => k + 1)}>Reiniciar</Btn></Row>
          <CardFan key={fanKey} backImage={BACK} count={78} pick={3} onPicked={(ix) => say(`elegidas: ${ix.join(', ')}`)} />
        </Section>

        <Section title="FlipCard">
          <Row>
            <Btn onClick={() => setFlipped(!flipped)}>Girar</Btn>
            <Btn on={rev} onClick={() => setRev(!rev)}>Invertida</Btn>
          </Row>
          <div style={{ display: 'flex', gap: 24 }}>
            <FlipCard front={FRONT('mayor-13')} back={BACK} flipped={flipped} reversed={rev} width={160} alt="La Muerte" onFlipped={() => say('carta girada')} />
            <div style={{ width: 90 }}><CardImage src={BACK} alt="Reverso" /></div>
          </div>
        </Section>

        <Section title="SpreadBoard">
          <Row>
            {(Object.keys(LABELS) as SpreadLayout[]).map((l) => <Btn key={l} on={layout === l} onClick={() => { setLayout(l); setDealt(0); setRevealed(0); }}>{l}</Btn>)}
          </Row>
          <Row>
            <Btn onClick={() => setDealt(slots)}>Repartir todas</Btn>
            <Btn onClick={() => setDealt((d) => Math.min(slots, d + 1))}>Repartir una</Btn>
            <Btn onClick={() => setRevealed((r) => Math.min(dealt, r + 1))}>Revelar siguiente</Btn>
            <Btn onClick={() => { setDealt(0); setRevealed(0); }}>Recoger</Btn>
          </Row>
          <SpreadBoard key={layout} layout={layout} slots={slots} labels={LABELS[layout]} onDealt={() => say('repartidas')}>{cards}</SpreadBoard>
        </Section>

        <Section title="Chests + Carousel3D">
          <Row><Btn onClick={() => setChestKey((k) => k + 1)}>Cerrar cofres</Btn></Row>
          <Chests key={chestKey} onChoose={(f) => say(`cofre: ${f}`)} />
          <div style={{ marginTop: 24 }}>
            <Carousel3D
              items={['rws', 'marsella', 'neon', 'acuarela', 'pixel', 'gatos']}
              itemWidth={150}
              getLabel={(m) => `Modelo ${m}`}
              render={(m) => (
                <div style={{ textAlign: 'center' }}>
                  <CardImage src={`/art/backs/${m}.svg`} />
                  <div style={{ marginTop: 6 }}>{m}</div>
                </div>
              )}
              onSelect={(m) => say(`modelo: ${m}`)}
              onChange={(m) => say(`delante: ${m}`)}
            />
          </div>
        </Section>

        <Section title="DustStamp">
          <Row><Btn onClick={() => setStamp((s) => s + 1)}>Compulsar título</Btn></Row>
          <div style={{ position: 'relative', height: 220, display: 'grid', placeItems: 'center', background: '#efe2c4', borderRadius: 8, color: '#3a2a1a' }}>
            <div style={{ fontFamily: 'serif', fontSize: 20 }}>Diploma en Péndulo Avanzado</div>
            <div style={{ position: 'absolute', right: 40, bottom: 50 }}>
              <DustStamp trigger={stamp} label="Compulsado en ventanilla 3, sin cita previa" size={110} />
            </div>
          </div>
        </Section>

        <Section title="Péndulo">
          <Row>
            <select value={model} onChange={(e) => setModel(e.target.value)} aria-label="Modelo de péndulo">
              {Object.values(PENDULUM_LOOKS).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            {(['sino', 'tablero'] as const).map((m) => <Btn key={m} on={mode === m} onClick={() => { setMode(m); setTarget(null); }}>{m}</Btn>)}
            <span style={{ fontSize: 12, opacity: 0.8 }}>Sí = eje {yesAxis}</span>
          </Row>
          <Row>
            {mode === 'sino' ? (
              <>
                <Btn onClick={() => setTarget({ kind: 'axis', axis: yesAxis })}>Sí</Btn>
                <Btn onClick={() => setTarget({ kind: 'axis', axis: yesAxis === 'vertical' ? 'horizontal' : 'vertical' })}>No</Btn>
                <Btn onClick={() => setTarget({ kind: 'circle' })}>Duda</Btn>
              </>
            ) : (
              SECTORS.map((s, k) => <Btn key={s} onClick={() => setTarget({ kind: 'point', ...sectorPoint(k) })}>{s}</Btn>)
            )}
            <Btn onClick={() => setTarget(null)}>Libre</Btn>
            <Btn on={angry} onClick={() => setAngry(!angry)}>Enfadado</Btn>
            <Btn on={midnight} onClick={() => setMidnight(!midnight)}>Medianoche</Btn>
            <Btn on={tilt} onClick={() => setTilt(!tilt)}>Inclinación simulada</Btn>
          </Row>
          <div style={{ maxWidth: 420, margin: '0 auto' }}>
            <Pendulum
              model={model}
              mode={mode}
              target={target}
              yesAxis={yesAxis}
              angry={angry}
              midnight={midnight}
              tilt={tilt ? { x: 0.4, y: 0 } : undefined}
              board={mode === 'tablero' ? <BoardSemicircle /> : undefined}
              onSettled={() => say('péndulo asentado')}
              onGrab={(g) => say(g ? 'sujetando la cadena' : 'soltado')}
            />
          </div>
          <p style={{ fontSize: 13, opacity: 0.8 }}>Arrastra cerca de la mano para mover la cadena: tu movimiento se suma a la física.</p>
        </Section>
      </div>
    </div>
  );
}

export default Playground;
