import { z } from 'zod';

export const staffRoleSchema = z.enum([
  'SUPER_ADMIN',
  'FINANCE_REVIEWER',
  'CONTENT_EDITOR',
  'BRANCH_LEAD',
  'HR_LEAD',
]);
export type StaffRole = z.infer<typeof staffRoleSchema>;

export const staffStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);
export type StaffStatus = z.infer<typeof staffStatusSchema>;

// A-02 user-approved policy. Count Unicode code points rather than UTF-16 units.
export const newPasswordSchema = z
  .string()
  .max(200, 'PASSWORD_TOO_LONG')
  .refine((value) => [...value].length >= 15, 'PASSWORD_MIN_LENGTH');
export const credentialResetParamsSchema = z.object({ id: z.uuid() });
export const credentialResetResponseSchema = z.object({
  temporaryPassword: z.string().min(32),
  expiresAt: z.iso.datetime(),
});

export const authBranchSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
});
export type AuthBranch = z.infer<typeof authBranchSchema>;

export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string(),
  role: staffRoleSchema,
  status: staffStatusSchema,
  mustChangePassword: z.boolean(),
  restricted: z.boolean(),
  branch: authBranchSchema.nullable(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const loginRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'EMAIL_REQUIRED')
    .email('INVALID_EMAIL')
    .max(254)
    .toLowerCase(),
  password: z.string().min(1, 'PASSWORD_REQUIRED').max(200),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const loginResponseSchema = z.object({
  user: authUserSchema,
  csrfToken: z.string(),
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const sessionResponseSchema = z.object({
  user: authUserSchema,
  csrfToken: z.string(),
});
export type SessionResponse = z.infer<typeof sessionResponseSchema>;

export const firstLoginPasswordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'CURRENT_PASSWORD_REQUIRED').max(200),
    newPassword: newPasswordSchema,
    confirmPassword: z.string().min(1, 'CONFIRM_PASSWORD_REQUIRED').max(200),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'PASSWORDS_DO_NOT_MATCH',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'NEW_PASSWORD_MUST_DIFFER',
    path: ['newPassword'],
  });
export type FirstLoginPasswordChangeRequest = z.infer<
  typeof firstLoginPasswordChangeSchema
>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'CURRENT_PASSWORD_REQUIRED').max(200),
    newPassword: newPasswordSchema,
    confirmPassword: z.string().min(1, 'CONFIRM_PASSWORD_REQUIRED').max(200),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'PASSWORDS_DO_NOT_MATCH',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'NEW_PASSWORD_MUST_DIFFER',
    path: ['newPassword'],
  });
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;

export const logoutResponseSchema = z.object({
  success: z.boolean(),
});
export type LogoutResponse = z.infer<typeof logoutResponseSchema>;
