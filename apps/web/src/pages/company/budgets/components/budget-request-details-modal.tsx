import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useBudgetRequest, useRecallBudgetRequest, useSubmitBudgetRequest, BudgetRequest } from '@/features/budgets/budgets.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCurrency } from '@/hooks/use-currency';
import { Edit, RotateCcw, Send, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface BudgetRequestDetailsModalProps {
  id: string | null;
  onClose: () => void;
  onEdit?: (request: BudgetRequest) => void;
}

export function BudgetRequestDetailsModal({ id, onClose, onEdit }: BudgetRequestDetailsModalProps) {
  const { data: request, isLoading } = useBudgetRequest(id || undefined);
  const recallMutation = useRecallBudgetRequest();
  const submitMutation = useSubmitBudgetRequest();
  const { formatCurrency } = useCurrency();

  if (!id) return null;

  const handleRecall = async () => {
    try {
      await recallMutation.mutateAsync(id);
      toast.success('Budget request recalled to draft status');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to recall request');
    }
  };

  const handleSubmit = async () => {
    try {
      await submitMutation.mutateAsync(id);
      toast.success('Budget request submitted for approval');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    }
  };

  return (
    <Dialog open={!!id} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Budget Request Details: {request?.requestNumber}
            {request && (
              <Badge variant={
                request.status === 'APPROVED' ? 'default' : 
                request.status === 'REJECTED' ? 'destructive' : 
                request.status === 'SUBMITTED' ? 'secondary' : 'outline'
              }>
                {request.status}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-gray-500">Loading details...</div>
        ) : request ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-lg border">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Project</p>
                <p className="font-medium text-sm mt-0.5">{request.project?.name || 'General'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Cost Center</p>
                <p className="font-medium text-sm mt-0.5">{request.costCenter?.name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Total Requested</p>
                <p className="font-semibold text-base text-primary mt-0.5">{formatCurrency(request.requestedAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Priority & Type</p>
                <p className="font-medium text-sm mt-0.5">{request.priority} • {request.requestType}</p>
              </div>
            </div>

            {request.objective && (
              <div>
                <h3 className="font-medium text-sm mb-1">Objective</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-muted/30 p-3 rounded-md">{request.objective}</p>
              </div>
            )}

            <div>
              <h3 className="font-medium text-sm mb-2">Line Items</h3>
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
                        <TableCell className="text-right">{formatCurrency(item.unitCost)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.requestedAmount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {request.businessJustification && (
              <div>
                <h3 className="font-medium text-sm mb-1">Business Justification</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-muted/30 p-3 rounded-md">{request.businessJustification}</p>
              </div>
            )}

            {/* Approval History & Comments */}
            {request.workflowInstance?.actions && request.workflowInstance.actions.length > 0 && (
              <div>
                <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Approval & Revision History
                </h3>
                <div className="space-y-2 border rounded-md p-3 bg-muted/20">
                  {request.workflowInstance.actions.map((act) => (
                    <div key={act.id} className="text-xs border-b last:border-0 pb-2 last:pb-0">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold capitalize text-gray-800 dark:text-gray-200">
                          {act.action === 'returned' ? '⚠️ Returned for Revision' : act.action}
                        </span>
                        <span className="text-muted-foreground">{new Date(act.createdAt).toLocaleString()}</span>
                      </div>
                      {act.comment && (
                        <p className="text-muted-foreground mt-1 bg-background p-2 rounded border">
                          "{act.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter className="flex justify-end gap-2 pt-2 border-t">
              {request.status === 'DRAFT' && (
                <>
                  {onEdit && (
                    <Button variant="outline" onClick={() => { onEdit(request); onClose(); }}>
                      <Edit className="h-4 w-4 mr-1.5" /> Edit Request
                    </Button>
                  )}
                  <Button onClick={handleSubmit} disabled={submitMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                    <Send className="h-4 w-4 mr-1.5" /> Submit Request
                  </Button>
                </>
              )}
              {(request.status === 'SUBMITTED' || request.status === 'UNDER_REVIEW') && (
                <Button variant="outline" className="text-amber-600 border-amber-300 hover:bg-amber-50" onClick={handleRecall} disabled={recallMutation.isPending}>
                  <RotateCcw className="h-4 w-4 mr-1.5" /> Recall to Draft
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>Close</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">Request not found.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
