import * as React from 'react';
import { NavLink, Outlet, useLocation, useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { useCompanySettings } from '@/features/company/hooks/use-org-queries';
import { NotificationPanel } from '@/components/notifications/notification-panel';
import { 
  Home, 
  CalendarDays, 
  Clock, 
  User,
  Menu,
  X,
  LogOut,
  Briefcase,
  FileText,
  Target,
  Laptop,
  Timer,
  Wallet,
  CreditCard,
  Headset
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MobileAppShell() {
  const { user, logout } = useAuthStore();
  const { data: companySettings } = useCompanySettings();
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  // Close drawer on route change
  React.useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  // Primary bottom navigation links
  const primaryNav = [
    { label: 'Home', icon: Home, path: `/t/${slug}/me` },
    { label: 'Attendance', icon: Clock, path: `/t/${slug}/me/attendance` },
    { label: 'Leave', icon: CalendarDays, path: `/t/${slug}/me/leave` },
    { label: 'Profile', icon: User, path: `/t/${slug}/me/profile` },
  ];

  // Secondary drawer links
  const secondaryNav = [
    { label: 'My Shifts', icon: Briefcase, path: `/t/${slug}/me/shifts` },
    { label: 'My Timesheets', icon: Timer, path: `/t/${slug}/me/timesheets` },
    { label: 'Company Policies', icon: FileText, path: `/t/${slug}/my-policies` },
    { label: 'My Payslips', icon: CreditCard, path: `/t/${slug}/me/payslips` },
    { label: 'Compensation', icon: Wallet, path: `/t/${slug}/me/compensation` },
    { label: 'My Assets', icon: Laptop, path: `/t/${slug}/me/assets` },
    { label: 'Helpdesk', icon: Headset, path: `/t/${slug}/me/helpdesk` },
    { label: 'Performance', icon: Target, path: `/t/${slug}/me/performance/goals` },
  ];

  const handleLogout = () => {
    setIsDrawerOpen(false);
    logout();
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-background overflow-hidden relative">
      
      {/* Top App Bar */}
      <header className="flex-shrink-0 h-14 flex items-center justify-between px-4 border-b bg-card z-30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden -ml-2" onClick={() => setIsDrawerOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <img src="/icon.png" alt="Logo" className="h-7 w-auto object-contain rounded" />
            <span className="font-semibold text-sm truncate max-w-[150px]">
              {companySettings?.companyName || 'KaaryaMitra'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center">
          <NotificationPanel />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-muted/20 pb-16">
        <div className="p-4">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t z-30 pb-safe">
        <div className="flex items-center justify-around h-full">
          {primaryNav.map((item) => {
            // Check if active (handle exact match for Home vs prefix for others)
            const isActive = item.label === 'Home' 
              ? location.pathname === item.path || location.pathname === `/t/${slug}/dashboard`
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.label}
                to={item.path}
                className="flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-transform"
              >
                <item.icon className={`w-6 h-6 ${isActive ? 'text-primary fill-primary/10' : 'text-muted-foreground'}`} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Side Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Side Drawer */}
      <div 
        className={`fixed top-0 left-0 bottom-0 w-[280px] bg-card z-50 transform transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col shadow-2xl`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {user?.firstName?.[0] || 'U'}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{user?.firstName} {user?.lastName}</span>
              <span className="text-xs text-muted-foreground truncate max-w-[150px]">{user?.email}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsDrawerOpen(false)} className="-mr-2">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            {secondaryNav.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <item.icon className="w-5 h-5 opacity-70" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>
      
    </div>
  );
}
