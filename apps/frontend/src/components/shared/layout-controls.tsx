import { useEffect, useRef, type PropsWithChildren } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
export function FoundationBrand({
  light = false,
  compact = false,
}: {
  light?: boolean;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Link
      className={`foundation-brand ${light ? 'is-light' : ''} ${compact ? 'is-compact' : ''}`}
      to="/"
      aria-label={t('layout.brand')}
      dir="ltr"
    >
      <span className="foundation-mark" aria-hidden="true">
        ✦
      </span>
      <span className="foundation-wordmark">
        <strong>HopeBridge</strong>
        <small>WELFARE FOUNDATION</small>
      </span>
    </Link>
  );
}
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  return (
    <button
      className="layout-language"
      type="button"
      aria-label={t('auth.switchLanguage')}
      onClick={() =>
        void i18n.changeLanguage(i18n.language === 'ur' ? 'en' : 'ur')
      }
    >
      EN / اردو
    </button>
  );
}
export function MobileNavigation({
  open,
  close,
  title,
  children,
}: PropsWithChildren<{ open: boolean; close: () => void; title: string }>) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { t } = useTranslation();
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className="layout-drawer"
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === dialog.current) close();
      }}
    >
      <div className="drawer-surface">
        <button
          className="drawer-close"
          onClick={close}
          aria-label={t('layout.closeMenu')}
        >
          ×
        </button>
        {children}
      </div>
    </dialog>
  );
}
