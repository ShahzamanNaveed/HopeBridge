import { Navigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AuthShell } from './auth-shell';
import { PasswordForm } from './password-form';
import { useAuth } from './use-auth';
import { useState } from 'react';
export function FirstLoginPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [startedRestricted] = useState(
    session.data?.user.mustChangePassword ?? false,
  );
  if (
    session.data &&
    !session.data.user.mustChangePassword &&
    !startedRestricted
  )
    return <Navigate replace to="/staff" />;
  return (
    <AuthShell password>
      <section className="hb-auth-form">
        <h1>{t('auth.secureAccount')}</h1>
        <p className="hb-subtitle">{t('auth.firstLoginBody')}</p>
        <PasswordForm first />
      </section>
    </AuthShell>
  );
}
