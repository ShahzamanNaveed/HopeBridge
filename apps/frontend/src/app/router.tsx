import { createBrowserRouter } from 'react-router';
import { PublicLayout } from '../layouts/public-layout';
import { DashboardLayout } from '../layouts/dashboard-layout';
import { PublicPage } from '../pages/public/public-page';
import { ErrorPage } from '../components/feedback/error-page';
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
