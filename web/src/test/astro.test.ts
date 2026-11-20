import { describe, expect, it } from 'vitest';
import { ageOn, decadeOf, derive, isAdult, lifeNumber, parseIsoDate, zodiacSign } from '../lib/astro';

describe('signo zodiacal', () => {
  it.each([
    [1, 1, 'capricornio'], [1, 19, 'capricornio'], [1, 20, 'acuario'], [2, 18, 'acuario'], [2, 19, 'piscis'],
    [3, 20, 'piscis'], [3, 21, 'aries'], [4, 20, 'tauro'], [5, 21, 'geminis'], [6, 21, 'cancer'],
    [7, 23, 'leo'], [8, 22, 'leo'], [8, 23, 'virgo'], [9, 23, 'libra'], [10, 23, 'escorpio'],
    [11, 22, 'sagitario'], [12, 21, 'sagitario'], [12, 22, 'capricornio'], [12, 31, 'capricornio'],
  ])('%i/%i → %s', (m, d, s) => expect(zodiacSign(m, d)).toBe(s));
});

describe('número de vida', () => {
  it('reduce a un dígito', () => {
    expect(lifeNumber({ year: 1990, month: 7, day: 15 })).toBe(5); // 32 → 5
    expect(lifeNumber({ year: 1985, month: 11, day: 29 })).toBe(9); // 36 → 9
  });
  it('conserva los maestros 11 y 22', () => {
    expect(lifeNumber({ year: 2000, month: 1, day: 8 })).toBe(11);
    expect(lifeNumber({ year: 1999, month: 1, day: 9 })).toBe(11); // 38 → 11
    expect(lifeNumber({ year: 1960, month: 3, day: 3 })).toBe(22);
  });
  it('siempre está en 1–9, 11 o 22', () => {
    for (let y = 1920; y < 2008; y += 3) for (let m = 1; m <= 12; m++) {
      expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22]).toContain(lifeNumber({ year: y, month: m, day: (y + m) % 28 + 1 }));
    }
  });
});

describe('edad y década', () => {
  const today = new Date(2026, 10, 20); // 20/11/2026
  it('calcula la edad respetando el cumpleaños', () => {
    expect(ageOn({ year: 2008, month: 11, day: 20 }, today)).toBe(18);
    expect(ageOn({ year: 2008, month: 11, day: 21 }, today)).toBe(17);
    expect(isAdult({ year: 2008, month: 11, day: 21 }, today)).toBe(false);
  });
  it('década', () => {
    expect(decadeOf(18)).toBe(10);
    expect(decadeOf(37)).toBe(30);
    expect(decadeOf(40)).toBe(40);
  });
  it('valida fechas', () => {
    expect(parseIsoDate('2001-02-29')).toBeNull();
    expect(parseIsoDate('2000-02-29')).toEqual({ year: 2000, month: 2, day: 29 });
    expect(parseIsoDate('basura')).toBeNull();
  });
  it('derive', () => {
    expect(derive({ year: 1990, month: 7, day: 25 }, today)).toEqual({ age: 36, decada: 30, signo: 'leo', numeroVida: 6 });
  });
});
