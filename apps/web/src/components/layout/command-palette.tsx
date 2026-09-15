import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { Search, User, FileText, Settings, Users, Building2 } from 'lucide-react';
import { useCommandStore } from '@/store/command.store';
import { useAuthStore } from '@/store/auth.store';
import { useEmployees } from '@/features/company/hooks/use-employee-queries';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { navItems, adminNavItems, essNavItems, NavItem, ADMIN_ROLES } from './app-shell';

export function CommandPalette() {
  const navigate = useNavigate();
  const { isOpen, setOpen, toggle } = useCommandStore();
  const { user } = useAuthStore();
  
  const userRoles = user?.roles ?? [];
  const hasDirectoryAccess = userRoles.includes('Company Admin') || userRoles.includes('HR Manager');

  // Only fetch employees if user has access
  const { data: employees } = useEmployees({ enabled: hasDirectoryAccess });

  // Listen for Ctrl+K or Cmd+K
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((key === 'k' || key === '/') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }
    };

    document.addEventListener('keydown', down, true); // Use capture phase
    return () => document.removeEventListener('keydown', down, true);
  }, [toggle]);

  const slug = user?.tenantSlug;

  const availableNavItems = React.useMemo(() => {
    let baseItems = navItems;
    if (user?.isSuperAdmin) baseItems = adminNavItems;
    else {
      const hasNoRoles = userRoles.length === 0;
      baseItems = navItems.filter((item) => {
        if (!item.allowedRoles) return true;
        if (hasNoRoles) return true;
        return item.allowedRoles.some((r) => userRoles.includes(r));
      });
    }

    // Add hidden search items (settings sub-pages)
    const hiddenSearchItems: NavItem[] = [
      { icon: FileText, label: 'Document Settings', path: 'settings/documents', allowedRoles: ADMIN_ROLES },
      { icon: Settings, label: 'Leave Settings', path: 'settings/leave', allowedRoles: ADMIN_ROLES },
      { icon: Settings, label: 'Shifts Settings', path: 'settings/shifts', allowedRoles: ADMIN_ROLES },
      { icon: Settings, label: 'Holiday Calendar', path: 'settings/holidays', allowedRoles: ADMIN_ROLES },
      { icon: Settings, label: 'Checklist Templates', path: 'settings/checklists', allowedRoles: ADMIN_ROLES },
      { icon: Settings, label: 'Helpdesk Settings', path: 'settings/helpdesk', allowedRoles: ADMIN_ROLES },
      { icon: Settings, label: 'Asset Settings', path: 'settings/assets', allowedRoles: ADMIN_ROLES },
      { icon: Settings, label: 'Salary Settings', path: 'settings/salary', allowedRoles: ADMIN_ROLES },
      { icon: Settings, label: 'Finance Config', path: 'settings/finance', allowedRoles: ADMIN_ROLES },
      { icon: Settings, label: 'Developer Hub', path: 'settings/developer', allowedRoles: ADMIN_ROLES },
    ].filter(item => {
      if (user?.isSuperAdmin) return false;
      if (!item.allowedRoles) return true;
      return item.allowedRoles.some(r => userRoles.includes(r));
    });

    return [...baseItems, ...hiddenSearchItems];
  }, [user?.isSuperAdmin, userRoles]);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    setTimeout(command, 50); // delay navigation slightly to allow modal to unmount safely
  }, [setOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl max-w-2xl sm:rounded-xl">
        <DialogTitle className="sr-only">Global Search</DialogTitle>
        <Command className="flex h-full w-full flex-col overflow-hidden bg-popover text-popover-foreground">
          <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search pages, settings, and employees..."
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2 custom-scrollbar">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Pages" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              {availableNavItems.map((item) => {
                const to = item.path.startsWith('/')
                  ? item.path
                  : slug
                  ? `/t/${slug}/${item.path}`
                  : item.path;

                return (
                  <Command.Item
                    key={item.path}
                    value={item.label}
                    onSelect={() => runCommand(() => navigate(to))}
                    onClick={() => runCommand(() => navigate(to))}
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm text-foreground outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                  </Command.Item>
                );
              })}
            </Command.Group>

            <Command.Group heading="My Apps (ESS)" className="px-2 py-1.5 text-xs font-medium text-muted-foreground mt-2">
              {essNavItems.map((item) => {
                const to = item.path.startsWith('/')
                  ? item.path
                  : slug
                  ? `/t/${slug}/${item.path}`
                  : item.path;

                return (
                  <Command.Item
                    key={item.path}
                    value={item.label}
                    onSelect={() => runCommand(() => navigate(to))}
                    onClick={() => runCommand(() => navigate(to))}
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm text-foreground outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                  </Command.Item>
                );
              })}
            </Command.Group>

            {employees && employees.length > 0 && (
              <Command.Group heading="Employees" className="px-2 py-1.5 text-xs font-medium text-muted-foreground mt-2">
                {employees.map((emp: any) => (
                  <Command.Item
                    key={emp.id}
                    value={`${emp.firstName} ${emp.lastName} ${emp.employeeCode}`}
                    onSelect={() => runCommand(() => navigate(`/t/${slug}/directory/${emp.id}`))}
                    onClick={() => runCommand(() => navigate(`/t/${slug}/directory/${emp.id}`))}
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm text-foreground outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    <div className="flex h-6 w-6 mr-2 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {emp.firstName?.[0]}{emp.lastName?.[0]}
                    </div>
                    <div className="flex flex-col">
                      <span>{emp.firstName} {emp.lastName}</span>
                      <span className="text-[10px] text-muted-foreground">{emp.employeeCode}</span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
