import { useTranslation } from 'react-i18next';
import { useSession } from './session';
import { personalVars, resolveServerText, stripUnresolved, type Vars } from '../lib/resolve';
import { provinceName } from '../lib/provinces';
import { useCallback } from 'react';

/** Variables que sólo conoce el navegador ({nombre}, {inicial}, {edad}) + algunas de cortesía. */
export function usePersonalVars(): Vars {
  const { t } = useTranslation();
  const name = useSession((s) => s.name);
  const age = useSession((s) => s.age);
  const signo = useSession((s) => s.signo);
  const province = useSession((s) => s.province);
  return {
    ...personalVars({ name, age, fallbackName: t('app.fallbackName') }),
    signo: signo ? t(`signs.${signo}`) : undefined,
    provincia: province === 'XX' ? t('province.abroadName') : provinceName(province) ?? undefined,
  };
}

/** Devuelve una función que rellena los huecos de un texto del servidor y limpia los sobrantes. */
export function useFill(extra: Vars = {}) {
  const vars = usePersonalVars();
  const key = JSON.stringify({ ...vars, ...extra });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback((text: string, more: Vars = {}) => stripUnresolved(resolveServerText(text, { ...vars, ...extra, ...more })), [key]);
}
