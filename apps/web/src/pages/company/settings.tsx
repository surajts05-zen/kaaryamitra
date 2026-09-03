import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCompanySettings, useUpdateCompanySettings } from '@/features/company/hooks/use-org-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  FileText,
  Calendar,
  CalendarClock,
  Laptop,
  CheckSquare,
  Headset,
  GitBranch,
  Shield,
  Sliders,
  Settings as SettingsIcon,
  Sparkles,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const schema = z.object({
  workHoursStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  workHoursEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  probationDays: z.number().min(0),
  timezone: z.string().min(2),
  isAttendanceEnabled: z.boolean().optional(),
  isGeolocationEnforced: z.boolean().optional(),
  clearanceMode: z.enum(['SIMPLE', 'CHECKLIST']).optional(),
  geminiApiKey: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type TabKey = 'modules' | 'general';

export function CompanySettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('modules');
  const { data: settings, isLoading } = useCompanySettings();
  const updateMutation = useUpdateCompanySettings();

  const { register, control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (settings) {
      reset({
        workHoursStart: settings.workHoursStart,
        workHoursEnd: settings.workHoursEnd,
        probationDays: settings.probationDays,
        timezone: settings.timezone,
        isAttendanceEnabled: settings.isAttendanceEnabled,
        isGeolocationEnforced: settings.isGeolocationEnforced,
        clearanceMode: settings.clearanceMode,
        geminiApiKey: settings.geminiApiKey,
      });
    }
  }, [settings, reset]);

  const onSubmit = (data: FormValues) => {
    updateMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Company settings updated');
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.error?.message || 'Failed to update settings');
      }
    });
  };

  if (isLoading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-5xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-primary" />
          Company Settings
        </h2>
        <p className="text-muted-foreground mt-1">
          Manage module configurations, organizational policies, and system rules.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('modules')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'modules'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sliders className="h-4 w-4" />
          Feature Modules
        </button>
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'general'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <SettingsIcon className="h-4 w-4" />
          General & Work Policies
        </button>
      </div>

      {/* Tab 1: Module Cards */}
      {activeTab === 'modules' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click on any module card to customize rules, templates, policies, and access controls.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            <Link to="documents">
              <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full border-border/60">
                <CardHeader>
                  <div className="p-2.5 w-fit rounded-lg bg-blue-500/10 text-blue-600 mb-2">
                    <FileText className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">Document Settings</CardTitle>
                  <CardDescription className="text-xs">
                    Manage required document categories, compliance rules, and file verification.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link to="leave">
              <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full border-border/60">
                <CardHeader>
                  <div className="p-2.5 w-fit rounded-lg bg-emerald-500/10 text-emerald-600 mb-2">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">Leave Settings</CardTitle>
                  <CardDescription className="text-xs">
                    Configure leave types, annual quotas, accrual policies, and approval rules.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link to="holidays">
              <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full border-border/60">
                <CardHeader>
                  <div className="p-2.5 w-fit rounded-lg bg-amber-500/10 text-amber-600 mb-2">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">Holiday Calendar</CardTitle>
                  <CardDescription className="text-xs">
                    Manage company public, optional, and regional holiday calendars.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link to="shifts">
              <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full border-border/60">
                <CardHeader>
                  <div className="p-2.5 w-fit rounded-lg bg-violet-500/10 text-violet-600 mb-2">
                    <CalendarClock className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">Shifts Config</CardTitle>
                  <CardDescription className="text-xs">
                    Define shift timings, night rosters, rotating schedules, and attendance rules.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link to="assets">
              <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full border-border/60">
                <CardHeader>
                  <div className="p-2.5 w-fit rounded-lg bg-indigo-500/10 text-indigo-600 mb-2">
                    <Laptop className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">Asset Management</CardTitle>
                  <CardDescription className="text-xs">
                    Manage company hardware inventory, asset categories, and employee assignments.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link to="checklists">
              <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full border-border/60">
                <CardHeader>
                  <div className="p-2.5 w-fit rounded-lg bg-rose-500/10 text-rose-600 mb-2">
                    <CheckSquare className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">Checklist Templates</CardTitle>
                  <CardDescription className="text-xs">
                    Define reusable task templates for employee onboarding and offboarding.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link to="helpdesk">
              <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full border-border/60">
                <CardHeader>
                  <div className="p-2.5 w-fit rounded-lg bg-cyan-500/10 text-cyan-600 mb-2">
                    <Headset className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">Helpdesk Categories</CardTitle>
                  <CardDescription className="text-xs">
                    Configure IT & HR support request categories, assignees, and SLA deadlines.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link to="workflows">
              <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full border-border/60">
                <CardHeader>
                  <div className="p-2.5 w-fit rounded-lg bg-orange-500/10 text-orange-600 mb-2">
                    <GitBranch className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">Workflow Engine</CardTitle>
                  <CardDescription className="text-xs">
                    Configure multi-stage approval workflows for leaves, expenses, and requests.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link to="roles">
              <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full border-border/60">
                <CardHeader>
                  <div className="p-2.5 w-fit rounded-lg bg-purple-500/10 text-purple-600 mb-2">
                    <Shield className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">Roles & Permissions</CardTitle>
                  <CardDescription className="text-xs">
                    Configure RBAC action permissions and assign roles to company employees.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      )}

      {/* Tab 2: General & Work Policies Form */}
      {activeTab === 'general' && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Work Policies & System Preferences</CardTitle>
              <CardDescription>Configure default working hours, probation rules, attendance tracking, and AI keys.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Work Hours Start</Label>
                  <Input type="time" {...register('workHoursStart')} />
                  {errors.workHoursStart && <p className="text-xs text-destructive">{errors.workHoursStart.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Work Hours End</Label>
                  <Input type="time" {...register('workHoursEnd')} />
                  {errors.workHoursEnd && <p className="text-xs text-destructive">{errors.workHoursEnd.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Default Probation Period (Days)</Label>
                <Input type="number" {...register('probationDays', { valueAsNumber: true })} />
                {errors.probationDays && <p className="text-xs text-destructive">{errors.probationDays.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Company Default Timezone</Label>
                <Input {...register('timezone')} />
                {errors.timezone && <p className="text-xs text-destructive">{errors.timezone.message}</p>}
              </div>

              <div className="pt-4 border-t space-y-4">
                <h3 className="text-lg font-medium">Attendance Settings</h3>
                
                <div className="flex items-center space-x-2">
                  <Controller
                    control={control}
                    name="isAttendanceEnabled"
                    render={({ field }) => (
                      <Checkbox
                        id="isAttendanceEnabled"
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="isAttendanceEnabled" className="cursor-pointer">Enable Attendance Tracking</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Controller
                    control={control}
                    name="isGeolocationEnforced"
                    render={({ field }) => (
                      <Checkbox
                        id="isGeolocationEnforced"
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="isGeolocationEnforced" className="cursor-pointer">Enforce Geolocation (Location required for check-in/out)</Label>
                </div>

                <div className="pt-4 border-t space-y-4">
                  <h3 className="text-lg font-medium">Offboarding Settings</h3>
                  <div className="space-y-2 max-w-sm">
                    <Label>Employee Clearance Mode</Label>
                    <Controller
                      control={control}
                      name="clearanceMode"
                      render={({ field }) => (
                        <Select value={field.value || 'SIMPLE'} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SIMPLE">Simple (Single Toggle by HR)</SelectItem>
                            <SelectItem value="CHECKLIST">Checklist (Department-wise Approval)</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.clearanceMode && <p className="text-xs text-destructive">{errors.clearanceMode.message}</p>}
                  </div>
                </div>

                <div className="pt-4 border-t space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    AI & Integrations (BYOK)
                  </h3>
                  <div className="space-y-2 max-w-sm">
                    <Label>Tenant Gemini API Key</Label>
                    <Input type="password" placeholder="AI-..." {...register('geminiApiKey')} />
                    <p className="text-xs text-muted-foreground">Optional. Overrides the platform-wide AI key for this workspace.</p>
                    {errors.geminiApiKey && <p className="text-xs text-destructive">{errors.geminiApiKey.message}</p>}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}
    </div>
  );
}
