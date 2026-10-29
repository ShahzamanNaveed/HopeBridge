import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { BrandLogo, LanguageControl } from './brand-logo';
import { useAuth } from './use-auth';
import { AuthError } from './form-controls';
import { AuthShell } from './auth-shell';
import { ApiError } from '../../services/api-client';
export function FirstLoginTemporaryExpired() {
  const { t } = useTranslation();
  return (
    <AuthShell password>
      <section className="hb-auth-form">
        <h1>{t('auth.secureAccount')}</h1>
        <p className="hb-subtitle">{t('auth.firstLoginBody')}</p>
        <div className="hb-expired-message">
          <AuthError error={new ApiError('TEMPORARY_PASSWORD_EXPIRED', 401)} />
          <Link className="hb-secondary" to="/staff/logout">
            {t('auth.signOut')}
          </Link>
        </div>
      </section>
    </AuthShell>
  );
}
export function AuthenticationLoading() {
  const { t } = useTranslation();
  return (
    <div className="hb-auth hb-loading" role="status">
      <BrandLogo />
      <span className="hb-spinner" aria-hidden="true">
        <span className="hb-glyph hb-spinner-glyph" />
      </span>
      <p>{t('auth.checkingSession')}</p>
    </div>
  );
}
export function AuthStatusPage({
  kind,
}: {
  kind:
    | 'denied'
    | 'expired'
    | 'temporary-expired'
    | 'unavailable'
    | 'credentials-changed'
    | 'signed-out';
}) {
  const { t } = useTranslation();
  const icons = {
    denied: 'denied',
    expired: 'clock',
    'temporary-expired': 'warning',
    unavailable: 'warning',
    'credentials-changed': 'check',
    'signed-out': 'check',
  };
  return (
    <div className={`hb-auth hb-status hb-status-${kind}`}>
      <BrandLogo />
      <LanguageControl />
      <section className="hb-status-card">
        <div className="hb-status-icon" aria-hidden="true">
          <span className={`hb-glyph hb-icon-${icons[kind]}`} />
        </div>
        {kind === 'denied' && <div className="hb-status-code">403</div>}
        <h1>{t(`auth.status.${kind}.title`)}</h1>
        <p>{t(`auth.status.${kind}.body`)}</p>
        <Link
          className="hb-primary"
          to={kind === 'denied' ? '/staff' : '/staff/login'}
        >
          {t(
            kind === 'denied'
              ? 'auth.returnWorkspace'
              : kind === 'expired'
                ? 'auth.signInAgain'
                : kind === 'credentials-changed'
                  ? 'auth.signIn'
                  : 'auth.returnSignIn',
          )}
        </Link>
        {kind === 'denied' && (
          <Link className="hb-text-button" to="/staff/logout">
            {t('auth.signOut')}
          </Link>
        )}
      </section>
    </div>
  );
}
export function LogoutPage() {
  const { t } = useTranslation();
  const { logout, session } = useAuth();
  const navigate = useNavigate();
  if (session.isPending) return <AuthenticationLoading />;
  if (!session.data && !session.error)
    return <Navigate replace to="/staff/signed-out" />;
  return (
    <div className="hb-auth hb-logout">
      <section className="hb-logout-card" aria-labelledby="logout-title">
        <div className="hb-logout-icon hb-glyph" aria-hidden="true" />
        <h1 id="logout-title">{t('auth.logoutTitle')}</h1>
        <p>{t('auth.logoutBody')}</p>
        <AuthError error={logout.error} />
        <div className="hb-logout-actions">
          <Link className="hb-secondary" to="/staff">
            {t('auth.cancel')}
          </Link>
          <button
            className="hb-primary"
            disabled={logout.isPending}
            onClick={() => {
              void logout
                .mutateAsync()
                .then(() => navigate('/staff/signed-out', { replace: true }))
                .catch(() => {});
            }}
          >
            {t(logout.isPending ? 'auth.signingOut' : 'auth.signOut')}
          </button>
        </div>
      </section>
    </div>
  );
}
export function StaffWorkspace() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const location = useLocation();
  return (
    <div className="hb-auth hb-account">
      <div className="hb-account-header">
        <BrandLogo />
        <LanguageControl />
      </div>
      <section className="hb-account-content">
        <h1>{t('auth.workspace')}</h1>
        {location.state?.passwordUpdated && (
          <div className="hb-alert hb-success" role="status">
            ✓ {t('auth.passwordUpdated')}
          </div>
        )}
        <p>{session.data?.user.displayName}</p>
        <p>{t(`auth.roles.${session.data?.user.role}`)}</p>
        <p>{t('auth.workspaceBody')}</p>
        <div className="hb-workspace-links">
          <Link className="hb-primary" to="/staff/security">
            {t('auth.accountSecurity')}
          </Link>
          <Link className="hb-secondary" to="/staff/logout">
            {t('auth.signOut')}
          </Link>
        </div>
      </section>
    </div>
  );
}
