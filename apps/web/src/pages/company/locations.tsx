import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocations, useCreateLocation } from '@/features/company/hooks/use-org-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  city: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().default('Asia/Kolkata'),
});

type FormValues = z.infer<typeof schema>;

export function LocationsPage() {
  const { data: locations, isLoading } = useLocations();
  const createMutation = useCreateLocation();
  const [isOpen, setIsOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { timezone: 'Asia/Kolkata' }
  });

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Location added');
        setIsOpen(false);
        reset();
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.error?.message || 'Failed to add location');
      }
    });
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Locations</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <MapPin className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Office Location</DialogTitle>
              <DialogDescription>Define a new physical or virtual office location.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Location Name (e.g., HQ, Bangalore Office)</Label>
                <Input placeholder="HQ" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input placeholder="Bangalore" {...register('city')} />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input placeholder="India" {...register('country')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input placeholder="Asia/Kolkata" {...register('timezone')} />
                {errors.timezone && <p className="text-xs text-destructive">{errors.timezone.message}</p>}
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Offices</CardTitle>
          <CardDescription>All registered workspaces and offices for this organization.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>City/Country</TableHead>
                <TableHead>Timezone</TableHead>
                <TableHead className="text-right">Employees</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">Loading...</TableCell>
                </TableRow>
              ) : !locations?.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No locations found.</TableCell>
                </TableRow>
              ) : (
                locations.map((loc: any) => (
                  <TableRow key={loc.id}>
                    <TableCell className="font-medium">{loc.name}</TableCell>
                    <TableCell>{loc.city ? `${loc.city}, ${loc.country || ''}` : '-'}</TableCell>
                    <TableCell><code className="bg-muted px-1 py-0.5 rounded text-xs">{loc.timezone}</code></TableCell>
                    <TableCell className="text-right">{loc._count?.employees || 0}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
