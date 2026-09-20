import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Plus, Users, Search, Filter, Loader2, CheckCircle2, Video, CheckCheck } from 'lucide-react';
import { ScheduleMeetingModal } from './components/schedule-meeting-modal';
import { apiClient } from '@/lib/api-client';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';

function formatMeetingDate(dateStr: string) {
  const d = parseISO(dateStr);
  if (isToday(d)) return 'TODAY';
  if (isTomorrow(d)) return 'TMRW';
  return format(d, 'dd MMM');
}

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    IN_PROGRESS: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    COMPLETED: 'bg-muted text-muted-foreground',
    CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return map[status] ?? 'bg-muted text-muted-foreground';
}

export function MeetingsDashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [search, setSearch] = useState('');

  // Show a toast/banner if returning from Google OAuth
  const calendarConnected = searchParams.get('calendar_connected') === 'true';

  const { data: meetings = [], isLoading, refetch } = useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      const res = await apiClient.get('/meetings');
      return res.data.data ?? [];
    },
  });

  const handleConnectCalendar = async () => {
    try {
      setIsConnecting(true);
      const res = await apiClient.get('/meetings/calendar/auth');
      if (res.data?.data?.url) {
        window.location.href = res.data.data.url;
      }
    } catch (err) {
      console.error('Failed to get calendar auth URL', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const filteredMeetings = meetings.filter((m: any) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  // Metrics computed from real data
  const thisWeekMeetings = meetings.filter((m: any) => {
    const d = parseISO(m.startTime);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    return d >= startOfWeek && d < endOfWeek;
  });

  const totalHoursThisWeek = thisWeekMeetings.reduce((acc: number, m: any) => {
    const start = parseISO(m.startTime);
    const end = parseISO(m.endTime);
    return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }, 0);

  return (
    <div className="flex flex-col gap-6 h-full">
      {calendarConnected && (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 text-sm">
          <CheckCheck className="h-4 w-4 shrink-0" />
          <span>Google Calendar connected successfully! New meetings will automatically sync.</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meetings &amp; Calendar</h1>
          <p className="text-muted-foreground mt-1">Manage your team's schedule, agendas, and minutes of meeting.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleConnectCalendar} disabled={isConnecting}>
            {isConnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
            Connect Calendar
          </Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={() => setIsScheduleOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Meeting
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="flex items-center justify-between bg-card border rounded-lg p-2">
            <div className="flex items-center gap-2 px-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search meetings..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-sm w-64"
              />
            </div>
            <div className="flex items-center gap-2 border-l pl-2">
              <div className="flex items-center rounded-md border p-1 bg-muted/30">
                <button
                  className={`px-3 py-1 text-xs font-medium rounded-sm ${view === 'list' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                  onClick={() => setView('list')}
                >
                  List
                </button>
                <button
                  className={`px-3 py-1 text-xs font-medium rounded-sm ${view === 'calendar' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                  onClick={() => setView('calendar')}
                >
                  Calendar
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading meetings...
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-center border rounded-xl bg-card">
              <Calendar className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">
                {search ? 'No meetings match your search.' : 'No meetings scheduled yet. Click "New Meeting" to get started.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredMeetings.map((meeting: any) => {
                const locationLabel = meeting.room?.name ?? meeting.meetingLink ?? meeting.location ?? 'No location';
                const isVirtual = !meeting.room && meeting.meetingLink;
                return (
                  <Card
                    key={meeting.id}
                    className="hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => navigate(`workspace/${meeting.id}`)}
                  >
                    <CardContent className="p-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="flex flex-col items-center justify-center bg-primary/10 text-primary rounded-lg h-14 min-w-[3.5rem] px-2 shrink-0">
                          <span className="text-[10px] sm:text-xs font-bold uppercase text-center leading-tight break-words">
                            {formatMeetingDate(meeting.startTime)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-base group-hover:text-primary transition-colors truncate">{meeting.title}</h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(parseISO(meeting.startTime), 'hh:mm a')} – {format(parseISO(meeting.endTime), 'hh:mm a')}
                            </span>
                            <span className="flex items-center gap-1">
                              {isVirtual ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                              {locationLabel}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {meeting.participants?.length ?? 0} attendees
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:items-end gap-2">
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${getStatusBadge(meeting.status)}`}>
                          {meeting.status}
                        </span>
                        {meeting.meetingType && (
                          <span className="px-2.5 py-0.5 rounded-full bg-muted text-xs font-medium">
                            {meeting.meetingType.name}
                          </span>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 text-xs w-full sm:w-auto opacity-0 group-hover:opacity-100 transition-opacity">
                          Enter Workspace
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Meeting Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Meetings this week</span>
                  <span className="font-bold">{thisWeekMeetings.length}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${Math.min((thisWeekMeetings.length / 20) * 100, 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Hours in meetings</span>
                  <span className="font-bold">{totalHoursThisWeek.toFixed(1)} hr</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 transition-all" style={{ width: `${Math.min((totalHoursThisWeek / 40) * 100, 100)}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Upcoming Today</CardTitle>
            </CardHeader>
            <CardContent>
              {meetings.filter((m: any) => isToday(parseISO(m.startTime))).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">No meetings today.</p>
              ) : (
                <div className="space-y-3">
                  {meetings
                    .filter((m: any) => isToday(parseISO(m.startTime)))
                    .slice(0, 4)
                    .map((m: any) => (
                      <div key={m.id} className="flex items-start gap-2 cursor-pointer hover:text-primary transition-colors" onClick={() => navigate(`workspace/${m.id}`)}>
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div className="text-sm min-w-0">
                          <p className="font-medium truncate">{m.title}</p>
                          <p className="text-xs text-muted-foreground">{format(parseISO(m.startTime), 'hh:mm a')}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ScheduleMeetingModal open={isScheduleOpen} onOpenChange={setIsScheduleOpen} onCreated={refetch} />
    </div>
  );
}
