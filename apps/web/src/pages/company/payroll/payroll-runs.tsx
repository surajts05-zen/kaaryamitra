import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePayrollRuns, useCreatePayrollRun } from '@/features/company/hooks/use-payroll-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, PlayCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function PayrollRunsPage() {
  const { data: runs, isLoading } = usePayrollRuns();
  const createMutation = useCreatePayrollRun();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { slug } = useParams<{ slug: string }>();

  const formatCurrency = (amount: any) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(amount) || 0);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      periodStart: new Date(formData.get('periodStart') as string).toISOString(),
      periodEnd: new Date(formData.get('periodEnd') as string).toISOString(),
      frequency: formData.get('frequency') as string,
      paymentDate: new Date(formData.get('paymentDate') as string).toISOString(),
    };

    try {
      await createMutation.mutateAsync(data);
      toast.success('Payroll run started successfully');
      setIsCreateModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start payroll run');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800';
      case 'REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'FINALIZED': return 'bg-purple-100 text-purple-800';
      case 'PAID': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Processing</h1>
          <p className="text-muted-foreground mt-1">
            Run and manage payroll cycles for your organization.
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 bg-primary">
          <PlayCircle className="w-4 h-4" />
          Run Payroll
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run Name</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead className="text-right">Net Payout</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : runs?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No payroll runs found. Click 'Run Payroll' to start your first cycle.
                  </TableCell>
                </TableRow>
              ) : (
                runs?.map((run: any) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-medium">{run.name}</TableCell>
                    <TableCell>
                      {run.periodStart && run.periodEnd 
                        ? `${format(new Date(run.periodStart), 'MMM d, yyyy')} - ${format(new Date(run.periodEnd), 'MMM d, yyyy')}`
                        : run.period}
                    </TableCell>
                    <TableCell>{run.paymentDate ? format(new Date(run.paymentDate), 'MMM d, yyyy') : 'N/A'}</TableCell>
                    <TableCell>{run._count.entries}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(run.totalNet)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(run.status)}`}>
                        {run.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/t/${slug}/payroll/${run.id}`}>
                          <Eye className="w-4 h-4 mr-2" /> View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Payroll Run</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Run Name</Label>
              <Input name="name" required placeholder="e.g. October 2026 Salary" defaultValue={`Salary - ${format(new Date(), 'MMMM yyyy')}`} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Period Start</Label>
                <Input name="periodStart" type="date" required />
              </div>
              <div className="space-y-2">
                <Label>Period End</Label>
                <Input name="periodEnd" type="date" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select name="frequency" defaultValue="MONTHLY" required>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="BI_WEEKLY">Bi-Weekly</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Date</Label>
                <Input name="paymentDate" type="date" required />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Generate Payroll
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
