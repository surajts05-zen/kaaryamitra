import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useHolidays, useCreateHoliday, useDeleteHoliday, Holiday } from '@/features/company/hooks/use-holidays-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  date: z.string().min(1, 'Date is required'),
  type: z.enum(['PUBLIC', 'OPTIONAL']),
});

type FormValues = z.infer<typeof schema>;

export function HolidaysSettingsPage() {
  const { data: holidays, isLoading } = useHolidays();
  const createMutation = useCreateHoliday();
  const deleteMutation = useDeleteHoliday();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'PUBLIC' }
  });

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Holiday created successfully');
        setIsDialogOpen(false);
        reset();
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.error?.message || 'Failed to create holiday');
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this holiday?')) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success('Holiday deleted'),
    });
  };

  if (isLoading) return <div className="p-8">Loading holidays...</div>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <Breadcrumb
        items={[
          { label: 'Settings', path: 'settings' },
          { label: 'Holiday Calendar' },
        ]}
      />

      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Holiday Calendar</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Holiday
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Holiday</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Holiday Name</Label>
                <Input {...register('name')} placeholder="e.g. Christmas" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" {...register('date')} />
                {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={watch('type')} onValueChange={(val: 'PUBLIC' | 'OPTIONAL') => setValue('type', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                    <SelectItem value="OPTIONAL">Optional</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : 'Save Holiday'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holidays?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No holidays defined.
                </TableCell>
              </TableRow>
            ) : (
              holidays?.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.name}</TableCell>
                  <TableCell>{format(new Date(h.date), 'PP')}</TableCell>
                  <TableCell>{h.type}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(h.id)} disabled={deleteMutation.isPending}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
