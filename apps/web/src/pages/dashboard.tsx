import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth.store';
import { Building2, Users, MapPin, Briefcase } from 'lucide-react';
import { useDashboardStats } from '@/features/dashboard/hooks/use-dashboard-queries';
import { format } from 'date-fns';
import { useAiInsights } from '@/features/ai/hooks/use-ai-chat';
import { Bot, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function DashboardPage() {
  const { user } = useAuthStore();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: insights, isLoading: insightsLoading } = useAiInsights();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Welcome, {user?.firstName}</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Headcount</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '--' : stats?.headcount ?? 0}</div>
            <p className="text-xs text-muted-foreground">Total active employees</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '--' : stats?.departments ?? 0}</div>
            <p className="text-xs text-muted-foreground">Functional units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '--' : stats?.locations ?? 0}</div>
            <p className="text-xs text-muted-foreground">Offices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Roles</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '--' : stats?.openRoles ?? 0}</div>
            <p className="text-xs text-muted-foreground">Active designations</p>
          </CardContent>
        </Card>
      </div>

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
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading activity...</p>
            ) : stats?.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity to display.</p>
            ) : (
              <div className="space-y-4">
                {stats?.recentActivity.map(activity => (
                  <div key={activity.id} className="flex items-center gap-4 text-sm">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-muted-foreground text-xs">{activity.actorEmail}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(activity.createdAt), 'MMM d, h:mm a')}
                    </div>
                  </div>
                ))}
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
            ) : stats?.upcomingHolidays.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming holidays scheduled.</p>
            ) : (
              <div className="space-y-4">
                {stats?.upcomingHolidays.map(holiday => (
                  <div key={holiday.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-sm">{holiday.name}</p>
                      <p className="text-xs text-muted-foreground">{holiday.type}</p>
                    </div>
                    <div className="text-sm font-medium">
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
