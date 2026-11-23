// Aviso legal y política de privacidad (se cargan bajo demanda).
import { useTranslation } from 'react-i18next';
import { useSession } from '../state/session';
import { Screen } from '../components/common';

function LegalText(p: { ns: 'legal' | 'privacy' }) {
  const { t } = useTranslation();
  const back = useSession((s) => s.back);
  // En la app, `body` ya es la variante «app» (sin servidor ni IP): ver i18n/es.app.json.
  const body = t(`${p.ns}.body`, { returnObjects: true }) as string[];
  return (
    <Screen title={t(`${p.ns}.title`)} className="legal">
      <p className="legal__pending" role="note">{t(`${p.ns}.pending`)}</p>
      <div className="card-panel legal__body">
        {body.map((para, i) => <p key={i}>{para}</p>)}
      </div>
      <button className="btn" onClick={back}>{t('app.back')}</button>
    </Screen>
  );
}
export const Legal = () => <LegalText ns="legal" />;
export const Privacy = () => <LegalText ns="privacy" />;
