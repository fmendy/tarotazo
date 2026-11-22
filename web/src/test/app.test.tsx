// Humo: la app monta, la puerta +18 funciona y el nombre no sale en ninguna petición.
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import '../i18n';
import { App } from '../App';
import { setFetch } from '../lib/api';
import { mockFetch } from '../lib/mock';
import { initialData, useSession } from '../state/session';

const bodies: string[] = [];
beforeAll(() => {
  window.matchMedia ??= ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as never;
  window.scrollTo = () => {};
  setFetch(async (url, init) => { bodies.push(url + ' ' + String(init?.body ?? '')); return mockFetch(url, init); });
});
afterEach(() => { cleanup(); sessionStorage.clear(); useSession.setState(initialData()); });

describe('App', () => {
  it('portada con aviso de entretenimiento y puerta +18 → nombre', async () => {
    render(<App />);
    expect(screen.getAllByText(/entretenimiento/i).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('checkbox'));
    await act(async () => { fireEvent.submit(screen.getByRole('checkbox').closest('form')!); });
    expect(useSession.getState().screen).toBe('name');
    const input = await screen.findByRole('textbox');
    await act(async () => { fireEvent.change(input, { target: { value: 'Vanesa' } }); await new Promise((r) => setTimeout(r, 700)); });
    expect(bodies.join('\n')).not.toContain('Vanesa');
  });

  it('«Todavía no» bloquea la sesión', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /todavía no/i }));
    expect(useSession.getState().screen).toBe('blocked');
  });
});
