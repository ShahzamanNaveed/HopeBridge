import { createBrowserRouter, Navigate } from 'react-router';
import type { StaffRole } from '@shiplens/contracts';
import { PublicLayout } from '../layouts/public-layout';
import {
  StaffLayout,
  StaffWorkspaceRedirect,
} from '../layouts/staff/staff-layout';
import {
  StaffDashboard,
  StaffModulePage,
  StaffAccountPage,
} from '../layouts/staff/staff-dashboard';
import { roleRoots } from '../layouts/staff/role-navigation';
import { PublicPage } from '../pages/public/public-page';
import { ErrorPage } from '../components/feedback/error-page';
import {
  AdminDashboard,
  AdminStaffPage,
  AdminBranchesPage,
  AdminAuditPage,
} from '../features/admin/admin-pages';
import {
  StaffLoginPage,
  FirstLoginPage,
  ChangePasswordPage,
  ProtectedRoute,
  AuthStatusPage,
  LogoutPage,
} from '../features/auth';
export const publicPages = [
  'home',
  'about',
  'programs',
  'branches',
  'events',
  'get-involved',
  'contact',
] as const;
export const router = createBrowserRouter([
  { path: '/staff/login', element: <StaffLoginPage /> },
  { path: '/staff/logout', element: <LogoutPage /> },
  ...(
    [
      ['session-expired', 'expired'],
      ['temporary-password-expired', 'temporary-expired'],
      ['account-unavailable', 'unavailable'],
      ['credentials-changed', 'credentials-changed'],
      ['signed-out', 'signed-out'],
    ] as const
  ).map(([path, kind]) => ({
    path: `/staff/${path}`,
    element: <AuthStatusPage kind={kind} />,
  })),
  {
    element: <ProtectedRoute allowRestricted />,
    children: [{ path: '/staff/first-login', element: <FirstLoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <StaffLayout />,
        children: [
          { path: '/staff', element: <StaffWorkspaceRedirect /> },
          { path: '/staff/security', element: <ChangePasswordPage embedded /> },
          { path: '/staff/account', element: <StaffAccountPage /> },
        ],
      },
      {
        path: '/staff/access-denied',
        element: <AuthStatusPage kind="denied" />,
      },
    ],
  },
  ...Object.entries(roleRoots).map(([role, path]) => ({
    element: <ProtectedRoute roles={[role as StaffRole]} />,
    children: [
      {
        path,
        element: <StaffLayout />,
        children: [
          {
            index: true,
            element:
              role === 'SUPER_ADMIN' ? <AdminDashboard /> : <StaffDashboard />,
          },
          ...(role === 'SUPER_ADMIN'
            ? [
                { path: 'staff-accounts', element: <AdminStaffPage /> },
                { path: 'branches', element: <AdminBranchesPage /> },
                {
                  path: 'lead-assignments',
                  element: <AdminBranchesPage assignments />,
                },
                { path: 'audit', element: <AdminAuditPage /> },
              ]
            : []),
          { path: ':module', element: <StaffModulePage /> },
        ],
      },
    ],
  })),
  { path: '/dashboard', element: <Navigate replace to="/staff" /> },
  {
    element: <PublicLayout />,
    errorElement: <ErrorPage />,
    children: [
      ...publicPages.map((page) => ({
        path: page === 'home' ? '/' : `/${page}`,
        element: <PublicPage page={page} />,
      })),
      { path: '*', element: <ErrorPage notFound /> },
    ],
  },
]);
