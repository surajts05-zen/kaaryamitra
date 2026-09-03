import React, { useState } from 'react';
import { 
  useEmployeeCompensation, 
  useReviseCompensation, 
  useEmployeeCompensationHistory,
  useSalaryStructures 
} from '@/features/company/hooks/use-compensation-queries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, History, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function EmployeeCompensationTab({ employeeId }: { employeeId: string }) {
  const { data: profile, isLoading } = useEmployeeCompensation(employeeId);
  const { data: history } = useEmployeeCompensationHistory(employeeId);
  const { data: structures } = useSalaryStructures();
  
  const reviseMutation = useReviseCompensation();
  
  const [isReviseModalOpen, setIsReviseModalOpen] = useState(false);
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);
  const [annualCTC, setAnnualCTC] = useState<number>(0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const handleRevise = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const struct = structures?.find((s: any) => s.id === selectedStructureId);
    
    if (!struct) {
      toast.error('Please select a structure');
      return;
    }

    const ctc = Number(formData.get('annualCTC'));
    const monthlyGross = ctc / 12;

    // Auto-calculate components based on structure (simplified for MVP)
    const items = struct.items.map((item: any) => {
      let amount = 0;
      if (item.calculationType === 'FIXED') {
        amount = item.value;
      } else if (item.calculationType === 'PERCENTAGE') {
        if (item.percentageBase === 'BASIC') {
          // Hardcode assuming BASIC is roughly 50% for this simplified MVP demo, 
          // a real engine would topological-sort the dependencies
          amount = (monthlyGross * 0.5) * (item.value / 100);
        } else if (!item.percentageBase) {
          amount = monthlyGross * (item.value / 100);
        }
      }
      return {
        componentId: item.componentId,
        amount
      };
    });

    const data = {
      structureId: selectedStructureId,
      effectiveFrom: new Date(formData.get('effectiveFrom') as string).toISOString(),
      annualCTC: ctc,
      monthlyGross,
      reason: formData.get('reason') as string,
      bankName: formData.get('bankName') as string,
      accountNumber: formData.get('accountNumber') as string,
      routingNumber: formData.get('routingNumber') as string,
      accountType: formData.get('accountType') as string,
      items
    };

    try {
      await reviseMutation.mutateAsync({ employeeId, data });
      toast.success('Compensation revised successfully');
      setIsReviseModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to revise compensation');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Compensation Profile</h3>
        <Button onClick={() => {
          setSelectedStructureId(profile?.structureId || null);
          setAnnualCTC(profile?.annualCTC || 0);
          setIsReviseModalOpen(true);
        }}>
          <Calculator className="w-4 h-4 mr-2" /> Revise Compensation
        </Button>
      </div>

      {!profile ? (
        <Card className="bg-muted/30">
          <CardContent className="py-10 text-center text-muted-foreground">
            No active compensation profile. Click 'Revise Compensation' to set one up.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Current Package</CardTitle>
              <CardDescription>Effective since {format(new Date(profile.effectiveFrom), 'PPP')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Annual CTC</span>
                  <span className="text-xl font-bold">{formatCurrency(profile.annualCTC)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Monthly Gross</span>
                  <span className="font-medium">{formatCurrency(profile.monthlyGross)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Structure</span>
                  <span className="font-medium">{profile.structure?.name || 'Custom'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Bank Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-1 text-sm">
                  <span className="text-muted-foreground">Bank Name</span>
                  <span className="font-medium">{profile.bankName || 'Not provided'}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  <span className="text-muted-foreground">Account No.</span>
                  <span className="font-medium">{profile.accountNumber || 'Not provided'}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  <span className="text-muted-foreground">IFSC / Routing</span>
                  <span className="font-medium">{profile.routingNumber || 'Not provided'}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  <span className="text-muted-foreground">Account Type</span>
                  <span className="font-medium">{profile.accountType || 'Not provided'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-full">
            <CardHeader className="pb-3">
              <CardTitle>Monthly Breakdown</CardTitle>
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
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary">
                          {item.component.type.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
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
                  <TableHead>Previous CTC</TableHead>
                  <TableHead>New CTC</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((rev: any) => (
                  <TableRow key={rev.id}>
                    <TableCell>{format(new Date(rev.effectiveDate), 'PPP')}</TableCell>
                    <TableCell>{rev.reason}</TableCell>
                    <TableCell>{rev.previousCTC ? formatCurrency(rev.previousCTC) : '-'}</TableCell>
                    <TableCell className="font-medium text-green-600">{formatCurrency(rev.newCTC)}</TableCell>
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

      <Dialog open={isReviseModalOpen} onOpenChange={setIsReviseModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{profile ? 'Revise Compensation' : 'Set Initial Compensation'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRevise} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Structure Template</Label>
                <Select 
                  value={selectedStructureId || ''} 
                  onValueChange={setSelectedStructureId}
                >
                  <SelectTrigger><SelectValue placeholder="Select structure" /></SelectTrigger>
                  <SelectContent>
                    {structures?.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Annual CTC</Label>
                <Input 
                  name="annualCTC" 
                  type="number" 
                  required 
                  min="0"
                  value={annualCTC}
                  onChange={(e) => setAnnualCTC(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Effective From Date</Label>
                <Input name="effectiveFrom" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="space-y-2">
                <Label>Revision Reason</Label>
                <Input name="reason" required placeholder="e.g. Annual Appraisal, Promotion" />
              </div>
            </div>

            <h4 className="font-semibold border-b pb-1 mt-4">Bank Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input name="bankName" defaultValue={profile?.bankName || ''} placeholder="e.g. HDFC Bank" />
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input name="accountNumber" defaultValue={profile?.accountNumber || ''} />
              </div>
              <div className="space-y-2">
                <Label>IFSC / Routing Number</Label>
                <Input name="routingNumber" defaultValue={profile?.routingNumber || ''} />
              </div>
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select name="accountType" defaultValue={profile?.accountType || 'Savings'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Savings">Savings</SelectItem>
                    <SelectItem value="Current">Current</SelectItem>
                    <SelectItem value="Salary">Salary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsReviseModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={reviseMutation.isPending}>
                {reviseMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirm Revision
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
