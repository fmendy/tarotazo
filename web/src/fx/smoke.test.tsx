import { describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { Ambience, CardFan, Carousel3D, Chests, CutDeck, DustStamp, FlipCard, ScreenTransition, ShuffleDeck, SpreadBoard, TypewriterText, setReducedMotion } from './index';
import { Pendulum } from '../pendulum';
import { Playground } from './Playground';

// jsdom no trae canvas ni matchMedia: lo justo para montar.
HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext'];
if (!window.matchMedia) {
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
}

describe('componentes fx (montaje)', () => {
  it('montan sin errores', () => {
    const noop = () => {};
    const { unmount } = render(
      <div>
        <ShuffleDeck backImage="/b.svg" style="riffle" onDone={noop} />
        <CutDeck backImage="/b.svg" mode="tres" onCut={noop} />
        <CutDeck backImage="/b.svg" mode="abanico" onCut={noop} />
        <CardFan backImage="/b.svg" count={22} pick={3} onPicked={noop} />
        <FlipCard front="/f.svg" back="/b.svg" flipped={false} />
        <SpreadBoard layout="celtic" slots={10}>{[<div key="a" />]}</SpreadBoard>
        <Ambience variant="humo" />
        <ScreenTransition id="a"><p>hola</p></ScreenTransition>
        <TypewriterText text="hola" />
        <DustStamp trigger={0} label="x" />
        <Chests onChoose={noop} />
        <Carousel3D items={[1, 2, 3]} render={(n) => <span>{n}</span>} onSelect={noop} />
        <Pendulum model="chorizo" mode="sino" target={{ kind: 'circle' }} yesAxis="vertical" />
      </div>,
    );
    unmount();
  });

  it('el Playground monta', () => {
    const { unmount } = render(<Playground />);
    unmount();
  });

  it('TypewriterText con movimiento reducido muestra el texto completo y llama a onDone', async () => {
    setReducedMotion(true);
    const onDone = vi.fn();
    const { container } = render(<TypewriterText text="Mmm… ¡ojo!" onDone={onDone} />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(container.textContent).toContain('Mmm… ¡ojo!');
    expect(onDone).toHaveBeenCalled();
    setReducedMotion(null);
  });

  it('ShuffleDeck con movimiento reducido termina enseguida', async () => {
    const onDone = vi.fn();
    render(<ShuffleDeck backImage="/b.svg" style="mesa" onDone={onDone} reducedMotion />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 600));
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
