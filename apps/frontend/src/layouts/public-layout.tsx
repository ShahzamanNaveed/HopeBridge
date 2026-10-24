import { NavLink, Outlet } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
const pages = [
  'home',
  'about',
  'programs',
  'branches',
  'events',
  'get-involved',
  'contact',
];
export function PublicLayout() {
  const { t, i18n } = useTranslation();
  return (
    <>
      <a className="skip-link" href="#main">
        {t('skip')}
      </a>
      <header>
        <div className="header-inner">
          <NavLink to="/" className="brand">
            {t('brand')}
          </NavLink>
          <Button
            variant="outline"
            onClick={() =>
              void i18n.changeLanguage(i18n.language === 'en' ? 'ur' : 'en')
            }
          >
            {t('switchLanguage')}
          </Button>
        </div>
        <nav aria-label={t('navigation')}>
          {pages.map((page) => (
            <NavLink end key={page} to={page === 'home' ? '/' : `/${page}`}>
              {t(`pages.${page}`)}
            </NavLink>
          ))}
          <NavLink to="/dashboard">{t('dashboard')}</NavLink>
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <footer>{t('footer')}</footer>
    </>
  );
}
