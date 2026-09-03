import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePayrollRun, useUpdatePayrollRunStatus, useUploadPayrollCsv } from '@/features/company/hooks/use-payroll-queries';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, Download, CheckCircle, Clock, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function PayrollRunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: run, isLoading } = usePayrollRun(id as string);
  const updateStatus = useUpdatePayrollRunStatus();
  const uploadCsv = useUploadPayrollCsv();
  
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [uploadResult, setUploadResult] = React.useState<any>(null);

  const formatCurrency = (amount: any) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(amount) || 0);
  };

  const handleStatusChange = async (status: string) => {
    try {
      await updateStatus.mutateAsync({ id: id as string, data: { status } });
      toast.success(`Payroll status updated to ${status}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      const res = await uploadCsv.mutateAsync({ id: id as string, file: selectedFile });
      setUploadResult(res);
      toast.success(res.message);
      setSelectedFile(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload CSV');
    }
  };

  if (isLoading) {
    return <div className="p-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!run) {
    return <div className="p-10 text-center text-muted-foreground">Run not found</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="../">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight">{run.name}</h2>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 border">
                {run.status}
              </span>
            </div>
            <p className="text-muted-foreground mt-1">
              Period: {run.periodStart && run.periodEnd 
                ? `${format(new Date(run.periodStart), 'MMM d, yyyy')} to ${format(new Date(run.periodEnd), 'MMM d, yyyy')}` 
                : run.period}
              <span className="mx-2">•</span> 
              Payment: {run.paymentDate ? format(new Date(run.paymentDate), 'MMM d, yyyy') : 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {run.status === 'DRAFT' && (
            <>
              <Button onClick={() => setIsUploadOpen(true)} variant="outline">
                <Upload className="w-4 h-4 mr-2" /> Upload CSV
              </Button>
              <Button onClick={() => handleStatusChange('REVIEW')} variant="outline">
                Submit for Review
              </Button>
            </>
          )}
          {run.status === 'REVIEW' && (
            <>
              <Button onClick={() => handleStatusChange('DRAFT')} variant="ghost">Reject</Button>
              <Button onClick={() => handleStatusChange('APPROVED')} className="bg-green-600 hover:bg-green-700">Approve Payroll</Button>
            </>
          )}
          {run.status === 'APPROVED' && (
            <Button onClick={() => handleStatusChange('FINALIZED')} className="bg-purple-600 hover:bg-purple-700">
              <CheckCircle className="w-4 h-4 mr-2" /> Finalize (Lock)
            </Button>
          )}
          {run.status === 'FINALIZED' && (
            <Button onClick={() => handleStatusChange('PAID')} className="bg-emerald-600 hover:bg-emerald-700">
              <Clock className="w-4 h-4 mr-2" /> Mark as Paid
            </Button>
          )}
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" /> Bank Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Gross Pay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(run.totalGross ?? 0)}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-red-50 border-red-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600/80">Total Deductions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">{formatCurrency(run.totalDeductions ?? 0)}</div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600/80">Net Payout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{formatCurrency(run.totalNet ?? 0)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Breakdown</CardTitle>
          <CardDescription>{run.entries.length} employees processed in this run</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Name</TableHead>
                <TableHead>Payable Days</TableHead>
                <TableHead className="text-right">Gross Earnings</TableHead>
                <TableHead className="text-right text-red-600">Deductions</TableHead>
                <TableHead className="text-right font-bold text-green-600">Net Pay</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {run.entries.map((entry: any) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    {entry.employee.firstName} {entry.employee.lastName}
                    <div className="text-xs text-muted-foreground">{entry.employee.workEmail}</div>
                  </TableCell>
                  <TableCell>{entry.workingDays}</TableCell>
                  <TableCell className="text-right">{formatCurrency(entry.grossEarnings)}</TableCell>
                  <TableCell className="text-right text-red-600">{formatCurrency(entry.totalDeductions)}</TableCell>
                  <TableCell className="text-right font-bold text-green-600">{formatCurrency(entry.netPay)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isUploadOpen} onOpenChange={(open) => {
        setIsUploadOpen(open);
        if (!open) setUploadResult(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Payroll CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV with columns: <b>EmployeeEmail, WorkingDays, GrossEarnings, TotalDeductions, NetPay</b> and any other components.
            </DialogDescription>
          </DialogHeader>

          {uploadResult ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 text-green-800 rounded-md">
                Successfully processed {uploadResult.successful} records.
              </div>
              {uploadResult.skipped?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-600">Skipped Records:</h4>
                  <ul className="text-sm space-y-1 max-h-40 overflow-y-auto bg-red-50 p-2 rounded-md">
                    {uploadResult.skipped.map((s: any, i: number) => (
                      <li key={i}>
                        <b>{s.email}</b>: {s.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <DialogFooter>
                <Button onClick={() => setIsUploadOpen(false)}>Close</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Input type="file" accept=".csv" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                <Button onClick={handleUpload} disabled={!selectedFile || uploadCsv.isPending}>
                  {uploadCsv.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Upload
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
