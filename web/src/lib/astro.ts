// Signo zodiacal, edad, década y número de vida (numerología). Todo local.
import type { Signo } from './types';

export interface BirthDate { year: number; month: number; day: number } // month 1..12

export function parseIsoDate(iso: string): BirthDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const year = Number(m[1]), month = Number(m[2]), day = Number(m[3]);
  if (!isValidDate(year, month, day)) return null;
  return { year, month, day };
}

export function isValidDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

export function ageOn(b: BirthDate, today: Date = new Date()): number {
  const y = today.getFullYear(), m = today.getMonth() + 1, d = today.getDate();
  let age = y - b.year;
  if (m < b.month || (m === b.month && d < b.day)) age--;
  return age;
}

export function isAdult(b: BirthDate, today: Date = new Date()): boolean {
  return ageOn(b, today) >= 18;
}

/** Década: 37 → 30. */
export function decadeOf(age: number): number {
  return Math.floor(Math.max(0, age) / 10) * 10;
}

// Fechas de inicio (mes, día) de cada signo, ordenadas por el año.
const SIGNS: { sign: Signo; m: number; d: number }[] = [
  { sign: 'capricornio', m: 1, d: 1 },
  { sign: 'acuario', m: 1, d: 20 },
  { sign: 'piscis', m: 2, d: 19 },
  { sign: 'aries', m: 3, d: 21 },
  { sign: 'tauro', m: 4, d: 20 },
  { sign: 'geminis', m: 5, d: 21 },
  { sign: 'cancer', m: 6, d: 21 },
  { sign: 'leo', m: 7, d: 23 },
  { sign: 'virgo', m: 8, d: 23 },
  { sign: 'libra', m: 9, d: 23 },
  { sign: 'escorpio', m: 10, d: 23 },
  { sign: 'sagitario', m: 11, d: 22 },
  { sign: 'capricornio', m: 12, d: 22 },
];

export function zodiacSign(month: number, day: number): Signo {
  let result: Signo = 'capricornio';
  for (const s of SIGNS) {
    if (month > s.m || (month === s.m && day >= s.d)) result = s.sign;
  }
  return result;
}

function digitSum(n: number): number {
  return String(n).split('').reduce((a, c) => a + Number(c), 0);
}

/**
 * Número de vida: suma de todos los dígitos de la fecha (AAAAMMDD) reducida a 1–9,
 * conservando los números maestros 11 y 22.
 */
export function lifeNumber(b: BirthDate): number {
  const digits = `${b.year}${String(b.month).padStart(2, '0')}${String(b.day).padStart(2, '0')}`;
  let n = digitSum(Number(digits));
  while (n > 9 && n !== 11 && n !== 22) n = digitSum(n);
  return n;
}

export function derive(b: BirthDate, today: Date = new Date()) {
  const age = ageOn(b, today);
  return { age, decada: decadeOf(age), signo: zodiacSign(b.month, b.day), numeroVida: lifeNumber(b) };
}
