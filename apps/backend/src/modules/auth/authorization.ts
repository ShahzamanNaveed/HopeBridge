import type { AuthUser, StaffRole } from '@shiplens/contracts';
import { HttpError } from '../../common/errors/http-error.js';

// Action grants only. Domain services must additionally validate state and record scope.
const grants = {
  'audit.read': ['SUPER_ADMIN'],
  'staff.reset': ['SUPER_ADMIN'],
  'staff.manage': ['SUPER_ADMIN'],
  'branch.manage': ['SUPER_ADMIN'],
  'branch.assign': ['SUPER_ADMIN'],
  'application.review': ['HR_LEAD'],
  'application.decide': ['HR_LEAD'],
  'transfer.decide': ['HR_LEAD'],
  'transfer.request': ['BRANCH_LEAD'],
  'collection.record': ['BRANCH_LEAD'],
  'report.read': ['FINANCE_REVIEWER', 'BRANCH_LEAD'],
  'report.submit': ['BRANCH_LEAD'],
  'report.return': ['FINANCE_REVIEWER'],
  'report.approve': ['FINANCE_REVIEWER'],
  'adjustment.request': ['BRANCH_LEAD'],
  'adjustment.decide': ['FINANCE_REVIEWER'],
  'remittance.record': ['BRANCH_LEAD'],
  'remittance.confirm': ['FINANCE_REVIEWER'],
  'remittance.cancel.request': ['BRANCH_LEAD'],
  'remittance.cancel.decide': ['FINANCE_REVIEWER'],
  'content.manage': ['CONTENT_EDITOR'],
  'financial.export': ['SUPER_ADMIN', 'FINANCE_REVIEWER', 'BRANCH_LEAD'],
} satisfies Record<string, StaffRole[]>;
export type Permission = keyof typeof grants;
export function authorize(
  user: AuthUser,
  action: Permission | 'session',
  branchId?: string,
): void {
  if (user.status !== 'ACTIVE')
    throw new HttpError(401, 'SESSION_EXPIRED', 'Sign in again');
  if (user.restricted || user.mustChangePassword)
    throw new HttpError(
      403,
      'PASSWORD_CHANGE_REQUIRED',
      'Password change required',
    );
  if (action === 'session') return;
  const roles: readonly StaffRole[] = Object.hasOwn(grants, action)
    ? grants[action]
    : [];
  if (!roles.includes(user.role))
    throw new HttpError(403, 'ACCESS_DENIED', 'Access denied');
  if (
    user.role === 'BRANCH_LEAD' &&
    (!branchId || user.branch?.id !== branchId)
  )
    throw new HttpError(403, 'ACCESS_DENIED', 'Access denied');
}
