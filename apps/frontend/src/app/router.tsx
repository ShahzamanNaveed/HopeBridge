import { createBrowserRouter } from 'react-router';
import { PublicLayout } from '../layouts/public-layout';
import { DashboardLayout } from '../layouts/dashboard-layout';
import { PublicPage } from '../pages/public/public-page';
import { ErrorPage } from '../components/feedback/error-page';
import {
  StaffLoginPage,
  FirstLoginPage,
  ChangePasswordPage,
  ProtectedRoute,
  AuthStatusPage,
  LogoutPage,
  StaffWorkspace,
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
      { path: '/staff', element: <StaffWorkspace /> },
      { path: '/staff/security', element: <ChangePasswordPage /> },
      {
        path: '/staff/access-denied',
        element: <AuthStatusPage kind="denied" />,
      },
    ],
  },
  {
    element: <PublicLayout />,
    errorElement: <ErrorPage />,
    children: [
      ...publicPages.map((page) => ({
        path: page === 'home' ? '/' : `/${page}`,
        element: <PublicPage page={page} />,
      })),
      { path: '/dashboard', element: <DashboardLayout /> },
      { path: '*', element: <ErrorPage notFound /> },
    ],
  },
]);
