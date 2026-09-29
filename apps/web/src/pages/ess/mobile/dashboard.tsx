import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth.store';
import { CalendarDays, FileText, Clock, CalendarClock, Timer, Laptop, Wallet, CreditCard, Headset, Target, MapPin } from 'lucide-react';
import { MobileCheckInFlow } from '@/features/attendance/components/MobileCheckInFlow';
import { useDashboardStats } from '@/features/dashboard/hooks/use-dashboard-queries';
import { usePinnedAnnouncements } from '@/features/library/hooks/use-library-queries';
import { useCompanySettings } from '@/features/company/hooks/use-org-queries';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const QUICK_LINKS = [
  { title: 'Attendance', icon: Clock, href: 'attendance', color: 'bg-emerald-500/10 text-emerald-600' },
  { title: 'Shifts', icon: CalendarClock, href: 'shifts', color: 'bg-indigo-500/10 text-indigo-600' },
  { title: 'Leave', icon: CalendarDays, href: 'leave', color: 'bg-rose-500/10 text-rose-600' },
  { title: 'Policies', icon: FileText, href: '../my-policies', color: 'bg-purple-500/10 text-purple-600' },
  { title: 'Timesheets', icon: Timer, href: 'timesheets', color: 'bg-orange-500/10 text-orange-600' },
  { title: 'Assets', icon: Laptop, href: 'assets', color: 'bg-teal-500/10 text-teal-600' },
  { title: 'Payslips', icon: CreditCard, href: 'payslips', color: 'bg-blue-500/10 text-blue-600' },
  { title: 'Helpdesk', icon: Headset, href: 'helpdesk', color: 'bg-yellow-500/10 text-yellow-600' },
];

export function MobileEssDashboard() {
  const { user } = useAuthStore();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: announcements, isLoading: announcementsLoading } = usePinnedAnnouncements();
  const { data: companySettings } = useCompanySettings();

  const nextHoliday = stats?.upcomingHolidays?.[0];
  const currentDate = format(new Date(), 'EEEE, MMM do');

  return (
    <div className="flex flex-col space-y-4 pb-4">
      {/* HEADER SECTION */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-km-forest to-km-forest/80 text-white p-5 shadow-sm">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-32 w-32 rounded-full bg-km-lime/10 blur-3xl mix-blend-overlay"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-km-lime font-medium uppercase text-[10px] tracking-wider">{currentDate}</p>
          </div>
          <h2 className="text-xl font-bold mb-1">Hi, {user?.firstName} 👋</h2>
          <p className="text-white/80 text-xs">Ready for a great day ahead!</p>
        </div>
      </div>

      {/* FLOATING ACTION BUTTON FLOW */}
      <MobileCheckInFlow />

      {/* ANNOUNCEMENTS */}
      <section className="mt-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <span className="text-primary">📢</span> Announcements
          </h3>
        </div>
        
        {announcementsLoading ? (
          <div className="flex gap-3 overflow-hidden">
            {[1, 2].map(i => <div key={i} className="h-28 w-60 flex-shrink-0 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : !announcements || announcements.length === 0 ? (
          <Card className="p-4 text-center border-dashed bg-muted/30">
            <p className="text-xs text-muted-foreground">No announcements right now.</p>
          </Card>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory hide-scrollbar">
            {announcements.map((item) => (
              <Card
                key={item.id}
                className="flex-shrink-0 w-64 snap-start overflow-hidden border-muted/60"
              >
                <CardContent className="p-3 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-semibold line-clamp-1 flex-1">{item.title}</h4>
                    <span className="text-[9px] text-muted-foreground ml-2 shrink-0">
                      {format(new Date(item.createdAt), 'MMM d')}
                    </span>
                  </div>
                  <div
                    className="text-[11px] text-muted-foreground line-clamp-2 prose prose-xs"
                    dangerouslySetInnerHTML={{ __html: item.content || '' }}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* QUICK LINKS GRID */}
      <section className="mt-2">
        <h3 className="text-sm font-semibold mb-2">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_LINKS.map((link) => (
            <Link key={link.title} to={link.href} className="block active:scale-95 transition-transform">
              <Card className="h-full border-none bg-card hover:bg-accent/50 text-center py-3 px-1 shadow-sm flex flex-col items-center justify-center">
                <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${link.color}`}>
                  <link.icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-medium text-foreground leading-tight px-0.5">{link.title}</span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* UPCOMING HOLIDAY */}
      <section className="mt-2">
        <Card className="border-muted/60 shadow-sm bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Next Holiday</p>
                {isLoading ? (
                  <p className="text-xs font-medium">Loading...</p>
                ) : nextHoliday ? (
                  <>
                    <p className="text-sm font-bold text-foreground">{nextHoliday.name}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(nextHoliday.date), 'MMMM do')}</p>
                  </>
                ) : (
                  <p className="text-xs font-medium">No holidays scheduled</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
