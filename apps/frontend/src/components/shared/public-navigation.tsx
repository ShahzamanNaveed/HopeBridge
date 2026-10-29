import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  FoundationBrand,
  LanguageSwitcher,
  MobileNavigation,
} from './layout-controls';
export const publicNavigation = [
  'home',
  'about',
  'programs',
  'branches',
  'events',
  'get-involved',
  'contact',
] as const;
export function PublicNavbar() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    const resize = () => {
      if (innerWidth > 1100) setOpen(false);
    };
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  const links = (
    <>
      {publicNavigation.map((page) => (
        <NavLink
          key={page}
          end
          to={page === 'home' ? '/' : `/${page}`}
          onClick={() => setOpen(false)}
        >
          {t(`pages.${page}`)}
        </NavLink>
      ))}
    </>
  );
  return (
    <>
      <header className="public-navbar">
        <FoundationBrand />
        <nav className="public-desktop-nav" aria-label={t('navigation')}>
          {links}
        </nav>
        <LanguageSwitcher />
        <Link className="layout-primary volunteer-nav-cta" to="/get-involved">
          {t('layout.volunteer')}
        </Link>
        <button
          className="public-menu-toggle"
          onClick={() => setOpen(true)}
          aria-label={t('layout.openMenu')}
          aria-expanded={open}
          aria-controls="public-mobile-navigation"
        >
          <span aria-hidden="true">☰</span>
        </button>
      </header>
      <MobileNavigation
        open={open}
        close={() => setOpen(false)}
        title={t('navigation')}
      >
        <div className="public-mobile-navigation" id="public-mobile-navigation">
          <FoundationBrand />
          <nav aria-label={t('layout.mobileNavigation')}>{links}</nav>
          <LanguageSwitcher />
          <Link
            className="layout-primary"
            to="/get-involved"
            onClick={() => setOpen(false)}
          >
            {t('layout.volunteer')}
          </Link>
        </div>
      </MobileNavigation>
    </>
  );
}
export function PublicFooter({ detailed = false }: { detailed?: boolean }) {
  const { t } = useTranslation();
  return (
    <footer
      className={`public-footer ${detailed ? 'footer-detailed' : 'footer-compact'}`}
      data-design-frame={detailed ? '1:867' : '1:754'}
    >
      {detailed ? (
        <>
          <div className="footer-columns">
            <div>
              <FoundationBrand light />
              <p>{t('layout.footerBody')}</p>
            </div>
            <div>
              <h2>{t('layout.quickLinks')}</h2>
              <nav aria-label={t('layout.footerNavigation')}>
                {publicNavigation.map((key) => (
                  <Link key={key} to={key === 'home' ? '/' : `/${key}`}>
                    {t(`pages.${key}`)}
                  </Link>
                ))}
              </nav>
            </div>
            <div>
              <h2>{t('layout.ourPrograms')}</h2>
              <p>{t('layout.programNames')}</p>
            </div>
            <div>
              <h2>{t('pages.contact')}</h2>
              <p>{t('layout.contactPlaceholders')}</p>
            </div>
          </div>
          <p className="footer-copyright">{t('layout.copyright')}</p>
        </>
      ) : (
        <>
          <strong className="footer-foundation">{t('layout.brand')}</strong>
          <p>{t('layout.programNames')}</p>
          <nav aria-label={t('layout.footerNavigation')}>
            {publicNavigation.map((key) => (
              <Link key={key} to={key === 'home' ? '/' : `/${key}`}>
                {t(`pages.${key}`)}
              </Link>
            ))}
          </nav>
          <p className="compact-contact">
            {t('layout.contactPlaceholders')} &nbsp; | &nbsp;{' '}
            {t('layout.copyright')}
          </p>
        </>
      )}
    </footer>
  );
}
