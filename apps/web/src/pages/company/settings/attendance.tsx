import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Shield, Wifi, Plus, Trash2, Clock, ToggleLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCompanySettings, useUpdateCompanySettings } from '@/features/company/hooks/use-org-queries';
import {
  useTrustedNetworks,
  useCreateTrustedNetwork,
  useUpdateTrustedNetwork,
  useDeleteTrustedNetwork,
} from '@/features/attendance/hooks/use-attendance-queries';

// ─────────────────────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────────────────────

const policySchema = z.object({
  attendancePunchWindowBefore: z.number().min(0).max(240),
  attendancePunchWindowAfter: z.number().min(0).max(480),
  attendanceEarlyDepartureGrace: z.number().min(0).max(120),
  attendanceAllowManualCorrection: z.boolean(),
  attendanceCorrectionRequiresApproval: z.boolean(),
  attendanceTrustedNetworkEnabled: z.boolean(),
  attendanceTrustedNetworkPolicy: z.enum(['NONE', 'WARN', 'REQUIRE']),
  attendanceMobileGpsPolicy: z.enum(['NONE', 'OPTIONAL', 'REQUIRE']),
  attendanceOvertimeEnabled: z.boolean(),
  attendanceMinWorkingHours: z.number().min(60).max(720),
});

type PolicyFormValues = z.infer<typeof policySchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Network Form Dialog
// ─────────────────────────────────────────────────────────────────────────────

function NetworkDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = React.useState('');
  const [cidr, setCidr] = React.useState('');
  const [description, setDescription] = React.useState('');
  const createNetwork = useCreateTrustedNetwork();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !cidr) return;
    try {
      await createNetwork.mutateAsync({ name, cidr, description });
      toast.success('Trusted network added');
      setName(''); setCidr(''); setDescription('');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to add network');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Trusted Network</DialogTitle>
          <DialogDescription>
            Add an IP range in CIDR notation. Punch-ins from these IPs will be marked as verified.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Network Name</Label>
            <Input
              placeholder="e.g. Mumbai HQ"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>CIDR Range</Label>
            <Input
              placeholder="e.g. 203.0.113.0/24 or 192.168.1.0/24"
              value={cidr}
              onChange={e => setCidr(e.target.value)}
              required
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              For single IP use /32 (e.g. 203.0.113.10/32)
            </p>
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input
              placeholder="e.g. Office broadband connection"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createNetwork.isPending}>
              {createNetwork.isPending ? 'Adding...' : 'Add Network'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export function AttendancePolicyPage() {
  const { data: settings, isLoading } = useCompanySettings();
  const updateSettings = useUpdateCompanySettings();
  const { data: networks, isLoading: networksLoading } = useTrustedNetworks();
  const deleteNetwork = useDeleteTrustedNetwork();
  const toggleNetwork = useUpdateTrustedNetwork();
  const [networkDialogOpen, setNetworkDialogOpen] = React.useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<PolicyFormValues>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      attendancePunchWindowBefore: 30,
      attendancePunchWindowAfter: 120,
      attendanceEarlyDepartureGrace: 15,
      attendanceAllowManualCorrection: true,
      attendanceCorrectionRequiresApproval: true,
      attendanceTrustedNetworkEnabled: false,
      attendanceTrustedNetworkPolicy: 'NONE',
      attendanceMobileGpsPolicy: 'OPTIONAL',
      attendanceOvertimeEnabled: false,
      attendanceMinWorkingHours: 480,
    },
  });

  const trustedNetworkEnabled = watch('attendanceTrustedNetworkEnabled');

  React.useEffect(() => {
    if (settings) {
      reset({
        attendancePunchWindowBefore: (settings as any).attendancePunchWindowBefore ?? 30,
        attendancePunchWindowAfter: (settings as any).attendancePunchWindowAfter ?? 120,
        attendanceEarlyDepartureGrace: (settings as any).attendanceEarlyDepartureGrace ?? 15,
        attendanceAllowManualCorrection: (settings as any).attendanceAllowManualCorrection ?? true,
        attendanceCorrectionRequiresApproval: (settings as any).attendanceCorrectionRequiresApproval ?? true,
        attendanceTrustedNetworkEnabled: (settings as any).attendanceTrustedNetworkEnabled ?? false,
        attendanceTrustedNetworkPolicy: (settings as any).attendanceTrustedNetworkPolicy ?? 'NONE',
        attendanceMobileGpsPolicy: (settings as any).attendanceMobileGpsPolicy ?? 'OPTIONAL',
        attendanceOvertimeEnabled: (settings as any).attendanceOvertimeEnabled ?? false,
        attendanceMinWorkingHours: (settings as any).attendanceMinWorkingHours ?? 480,
      });
    }
  }, [settings, reset]);

  const onSubmit = (data: PolicyFormValues) => {
    updateSettings.mutate(data, {
      onSuccess: () => toast.success('Attendance policy saved'),
      onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to save'),
    });
  };

  const handleDeleteNetwork = async (id: string) => {
    if (!confirm('Delete this trusted network?')) return;
    try {
      await deleteNetwork.mutateAsync(id);
      toast.success('Network removed');
    } catch {
      toast.error('Failed to delete network');
    }
  };

  const handleToggleNetwork = async (id: string, isActive: boolean) => {
    try {
      await toggleNetwork.mutateAsync({ id, isActive: !isActive });
      toast.success(`Network ${!isActive ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to update network');
    }
  };

  if (isLoading) return <div className="p-8">Loading attendance policy...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <Breadcrumb
        items={[
          { label: 'Settings', path: 'settings' },
          { label: 'Attendance Policy' },
        ]}
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary" />
          Attendance Policy
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Configure punch windows, overtime rules, trusted networks, and correction workflows.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Punch Window */}
        <Card className="border border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Punch Window Settings</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Define when employees can punch in relative to their shift start time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Early Punch Window (mins)</Label>
                <Input
                  type="number"
                  min={0} max={240}
                  {...register('attendancePunchWindowBefore', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">Minutes before shift start an employee can punch in</p>
                {errors.attendancePunchWindowBefore && (
                  <p className="text-xs text-destructive">{errors.attendancePunchWindowBefore.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Late Punch Cutoff (mins)</Label>
                <Input
                  type="number"
                  min={0} max={480}
                  {...register('attendancePunchWindowAfter', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">Minutes after shift start allowed for punch in</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Early Departure Grace (mins)</Label>
                <Input
                  type="number"
                  min={0} max={120}
                  {...register('attendanceEarlyDepartureGrace', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">Minutes before shift end that is NOT flagged as early departure</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overtime */}
        <Card className="border border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Work Hours & Overtime</CardTitle>
            <CardDescription className="text-xs">
              Minimum daily working hours and overtime tracking configuration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Enable Overtime Tracking</p>
                <p className="text-xs text-muted-foreground">Track hours worked beyond the minimum daily threshold</p>
              </div>
              <Controller
                name="attendanceOvertimeEnabled"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
            <div className="space-y-2 max-w-sm">
              <Label className="text-sm font-medium">Minimum Daily Working Hours (minutes)</Label>
              <Input
                type="number"
                min={60} max={720}
                {...register('attendanceMinWorkingHours', { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">Default: 480 mins (8 hours)</p>
            </div>
          </CardContent>
        </Card>

        {/* Correction Workflow */}
        <Card className="border border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Attendance Correction Workflow</CardTitle>
            <CardDescription className="text-xs">
              Control whether employees can submit regularization requests and whether they need approval.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Allow Manual Corrections</p>
                <p className="text-xs text-muted-foreground">Employees can submit attendance correction requests</p>
              </div>
              <Controller
                name="attendanceAllowManualCorrection"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Corrections Require Approval</p>
                <p className="text-xs text-muted-foreground">HR/Manager must approve correction requests before they are applied</p>
              </div>
              <Controller
                name="attendanceCorrectionRequiresApproval"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Mobile GPS */}
        <Card className="border border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Mobile GPS Policy</CardTitle>
            <CardDescription className="text-xs">
              Whether location data is required for mobile attendance punches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-sm">
              <Label className="text-sm font-medium">GPS on Mobile</Label>
              <Controller
                name="attendanceMobileGpsPolicy"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Disabled — Never collect GPS</SelectItem>
                      <SelectItem value="OPTIONAL">Optional — Collect if available</SelectItem>
                      <SelectItem value="REQUIRE">Required — GPS mandatory on mobile</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Trusted Networks Toggle */}
        <Card className="border border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Trusted Network Policy</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Verify employee location by IP address. Punches from trusted IPs are marked "Verified".
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Enable Trusted Network Checking</p>
                <p className="text-xs text-muted-foreground">Compare employee IP against configured trusted CIDR ranges</p>
              </div>
              <Controller
                name="attendanceTrustedNetworkEnabled"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
            {trustedNetworkEnabled && (
              <div className="space-y-2 max-w-sm">
                <Label className="text-sm font-medium">Network Enforcement Mode</Label>
                <Controller
                  name="attendanceTrustedNetworkPolicy"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">None — No enforcement, just log</SelectItem>
                        <SelectItem value="WARN">Warn — Flag punch but allow it</SelectItem>
                        <SelectItem value="REQUIRE">Block — Deny punch from untrusted IPs</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end pt-0">
            <Button type="submit" disabled={!isDirty || updateSettings.isPending}>
              {updateSettings.isPending ? 'Saving...' : 'Save Policy'}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Trusted Networks List */}
      <Card className="border border-border/60">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Wifi className="w-4 h-4" /> Trusted IP Networks
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Configure office/branch network IP ranges. Employees punching from these ranges get a "Verified" trust badge.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setNetworkDialogOpen(true)} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Add Network
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {networksLoading ? (
            <div className="p-6 text-muted-foreground text-sm">Loading networks...</div>
          ) : networks?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Wifi className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No trusted networks configured yet.</p>
              <p className="text-xs mt-1">Add your office IP ranges to enable location verification.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>CIDR</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {networks?.map((net: any) => (
                  <TableRow key={net.id}>
                    <TableCell className="font-medium text-sm">{net.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{net.cidr}</code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{net.description || '—'}</TableCell>
                    <TableCell>
                      {net.isActive ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                          <CheckCircle2 className="w-2.5 h-2.5 mr-1" />Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleToggleNetwork(net.id, net.isActive)}
                        >
                          {net.isActive ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => handleDeleteNetwork(net.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      <NetworkDialog open={networkDialogOpen} onOpenChange={setNetworkDialogOpen} />
    </div>
  );
}
