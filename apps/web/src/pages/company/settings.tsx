import { useEffect } from 'react';
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
import { FileText, Calendar, CalendarClock, Laptop, CheckSquare, Headset } from 'lucide-react';
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

export function CompanySettingsPage() {
  const { data: settings, isLoading } = useCompanySettings();
  const updateMutation = useUpdateCompanySettings();

  const { register, control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  // Reset form when settings load
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
    <div className="flex-1 space-y-4 p-8 pt-6 max-w-4xl">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Work Policies</CardTitle>
            <CardDescription>Configure default working hours and probation rules.</CardDescription>
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
                <h3 className="text-lg font-medium">AI & Integrations</h3>
                <div className="space-y-2 max-w-sm">
                  <Label>Gemini API Key (BYOK)</Label>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Link to="documents">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <FileText className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Document Settings</CardTitle>
              <CardDescription>Manage required document categories and compliance settings</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="leave">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <Calendar className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Leave Settings</CardTitle>
              <CardDescription>Configure leave types and policies</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="holidays">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <Calendar className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Holiday Calendar</CardTitle>
              <CardDescription>Manage company public and optional holidays</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="shifts">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CalendarClock className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Shifts Config</CardTitle>
              <CardDescription>Define shift timings, rotating schedules, and rules</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="assets">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <Laptop className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Asset Management</CardTitle>
              <CardDescription>Manage company inventory and asset categories</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="checklists">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CheckSquare className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Checklist Templates</CardTitle>
              <CardDescription>Define reusable onboarding and offboarding task templates</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="helpdesk">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <Headset className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Helpdesk Categories</CardTitle>
              <CardDescription>Configure support request categories and SLAs</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
