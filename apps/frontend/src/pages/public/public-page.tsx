import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
export function PublicPage({ page }: { page: string }) {
  const { t } = useTranslation();
  if (page !== 'home')
    return (
      <>
        <section className="public-inner-hero">
          <h1>{t(`pages.${page}`)}</h1>
          <p>{t('layout.publicInnerBody')}</p>
        </section>
        <div className="public-inner-content">
          {[0, 1, 2].map((index) => (
            <section className="public-content-slot" key={index}>
              <div className="public-content-art" aria-hidden="true" />
              <div>
                <h2>{t(`pages.${page}`)}</h2>
                <p>
                  {t(
                    page === 'get-involved'
                      ? 'layout.applicationUnavailable'
                      : 'layout.publicContentUnavailable',
                  )}
                </p>
              </div>
            </section>
          ))}
        </div>
      </>
    );
  return (
    <>
      <section className="public-home-hero">
        <div className="public-hero-copy">
          <h1>{t('layout.heroTitle')}</h1>
          <p>{t('layout.heroBody')}</p>
          <Link className="layout-primary" to="/get-involved">
            {t('layout.volunteer')}
          </Link>
        </div>
        <div className="public-hero-art" aria-hidden="true">
          ✦
        </div>
      </section>
      <div className="public-home-sections">
        <section className="home-section home-about">
          <h2>{t('layout.aboutFoundation')}</h2>
          <Link className="public-feature-slot" to="/about">
            {t('layout.aboutCard')}
          </Link>
        </section>
        <section className="home-section home-programs">
          <h2>{t('layout.ourPrograms')}</h2>
          <div className="home-program-grid">
            {['education', 'food', 'healthcare', 'relief'].map((key) => (
              <Link className="public-feature-slot" key={key} to="/programs">
                {t(`layout.programs.${key}`)}
              </Link>
            ))}
          </div>
        </section>
        <section className="home-section">
          <h2>{t('layout.ourBranches')}</h2>
          <Link className="public-feature-slot" to="/branches">
            {t('layout.exploreBranches')}
          </Link>
        </section>
        <section className="home-section">
          <h2>{t('layout.upcomingEvents')}</h2>
          <Link className="public-feature-slot" to="/events">
            {t('layout.exploreEvents')}
          </Link>
        </section>
        <section className="home-section">
          <h2>{t('layout.volunteerWithUs')}</h2>
          <Link className="public-feature-slot" to="/get-involved">
            {t('layout.bePart')}
          </Link>
        </section>
      </div>
    </>
  );
}
