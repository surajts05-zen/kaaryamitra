import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth.store';
import { Building2, Users, MapPin, Briefcase, CalendarDays, Headset, UserMinus, UserPlus, Activity, Bot, Sparkles, FileText, Folder, Megaphone, Laptop, ArrowRight, Clock, CalendarClock, Timer, DoorOpen, IndianRupee, Receipt, Target } from 'lucide-react';
import { useDashboardStats } from '@/features/dashboard/hooks/use-dashboard-queries';
import { usePinnedAnnouncements } from '@/features/library/hooks/use-library-queries';
import { format } from 'date-fns';
import { useAiInsights } from '@/features/ai/hooks/use-ai-chat';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';

function getActivityMeta(action: string) {
  if (action.includes('onboarded')) {
    return { icon: UserPlus, color: 'text-emerald-600 bg-emerald-500/10' };
  }
  if (action.includes('Leave')) {
    return { icon: CalendarDays, color: 'text-blue-600 bg-blue-500/10' };
  }
  if (action.includes('Helpdesk')) {
    return { icon: Headset, color: 'text-purple-600 bg-purple-500/10' };
  }
  if (action.includes('Resignation')) {
    return { icon: UserMinus, color: 'text-rose-600 bg-rose-500/10' };
  }
  return { icon: Activity, color: 'text-primary bg-primary/10' };
}

const QUICK_LINKS = [
  { title: 'Company Policies', icon: FileText, href: '../my-policies', color: 'bg-purple-500/10 text-purple-600' },
  { title: 'My Attendance', icon: Clock, href: '../me/attendance', color: 'bg-blue-500/10 text-blue-600' },
  { title: 'My Leaves', icon: CalendarDays, href: '../me/leave', color: 'bg-emerald-500/10 text-emerald-600' },
  { title: 'My Shifts', icon: CalendarClock, href: '../me/shifts', color: 'bg-indigo-500/10 text-indigo-600' },
  { title: 'My Timesheets', icon: Timer, href: '../me/timesheets', color: 'bg-orange-500/10 text-orange-600' },
  { title: 'My Assets', icon: Laptop, href: '../me/assets', color: 'bg-teal-500/10 text-teal-600' },
  { title: 'My Resignation', icon: DoorOpen, href: '../me/resignation', color: 'bg-rose-500/10 text-rose-600' },
  { title: 'My Compensation', icon: IndianRupee, href: '../me/compensation', color: 'bg-green-500/10 text-green-600' },
  { title: 'My Payslips', icon: Receipt, href: '../me/payslips', color: 'bg-blue-500/10 text-blue-600' },
  { title: 'My Helpdesk', icon: Headset, href: '../me/helpdesk', color: 'bg-yellow-500/10 text-yellow-600' },
  { title: 'My Goals', icon: Target, href: '../me/performance/goals', color: 'bg-cyan-500/10 text-cyan-600' },
  { title: 'My Reviews', icon: Target, href: '../me/performance/reviews', color: 'bg-pink-500/10 text-pink-600' },
  { title: 'Content Library', icon: Folder, href: '../library', color: 'bg-emerald-500/10 text-emerald-600' },
  { title: 'Directory', icon: Users, href: '../directory', color: 'bg-indigo-500/10 text-indigo-600' },
];

