import { describe, expect, it } from 'vitest';
import { PendulumSim, mulberry32, boardToWorld } from './physics';

const run = (sim: PendulumSim, seconds: number, each?: (s: PendulumSim) => void) => {
  const n = Math.round(seconds / sim.params.dt);
  for (let i = 0; i < n; i++) {
    sim.step();
    each?.(sim);
  }
};

describe('PendulumSim (péndulo esférico, Verlet)', () => {
  it('conserva aproximadamente la energía sin amortiguación', () => {
    const sim = new PendulumSim({ damping: 0, tremor: 0 }, mulberry32(1));
    sim.setAngle(0.45, 0.3, 0.6); // ~26° con velocidad tangencial: órbita esférica
    run(sim, 0.1);
    const e0 = sim.energy();
    let maxDev = 0;
    run(sim, 20, (s) => {
      maxDev = Math.max(maxDev, Math.abs(s.energy() - e0));
    });
    const scale = Math.abs(sim.params.gravity * sim.params.length); // energía de referencia
    expect(maxDev / scale).toBeLessThan(0.02);
  });

  it('mantiene la ligadura de la cadena', () => {
    const sim = new PendulumSim({ damping: 0 }, mulberry32(2));
    sim.setAngle(0.8, 1, 1);
    run(sim, 5, (s) => {
      const d = Math.hypot(s.p.x - s.pivot.x, s.p.y - s.pivot.y, s.p.z - s.pivot.z);
      expect(Math.abs(d - s.length)).toBeLessThan(1e-9);
    });
  });

  it('la amortiguación disipa energía', () => {
    const sim = new PendulumSim({ damping: 1, tremor: 0 }, mulberry32(3));
    sim.setAngle(0.5);
    run(sim, 0.1);
    const e0 = sim.energy();
    run(sim, 10);
    expect(sim.energy()).toBeLessThan(e0);
    expect(Math.hypot(sim.p.x, sim.p.y)).toBeLessThan(0.02);
  });

  for (const axis of ['x', 'y'] as const) {
    it(`converge a oscilar en el eje ${axis}`, () => {
      const sim = new PendulumSim({}, mulberry32(10 + axis.charCodeAt(0)));
      sim.setTarget({ kind: 'axis', axis });
      let settledAt = -1;
      run(sim, 14, (s) => {
        if (settledAt < 0 && s.consumeSettled()) settledAt = s.time;
      });
      let maxAlong = 0;
      let maxPerp = 0;
      run(sim, 4, (s) => {
        const along = axis === 'x' ? s.p.x : s.p.y;
        const perp = axis === 'x' ? s.p.y : s.p.x;
        maxAlong = Math.max(maxAlong, Math.abs(along));
        maxPerp = Math.max(maxPerp, Math.abs(perp));
      });
      const A = sim.params.axisAmplitude * sim.params.length;
      expect(settledAt).toBeGreaterThan(0);
      expect(Math.abs(maxAlong - A) / A).toBeLessThan(0.25);
      expect(maxPerp / maxAlong).toBeLessThan(0.15);
    });
  }

  it('converge a girar en círculo', () => {
    const sim = new PendulumSim({}, mulberry32(7));
    sim.setTarget({ kind: 'circle' });
    run(sim, 14);
    const R = sim.params.circleRadius * sim.params.length;
    let minR = Infinity;
    let maxR = 0;
    run(sim, 4, (s) => {
      const r = Math.hypot(s.p.x, s.p.y);
      minR = Math.min(minR, r);
      maxR = Math.max(maxR, r);
    });
    expect(minR).toBeGreaterThan(R * 0.75);
    expect(maxR).toBeLessThan(R * 1.25);
    expect(sim.settled).toBe(true);
  });

  it('se asienta sobre un punto del tablero', () => {
    const sim = new PendulumSim({}, mulberry32(9));
    const pt = boardToWorld(0.8, 0.3, 0.5);
    sim.setTarget({ kind: 'point', ...pt });
    let settled = false;
    run(sim, 12, (s) => {
      settled = settled || s.consumeSettled();
    });
    expect(Math.hypot(sim.p.x - pt.x, sim.p.y - pt.y)).toBeLessThan(0.03);
    expect(settled).toBe(true);
  });

  it('empieza quieto antes de moverse hacia el objetivo', () => {
    const sim = new PendulumSim({ tremor: 0 }, mulberry32(4));
    sim.setTarget({ kind: 'axis', axis: 'y' });
    run(sim, 0.5);
    expect(Math.hypot(sim.p.x, sim.p.y)).toBeLessThan(0.01);
  });

  it('se enrolla al enfadarse', () => {
    const sim = new PendulumSim({}, mulberry32(5));
    sim.setAngry(true);
    let settled = false;
    run(sim, 6, (s) => {
      settled = settled || s.consumeSettled();
    });
    expect(sim.length).toBeLessThan(0.5);
    expect(sim.wind).toBeGreaterThan(4);
    expect(settled).toBe(true);
  });

  it('el pivote arrastrado mueve la lenteja', () => {
    const sim = new PendulumSim({ tremor: 0 }, mulberry32(6));
    for (let i = 0; i < 30; i++) {
      sim.setPivot(i * 0.01, 0);
      sim.step();
    }
    run(sim, 0.5);
    expect(Math.abs(sim.p.x)).toBeGreaterThan(0.05);
  });
});
