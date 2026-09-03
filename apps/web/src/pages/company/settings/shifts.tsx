import * as React from 'react';
import { useShifts, useCreateShift, useUpdateShift, useAssignShift } from '@/features/company/hooks/use-shifts-queries';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { useEmployees } from '@/features/company/hooks/use-employee-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Settings2, Clock, Trash2, Edit, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

export function AdminShiftsPage() {
  const { data: shifts, isLoading } = useShifts();
  const createShift = useCreateShift();
  const updateShift = useUpdateShift();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = React.useState(false);
  const [editingShiftId, setEditingShiftId] = React.useState<string | null>(null);

  const { data: employees } = useEmployees();
  const assignShift = useAssignShift();

  // Form state
  const [name, setName] = React.useState('');
  const [startTime, setStartTime] = React.useState('09:00');
  const [endTime, setEndTime] = React.useState('17:00');
  const [type, setType] = React.useState<'FIXED' | 'FLEXIBLE' | 'ROTATING'>('FIXED');
  const [gracePeriod, setGracePeriod] = React.useState('15');

  // Assignment state
  const [selectedEmployees, setSelectedEmployees] = React.useState<string[]>([]);
  const [assignShiftId, setAssignShiftId] = React.useState<string>('');
  const [assignEffectiveFrom, setAssignEffectiveFrom] = React.useState('');
  const [assignEffectiveTo, setAssignEffectiveTo] = React.useState('');

  const handleOpenEdit = (shift: any) => {
    setEditingShiftId(shift.id);
    setName(shift.name);
    setStartTime(shift.startTime);
    setEndTime(shift.endTime);
    setType(shift.type);
    setGracePeriod(String(shift.gracePeriodMinutes));
    setIsDialogOpen(true);
  };

  const handleOpenNew = () => {
    setEditingShiftId(null);
    setName('');
    setStartTime('09:00');
    setEndTime('17:00');
    setType('FIXED');
    setGracePeriod('15');
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name,
      startTime,
      endTime,
      type,
      gracePeriodMinutes: parseInt(gracePeriod) || 0,
      color: '#4CAF50', // Default color for now
    };

    if (editingShiftId) {
      updateShift.mutate(
        { id: editingShiftId, ...data },
        {
          onSuccess: () => {
            toast.success('Shift updated successfully');
            setIsDialogOpen(false);
          },
        }
      );
    } else {
      createShift.mutate(data, {
        onSuccess: () => {
          toast.success('Shift created successfully');
          setIsDialogOpen(false);
        },
      });
    }
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmployees.length === 0) {
      toast.error('Please select at least one employee');
      return;
    }
    assignShift.mutate(
      {
        employeeIds: selectedEmployees,
        shiftId: assignShiftId,
        effectiveFrom: assignEffectiveFrom,
        ...(assignEffectiveTo ? { effectiveTo: assignEffectiveTo } : {}),
      },
      {
        onSuccess: () => {
          toast.success('Shift assigned successfully');
          setIsAssignDialogOpen(false);
          setSelectedEmployees([]);
          setAssignShiftId('');
          setAssignEffectiveFrom('');
          setAssignEffectiveTo('');
        },
      }
    );
  };

  if (isLoading) return <div className="p-8">Loading shifts...</div>;

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Settings', path: 'settings' },
          { label: 'Shifts Config' },
        ]}
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shift Configuration</h1>
          <p className="text-muted-foreground">Manage organizational shift templates and schedules.</p>
        </div>

        <div className="flex gap-2">
          <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Assign Shift
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Assign Shift</DialogTitle>
                <DialogDescription>
                  Assign a shift schedule to employees.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAssignSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Shift</Label>
                  <Select value={assignShiftId} onValueChange={setAssignShiftId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift..." />
                    </SelectTrigger>
                    <SelectContent>
                      {shifts?.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Employees</Label>
                  <div className="h-32 overflow-y-auto border rounded-md p-2 space-y-2">
                    {employees?.map((emp: any) => (
                      <div key={emp.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={emp.id} 
                          checked={selectedEmployees.includes(emp.id)}
                          onCheckedChange={(c) => {
                            if (c) setSelectedEmployees(p => [...p, emp.id]);
                            else setSelectedEmployees(p => p.filter(id => id !== emp.id));
                          }}
                        />
                        <label htmlFor={emp.id} className="text-sm cursor-pointer">
                          {emp.user.firstName} {emp.user.lastName} ({emp.employeeCode})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Effective From</Label>
                    <Input
                      type="date"
                      value={assignEffectiveFrom}
                      onChange={(e) => setAssignEffectiveFrom(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Effective To (Optional)</Label>
                    <Input
                      type="date"
                      value={assignEffectiveTo}
                      onChange={(e) => setAssignEffectiveTo(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={assignShift.isPending || !assignShiftId || !assignEffectiveFrom || selectedEmployees.length === 0}>
                    {assignShift.isPending ? 'Assigning...' : 'Assign'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenNew}>
                <Plus className="mr-2 h-4 w-4" />
                New Shift
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingShiftId ? 'Edit Shift' : 'Create Shift'}</DialogTitle>
              <DialogDescription>
                Define the standard hours and rules for this shift template.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Shift Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Morning Shift"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Shift Type</Label>
                <Select value={type} onValueChange={(val: any) => setType(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Fixed Hours</SelectItem>
                    <SelectItem value="FLEXIBLE">Flexible Hours</SelectItem>
                    <SelectItem value="ROTATING">Rotating Shift</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grace">Grace Period (Minutes)</Label>
                <Input
                  id="grace"
                  type="number"
                  min="0"
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(e.target.value)}
                  required
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createShift.isPending || updateShift.isPending}>
                  {createShift.isPending || updateShift.isPending ? 'Saving...' : 'Save Shift'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {shifts?.map((shift) => (
          <Card key={shift.id} className="relative overflow-hidden transition-all hover:shadow-md">
            <div className={`absolute left-0 top-0 h-full w-1.5`} style={{ backgroundColor: shift.color }} />
            <CardHeader className="pb-3 pl-6">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{shift.name}</CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-1">
                    <Settings2 className="h-3 w-3" />
                    {shift.type} Shift
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleOpenEdit(shift)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pl-6">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {shift.startTime} - {shift.endTime}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>Grace Period: {shift.gracePeriodMinutes} mins</span>
                {shift.isActive ? (
                  <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-1 text-green-600 font-medium">Active</span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-1 text-red-600 font-medium">Inactive</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {shifts?.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">No shifts configured yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
