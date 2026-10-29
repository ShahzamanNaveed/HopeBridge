import type { StaffRole } from '@shiplens/contracts';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './use-auth';
import {
  AuthenticationLoading,
  FirstLoginTemporaryExpired,
} from './auth-status-pages';
import { AuthError } from './form-controls';
import { ApiError } from '../../services/api-client';
export function ProtectedRoute({
  allowRestricted = false,
  roles,
}: {
  allowRestricted?: boolean;
  roles?: readonly StaffRole[];
}) {
  const { session } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [validatedNavigation, setValidatedNavigation] = useState<string>();
  const refetch = session.refetch;
  useEffect(() => {
    let active = true;
    void refetch().then(() => {
      if (active) setValidatedNavigation(location.key);
    });
    return () => {
      active = false;
    };
  }, [location.key, refetch]);
  if (session.isPending || validatedNavigation !== location.key)
    return <AuthenticationLoading />;
  if (
    session.error instanceof ApiError &&
    session.error.code === 'TEMPORARY_PASSWORD_EXPIRED'
  )
    return <FirstLoginTemporaryExpired />;
  if (session.error)
    return (
      <div className="hb-auth hb-session-error">
        <AuthError error={session.error} />
        <button className="hb-primary" onClick={() => void session.refetch()}>
          {t('auth.retry')}
        </button>
      </div>
    );
  if (!session.data) return <Navigate replace to="/staff/session-expired" />;
  if (session.data.user.mustChangePassword && !allowRestricted)
    return <Navigate replace to="/staff/first-login" />;
  if (roles && !roles.includes(session.data.user.role))
    return <Navigate replace to="/staff/access-denied" />;
  return <Outlet />;
}
