import { useTranslation } from 'react-i18next';
export function PublicPage({ page }: { page: string }) {
  const { t } = useTranslation();
  return (
    <section className="page">
      <p className="eyebrow">{t('foundation')}</p>
      <h1>{t(`pages.${page}`)}</h1>
      <p className="lead">{t(page === 'home' ? 'intro' : 'placeholder')}</p>
      <div className="notice">
        <h2>{t('statusTitle')}</h2>
        <p>{t('status')}</p>
      </div>
    </section>
  );
}
