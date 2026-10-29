import { useTranslation } from 'react-i18next';
import { BrandLogo, LanguageControl } from './brand-logo';
import { PasswordForm } from './password-form';
export function ChangePasswordPage() {
  const { t } = useTranslation();
  return (
    <div className="hb-auth hb-account">
      <div className="hb-account-header">
        <BrandLogo />
        <span>{t('auth.portalAccount')}</span>
        <LanguageControl />
      </div>
      <section className="hb-account-content">
        <p className="hb-breadcrumb">{t('auth.accountBreadcrumb')}</p>
        <h1>{t('auth.accountSecurity')}</h1>
        <div className="hb-account-card">
          <h2>{t('auth.changePassword')}</h2>
          <p className="hb-subtitle">{t('auth.changeBody')}</p>
          <PasswordForm />
        </div>
      </section>
    </div>
  );
}
