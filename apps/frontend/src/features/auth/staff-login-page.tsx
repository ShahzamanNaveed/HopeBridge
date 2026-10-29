import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginRequestSchema, type LoginRequest } from '@shiplens/contracts';
import { Navigate, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from './use-auth';
import { AuthShell } from './auth-shell';
import { AuthError, AuthField } from './form-controls';
import { AuthenticationLoading } from './auth-status-pages';
export function StaffLoginPage() {
  const { t } = useTranslation();
  const { session, login } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: '', password: '' },
  });
  if (session.isPending) return <AuthenticationLoading />;
  if (session.data)
    return (
      <Navigate
        replace
        to={
          session.data.user.mustChangePassword ? '/staff/first-login' : '/staff'
        }
      />
    );
  return (
    <AuthShell>
      <section className="hb-auth-form">
        <h1>{t('auth.welcome')}</h1>
        <p className="hb-subtitle">{t('auth.loginBody')}</p>
        <form
          noValidate
          onSubmit={handleSubmit(async (body) => {
            try {
              const data = await login.mutateAsync(body);
              navigate(
                data.user.mustChangePassword ? '/staff/first-login' : '/staff',
                { replace: true },
              );
            } catch {
              /* rendered below */
            }
          })}
        >
          <AuthError error={login.error} />
          <AuthField
            name="email"
            label={t('auth.email')}
            registration={register('email')}
            error={errors.email?.message}
            autoComplete="username"
          />
          <AuthField
            name="password"
            label={t('auth.password')}
            registration={register('password')}
            error={errors.password?.message}
            password
            autoComplete="current-password"
          />
          <button
            className="hb-primary hb-login-submit"
            disabled={login.isPending}
            aria-busy={login.isPending}
          >
            {t(login.isPending ? 'auth.signingIn' : 'auth.signIn')}
          </button>
        </form>
        <p className="hb-support">{t('auth.support')}</p>
      </section>
      <p className="hb-access-note">{t('auth.staffOnly')}</p>
    </AuthShell>
  );
}
