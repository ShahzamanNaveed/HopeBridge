import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Path,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  adminOverviewSchema,
  adminPageSchema,
  staffRecordSchema,
  branchRecordSchema,
  auditRecordSchema,
  staffDetailSchema,
  branchDetailSchema,
  cityRecordSchema,
  staffCreateSchema,
  staffProvisionResponseSchema,
  credentialResetResponseSchema,
  staffUpdateSchema,
  branchCreateSchema,
  branchUpdateSchema,
  branchTransitionSchema,
  leadAssignSchema,
  staffRoleSchema,
  branchStatusSchema,
  type StaffRecord,
  type BranchRecord,
  type AuditRecord,
} from '@shiplens/contracts';
import { apiRequest, ApiError } from '../../services/api-client';
import { useAuth } from '../auth';
import {
  PageHeader,
  StatusBadge,
} from '../../components/shared/dashboard-components';
import './admin.css';

function useAdminQuery<T extends z.ZodType>(
  path: string,
  schema: T,
  enabled = true,
) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['admin', session.data?.user.id, path],
    queryFn: async ({ signal }) =>
      schema.parse(await apiRequest(`/admin${path}`, { signal })),
    enabled: enabled && !!session.data,
    retry: false,
  });
}
function useAdminMutation() {
  const { session } = useAuth();
  const cache = useQueryClient();
  return useMutation({
    gcTime: 0,
    mutationFn: ({ path, body }: { path: string; body: unknown }) =>
      apiRequest<unknown>(path, {
        method: 'POST',
        body,
        csrfToken: session.data?.csrfToken,
      }),
    onSuccess: async () => {
      window.dispatchEvent(new Event('admin:saved'));
      await cache.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}
function AdminFeedback() {
  const { t } = useTranslation();
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const show = () => setSaved(true);
    window.addEventListener('admin:saved', show);
    return () => window.removeEventListener('admin:saved', show);
  }, []);
  return saved ? (
    <p role="status" className="admin-success">
      {t('admin.saved')}
    </p>
  ) : null;
}
function ErrorMessage({ error }: { error: unknown }) {
  const { t } = useTranslation();
  if (!error) return null;
  const code = error instanceof ApiError ? error.code : 'INTERNAL_ERROR';
  return (
    <p role="alert" className="admin-error">
      {t(`admin.errors.${code}`, { defaultValue: t('admin.error') })}
    </p>
  );
}
function QueryState({
  pending,
  error,
  empty,
  retry,
}: {
  pending: boolean;
  error: unknown;
  empty?: boolean;
  retry: () => unknown;
}) {
  const { t } = useTranslation();
  return (
    <>
      {pending && <p role="status">{t('admin.loading')}</p>}
      {!!error && (
        <>
          <ErrorMessage error={error} />
          <button className="layout-secondary" onClick={() => retry()}>
            {t('admin.retry')}
          </button>
        </>
      )}
      {!pending && !error && empty && <p>{t('admin.empty')}</p>}
    </>
  );
}
function Modal({
  title,
  close,
  children,
  busy = false,
}: PropsWithChildren<{ title: string; close: () => void; busy?: boolean }>) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useTranslation();
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="admin-modal"
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) close();
      }}
    >
      <div className="admin-modal-heading">
        <h2>{title}</h2>
        <button
          className="layout-secondary"
          disabled={busy}
          onClick={close}
          aria-label={t('admin.close')}
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
type Field = {
  key: string;
  label: string;
  type?: string;
  options?: { value: string; label: string }[];
  optional?: boolean;
};
function AdminForm<T extends FieldValues>({
  schema,
  values,
  fields,
  submit,
  busy,
  error,
  confirm = false,
}: {
  schema: z.ZodType<T, T>;
  values: DefaultValues<T>;
  fields: Field[];
  submit: (value: T) => Promise<void>;
  busy: boolean;
  error: unknown;
  confirm?: boolean;
}) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<T>({ resolver: zodResolver(schema), defaultValues: values });
  const [confirmed, setConfirmed] = useState(false);
  return (
    <form className="admin-form" noValidate onSubmit={handleSubmit(submit)}>
      <ErrorMessage error={error} />
      {fields.map((field) => (
        <label key={field.key}>
          {field.label}
          {field.options ? (
            <select
              aria-label={field.label}
              {...register(field.key as Path<T>)}
              aria-invalid={!!errors[field.key]}
            >
              <option value="">
                {t(field.optional ? 'admin.none' : 'admin.select')}
              </option>
              {field.options.map((x) => (
                <option key={x.value} value={x.value}>
                  {x.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              aria-label={field.label}
              type={field.type ?? 'text'}
              autoComplete="off"
              {...register(field.key as Path<T>)}
              aria-invalid={!!errors[field.key]}
            />
          )}
          {errors[field.key] && (
            <span role="alert" className="admin-error">
              {t('admin.invalidField')}
            </span>
          )}
        </label>
      ))}
      {confirm && (
        <label className="admin-confirm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          {t('admin.confirmChange')}
        </label>
      )}
      <button
        className="layout-primary"
        disabled={busy || (confirm && !confirmed)}
      >
        {t(busy ? 'admin.saving' : 'admin.save')}
      </button>
    </form>
  );
}
function Pager({
  page,
  total,
  setPage,
}: {
  page: number;
  total: number;
  setPage: (page: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <nav className="admin-pager" aria-label={t('admin.pagination')}>
      <button
        className="layout-secondary"
        disabled={page === 1}
        onClick={() => setPage(page - 1)}
      >
        {t('admin.previous')}
      </button>
      <span>{t('admin.page', { page, total })}</span>
      <button
        className="layout-secondary"
        disabled={page * 20 >= total}
        onClick={() => setPage(page + 1)}
      >
        {t('admin.next')}
      </button>
    </nav>
  );
}
function SearchFilters({
  search,
  setSearch,
  filter,
  setFilter,
  options,
}: {
  search: string;
  setSearch: (x: string) => void;
  filter: string;
  setFilter: (x: string) => void;
  options: { value: string; label: string }[];
}) {
  const { t } = useTranslation();
  return (
    <div className="admin-filters">
      <label>
        {t('admin.search')}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          maxLength={100}
        />
      </label>
      <label>
        {t('admin.filter')}
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">{t('admin.all')}</option>
          {options.map((x) => (
            <option key={x.value} value={x.value}>
              {x.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
function AuditTable({
  items,
  select,
}: {
  items: AuditRecord[];
  select?: (id: string) => void;
}) {
  const { t, i18n } = useTranslation();
  return (
    <div className="admin-table-scroll">
      <table>
        <thead>
          <tr>
            {['time', 'actor', 'action', 'entity', 'branch', 'details'].map(
              (x) => (
                <th key={x}>{t(`admin.${x}`)}</th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.id}>
              <td>{new Date(row.createdAt).toLocaleString(i18n.language)}</td>
              <td>{row.actor}</td>
              <td>
                {t(`admin.actions.${row.action}`, { defaultValue: row.action })}
              </td>
              <td>
                {row.entityType}
                <small dir="ltr">{row.entityId}</small>
              </td>
              <td>{row.branch?.code ?? '—'}</td>
              <td>
                {select ? (
                  <button
                    className="layout-secondary"
                    onClick={() => select(row.id)}
                  >
                    {t('admin.view')}
                  </button>
                ) : (
                  <Link to="/staff/super-admin/audit">{t('admin.view')}</Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminDashboard() {
  const { t } = useTranslation();
  const query = useAdminQuery('/overview', adminOverviewSchema);
  const data = query.data;
  return (
    <div className="staff-dashboard admin-module" data-design-frame="1:300">
      <PageHeader
        title={t('layout.dashboards.SUPER_ADMIN.title')}
        description={t('layout.dashboards.SUPER_ADMIN.body')}
      >
        <p className="dashboard-availability">
          {t('admin.attentionDefinition')}
        </p>
      </PageHeader>
      <QueryState
        pending={query.isPending}
        error={query.error}
        retry={query.refetch}
      />
      {data && (
        <>
          <div className="dashboard-metrics">
            {(
              [
                'totalBranches',
                'activeBranches',
                'activeStaff',
                'attentionBranches',
              ] as const
            ).map((key) => (
              <section
                className="dashboard-card"
                key={key}
                aria-label={`${t(`layout.cards.${key}`)}: ${data[key]}`}
              >
                <span className="metric-icon" aria-hidden="true">
                  ◈
                </span>
                <p>{t(`layout.cards.${key}`)}</p>
                <strong>{data[key]}</strong>
              </section>
            ))}
          </div>
          <div className="dashboard-panels">
            <section className="dashboard-panel admin-distribution">
              <h2>{t('layout.panels.branchStatus')}</h2>
              {branchStatusSchema.options.map((status) => (
                <div className="admin-count" key={status}>
                  <span>{t(`admin.statuses.${status}`)}</span>
                  <meter
                    value={
                      data.branchStatuses.find((x) => x.status === status)
                        ?.count ?? 0
                    }
                    min={0}
                    max={Math.max(data.totalBranches, 1)}
                  />
                  <strong>
                    {data.branchStatuses.find((x) => x.status === status)
                      ?.count ?? 0}
                  </strong>
                </div>
              ))}
            </section>
            <section className="dashboard-panel admin-distribution">
              <h2>{t('layout.panels.staffDistribution')}</h2>
              {staffRoleSchema.options.map((role) => (
                <div className="admin-count" key={role}>
                  <span>{t(`auth.roles.${role}`)}</span>
                  <strong>
                    {data.staffRoles.find((x) => x.role === role)?.count ?? 0}
                  </strong>
                </div>
              ))}
            </section>
            <section className="dashboard-panel admin-activity">
              <h2>{t('layout.panels.adminActivity')}</h2>
              {data.recentActivity.length ? (
                <ul>
                  {data.recentActivity.map((x) => (
                    <li key={x.id}>
                      {t(`admin.actions.${x.action}`, {
                        defaultValue: x.action,
                      })}
                      <small>{x.actor}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>{t('admin.empty')}</p>
              )}
            </section>
            <section className="dashboard-panel admin-activity">
              <h2>{t('layout.panels.recentBranches')}</h2>
              {data.recentBranches.length ? (
                <ul>
                  {data.recentBranches.map((x) => (
                    <li key={x.id}>
                      <Link to="/staff/super-admin/branches">{x.name}</Link>
                      <small>
                        {x.code} · {t(`admin.statuses.${x.status}`)}
                      </small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>{t('admin.empty')}</p>
              )}
            </section>
          </div>
          <div className="dashboard-quick-actions">
            <h2>{t('layout.quickActions')}</h2>
            <div>
              {['staff-accounts', 'branches', 'lead-assignments', 'audit'].map(
                (path, i) => (
                  <Link
                    key={path}
                    className={i === 0 ? 'layout-primary' : 'layout-secondary'}
                    to={`/staff/super-admin/${path}`}
                  >
                    {t(`layout.nav.${path}`)}
                  </Link>
                ),
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
export function AdminStaffPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [create, setCreate] = useState(false);
  const query = useAdminQuery(
    `/staff?${new URLSearchParams({ page: String(page), search, ...(role ? { role } : {}), ...(status ? { status } : {}) })}`,
    adminPageSchema(staffRecordSchema),
  );
  const [secret, setSecret] = useState<{
    temporaryPassword: string;
    expiresAt: string;
  } | null>(null);
  return (
    <div className="admin-module">
      <AdminFeedback />
      <PageHeader title={t('layout.nav.staff-accounts')}>
        <button className="layout-primary" onClick={() => setCreate(true)}>
          {t('admin.createStaff')}
        </button>
      </PageHeader>
      <SearchFilters
        search={search}
        setSearch={(x) => {
          setSearch(x);
          setPage(1);
        }}
        filter={role}
        setFilter={(x) => {
          setRole(x);
          setPage(1);
        }}
        options={staffRoleSchema.options.map((value) => ({
          value,
          label: t(`auth.roles.${value}`),
        }))}
      />
      <label className="admin-status-filter">
        {t('admin.status')}
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">{t('admin.all')}</option>
          {['ACTIVE', 'INACTIVE'].map((x) => (
            <option key={x} value={x}>
              {t(`admin.statuses.${x}`)}
            </option>
          ))}
        </select>
      </label>
      <QueryState
        pending={query.isPending}
        error={query.error}
        empty={!query.data?.items.length}
        retry={query.refetch}
      />
      {query.data && (
        <>
          <div className="admin-table-scroll">
            <table>
              <thead>
                <tr>
                  {['name', 'email', 'role', 'status', 'branch', 'details'].map(
                    (x) => (
                      <th key={x}>{t(`admin.${x}`)}</th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((row) => (
                  <tr key={row.id}>
                    <td>{row.displayName}</td>
                    <td dir="ltr">{row.email}</td>
                    <td>{t(`auth.roles.${row.role}`)}</td>
                    <td>
                      <StatusBadge>
                        {t(`admin.statuses.${row.status}`)}
                      </StatusBadge>
                    </td>
                    <td>{row.branch?.code ?? '—'}</td>
                    <td>
                      <button
                        className="layout-secondary"
                        onClick={() => setSelected(row.id)}
                      >
                        {t('admin.view')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} total={query.data.total} setPage={setPage} />
        </>
      )}
      {create && (
        <StaffCreate
          close={() => setCreate(false)}
          done={(value) => {
            setCreate(false);
            setSecret(value);
          }}
        />
      )}
      {selected && (
        <StaffDetails
          id={selected}
          close={() => setSelected(null)}
          secret={(value) => {
            setSelected(null);
            setSecret(value);
          }}
        />
      )}
      {secret && <SecretModal value={secret} close={() => setSecret(null)} />}
    </div>
  );
}
function SecretModal({
  value,
  close,
}: {
  value: { temporaryPassword: string; expiresAt: string };
  close: () => void;
}) {
  const { t, i18n } = useTranslation();
  return (
    <Modal title={t('admin.temporaryCredential')} close={close}>
      <p>{t('admin.secretWarning')}</p>
      <output className="admin-secret" dir="ltr">
        {value.temporaryPassword}
      </output>
      <p>
        {t('admin.expires', {
          date: new Date(value.expiresAt).toLocaleString(i18n.language),
        })}
      </p>
      <button className="layout-primary" onClick={close}>
        {t('admin.savedCredential')}
      </button>
    </Modal>
  );
}
function StaffCreate({
  close,
  done,
}: {
  close: () => void;
  done: (value: { temporaryPassword: string; expiresAt: string }) => void;
}) {
  const { t } = useTranslation();
  const mutation = useAdminMutation();
  return (
    <Modal
      title={t('admin.createStaff')}
      close={close}
      busy={mutation.isPending}
    >
      <AdminForm
        schema={staffCreateSchema}
        values={{ displayName: '', email: '', role: 'HR_LEAD' }}
        fields={[
          { key: 'displayName', label: t('admin.name') },
          { key: 'email', label: t('admin.email'), type: 'email' },
          {
            key: 'role',
            label: t('admin.role'),
            options: staffRoleSchema.options.map((value) => ({
              value,
              label: t(`auth.roles.${value}`),
            })),
          },
        ]}
        busy={mutation.isPending}
        error={mutation.error}
        submit={async (body) => {
          try {
            const value = await mutation.mutateAsync({
              path: '/admin/staff',
              body,
            });
            done(staffProvisionResponseSchema.parse(value));
            mutation.reset();
          } catch {
            /* inline feedback */
          }
        }}
      />
    </Modal>
  );
}
function StaffDetails({
  id,
  close,
  secret,
}: {
  id: string;
  close: () => void;
  secret: (value: { temporaryPassword: string; expiresAt: string }) => void;
}) {
  const { t } = useTranslation();
  const query = useAdminQuery(`/staff/${id}`, staffDetailSchema);
  const mutation = useAdminMutation();
  const [reset, setReset] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidatePage, setCandidatePage] = useState(1);
  const candidates = useAdminQuery(
    `/staff?${new URLSearchParams({ role: 'BRANCH_LEAD', status: 'ACTIVE', search: candidateSearch, page: String(candidatePage) })}`,
    adminPageSchema(staffRecordSchema),
  );
  const staff = query.data?.staff;
  return (
    <Modal
      title={t('admin.staffDetails')}
      close={close}
      busy={mutation.isPending}
    >
      <QueryState
        pending={query.isPending}
        error={query.error}
        retry={query.refetch}
      />
      {staff && (
        <>
          {staff.branch && (
            <>
              <label className="admin-status-filter">
                {t('admin.searchCandidates')}
                <input
                  value={candidateSearch}
                  onChange={(e) => {
                    setCandidateSearch(e.target.value);
                    setCandidatePage(1);
                  }}
                />
              </label>
              <QueryState
                pending={candidates.isPending}
                error={candidates.error}
                retry={candidates.refetch}
              />
              {candidates.data && (
                <Pager
                  page={candidatePage}
                  total={candidates.data.total}
                  setPage={setCandidatePage}
                />
              )}
            </>
          )}
          <StaffEdit
            key={`${staff.id}:${staff.version}`}
            staff={staff}
            candidates={candidates.data?.items ?? []}
            busy={mutation.isPending}
            error={mutation.error}
            submit={async (body) => {
              try {
                await mutation.mutateAsync({
                  path: `/admin/staff/${id}/update`,
                  body,
                });
                close();
              } catch {
                /* inline */
              }
            }}
          />
          {staff.status === 'ACTIVE' && (
            <>
              <label className="admin-confirm">
                <input
                  type="checkbox"
                  checked={reset}
                  onChange={(e) => setReset(e.target.checked)}
                />
                {t('admin.confirmReset')}
              </label>
              <button
                className="layout-secondary"
                disabled={!reset || mutation.isPending}
                onClick={async () => {
                  try {
                    const value = await mutation.mutateAsync({
                      path: `/auth/staff/${id}/reset-credential`,
                      body: {},
                    });
                    secret(credentialResetResponseSchema.parse(value));
                    mutation.reset();
                  } catch {
                    /* inline */
                  }
                }}
              >
                {t('admin.resetCredential')}
              </button>
            </>
          )}
          <h3>{t('admin.history')}</h3>
          <AuditTable items={query.data!.history} />
        </>
      )}
    </Modal>
  );
}
function StaffEdit({
  staff,
  candidates,
  busy,
  error,
  submit,
}: {
  staff: StaffRecord;
  candidates: StaffRecord[];
  busy: boolean;
  error: unknown;
  submit: (value: z.infer<typeof staffUpdateSchema>) => Promise<void>;
}) {
  const { t } = useTranslation();
  const schema = staffUpdateSchema.extend({
    replacementId: z
      .union([z.uuid(), z.literal('')])
      .optional()
      .transform((v) => v || undefined),
  });
  // The input/output differ only for the optional empty selector. Normalize in submit.
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: staff.displayName,
      email: staff.email,
      role: staff.role,
      status: staff.status,
      version: staff.version,
      replacementId: '',
    },
  });
  const [confirmed, setConfirmed] = useState(false);
  return (
    <form className="admin-form" noValidate onSubmit={handleSubmit(submit)}>
      <ErrorMessage error={error} />
      <label>
        {t('admin.name')}
        <input {...register('displayName')} />
        {errors.displayName && (
          <span role="alert">{t('admin.invalidField')}</span>
        )}
      </label>
      <label>
        {t('admin.email')}
        <input type="email" {...register('email')} />
        {errors.email && <span role="alert">{t('admin.invalidField')}</span>}
      </label>
      <label>
        {t('admin.role')}
        <select {...register('role')}>
          {staffRoleSchema.options.map((x) => (
            <option key={x} value={x}>
              {t(`auth.roles.${x}`)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t('admin.status')}
        <select {...register('status')}>
          {['ACTIVE', 'INACTIVE'].map((x) => (
            <option key={x} value={x}>
              {t(`admin.statuses.${x}`)}
            </option>
          ))}
        </select>
      </label>
      {staff.branch && (
        <label>
          {t('admin.replacement')}
          <select {...register('replacementId')}>
            <option value="">{t('admin.select')}</option>
            {candidates
              .filter((x) => !x.branch && x.id !== staff.id)
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {x.displayName} ({x.email})
                </option>
              ))}
          </select>
          <small>
            {t('admin.replacementHint', { branch: staff.branch.code })}
          </small>
        </label>
      )}
      <label className="admin-confirm">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        {t('admin.confirmChange')}
      </label>
      <button className="layout-primary" disabled={busy || !confirmed}>
        {t(busy ? 'admin.saving' : 'admin.save')}
      </button>
    </form>
  );
}

export function AdminBranchesPage({
  assignments = false,
}: {
  assignments?: boolean;
}) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [create, setCreate] = useState(false);
  const query = useAdminQuery(
    `/branches?${new URLSearchParams({ page: String(page), search, ...(status ? { status } : {}) })}`,
    adminPageSchema(branchRecordSchema),
  );
  return (
    <div className="admin-module">
      <AdminFeedback />
      <PageHeader
        title={t(`layout.nav.${assignments ? 'lead-assignments' : 'branches'}`)}
      >
        {!assignments && (
          <button className="layout-primary" onClick={() => setCreate(true)}>
            {t('admin.createBranch')}
          </button>
        )}
      </PageHeader>
      <SearchFilters
        search={search}
        setSearch={(x) => {
          setSearch(x);
          setPage(1);
        }}
        filter={status}
        setFilter={(x) => {
          setStatus(x);
          setPage(1);
        }}
        options={branchStatusSchema.options.map((value) => ({
          value,
          label: t(`admin.statuses.${value}`),
        }))}
      />
      <QueryState
        pending={query.isPending}
        error={query.error}
        empty={!query.data?.items.length}
        retry={query.refetch}
      />
      {query.data && (
        <>
          <div className="admin-table-scroll">
            <table>
              <thead>
                <tr>
                  {[
                    'code',
                    'name',
                    'city',
                    'status',
                    'currentLead',
                    'details',
                  ].map((x) => (
                    <th key={x}>{t(`admin.${x}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((row) => (
                  <tr key={row.id}>
                    <td dir="ltr">{row.code}</td>
                    <td>{row.name}</td>
                    <td>{row.city.name}</td>
                    <td>
                      <StatusBadge>
                        {t(`admin.statuses.${row.status}`)}
                      </StatusBadge>
                    </td>
                    <td>
                      {row.currentLead?.leadName ?? t('admin.unassigned')}
                    </td>
                    <td>
                      <button
                        className="layout-secondary"
                        onClick={() => setSelected(row.id)}
                      >
                        {t(assignments ? 'admin.assignLead' : 'admin.view')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} total={query.data.total} setPage={setPage} />
        </>
      )}
      {create && <BranchCreate close={() => setCreate(false)} />}
      {selected && (
        <BranchDetails
          id={selected}
          close={() => setSelected(null)}
          assignments={assignments}
        />
      )}
    </div>
  );
}
function BranchCreate({ close }: { close: () => void }) {
  const { t } = useTranslation();
  const cities = useAdminQuery('/cities', z.array(cityRecordSchema));
  const mutation = useAdminMutation();
  return (
    <Modal
      title={t('admin.createBranch')}
      close={close}
      busy={mutation.isPending}
    >
      <QueryState
        pending={cities.isPending}
        error={cities.error}
        empty={!cities.data?.length}
        retry={cities.refetch}
      />
      {!cities.data?.length && <p>{t('admin.cityMappingHint')}</p>}
      {!!cities.data?.length && (
        <AdminForm
          schema={branchCreateSchema}
          values={{ name: '', address: '', cityId: '' }}
          fields={[
            { key: 'name', label: t('admin.name') },
            { key: 'address', label: t('admin.address') },
            {
              key: 'cityId',
              label: t('admin.city'),
              options: cities.data.map((x) => ({
                value: x.id,
                label: `${x.name} (${x.code})`,
              })),
            },
          ]}
          busy={mutation.isPending}
          error={mutation.error}
          submit={async (body) => {
            try {
              await mutation.mutateAsync({ path: '/admin/branches', body });
              close();
            } catch {
              /* inline */
            }
          }}
        />
      )}
    </Modal>
  );
}
function BranchDetails({
  id,
  close,
  assignments,
}: {
  id: string;
  close: () => void;
  assignments: boolean;
}) {
  const { t } = useTranslation();
  const query = useAdminQuery(`/branches/${id}`, branchDetailSchema);
  const cities = useAdminQuery('/cities', z.array(cityRecordSchema));
  const mutation = useAdminMutation();
  const [tab, setTab] = useState(assignments ? 'lead' : 'details');
  const branch = query.data?.branch;
  return (
    <Modal
      title={t('admin.branchDetails')}
      close={close}
      busy={mutation.isPending}
    >
      <QueryState
        pending={query.isPending}
        error={query.error}
        retry={query.refetch}
      />
      {branch && (
        <>
          <p>
            {branch.code} · {t(`admin.statuses.${branch.status}`)} ·{' '}
            {branch.currentLead?.leadName ?? t('admin.unassigned')}
          </p>
          <div className="admin-tabs">
            {['details', 'status', 'lead', 'history'].map((x) => (
              <button
                key={x}
                className={tab === x ? 'layout-primary' : 'layout-secondary'}
                onClick={() => {
                  setTab(x);
                  mutation.reset();
                }}
              >
                {t(`admin.${x}`)}
              </button>
            ))}
          </div>
          {tab === 'details' && (
            <AdminForm
              key={`edit:${branch.version}`}
              schema={branchUpdateSchema}
              values={{
                name: branch.name,
                address: branch.address ?? '',
                cityId: branch.cityId,
                version: branch.version,
              }}
              fields={[
                { key: 'name', label: t('admin.name') },
                { key: 'address', label: t('admin.address') },
                {
                  key: 'cityId',
                  label: t('admin.city'),
                  options: (cities.data ?? []).map((x) => ({
                    value: x.id,
                    label: x.name,
                  })),
                },
              ]}
              busy={mutation.isPending}
              error={mutation.error}
              submit={async (body) => {
                try {
                  await mutation.mutateAsync({
                    path: `/admin/branches/${id}/update`,
                    body,
                  });
                  close();
                } catch {
                  /* inline */
                }
              }}
            />
          )}
          {tab === 'status' && <BranchStatus branch={branch} close={close} />}
          {tab === 'lead' && <LeadForm branch={branch} close={close} />}
          {tab === 'history' && (
            <>
              <h3>{t('admin.assignmentHistory')}</h3>
              <ul className="admin-history">
                {query.data!.assignments.map((x) => (
                  <li key={x.id}>
                    {x.leadName}
                    <small>
                      {x.startedAt} — {x.endedAt ?? t('admin.current')}
                    </small>
                  </li>
                ))}
              </ul>
              <h3>{t('admin.history')}</h3>
              <AuditTable items={query.data!.history} />
            </>
          )}
        </>
      )}
    </Modal>
  );
}
function BranchStatus({
  branch,
  close,
}: {
  branch: BranchRecord;
  close: () => void;
}) {
  const { t } = useTranslation();
  const mutation = useAdminMutation();
  const allowed = {
    FORMING: ['ACTIVE', 'CLOSED'],
    ACTIVE: ['PAUSED', 'CLOSED'],
    PAUSED: ['ACTIVE', 'CLOSED'],
    CLOSED: [],
  } as const;
  return (
    <>
      <p>{t('admin.statusWarning')}</p>
      {allowed[branch.status].length ? (
        <AdminForm
          schema={branchTransitionSchema}
          values={{
            version: branch.version,
            status: allowed[branch.status][0],
          }}
          fields={[
            {
              key: 'status',
              label: t('admin.status'),
              options: allowed[branch.status].map((value) => ({
                value,
                label: t(`admin.statuses.${value}`),
              })),
            },
          ]}
          busy={mutation.isPending}
          error={mutation.error}
          confirm
          submit={async (body) => {
            try {
              await mutation.mutateAsync({
                path: `/admin/branches/${branch.id}/status`,
                body,
              });
              close();
            } catch {
              /* inline */
            }
          }}
        />
      ) : (
        <p>{t('admin.closedTerminal')}</p>
      )}
    </>
  );
}
function LeadForm({
  branch,
  close,
}: {
  branch: BranchRecord;
  close: () => void;
}) {
  const { t } = useTranslation();
  const mutation = useAdminMutation();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const candidates = useAdminQuery(
    `/staff?${new URLSearchParams({ role: 'BRANCH_LEAD', status: 'ACTIVE', search, page: String(page) })}`,
    adminPageSchema(staffRecordSchema),
  );
  return (
    <>
      <p>{t('admin.leadWarning')}</p>
      <label className="admin-status-filter">
        {t('admin.searchCandidates')}
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </label>
      <QueryState
        pending={candidates.isPending}
        error={candidates.error}
        empty={!candidates.data?.items.filter((x) => !x.branch).length}
        retry={candidates.refetch}
      />
      {candidates.data && (
        <>
          <AdminForm
            key={`${branch.version}:${search}:${page}`}
            schema={leadAssignSchema}
            values={{
              version: branch.version,
              leadId: '',
              expectedAssignmentId: branch.currentLead?.id ?? null,
            }}
            fields={[
              {
                key: 'leadId',
                label: t('admin.lead'),
                options: candidates.data.items
                  .filter((x) => !x.branch)
                  .map((x) => ({
                    value: x.id,
                    label: `${x.displayName} (${x.email})`,
                  })),
              },
            ]}
            busy={mutation.isPending}
            error={mutation.error}
            confirm
            submit={async (body) => {
              try {
                await mutation.mutateAsync({
                  path: `/admin/branches/${branch.id}/lead`,
                  body,
                });
                close();
              } catch {
                /* inline */
              }
            }}
          />
          <Pager page={page} total={candidates.data.total} setPage={setPage} />
        </>
      )}
    </>
  );
}
export function AdminAuditPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [branchId, setBranchId] = useState('');
  const [actorId, setActorId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const validIds =
    (!branchId || z.uuid().safeParse(branchId).success) &&
    (!actorId || z.uuid().safeParse(actorId).success);
  const query = useAdminQuery(
    `/audit?${new URLSearchParams({ page: String(page), search, ...(domain ? { domain } : {}), ...(branchId ? { branchId } : {}), ...(actorId ? { actorId } : {}), ...(from ? { from: new Date(from).toISOString() } : {}), ...(to ? { to: new Date(to).toISOString() } : {}) })}`,
    adminPageSchema(auditRecordSchema),
    validIds,
  );
  const detail = useAdminQuery(
    `/audit/${selected}`,
    auditRecordSchema,
    !!selected,
  );
  return (
    <div className="admin-module">
      <AdminFeedback />
      <PageHeader
        title={t('layout.nav.audit')}
        description={t('admin.auditReadOnly')}
      />
      <SearchFilters
        search={search}
        setSearch={(x) => {
          setSearch(x);
          setPage(1);
        }}
        filter={domain}
        setFilter={(x) => {
          setDomain(x);
          setPage(1);
        }}
        options={[
          'auth',
          'users',
          'branches',
          'applications',
          'members',
          'collections',
          'reports',
          'dashboard',
          'content',
          'audit',
        ].map((value) => ({ value, label: t(`admin.domains.${value}`) }))}
      />
      <div className="admin-filters">
        {[
          { key: 'branchId', value: branchId, set: setBranchId },
          { key: 'actorId', value: actorId, set: setActorId },
        ].map((x) => (
          <label key={x.key}>
            {t(`admin.${x.key}`)}
            <input
              value={x.value}
              onChange={(e) => {
                x.set(e.target.value);
                setPage(1);
              }}
            />
          </label>
        ))}
        <label>
          {t('admin.from')}
          <input
            type="datetime-local"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          {t('admin.to')}
          <input
            type="datetime-local"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </label>
      </div>
      {!validIds ? (
        <p role="alert">{t('admin.invalidField')}</p>
      ) : (
        <>
          <QueryState
            pending={query.isPending}
            error={query.error}
            empty={!query.data?.items.length}
            retry={query.refetch}
          />
          {query.data && (
            <>
              <AuditTable items={query.data.items} select={setSelected} />
              <Pager page={page} total={query.data.total} setPage={setPage} />
            </>
          )}
        </>
      )}
      {selected && (
        <Modal title={t('admin.auditDetails')} close={() => setSelected(null)}>
          <QueryState
            pending={detail.isPending}
            error={detail.error}
            retry={detail.refetch}
          />
          {detail.data && (
            <>
              <dl className="admin-detail">
                {['createdAt', 'actor', 'action', 'entityType', 'entityId'].map(
                  (x) => (
                    <div key={x}>
                      <dt>{t(`admin.${x}`)}</dt>
                      <dd>{String(detail.data![x as keyof AuditRecord])}</dd>
                    </div>
                  ),
                )}
              </dl>
              {(['before', 'after', 'metadata'] as const).map((x) => (
                <section key={x}>
                  <h3>{t(`admin.${x}`)}</h3>
                  <pre>{JSON.stringify(detail.data![x], null, 2)}</pre>
                </section>
              ))}
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
