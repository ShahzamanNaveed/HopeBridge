import { Outlet, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  PublicNavbar,
  PublicFooter,
} from '../components/shared/public-navigation';
import '../styles/layouts.css';
export function PublicLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  return (
    <div className="hwf-layout public-layout">
      <a className="skip-link" href="#main">
        {t('skip')}
      </a>
      <PublicNavbar />
      <main className="public-main" id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <PublicFooter detailed={location.pathname === '/contact'} />
    </div>
  );
}
