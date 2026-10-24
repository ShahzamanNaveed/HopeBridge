import { useTranslation } from 'react-i18next';
export function DashboardLayout() {
  const { t } = useTranslation();
  return (
    <section className="page">
      <p className="eyebrow">{t('foundation')}</p>
      <h1>{t('dashboard')}</h1>
      <p className="lead">{t('dashboardNotice')}</p>
      <div className="notice">
        <h2>{t('statusTitle')}</h2>
        <p>{t('status')}</p>
      </div>
    </section>
  );
}
