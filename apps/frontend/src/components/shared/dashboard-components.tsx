import type { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
export function PageHeader({
  title,
  description,
  children,
}: PropsWithChildren<{ title: string; description?: string }>) {
  return (
    <div className="layout-page-header">
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      {children}
    </div>
  );
}
export function DashboardCard({ title }: { title: string }) {
  const { t } = useTranslation();
  return (
    <section
      className="dashboard-card"
      aria-label={`${title}: ${t('layout.unavailable')}`}
    >
      <span className="metric-icon" aria-hidden="true">
        ◈
      </span>
      <p>{title}</p>
      <strong aria-hidden="true">—</strong>
    </section>
  );
}
export function StatusBadge({ children }: PropsWithChildren) {
  return <span className="layout-status-badge">{children}</span>;
}
export function ChartContainer({ title }: { title: string }) {
  const { t } = useTranslation();
  return (
    <section className="dashboard-panel">
      <h2>{title}</h2>
      <div className="unavailable-bars" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <span />
            <i />
          </div>
        ))}
      </div>
      <p className="panel-availability">{t('layout.dataUnavailable')}</p>
    </section>
  );
}
export function DataTableShell({ title }: { title: string }) {
  return <ChartContainer title={title} />;
}
