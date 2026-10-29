import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { AuthUser } from '@shiplens/contracts';
import { useAuth } from '../../features/auth';
import {
  FoundationBrand,
  LanguageSwitcher,
  MobileNavigation,
} from '../../components/shared/layout-controls';
import { navigationPath, roleMenus, roleRoots } from './role-navigation';
import '../../styles/layouts.css';

export function RoleNavigation({
  user,
  onNavigate,
  collapsed = false,
}: {
  user: AuthUser;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const { t } = useTranslation();
  const glyphs = ['◫', '▤', '▥', '♧', '◷', '◇', '☷'];
  return (
    <nav className="staff-role-nav" aria-label={t('layout.staffNavigation')}>
      {roleMenus[user.role].map((key, index) => (
        <NavLink
          key={key}
          end
          to={navigationPath(user.role, key)}
          onClick={onNavigate}
          title={collapsed ? t(`layout.nav.${key}`) : undefined}
          aria-label={t(`layout.nav.${key}`)}
        >
          <span className="nav-glyph" aria-hidden="true">
            {glyphs[index]}
          </span>
          <span className="nav-label">{t(`layout.nav.${key}`)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
export function StaffSidebar({
  user,
  collapsed = false,
  onNavigate,
}: {
  user: AuthUser;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="staff-sidebar-content">
      <FoundationBrand light compact={collapsed} />
      <RoleNavigation
        user={user}
        collapsed={collapsed}
        onNavigate={onNavigate}
      />
      <div className="staff-sidebar-bottom">
        <Link
          to="/staff/security"
          onClick={onNavigate}
          aria-label={t('auth.accountSecurity')}
          title={t('auth.accountSecurity')}
        >
          <span aria-hidden="true">⚙</span>
          <span className="nav-label">{t('auth.accountSecurity')}</span>
        </Link>
        <Link
          to="/staff/logout"
          onClick={onNavigate}
          aria-label={t('auth.signOut')}
          title={t('auth.signOut')}
        >
          <span aria-hidden="true">↪</span>
          <span className="nav-label">{t('auth.signOut')}</span>
        </Link>
        <small>{collapsed ? 'HWF' : t('layout.staffWorkspace')}</small>
      </div>
    </div>
  );
}
export function StaffProfileMenu({ user }: { user: AuthUser }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', keyboard);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', keyboard);
    };
  }, [open]);
  const initials = user.displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => [...word][0])
    .join('')
    .toUpperCase();
  return (
    <div className="staff-profile" ref={wrapper}>
      <button
        ref={trigger}
        className="staff-profile-trigger"
        aria-label={t('layout.profileMenu')}
        aria-expanded={open}
        aria-controls="staff-profile-popover"
        onClick={() => setOpen(!open)}
      >
        <span className="staff-identity">
          <strong>{user.displayName}</strong>
          <small>{t(`auth.roles.${user.role}`)}</small>
        </span>
        <span className="staff-avatar" dir="auto">
          {initials}
        </span>
      </button>
      {open && (
        <div className="staff-profile-popover" id="staff-profile-popover">
          <strong>{user.displayName}</strong>
          <p>{t(`auth.roles.${user.role}`)}</p>
          <Link to="/staff/account">{t('layout.myAccount')}</Link>
          <Link to="/staff/security">{t('auth.changePassword')}</Link>
          <Link className="profile-signout" to="/staff/logout">
            {t('auth.signOut')}
          </Link>
        </div>
      )}
    </div>
  );
}
export function StaffHeader({
  user,
  toggle,
  collapsed,
  drawerOpen,
}: {
  user: AuthUser;
  toggle: () => void;
  collapsed: boolean;
  drawerOpen: boolean;
}) {
  const { t } = useTranslation();
  return (
    <header className="staff-header">
      <button
        className="staff-toggle"
        onClick={toggle}
        aria-label={t('layout.toggleSidebar')}
        aria-expanded={drawerOpen || !collapsed}
        aria-controls="staff-sidebar"
      >
        <span aria-hidden="true">☰</span>
      </button>
      <div className="staff-header-title">
        {t(`layout.workspaces.${user.role}`)}
      </div>
      <LanguageSwitcher />
      <StaffProfileMenu user={user} />
    </header>
  );
}
export function StaffLayout() {
  const { session } = useAuth();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return sessionStorage.getItem('hwf.sidebar') === 'collapsed';
    } catch {
      return false;
    }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    try {
      sessionStorage.setItem(
        'hwf.sidebar',
        collapsed ? 'collapsed' : 'expanded',
      );
    } catch {
      /* Optional non-secret navigation preference. */
    }
  }, [collapsed]);
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    const resize = () => {
      if (innerWidth > 900) setDrawerOpen(false);
    };
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  if (!session.data) return null; // The parent ProtectedRoute owns session loading and denial.
  const user = session.data.user;
  const toggle = () => {
    if (matchMedia('(max-width: 900px)').matches) setDrawerOpen(!drawerOpen);
    else setCollapsed(!collapsed);
  };
  return (
    <div
      className={`hwf-layout staff-layout ${collapsed ? 'sidebar-collapsed' : ''}`}
    >
      <a className="skip-link" href="#staff-main">
        {t('skip')}
      </a>
      <aside
        className="staff-sidebar"
        id="staff-sidebar"
        aria-label={t('layout.staffNavigation')}
      >
        <StaffSidebar user={user} collapsed={collapsed} />
      </aside>
      <MobileNavigation
        open={drawerOpen}
        close={() => setDrawerOpen(false)}
        title={t('layout.staffNavigation')}
      >
        <StaffSidebar user={user} onNavigate={() => setDrawerOpen(false)} />
      </MobileNavigation>
      <div className="staff-main-offset">
        <StaffHeader
          user={user}
          toggle={toggle}
          collapsed={collapsed}
          drawerOpen={drawerOpen}
        />
        <main className="staff-content" id="staff-main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
export function StaffWorkspaceRedirect() {
  const { session } = useAuth();
  return session.data ? (
    <Navigate replace to={roleRoots[session.data.user.role]} />
  ) : null;
}
