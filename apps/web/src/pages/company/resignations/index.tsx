import { useResignations, useUpdateResignationStatus } from '@/features/company/hooks/use-resignations-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function ResignationsPage() {
  const { data: resignations, isLoading } = useResignations();
  const updateMutation = useUpdateResignationStatus();

  const handleApprove = (id: string, date: string) => {
    updateMutation.mutate({
      id,
      data: { status: 'APPROVED', approvedLastWorkingDay: date }
    }, {
      onSuccess: () => toast.success('Resignation approved')
    });
  };

  const handleReject = (id: string) => {
    updateMutation.mutate({
      id,
      data: { status: 'REJECTED' }
    }, {
      onSuccess: () => toast.success('Resignation rejected')
    });
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Resignations</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resignation Requests</CardTitle>
          <CardDescription>Manage employee resignations and offboarding clearance.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Submitted On</TableHead>
                <TableHead>Requested LWD</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Clearance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow>
              ) : resignations?.length === 0 ? (
                <TableRow><TableCell colSpan={6}>No resignations found.</TableCell></TableRow>
              ) : (
                resignations?.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.employee.firstName} {r.employee.lastName}
                      <div className="text-xs text-muted-foreground">{r.employee.employeeCode}</div>
                    </TableCell>
                    <TableCell>{format(new Date(r.submittedAt), 'PP')}</TableCell>
                    <TableCell>{format(new Date(r.requestedLastWorkingDay), 'PP')}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'APPROVED' ? 'default' : r.status === 'PENDING' ? 'outline' : 'destructive'}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {r.isClearanceCompleted ? (
                        <Badge variant="default" className="bg-green-600">Cleared</Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-600">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === 'PENDING' && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleApprove(r.id, r.requestedLastWorkingDay)}>Approve</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReject(r.id)}>Reject</Button>
                        </div>
                      )}
                    </TableCell>
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
