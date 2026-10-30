import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  changePasswordSchema,
  type ChangePasswordRequest,
} from '@shiplens/contracts';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useAuth } from './use-auth';
import { AuthError, AuthField } from './form-controls';
export function PasswordForm({ first = false }: { first?: boolean }) {
  const { t } = useTranslation();
  const { change } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordRequest>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });
  return (
    <form
      className="hb-password-form"
      noValidate
      onSubmit={handleSubmit(async (body) => {
        try {
          await change.mutateAsync({ body, first });
          reset();
        } catch {
          /* rendered below */
        }
      })}
    >
      <AuthError error={change.error} />
      <AuthField
        name="currentPassword"
        label={t(first ? 'auth.temporaryPassword' : 'auth.currentPassword')}
        registration={register('currentPassword')}
        error={errors.currentPassword?.message}
        password
        autoComplete="current-password"
      />
      <AuthField
        name="newPassword"
        label={t('auth.newPassword')}
        registration={register('newPassword')}
        error={errors.newPassword?.message}
        password
        autoComplete="new-password"
      />
      <AuthField
        name="confirmPassword"
        label={t('auth.confirmPassword')}
        registration={register('confirmPassword')}
        error={errors.confirmPassword?.message}
        password
        autoComplete="new-password"
      />
      <div className={first ? 'hb-guidance' : 'hb-account-guidance'}>
        {t(first ? 'auth.passwordGuidance' : 'auth.accountGuidance')}
      </div>
      {change.isSuccess && (
        <div role="status" className="hb-alert hb-success">
          ✓ &nbsp;{t('auth.passwordUpdated')}
        </div>
      )}
      <div className="hb-password-actions">
        {first && change.isSuccess ? (
          <Link className="hb-primary" to="/staff">
            {t('auth.updateContinue')}
          </Link>
        ) : (
          <button
            className="hb-primary"
            disabled={change.isPending}
            aria-busy={change.isPending}
          >
            {t(
              change.isPending
                ? 'auth.updating'
                : first
                  ? 'auth.updateContinue'
                  : 'auth.savePassword',
            )}
          </button>
        )}
        <Link className="hb-secondary" to={first ? '/staff/logout' : '/staff'}>
          {t(first ? 'auth.signOut' : 'auth.cancel')}
        </Link>
      </div>
    </form>
  );
}
