import type { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { BrandLogo, LanguageControl } from './brand-logo';
export function AuthShell({
  children,
  password = false,
}: PropsWithChildren<{ password?: boolean }>) {
  const { t } = useTranslation();
  return (
    <div
      className={`hb-auth hb-split ${password ? 'hb-password' : 'hb-login'}`}
    >
      <aside className="hb-story">
        <BrandLogo />
        <div className="hb-story-copy">
          <h2>{t('auth.mission')}</h2>
          <p>{t('auth.missionBody')}</p>
        </div>
        <div className="hb-story-rule" />
        <p className="hb-story-footer">{t('auth.portalBrand')}</p>
      </aside>
      <div className="hb-form-side">
        <div className="hb-mobile-brand">
          <BrandLogo />
        </div>
        <LanguageControl />
        {children}
      </div>
    </div>
  );
}
