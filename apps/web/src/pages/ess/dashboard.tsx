import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth.store';
import { Calendar, Clock, Bell, CalendarDays, UserPlus, Headset, UserMinus, Activity } from 'lucide-react';
import { AttendanceWidget } from '@/features/attendance/components/AttendanceWidget';
import { useDashboardStats } from '@/features/dashboard/hooks/use-dashboard-queries';
import { format } from 'date-fns';

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

export function EssDashboardPage() {
  const { user } = useAuthStore();
  const { data: stats, isLoading } = useDashboardStats();

  const nextHoliday = stats?.upcomingHolidays?.[0];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Welcome, {user?.firstName}</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AttendanceWidget />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Headcount</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '--' : stats?.headcount ?? 0}</div>
            <p className="text-xs text-muted-foreground">Active workspace members</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Holiday</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">
              {isLoading ? '--' : nextHoliday ? nextHoliday.name : 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              {nextHoliday ? format(new Date(nextHoliday.date), 'MMM d, yyyy') : 'No upcoming holiday'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Roles</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '--' : stats?.openRoles ?? 0}</div>
            <p className="text-xs text-muted-foreground">Active designations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '--' : stats?.departments ?? 0}</div>
            <p className="text-xs text-muted-foreground">Functional units</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading activity...</p>
            ) : !stats?.recentActivity || stats.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity to display.</p>
            ) : (
              <div className="space-y-4">
                {stats.recentActivity.map((activity) => {
                  const meta = getActivityMeta(activity.action);
                  const Icon = meta.icon;
                  return (
                    <div key={activity.id} className="flex items-center gap-3.5 text-sm">
                      <div className={`p-2 rounded-lg shrink-0 ${meta.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{activity.action}</p>
                        <p className="text-muted-foreground text-xs truncate">{activity.actorEmail}</p>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0 font-medium">
                        {format(new Date(activity.createdAt), 'MMM d, h:mm a')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Upcoming Holidays</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading holidays...</p>
            ) : !stats?.upcomingHolidays || stats.upcomingHolidays.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming holidays scheduled.</p>
            ) : (
              <div className="space-y-3">
                {stats.upcomingHolidays.map((holiday) => (
                  <div key={holiday.id} className="flex items-center justify-between border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                        <CalendarDays className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{holiday.name}</p>
                        <p className="text-xs text-muted-foreground">{holiday.type || 'Company Holiday'}</p>
                      </div>
                    </div>
                    <div className="text-xs font-semibold px-2.5 py-1 rounded-md bg-muted text-foreground shrink-0">
                      {format(new Date(holiday.date), 'MMM d, yyyy')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
