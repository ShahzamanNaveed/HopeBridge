import { Link, Navigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../features/auth';
import {
  DashboardCard,
  ChartContainer,
  DataTableShell,
  PageHeader,
  StatusBadge,
} from '../../components/shared/dashboard-components';
import { dashboardConfig, navigationPath, roleMenus } from './role-navigation';
export function StaffDashboard() {
  const { session } = useAuth();
  const { t } = useTranslation();
  if (!session.data) return null;
  const user = session.data.user;
  const config = dashboardConfig[user.role];
  return (
    <div className="staff-dashboard" data-design-frame={config.frame}>
      <PageHeader
        title={t(`layout.dashboards.${user.role}.title`)}
        description={
          user.role === 'BRANCH_LEAD'
            ? user.branch
              ? t('layout.assignedBranch', {
                  name: user.branch.name,
                  code: user.branch.code,
                })
              : t('layout.noAssignedBranch')
            : t(`layout.dashboards.${user.role}.body`)
        }
      >
        <p className="dashboard-availability">
          {t('layout.modulesUnavailable')}
        </p>
      </PageHeader>
      <div className="dashboard-metrics">
        {config.cards.map((key) => (
          <DashboardCard key={key} title={t(`layout.cards.${key}`)} />
        ))}
      </div>
      <div className="dashboard-panels">
        {config.panels.map((key, i) =>
          i === 0 ? (
            <ChartContainer key={key} title={t(`layout.panels.${key}`)} />
          ) : (
            <DataTableShell key={key} title={t(`layout.panels.${key}`)} />
          ),
        )}
      </div>
      <div className="dashboard-quick-actions">
        <h2>{t('layout.quickActions')}</h2>
        <div>
          {config.actions.map(([label, key], index) => (
            <Link
              key={key}
              className={index === 0 ? 'layout-primary' : 'layout-secondary'}
              to={navigationPath(user.role, key)}
            >
              {t(`layout.actions.${label}`)}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
export function StaffModulePage() {
  const { module } = useParams();
  const { session } = useAuth();
  const { t } = useTranslation();
  if (!session.data) return null;
  const user = session.data.user;
  if (
    !(roleMenus[user.role] as readonly string[]).includes(module ?? '') ||
    module === 'dashboard'
  )
    return <Navigate replace to="/staff/access-denied" />;
  if (user.role === 'BRANCH_LEAD' && !user.branch)
    return <Navigate replace to="/staff/access-denied" />;
  return (
    <>
      <div className="layout-breadcrumb">
        {t(`layout.workspaces.${user.role}`)} / {t(`layout.nav.${module}`)}
      </div>
      <PageHeader
        title={t(`layout.nav.${module}`)}
        description={t('layout.moduleBody')}
      />
      <section className="module-unavailable">
        <StatusBadge>{t('layout.unavailable')}</StatusBadge>
        <p>{t('layout.moduleUnavailable')}</p>
        <Link
          to={navigationPath(user.role, 'dashboard')}
          className="layout-secondary"
        >
          {t('auth.returnWorkspace')}
        </Link>
      </section>
    </>
  );
}
export function StaffAccountPage() {
  const { session } = useAuth();
  const { t } = useTranslation();
  if (!session.data) return null;
  const user = session.data.user;
  return (
    <>
      <PageHeader title={t('layout.myAccount')} />
      <section className="module-unavailable">
        <dl className="staff-account-data">
          <dt>{t('layout.name')}</dt>
          <dd>{user.displayName}</dd>
          <dt>{t('auth.email')}</dt>
          <dd dir="ltr">{user.email}</dd>
          <dt>{t('layout.role')}</dt>
          <dd>{t(`auth.roles.${user.role}`)}</dd>
        </dl>
        <Link className="layout-primary" to="/staff/security">
          {t('auth.changePassword')}
        </Link>
      </section>
    </>
  );
}
