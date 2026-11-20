// Node ≥ 25 trae un `localStorage` global experimental que tapa el de jsdom y vale undefined
// sin --localstorage-file. Para las pruebas, usamos un Storage en memoria si falta.
class MemoryStorage implements Storage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  key(i: number) { return Array.from(this.m.keys())[i] ?? null; }
  removeItem(k: string) { this.m.delete(k); }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
}
for (const name of ['localStorage', 'sessionStorage'] as const) {
  let ok = false;
  try { ok = !!globalThis[name] && typeof globalThis[name].clear === 'function'; } catch { ok = false; }
  if (!ok) Object.defineProperty(globalThis, name, { value: new MemoryStorage(), configurable: true, writable: true });
}
