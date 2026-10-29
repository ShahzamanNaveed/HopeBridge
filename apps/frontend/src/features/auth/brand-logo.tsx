import { useTranslation } from 'react-i18next';
import './auth.css';
export function BrandLogo() {
  const { t } = useTranslation();
  return (
    <div className="hb-brand" dir="ltr" aria-label={t('auth.brand')}>
      <span className="hb-brand-symbol" aria-hidden="true">
        <span className="hb-glyph hb-sparkle" />
      </span>
      <div>
        <strong>HopeBridge</strong>
        <small>WELFARE FOUNDATION</small>
      </div>
    </div>
  );
}
export function LanguageControl() {
  const { i18n, t } = useTranslation();
  return (
    <button
      type="button"
      className="hb-language"
      aria-label={t('auth.switchLanguage')}
      onClick={() =>
        void i18n.changeLanguage(i18n.language === 'ur' ? 'en' : 'ur')
      }
    >
      EN / اردو
    </button>
  );
}
