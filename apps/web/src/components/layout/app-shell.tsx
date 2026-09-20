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
  FolderGit2,
  Inbox,
  Shield,
  CalendarDays,
  CalendarClock,
  Timer,
  FileText,
  UserMinus,
  Headset,
  Laptop,
  Target,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Wallet,
  Coins,
  Landmark,
  CreditCard,
  Banknote,
  ShieldAlert,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { useCompanySettings } from '@/features/company/hooks/use-org-queries';
import { NotificationPanel } from '@/components/notifications/notification-panel';
import { useNotificationStore } from '@/store/notification.store';
import { AiChatWidget } from '@/features/ai/components/ai-chat-widget';

// ─── Role constants ────────────────────────────────────────────────────────────
export const ADMIN_ROLES = ['Company Admin'];
export const HR_ROLES = ['Company Admin', 'HR Manager'];
export const APPROVER_ROLES = ['Company Admin', 'HR Manager', 'Manager'];
export const FINANCE_ROLES = ['Company Admin', 'HR Manager', 'Project Manager', 'Finance Manager'];

export interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  /** If omitted, item is visible to ALL authenticated tenant users */
  allowedRoles?: string[];
  group?: string;
}

export const navItems: NavItem[] = [
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
  { icon: FolderGit2,    label: 'Projects',      path: 'projects',          allowedRoles: FINANCE_ROLES, group: 'Management' },
  { icon: CalendarDays,  label: 'Meetings',      path: 'meetings',          group: 'Management' },
  { icon: Landmark,      label: 'Budgets',       path: 'budgets',           allowedRoles: FINANCE_ROLES, group: 'Management' },

  { icon: LayoutDashboard, label: 'Reports', path: 'reports', allowedRoles: HR_ROLES, group: 'Data & Analytics' },

  { icon: FileText,      label: 'Content Library', path: 'library', allowedRoles: ADMIN_ROLES, group: 'Settings' },
  { icon: GitBranch, label: 'Workflows',        path: 'settings/workflows', allowedRoles: ADMIN_ROLES, group: 'Settings' },
  { icon: FileText,  label: 'Policies & Content', path: 'settings/policies', allowedRoles: ADMIN_ROLES, group: 'Settings' },
  { icon: Shield,    label: 'Roles & Permissions', path: 'settings/roles', allowedRoles: ADMIN_ROLES, group: 'Settings' },
  { icon: CreditCard,label: 'Billing & Plans', path: 'settings/billing', allowedRoles: ADMIN_ROLES, group: 'Settings' },
  { icon: Settings,  label: 'Settings',      path: 'settings',          allowedRoles: ADMIN_ROLES, group: 'Settings' },
  
  // Help & Resources
  { icon: BookOpen,  label: 'User Guide',    path: 'user-guide',        group: 'Help & Resources' },
];

export const adminNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Platform Dashboard', path: '/admin' },
  { icon: Building2,       label: 'Workspaces',         path: '/admin/tenants', group: 'Platform' },
  { icon: CreditCard,      label: 'Billing Overview',   path: '/admin/billing', group: 'Platform Billing' },
  { icon: FileText,        label: 'Plans & Add-ons',    path: '/admin/billing/plans', group: 'Platform Billing' },
  { icon: Wallet,          label: 'Razorpay Settings',  path: '/admin/billing/settings', group: 'Platform Billing' },
  { icon: Settings,        label: 'Platform Config',    path: '/admin/settings', group: 'Platform' },
];

export const essNavItems: NavItem[] = [
  { icon: FileText, label: 'Company Policies', path: 'my-policies' },
  { icon: Clock, label: 'My Attendance', path: 'me/attendance' },
  { icon: CalendarDays, label: 'My Leaves', path: 'me/leave' },
  { icon: CalendarClock, label: 'My Shifts', path: 'me/shifts' },
  { icon: Timer, label: 'My Timesheets', path: 'me/timesheets' },
  { icon: Laptop, label: 'My Assets', path: 'me/assets' },
  { icon: Wallet, label: 'My Compensation', path: 'me/compensation' },
  { icon: CreditCard, label: 'My Payslips', path: 'me/payslips' },
  { icon: Headset, label: 'My Helpdesk', path: 'me/helpdesk' },
  { icon: Target, label: 'My Goals', path: 'me/performance/goals' },
  { icon: Target, label: 'My Reviews', path: 'me/performance/reviews' },
];

import { CommandPalette } from '@/components/layout/command-palette';
import { useCommandStore } from '@/store/command.store';

export function AppShell() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);
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
  const { data: companySettings } = useCompanySettings();
  
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
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // Close user menu on click-outside
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

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
    <div className="flex h-full w-full bg-background overflow-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 h-full flex flex-col shrink-0 transform border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center px-5 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/icon.png" alt="Logo" className="h-9 w-auto object-contain rounded-md shrink-0 shadow-sm" />
            <div className="flex flex-col min-w-0">
              <span className="text-base font-bold tracking-tight leading-snug truncate text-sidebar-foreground">
                {companySettings?.companyName || 'KaaryaMitra'}
              </span>
              <span className="text-[10px] text-sidebar-foreground/60 font-medium tracking-wider uppercase truncate">
                {companySettings?.companyName ? 'KaaryaMitra HRMS' : 'Workspace'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <nav className="space-y-4 pb-6">
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
              onClick={() => useCommandStore.getState().setOpen(true)}
            >
              <Search className="mr-2 h-4 w-4" />
              <span>Search everywhere...</span>
              <kbd className="pointer-events-none ml-auto inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-[10px]">Ctrl</span>/
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

          {/* User Menu Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-accent transition-colors cursor-pointer"
              title={user?.email}
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {initials}
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown panel — toggled by click */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-xl border bg-card shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                {/* User info header */}
                <div className="px-4 py-3 border-b">
                  <p className="text-sm font-semibold truncate">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>

                <div className="p-1">
                  <NavLink
                    to={slug ? `/t/${slug}/me/profile` : '#'}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    My Profile
                  </NavLink>
                </div>

                <div className="border-t p-1">
                  <button
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    onClick={() => { setIsUserMenuOpen(false); logout(); }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-muted/30 flex flex-col">
          <div className="mx-auto max-w-7xl w-full flex-1 flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>

      <AiChatWidget />
      <CommandPalette />
    </div>
  );
}
