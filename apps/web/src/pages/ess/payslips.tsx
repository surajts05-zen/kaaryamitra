import React from 'react';
import { useMyPayslips, useMyPayslipDetails } from '@/features/company/hooks/use-payroll-queries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Download, Receipt, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Breadcrumb } from '@/components/ui/breadcrumb';

function PayslipPreviewModal({ payslipId, open, onOpenChange }: { payslipId: string | null, open: boolean, onOpenChange: (o: boolean) => void }) {
  const { data: payslip, isLoading } = useMyPayslipDetails(payslipId || '');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
  };

  if (!open || !payslipId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center pr-6">
            <span>Payslip: Period {payslip?.payrollRun?.period || ''}</span>
            <Button size="sm" variant="outline" disabled={isLoading} onClick={() => window.print()}>
              <Download className="w-4 h-4 mr-2" /> Download PDF
            </Button>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : payslip ? (
          <div className="space-y-6 print:block">
            <div className="flex justify-between border-b pb-4">
              <div>
                <h3 className="font-bold text-xl">{payslip.employee?.department?.name || 'KaaryaMitra HRMS'}</h3>
                <p className="text-sm text-muted-foreground">Generated on {format(new Date(), 'PP')}</p>
              </div>
              <div className="text-right text-sm">
                <p><span className="font-medium">Period:</span> {payslip.payrollRun?.period}</p>
                <p><span className="font-medium">Working Days:</span> {payslip.workingDays} (LOP: {payslip.lopDays})</p>
                <p><span className="font-medium">Status:</span> {payslip.payrollRun?.status}</p>
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><span className="font-medium text-muted-foreground">Employee Name:</span> {payslip.employee?.firstName} {payslip.employee?.lastName}</p>
                <p><span className="font-medium text-muted-foreground">Designation:</span> {payslip.employee?.designation?.name || '-'}</p>
              </div>
              <div>
                <p><span className="font-medium text-muted-foreground">Bank Name:</span> {payslip.employee?.compensationProfile?.bankName || '-'}</p>
                <p><span className="font-medium text-muted-foreground">Account No:</span> {payslip.employee?.compensationProfile?.accountNumber || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold border-b pb-2 mb-3 text-green-700">Earnings</h4>
                <div className="space-y-2 text-sm">
                  {payslip.lineItems?.filter((i: any) => i.type === 'EARNING').map((item: any) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.name}</span>
                      <span>{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold pt-2 border-t mt-4">
                    <span>Total Earnings</span>
                    <span className="text-green-700">{formatCurrency(payslip.grossEarnings)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold border-b pb-2 mb-3 text-red-700">Deductions</h4>
                <div className="space-y-2 text-sm">
                  {payslip.lineItems?.filter((i: any) => i.type === 'DEDUCTION' || i.type === 'EMPLOYEE_CONTRIBUTION').map((item: any) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.name}</span>
                      <span>{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  {payslip.lineItems?.filter((i: any) => i.type === 'DEDUCTION' || i.type === 'EMPLOYEE_CONTRIBUTION').length === 0 && (
                    <div className="text-muted-foreground italic text-center py-2">No deductions</div>
                  )}
                  <div className="flex justify-between font-bold pt-2 border-t mt-4">
                    <span>Total Deductions</span>
                    <span className="text-red-700">{formatCurrency(payslip.totalDeductions)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg flex justify-between items-center mt-6">
              <span className="font-bold text-lg">Net Payable Amount</span>
              <span className="font-bold text-2xl text-primary">{formatCurrency(payslip.netPay)}</span>
            </div>
            
            <p className="text-center text-xs text-muted-foreground mt-8 italic">
              This is a system generated document. No signature is required.
            </p>
          </div>
        ) : (
          <div className="py-10 text-center text-muted-foreground">Failed to load payslip</div>
        )}
        
        <DialogFooter className="print:hidden">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MyPayslipsPage() {
  const { data: payslips, isLoading } = useMyPayslips();
  const [selectedPayslipId, setSelectedPayslipId] = React.useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Breadcrumb items={[{ label: 'My Payslips' }]} backPath="dashboard" backLabel="Back to Dashboard" />
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Payslips</h1>
        <p className="text-muted-foreground mt-1">
          View and download your monthly salary slips.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" /> Payslip History
          </CardTitle>
          <CardDescription>All your finalized payroll entries</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payroll Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Gross Pay</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right font-bold">Net Pay</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : payslips?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No payslips available yet.
                  </TableCell>
                </TableRow>
              ) : (
                payslips?.map((slip: any) => (
                  <TableRow key={slip.id}>
                    <TableCell className="font-medium">{slip.payrollRun?.period || 'Period'}</TableCell>
                    <TableCell>{slip.payrollRun?.status}</TableCell>
                    <TableCell className="text-right">{formatCurrency(slip.grossEarnings)}</TableCell>
                    <TableCell className="text-right text-red-600/80">{formatCurrency(slip.totalDeductions)}</TableCell>
                    <TableCell className="text-right font-bold text-green-700">{formatCurrency(slip.netPay)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelectedPayslipId(slip.id)}>
                        View <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PayslipPreviewModal 
        payslipId={selectedPayslipId} 
        open={!!selectedPayslipId} 
        onOpenChange={(o) => { if (!o) setSelectedPayslipId(null); }} 
      />
    </div>
  );
}
