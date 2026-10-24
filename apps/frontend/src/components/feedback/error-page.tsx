import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
export function ErrorPage({ notFound = false }: { notFound?: boolean }) {
  const { t } = useTranslation();
  return (
    <section className="page">
      <h1>{t(notFound ? 'notFound' : 'error')}</h1>
      <Link to="/">{t('backHome')}</Link>
    </section>
  );
}
