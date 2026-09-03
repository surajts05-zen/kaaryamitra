import React from 'react';
import { useMyCompensation, useMyCompensationHistory } from '@/features/company/hooks/use-compensation-queries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, History, IndianRupee, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

export default function MyCompensationPage() {
  const { data: profile, isLoading } = useMyCompensation();
  const { data: history } = useMyCompensationHistory();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Compensation</h1>
        <p className="text-muted-foreground mt-1">
          View your current compensation structure and history.
        </p>
      </div>

      {!profile ? (
        <Card className="bg-muted/30">
          <CardContent className="py-10 text-center flex flex-col items-center text-muted-foreground">
            <ShieldCheck className="w-12 h-12 mb-4 text-muted" />
            <p className="text-lg font-medium">No compensation details available</p>
            <p className="text-sm">Your compensation profile has not been set up or published yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-primary" /> Current Package
              </CardTitle>
              <CardDescription>Effective since {format(new Date(profile.effectiveFrom), 'PPP')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-primary/10">
                  <span className="text-muted-foreground font-medium">Annual CTC</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(profile.annualCTC)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-primary/10">
                  <span className="text-muted-foreground font-medium">Monthly Gross</span>
                  <span className="text-lg font-semibold">{formatCurrency(profile.monthlyGross)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Disbursement Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                  <span className="text-muted-foreground col-span-1">Bank Name</span>
                  <span className="font-medium col-span-2 text-right">{profile.bankName || '-'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                  <span className="text-muted-foreground col-span-1">Account No.</span>
                  <span className="font-medium col-span-2 text-right">
                    {profile.accountNumber ? `••••${profile.accountNumber.slice(-4)}` : '-'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                  <span className="text-muted-foreground col-span-1">IFSC / Routing</span>
                  <span className="font-medium col-span-2 text-right">{profile.routingNumber || '-'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="text-muted-foreground col-span-1">Account Type</span>
                  <span className="font-medium col-span-2 text-right">{profile.accountType || '-'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-full">
            <CardHeader className="pb-3">
              <CardTitle>Monthly Salary Breakdown</CardTitle>
              <CardDescription>Estimated gross earnings and standard deductions</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profile.items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.component.name}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.component.type === 'EARNING' ? 'bg-green-100 text-green-700' :
                          item.component.type === 'DEDUCTION' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {item.component.type.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {history && history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" /> Revision History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>New CTC</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((rev: any) => (
                  <TableRow key={rev.id}>
                    <TableCell className="font-medium">{format(new Date(rev.effectiveDate), 'PPP')}</TableCell>
                    <TableCell>{rev.reason}</TableCell>
                    <TableCell>{formatCurrency(rev.newCTC)}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {rev.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
