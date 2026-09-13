import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useBudgetRequest } from '@/features/budgets/budgets.service';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface BudgetRequestDetailsModalProps {
  id: string | null;
  onClose: () => void;
}

export function BudgetRequestDetailsModal({ id, onClose }: BudgetRequestDetailsModalProps) {
  const { data: request, isLoading } = useBudgetRequest(id || undefined);

  if (!id) return null;

  return (
    <Dialog open={!!id} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Budget Request Details: {request?.requestNumber}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-gray-500">Loading details...</div>
        ) : request ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Project</p>
                <p className="font-medium">{request.project?.name || 'General'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant={
                  request.status === 'APPROVED' ? 'default' : 
                  request.status === 'REJECTED' ? 'destructive' : 
                  request.status === 'SUBMITTED' ? 'secondary' : 'outline'
                }>
                  {request.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Requested</p>
                <p className="font-medium">₹{Number(request.requestedAmount).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Objective</p>
                <p className="font-medium">{request.objective || '-'}</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Line Items</h3>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Cost</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {request.lineItems?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.category?.name || '-'}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">₹{Number(item.unitCost).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium">₹{Number(item.requestedAmount).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {request.businessJustification && (
              <div>
                <h3 className="font-medium mb-1">Business Justification</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{request.businessJustification}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">Request not found.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
