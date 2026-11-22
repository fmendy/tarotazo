// Port de es.arcana.narrative.Astro y TimeContext: estación (hemisferio norte), fase lunar y momento de la lectura.

const REFERENCE_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0); // 6/1/2000 18:14 UTC
export const SYNODIC_MONTH = 29.530588853;
const OCTANT = SYNODIC_MONTH / 8;

/** Estación astronómica aproximada para mes (1–12) y día. */
export function estacion(month: number, day: number): string {
  const md = month * 100 + day;
  if (md < 320) return 'invierno';
  if (md < 621) return 'primavera';
  if (md < 923) return 'verano';
  if (md < 1221) return 'otono';
  return 'invierno';
}

/** Edad de la luna en días (0 = luna nueva). */
export function moonAge(epochMillis: number): number {
  const seconds = Math.trunc((epochMillis - REFERENCE_NEW_MOON) / 1000);
  const age = (seconds / 86_400) % SYNODIC_MONTH;
  return age < 0 ? age + SYNODIC_MONTH : age;
}

/** nueva | creciente | llena | menguante. */
export function faseLunar(epochMillis: number): string {
  const age = moonAge(epochMillis);
  if (age < OCTANT / 2 || age >= SYNODIC_MONTH - OCTANT / 2) return 'nueva';
  const full = SYNODIC_MONTH / 2;
  if (age < full - OCTANT / 2) return 'creciente';
  if (age < full + OCTANT / 2) return 'llena';
  return 'menguante';
}

/** @property diaSemana ISO 1 = lunes … 7 = domingo */
export interface Moment {
  hora: number;
  diaSemana: number;
  estacion: string;
  faseLunar: string;
}

/**
 * Momento de la lectura: hora y día del contexto si llegan; si no, del reloj local del dispositivo (en el backend,
 * el reloj del servidor en Europe/Madrid). Estación y fase lunar siempre con la fecha actual.
 */
export function moment(ctx: { hora?: number | null; diaSemana?: number | null } | undefined, now: Date): Moment {
  const hora = ctx?.hora ?? now.getHours();
  const js = now.getDay();
  const diaSemana = ctx?.diaSemana ?? (js === 0 ? 7 : js);
  return { hora, diaSemana, estacion: estacion(now.getMonth() + 1, now.getDate()), faseLunar: faseLunar(now.getTime()) };
}