export function DashboardPage() {
  const { user } = useAuthStore();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: insights, isLoading: insightsLoading } = useAiInsights();
  const { data: announcements, isLoading: announcementsLoading } = usePinnedAnnouncements();

  const currentDate = format(new Date(), 'EEEE, MMMM do, yyyy');

  return (
    <div className="flex-1 space-y-6 pb-12">
      {/* HERO BANNER */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-km-forest to-km-forest/80 text-white p-8 shadow-lg">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-km-lime/10 blur-3xl mix-blend-overlay"></div>
        <div className="absolute bottom-0 left-10 -mb-10 h-32 w-32 rounded-full bg-blue-500/20 blur-2xl mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col justify-center h-full">
          <p className="text-km-lime font-medium mb-1 tracking-wide uppercase text-sm">{currentDate}</p>
          <h2 className="text-4xl font-bold tracking-tight mb-2">Welcome back, {user?.firstName}</h2>
          <p className="text-white/80 max-w-2xl text-lg">
            Here's what's happening across the organization today.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* LEFT COLUMN: News & Announcements */}
        <div className="md:col-span-8 space-y-6">
          
          {/* QUICK LINKS */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-km-lime" /> Quick Actions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {QUICK_LINKS.map((link) => (
                <Link key={link.title} to={link.href} className="group block">
                  <Card className="h-full border-muted/60 bg-card hover:bg-accent/50 hover:border-km-lime/50 transition-all text-center p-4 shadow-sm group-hover:shadow-md">
                    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${link.color}`}>
                      <link.icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">{link.title}</span>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          {/* ANNOUNCEMENTS FEED */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-km-forest" /> Company News & Announcements
              </h3>
              <Link to="../library" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                View Library <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="space-y-4">
              {announcementsLoading ? (
                <div className="space-y-4">
                  {[1,2].map(i => <Card key={i} className="h-32 animate-pulse bg-muted/50" />)}
                </div>
              ) : !announcements || announcements.length === 0 ? (
                <Card className="p-8 text-center border-dashed bg-muted/30">
                  <Megaphone className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No pinned announcements to display.</p>
                </Card>
              ) : (
                announcements.map((item) => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow group border-muted/60">
                    <CardContent className="p-0">
                      <div className="p-5 flex gap-5">
                        <div className="bg-primary/10 rounded-lg p-4 flex-shrink-0 self-start hidden sm:block">
                          <FileText className="h-8 w-8 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors cursor-pointer">
                              {item.title}
                            </h4>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                              {format(new Date(item.createdAt), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Published by {item.createdBy?.firstName} {item.createdBy?.lastName}
                          </p>
                          <div 
                            className="text-sm text-foreground/80 line-clamp-2 prose prose-sm dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: item.content || '' }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </section>

          {/* AI HR SUMMARY */}
          <Card className="bg-km-forest/5 border-km-forest/20 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Bot className="h-24 w-24 text-km-forest" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-km-forest">
                <Sparkles className="h-5 w-5 text-km-lime" />
                Executive HR Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insightsLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-5/6"></div>
                </div>
              ) : insights ? (
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                  <ReactMarkdown>{insights}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">AI Insights are currently unavailable. Ensure your Gemini API Key is configured in settings.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Widgets & Stats */}
        <div className="md:col-span-4 space-y-6">
          
          {/* ORG STATS */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card shadow-sm border-muted/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">Headcount</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground/70" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold">{isLoading ? '--' : stats?.headcount ?? 0}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-card shadow-sm border-muted/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">Open Roles</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground/70" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold">{isLoading ? '--' : stats?.openRoles ?? 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* RECENT ACTIVITY */}
          <Card className="border-muted/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-km-forest" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading activity...</p>
              ) : !stats?.recentActivity || stats.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              ) : (
                <div className="space-y-4">
                  {stats.recentActivity.slice(0, 5).map((activity) => {
                    const meta = getActivityMeta(activity.action);
                    const Icon = meta.icon;
                    return (
                      <div key={activity.id} className="flex items-center gap-3 text-sm">
                        <div className={`p-1.5 rounded-full shrink-0 ${meta.color}`}>
                          <Icon className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-xs line-clamp-1">{activity.action}</p>
                          <p className="text-muted-foreground text-[10px] truncate">{activity.actorEmail}</p>
                        </div>
                        <div className="text-[10px] text-muted-foreground shrink-0 font-medium">
                          {format(new Date(activity.createdAt), 'MMM d')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* UPCOMING HOLIDAYS */}
          <Card className="border-muted/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-500" /> Upcoming Holidays
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading holidays...</p>
              ) : !stats?.upcomingHolidays || stats.upcomingHolidays.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming holidays.</p>
              ) : (
                <div className="space-y-3">
                  {stats.upcomingHolidays.slice(0, 4).map((holiday) => (
                    <div key={holiday.id} className="flex items-center justify-between border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-xs text-foreground">{holiday.name}</p>
                        <p className="text-[10px] text-muted-foreground">{holiday.type || 'Company Holiday'}</p>
                      </div>
                      <div className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground shrink-0">
                        {format(new Date(holiday.date), 'MMM d')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

