import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  useHolidays, 
  useCreateHoliday, 
  useDeleteHoliday, 
  useBulkCreateHolidays 
} from '@/features/company/hooks/use-holidays-queries';
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
import { Trash2, Plus, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { CsvImportModal } from '@/components/ui/csv-import-modal';

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
  const bulkCreateMutation = useBulkCreateHolidays();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

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

  const handleBulkImport = async (rows: Record<string, string>[]) => {
    const items = rows
      .filter(r => r.name && r.date)
      .map(r => ({
        name: r.name!,
        date: r.date!,
        type: (r.type?.toUpperCase() === 'OPTIONAL' ? 'OPTIONAL' : 'PUBLIC'),
      }));

    const res = await bulkCreateMutation.mutateAsync(items);
    toast.success(`Successfully imported ${res.count} holidays`);
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
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Holiday Calendar</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage public holidays and optional time-off dates for your organization.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setIsCsvModalOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" /> Import CSV
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Add Holiday
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

      <CsvImportModal
        isOpen={isCsvModalOpen}
        onOpenChange={setIsCsvModalOpen}
        title="Import Holiday Calendar"
        description="Upload a CSV file containing annual public and optional holidays."
        sampleFilename="holidays"
        headers={[
          { key: 'name', label: 'Holiday Name', required: true },
          { key: 'date', label: 'Date (YYYY-MM-DD)', required: true },
          { key: 'type', label: 'Type (PUBLIC or OPTIONAL)', required: false },
        ]}
        sampleRows={[
          ['New Year Day', '2026-01-01', 'PUBLIC'],
          ['Good Friday', '2026-04-03', 'OPTIONAL'],
          ['Independence Day', '2026-08-15', 'PUBLIC'],
        ]}
        onImport={handleBulkImport}
        isLoading={bulkCreateMutation.isPending}
      />
    </div>
  );
}
