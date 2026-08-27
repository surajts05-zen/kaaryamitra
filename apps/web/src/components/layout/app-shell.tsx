import * as React from 'react';
import { NavLink, Outlet, useLocation, useParams } from 'react-router-dom';
import { useTheme } from '@/components/theme-provider';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Clock,
  Settings,
  Menu,
  Sun,
  Moon,
  LogOut,
  Search,
  Building2,
  MapPin,
  Briefcase,
  GitBranch,
  Inbox,
  Shield,
  CalendarDays,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { NotificationPanel } from '@/components/notifications/notification-panel';
import { useNotificationStore } from '@/store/notification.store';

// ─── Role constants ────────────────────────────────────────────────────────────
const ADMIN_ROLES = ['Company Admin'];
const HR_ROLES = ['Company Admin', 'HR Manager'];
const APPROVER_ROLES = ['Company Admin', 'HR Manager', 'Manager'];

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  /** If omitted, item is visible to ALL authenticated tenant users */
  allowedRoles?: string[];
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: 'dashboard' },

  // ESS – visible to everyone
  { icon: CalendarDays, label: 'My Leaves', path: 'me/leave' },

  // HR / Admin
  { icon: Users,     label: 'Directory',     path: 'directory',         allowedRoles: HR_ROLES },
  { icon: Building2, label: 'Departments',   path: 'departments',       allowedRoles: HR_ROLES },
  { icon: MapPin,    label: 'Locations',     path: 'locations',         allowedRoles: HR_ROLES },
  { icon: Briefcase, label: 'Designations',  path: 'designations',      allowedRoles: HR_ROLES },

  // Approvers
  { icon: Inbox,     label: 'Approvals Inbox', path: 'approvals',       allowedRoles: APPROVER_ROLES },

  // Admin-only configuration
  { icon: Calendar,  label: 'Leave Settings',  path: 'settings/leave',  allowedRoles: HR_ROLES },
  { icon: GitBranch, label: 'Workflows',        path: 'settings/workflows', allowedRoles: ADMIN_ROLES },
  { icon: Shield,    label: 'Roles & Permissions', path: 'settings/roles', allowedRoles: ADMIN_ROLES },

  // General
  { icon: Clock,     label: 'My Attendance',    path: 'me/attendance' },
  { icon: Settings,  label: 'Settings',      path: 'settings',          allowedRoles: ADMIN_ROLES },
];

const adminNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Platform Dashboard', path: '/admin' },
  { icon: Building2,       label: 'Workspaces',         path: '/admin/tenants' },
  { icon: Settings,        label: 'Platform Config',    path: '/admin/settings' },
];

export function AppShell() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const { slug: pathSlug } = useParams();
  const { user, logout } = useAuthStore();
  const startPolling = useNotificationStore((s) => s.startPolling);
  
  const slug = pathSlug || user?.tenantSlug;
  const userRoles = user?.roles ?? [];

  // For super-admins use the platform nav
  // For tenant users, filter by allowedRoles — if a user has no roles assigned yet
  // (e.g. a brand-new Tenant Admin), show everything so they're never locked out.
  const currentNavItems = React.useMemo(() => {
    if (user?.isSuperAdmin) return adminNavItems;

    const hasNoRoles = userRoles.length === 0;

    return navItems.filter((item) => {
      if (!item.allowedRoles) return true; // visible to all
      if (hasNoRoles) return true;         // no roles assigned yet → show everything
      return item.allowedRoles.some((r) => userRoles.includes(r));
    });
  }, [user?.isSuperAdmin, userRoles]);

  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : 'U';
  const tenantName = user?.isSuperAdmin ? 'Platform Admin' : 'Workspace';

  // Close mobile menu on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Start notification polling when shell mounts (user is authenticated)
  React.useEffect(() => {
    if (!user) return;
    const stop = startPolling();
    return stop;
  }, [user?.id, startPolling]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <img src="/icon.png" alt="KaaryaMitra Logo" className="h-8 w-8 object-contain rounded-lg" />
            <span className="text-lg font-bold tracking-tight">KaaryaMitra</span>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-4 rounded-xl bg-sidebar-accent p-3">
            <p className="text-xs text-sidebar-foreground/60 uppercase font-semibold mb-1">
              {user?.isSuperAdmin ? 'System' : 'Workspace'}
            </p>
            <p className="font-medium text-sm truncate">{tenantName}</p>
          </div>

          <nav className="space-y-1">
            {currentNavItems.map((item) => {
              const to = item.path.startsWith('/')
                ? item.path
                : slug
                ? `/t/${slug}/${item.path}`
                : item.path;

              return (
                <NavLink
                  key={item.path}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-km-lime/10 text-km-lime'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={() => logout()}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Global Search Trigger */}
            <Button
              variant="outline"
              className="hidden w-64 justify-start text-muted-foreground md:flex"
            >
              <Search className="mr-2 h-4 w-4" />
              <span>Search everywhere...</span>
              <kbd className="pointer-events-none ml-auto inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>

            <NotificationPanel />

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary" title={user?.email}>
              {initials}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          <div className="mx-auto max-w-6xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
