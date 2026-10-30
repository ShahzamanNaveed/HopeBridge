import { useState } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../services/api-client';
export function AuthField({
  name,
  label,
  registration,
  error,
  password = false,
  autoComplete,
}: {
  name: string;
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
  password?: boolean;
  autoComplete: string;
}) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  return (
    <div className="hb-field">
      <label htmlFor={name}>{label}</label>
      <div className="hb-input-wrap">
        <input
          {...registration}
          id={name}
          type={password && !visible ? 'password' : password ? 'text' : 'email'}
          dir="ltr"
          autoComplete={autoComplete}
          placeholder={password ? '••••••••' : 'name@hopebridge.org'}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        />
        {password && (
          <button
            type="button"
            className="hb-visibility"
            aria-label={t(visible ? 'auth.hidePassword' : 'auth.showPassword')}
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
          >
            <span className="hb-glyph hb-eye" aria-hidden="true" />
          </button>
        )}
      </div>
      {error && (
        <p className="hb-field-error" id={`${name}-error`}>
          {t(`auth.errors.${error}`, {
            defaultValue: t('auth.errors.VALIDATION_ERROR'),
          })}
        </p>
      )}
    </div>
  );
}
export function AuthError({ error }: { error: unknown }) {
  const { t } = useTranslation();
  if (!error) return null;
  const code = error instanceof ApiError ? error.code : 'INTERNAL_ERROR';
  return (
    <div className="hb-alert hb-error" role="alert">
      ! &nbsp;
      {t(`auth.errors.${code}`, {
        defaultValue: t('auth.errors.INTERNAL_ERROR'),
      })}
    </div>
  );
}
