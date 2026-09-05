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
  CalendarClock,
  Timer,
  FileText,
  UserMinus,
  DoorOpen,
  Headset,
  Laptop,
  Target,
  ChevronDown,
  ChevronRight,
  BookOpen,
  IndianRupee,
  Banknote,
  Receipt,
  ShieldAlert
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { NotificationPanel } from '@/components/notifications/notification-panel';
import { useNotificationStore } from '@/store/notification.store';
import { AiChatWidget } from '@/features/ai/components/ai-chat-widget';

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
  group?: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: 'dashboard' },
  { icon: Inbox,     label: 'Approvals Inbox', path: 'approvals',       allowedRoles: APPROVER_ROLES },


  // HR / Admin
  { icon: Users,     label: 'Emp Directory',     path: 'directory',         allowedRoles: HR_ROLES, group: 'Organization' },
  { icon: Building2, label: 'Departments',   path: 'departments',       allowedRoles: HR_ROLES, group: 'Organization' },
  { icon: MapPin,    label: 'Locations',     path: 'locations',         allowedRoles: HR_ROLES, group: 'Organization' },
  { icon: Briefcase, label: 'Designations',  path: 'designations',      allowedRoles: HR_ROLES, group: 'Organization' },
  
  { icon: Banknote,  label: 'Payroll',       path: 'payroll',           allowedRoles: HR_ROLES, group: 'Management' },
  { icon: Laptop,        label: 'Assets',        path: 'assets',            allowedRoles: HR_ROLES, group: 'Management' },
  { icon: UserMinus, label: 'Resignations',  path: 'resignations',      allowedRoles: HR_ROLES, group: 'Management' },
  { icon: Headset,       label: 'Helpdesk',      path: 'helpdesk',          allowedRoles: HR_ROLES, group: 'Management' },
  { icon: Target,        label: 'Goals',         path: 'performance/goals', allowedRoles: HR_ROLES, group: 'Management' },
  { icon: Target,        label: 'Review Cycles', path: 'performance/reviews', allowedRoles: HR_ROLES, group: 'Management' },

  { icon: LayoutDashboard, label: 'Reports', path: 'reports', allowedRoles: HR_ROLES, group: 'Data & Analytics' },

  { icon: FileText,      label: 'Content Library', path: 'library', allowedRoles: ADMIN_ROLES, group: 'Settings' },
  { icon: GitBranch, label: 'Workflows',        path: 'settings/workflows', allowedRoles: ADMIN_ROLES, group: 'Settings' },
  { icon: FileText,  label: 'Policies & Content', path: 'settings/policies', allowedRoles: ADMIN_ROLES, group: 'Settings' },
  { icon: Shield,    label: 'Roles & Permissions', path: 'settings/roles', allowedRoles: ADMIN_ROLES, group: 'Settings' },
  { icon: IndianRupee, label: 'Salary Components', path: 'settings/salary-components', allowedRoles: ADMIN_ROLES, group: 'Settings' },
  { icon: IndianRupee, label: 'Salary Structures', path: 'settings/salary-structures', allowedRoles: ADMIN_ROLES, group: 'Settings' },
  { icon: ShieldAlert, label: 'Statutory Compliances', path: 'settings/statutory', allowedRoles: ADMIN_ROLES, group: 'Settings' },
  { icon: Settings,  label: 'Settings',      path: 'settings',          allowedRoles: ADMIN_ROLES, group: 'Settings' },
  
  // Help & Resources
  { icon: BookOpen,  label: 'User Guide',    path: 'user-guide',        group: 'Help & Resources' },
];

const adminNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Platform Dashboard', path: '/admin' },
  { icon: Building2,       label: 'Workspaces',         path: '/admin/tenants', group: 'Platform' },
  { icon: Settings,        label: 'Platform Config',    path: '/admin/settings', group: 'Platform' },
];

export function AppShell() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({
    'My Workspace': true,
    'Organization': true,
    'Management': true,
    'Data & Analytics': true,
    'Settings': false,
    'Help & Resources': true,
  });
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

  // Close mobile menu on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Start notification polling when shell mounts (user is authenticated)
  React.useEffect(() => {
    if (!user) return;
    const stop = startPolling();

    // Stop polling immediately when the session expires
    const handleLogout = () => stop();
    window.addEventListener('auth:logout', handleLogout);

    return () => {
      stop();
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [user?.id, startPolling]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
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
        <div className="flex h-16 items-center px-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <img src="/icon.png" alt="KaaryaMitra Logo" className="h-10 w-auto object-contain rounded-md shrink-0 shadow-sm" />
            <span className="text-xl font-bold tracking-tight">KaaryaMitra</span>
          </div>
        </div>

        <div className="p-4">
          <nav className="space-y-4 overflow-y-auto pb-6 max-h-[calc(100vh-80px)] custom-scrollbar">
            {/* Direct items without group */}
            {currentNavItems.filter((item) => !item.group).map((item) => {
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

            {/* Grouped items */}
            {Object.entries(
              currentNavItems.filter((item) => item.group).reduce((acc, item) => {
                const group = item.group!;
                if (!acc[group]) acc[group] = [];
                acc[group].push(item);
                return acc;
              }, {} as Record<string, NavItem[]>)
            ).map(([group, items]) => {
              const isExpanded = expandedGroups[group] ?? false;

              return (
              <div key={group} className="space-y-1">
                <button
                  onClick={() => setExpandedGroups(prev => ({ ...prev, [group]: !(prev[group] ?? false) }))}
                  className="w-full flex items-center justify-between px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-1 mt-2 hover:text-sidebar-foreground transition-colors cursor-pointer"
                >
                  {group}
                  {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>
                {isExpanded && (
                  <div className="space-y-1">
                    {items.map((item) => {
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
                  </div>
                )}
              </div>
            )})}
          </nav>
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

          <div className="flex items-center gap-3">
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

            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              onClick={() => logout()}
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      <AiChatWidget />
    </div>
  );
}
