import React, { useState } from 'react';
import { useMyPayslips, useMyPayslipDetails } from '@/features/company/hooks/use-payroll-queries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, CreditCard, X, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrency } from '@/hooks/use-currency';
import { cn } from '@/lib/utils';

function MobilePayslipPreview({ payslipId, open, onClose }: { payslipId: string | null, open: boolean, onClose: () => void }) {
  const { data: payslip, isLoading } = useMyPayslipDetails(payslipId || '');
  const { formatCurrency } = useCurrency();

  if (!open || !payslipId) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-background w-full rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom flex flex-col h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div>
            <h3 className="font-bold">Payslip Details</h3>
            <p className="text-xs text-muted-foreground">Period: {payslip?.payrollRun?.period || '...'}</p>
          </div>
          <div className="flex gap-2">
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-primary/10 text-primary" onClick={() => window.print()}>
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full bg-muted">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
          ) : payslip ? (
            <div className="space-y-6">
              <div className="bg-primary/5 p-4 rounded-xl text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Net Payable</p>
                <p className="text-3xl font-bold" style={{ color: payslip.settings?.themeColor || 'inherit' }}>
                  {formatCurrency(payslip.netPay)}
                </p>
                <div className="flex justify-center gap-4 mt-3 text-[10px] text-muted-foreground">
                  <span>Work Days: {payslip.workingDays}</span>
                  <span>LOP: {payslip.lopDays}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">Earnings</h4>
                <div className="bg-muted/30 rounded-xl p-1">
                  {payslip.lineItems?.filter((i: any) => i.type === 'EARNING').map((item: any) => (
                    <div key={item.id} className="flex justify-between p-2.5 text-sm border-b border-border/50 last:border-0">
                      <span>{item.name}</span>
                      <span className="font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between p-2.5 text-sm font-bold bg-emerald-50/50 text-emerald-700 rounded-b-lg">
                    <span>Total Earnings</span>
                    <span>{formatCurrency(payslip.grossEarnings)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">Deductions</h4>
                <div className="bg-muted/30 rounded-xl p-1">
                  {payslip.lineItems?.filter((i: any) => i.type === 'DEDUCTION' || i.type === 'EMPLOYEE_CONTRIBUTION').map((item: any) => (
                    <div key={item.id} className="flex justify-between p-2.5 text-sm border-b border-border/50 last:border-0">
                      <span>{item.name}</span>
                      <span className="font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  {payslip.lineItems?.filter((i: any) => i.type === 'DEDUCTION' || i.type === 'EMPLOYEE_CONTRIBUTION').length === 0 && (
                    <div className="p-2.5 text-sm text-center text-muted-foreground italic">No deductions</div>
                  )}
                  <div className="flex justify-between p-2.5 text-sm font-bold bg-rose-50/50 text-rose-700 rounded-b-lg">
                    <span>Total Deductions</span>
                    <span>{formatCurrency(payslip.totalDeductions)}</span>
                  </div>
                </div>
              </div>
              
              <div className="pb-10 pt-4 text-center">
                <p className="text-[10px] text-muted-foreground italic px-6">
                  {payslip.settings?.customMessage || 'This is a system generated document. No signature is required.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">Failed to load payslip</div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MobileMyPayslips() {
  const { data: payslips, isLoading } = useMyPayslips();
  const [selectedPayslipId, setSelectedPayslipId] = useState<string | null>(null);
  const { formatCurrency } = useCurrency();

  return (
    <div className="flex flex-col space-y-4 pb-24">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" /> Payslips
        </h2>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : payslips?.length === 0 ? (
          <Card className="border-dashed bg-muted/30">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No payslips available yet.
            </CardContent>
          </Card>
        ) : (
          payslips?.map((slip: any) => (
            <Card 
              key={slip.id} 
              className="border-muted/60 shadow-sm overflow-hidden active:scale-[0.98] transition-transform cursor-pointer"
              onClick={() => setSelectedPayslipId(slip.id)}
            >
              <CardContent className="p-0 flex items-center">
                <div className="p-4 flex-1">
                  <p className="font-bold text-sm mb-0.5">{slip.payrollRun?.period || 'Period'}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">{slip.payrollRun?.status}</p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-muted-foreground">Gross:</span> <span className="font-medium">{formatCurrency(slip.grossEarnings)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Net:</span> <span className="font-bold text-emerald-600">{formatCurrency(slip.netPay)}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-muted/20 border-l flex items-center justify-center h-full">
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <MobilePayslipPreview 
        payslipId={selectedPayslipId} 
        open={!!selectedPayslipId} 
        onClose={() => setSelectedPayslipId(null)} 
      />
    </div>
  );
}
