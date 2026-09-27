import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  Users, Clock, AlertTriangle, CheckCircle2, Coffee, UserX,
  CalendarDays, Search, RefreshCw, CheckCheck, XCircle, Shield,
  Download, TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  useAdminAttendanceOverview,
  useAdminAttendanceRecords,
  usePendingCorrections,
  useApproveCorrection,
  useRejectCorrection,
} from '@/features/attendance/hooks/use-attendance-queries';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, accent, subtitle }: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  accent: string;
  subtitle?: string;
}) {
  return (
    <Card className="border border-border/60">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={cn('p-2.5 rounded-xl', accent)}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Today's Overview Tab
// ─────────────────────────────────────────────────────────────────────────────

function TodayOverviewTab() {
  const { data: overview, isLoading, refetch } = useAdminAttendanceOverview();

  if (isLoading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border border-border/60 animate-pulse h-24" />
      ))}
    </div>
  );

  if (!overview) return null;

  const presentPct = overview.totalEmployees > 0
    ? Math.round((overview.present / overview.totalEmployees) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Present"
          value={overview.present}
          accent="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
          subtitle={`${presentPct}% of workforce`}
        />
        <StatCard
          icon={UserX}
          label="Absent"
          value={overview.absent}
          accent="bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
        />
        <StatCard
          icon={AlertTriangle}
          label="Late Arrivals"
          value={overview.late}
          accent="bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
        />
        <StatCard
          icon={Coffee}
          label="On Break"
          value={overview.onBreak}
          accent="bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
          subtitle={`${overview.currentlyIn} currently in`}
        />
      </div>

      {/* Live records table */}
      <Card className="border border-border/60">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Today's Attendance</CardTitle>
            <CardDescription className="text-xs">
              {format(new Date(), 'EEEE, MMMM d, yyyy')} · Auto-refreshes every minute
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => refetch()} title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[480px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Punch In</TableHead>
                  <TableHead>Punch Out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.records?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No attendance records for today yet.
                    </TableCell>
                  </TableRow>
                )}
                {overview.records?.map((r: any) => {
                  const isOnBreak = r.breaks?.some((b: any) => !b.endAt);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {r.employee?.firstName} {r.employee?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{r.employee?.employeeCode}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {r.punchInTime ? (
                          <div>
                            <p className="text-sm font-mono">{format(new Date(r.punchInTime), 'HH:mm')}</p>
                            {r.isLate && (
                              <p className="text-[10px] text-amber-600">+{r.lateMinutes}m late</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.punchOutTime ? (
                          <span className="text-sm font-mono">{format(new Date(r.punchOutTime), 'HH:mm')}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {!r.punchInTime ? (
                          <Badge variant="secondary">Absent</Badge>
                        ) : r.punchOutTime ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Done</Badge>
                        ) : isOnBreak ? (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">Break</Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 animate-pulse">Working</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm tabular-nums">
                          {r.totalMinutes
                            ? `${Math.floor(r.totalMinutes / 60)}h ${r.totalMinutes % 60}m`
                            : r.punchInTime && !r.punchOutTime ? 'Active' : '—'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Historical Records Tab
// ─────────────────────────────────────────────────────────────────────────────

function HistoricalTab() {
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [lateFilter, setLateFilter] = React.useState('ALL');
  const [page, setPage] = React.useState(1);

  const { data, isLoading } = useAdminAttendanceRecords({
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
    ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
    ...(lateFilter === 'LATE' ? { isLate: true } : lateFilter === 'ON_TIME' ? { isLate: false } : {}),
    page,
    pageSize: 50,
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="border border-border/60">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setPage(1); }}
                className="h-8 text-sm w-36"
                placeholder="Start Date"
              />
              <span className="text-muted-foreground text-sm">—</span>
              <Input
                type="date"
                value={endDate}
                onChange={e => { setEndDate(e.target.value); setPage(1); }}
                className="h-8 text-sm w-36"
                placeholder="End Date"
              />
            </div>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="h-8 w-32 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PRESENT">Present</SelectItem>
                <SelectItem value="ABSENT">Absent</SelectItem>
                <SelectItem value="HALF_DAY">Half Day</SelectItem>
              </SelectContent>
            </Select>
            <Select value={lateFilter} onValueChange={v => { setLateFilter(v); setPage(1); }}>
              <SelectTrigger className="h-8 w-32 text-sm">
                <SelectValue placeholder="Punctuality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="LATE">Late Only</SelectItem>
                <SelectItem value="ON_TIME">On Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Attendance Records</CardTitle>
            {data && (
              <CardDescription className="text-xs">{data.total} record{data.total !== 1 ? 's' : ''} found</CardDescription>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Punch In</TableHead>
                  <TableHead>Punch Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                  </TableRow>
                )}
                {!isLoading && data?.records?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No records found for the selected filters.</TableCell>
                  </TableRow>
                )}
                {data?.records?.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{r.employee?.firstName} {r.employee?.lastName}</p>
                        <p className="text-xs text-muted-foreground">{r.employee?.department?.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(r.date), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <p className="text-xs">{r.shift?.name ?? '—'}</p>
                      {r.shift && <p className="text-[10px] text-muted-foreground">{r.shift.startTime}–{r.shift.endTime}</p>}
                    </TableCell>
                    <TableCell>
                      {r.punchInTime ? (
                        <div>
                          <p className="text-sm font-mono">{format(new Date(r.punchInTime), 'HH:mm')}</p>
                          {r.isLate && <p className="text-[10px] text-amber-600">+{r.lateMinutes}m late</p>}
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {r.punchOutTime ? (
                        <div>
                          <p className="text-sm font-mono">{format(new Date(r.punchOutTime), 'HH:mm')}</p>
                          {r.isEarlyExit && <p className="text-[10px] text-amber-600">-{r.earlyExitMinutes}m early</p>}
                        </div>
                      ) : r.isMissingPunch ? (
                        <span className="text-xs text-rose-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Missing</span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm tabular-nums">
                        {r.totalMinutes ? `${Math.floor(r.totalMinutes / 60)}h ${r.totalMinutes % 60}m` : '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] font-medium',
                          r.status === 'PRESENT' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                          r.status === 'ABSENT' && 'bg-rose-50 text-rose-700 border-rose-200',
                          r.status === 'HALF_DAY' && 'bg-amber-50 text-amber-700 border-amber-200',
                        )}
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
              <span className="text-muted-foreground">
                Page {data.page} of {data.totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= data.totalPages}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Corrections Tab
// ─────────────────────────────────────────────────────────────────────────────

function CorrectionsTab() {
  const { data: corrections, isLoading } = usePendingCorrections();
  const approveCorrection = useApproveCorrection();
  const rejectCorrection = useRejectCorrection();

  const handleApprove = async (id: string) => {
    try {
      await approveCorrection.mutateAsync({ id });
      toast.success('Correction approved');
    } catch {
      toast.error('Failed to approve correction');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectCorrection.mutateAsync({ id });
      toast.success('Correction rejected');
    } catch {
      toast.error('Failed to reject correction');
    }
  };

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading corrections...</div>;

  return (
    <Card className="border border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Pending Attendance Corrections</CardTitle>
        <CardDescription className="text-xs">
          Employee-submitted regularization requests awaiting approval.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {corrections?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            <p className="text-sm font-medium">All caught up!</p>
            <p className="text-xs mt-1">No pending correction requests.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Requested In</TableHead>
                <TableHead>Requested Out</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {corrections?.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">
                        {c.record?.employee?.firstName} {c.record?.employee?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{c.record?.employee?.employeeCode}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {c.record?.date ? format(new Date(c.record.date), 'dd MMM yyyy') : '—'}
                  </TableCell>
                  <TableCell className="text-sm font-mono">
                    {c.requestedCheckIn ? format(new Date(c.requestedCheckIn), 'HH:mm') : '—'}
                  </TableCell>
                  <TableCell className="text-sm font-mono">
                    {c.requestedCheckOut ? format(new Date(c.requestedCheckOut), 'HH:mm') : '—'}
                  </TableCell>
                  <TableCell className="text-sm max-w-48 truncate" title={c.reason}>
                    {c.reason}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleApprove(c.id)}
                        disabled={approveCorrection.isPending}
                      >
                        <CheckCheck className="w-3 h-3 mr-1" />Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                        onClick={() => handleReject(c.id)}
                        disabled={rejectCorrection.isPending}
                      >
                        <XCircle className="w-3 h-3 mr-1" />Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Admin Attendance Page
// ─────────────────────────────────────────────────────────────────────────────

export function AdminAttendancePage() {
  const { data: overview } = useAdminAttendanceOverview();
  const { data: corrections } = usePendingCorrections();

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', path: 'dashboard' },
          { label: 'Attendance' },
        ]}
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Monitor real-time attendance, manage records, and review correction requests.
          </p>
        </div>
        {corrections?.length > 0 && (
          <Badge className="bg-amber-100 text-amber-700 border border-amber-300 text-sm px-3 py-1">
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
            {corrections.length} correction{corrections.length !== 1 ? 's' : ''} pending
          </Badge>
        )}
      </div>

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">
            <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
            Today
          </TabsTrigger>
          <TabsTrigger value="history">
            <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
            Records
          </TabsTrigger>
          <TabsTrigger value="corrections" className="relative">
            <Shield className="w-3.5 h-3.5 mr-1.5" />
            Corrections
            {corrections?.length > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {corrections.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="today">
            <TodayOverviewTab />
          </TabsContent>
          <TabsContent value="history">
            <HistoricalTab />
          </TabsContent>
          <TabsContent value="corrections">
            <CorrectionsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
