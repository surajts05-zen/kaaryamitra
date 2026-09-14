import { useState, useEffect } from 'react';
import { useBudgetRequests, useArchiveBudgetRequest, useRecallBudgetRequest, useSubmitBudgetRequest, BudgetRequest } from '@/features/budgets/budgets.service';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Archive, Edit, RotateCcw, Send } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BudgetRequestModal } from './components/budget-request-modal';
import { BudgetRequestDetailsModal } from './components/budget-request-details-modal';
import { toast } from 'sonner';
import { useCurrency } from '@/hooks/use-currency';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export function BudgetRequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: requests, isLoading } = useBudgetRequests();
  const archiveMutation = useArchiveBudgetRequest();
  const recallMutation = useRecallBudgetRequest();
  const submitMutation = useSubmitBudgetRequest();
  const { formatCurrency } = useCurrency();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<BudgetRequest | null>(null);
  const [viewingRequestId, setViewingRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setEditingRequest(null);
      setIsModalOpen(true);
      // Clean up the URL so it doesn't re-open on refresh
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handleArchive = async (id: string) => {
    try {
      await archiveMutation.mutateAsync(id);
      toast.success('Budget request archived successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to archive request');
    }
  };

  const handleRecall = async (id: string) => {
    try {
      await recallMutation.mutateAsync(id);
      toast.success('Budget request recalled to draft status');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to recall request');
    }
  };

  const handleSubmitDraft = async (id: string) => {
    try {
      await submitMutation.mutateAsync(id);
      toast.success('Budget request submitted for approval');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    }
  };

  const activeRequests = requests?.filter((req: any) => !req.isArchived) || [];
  const archivedRequests = requests?.filter((req: any) => req.isArchived) || [];

  return (
    <div className="p-6 w-full space-y-6">
      <Breadcrumb 
        items={[
          { label: 'Budget Overview', path: 'budgets' }, 
          { label: 'Budget Requests' }
        ]} 
        backPath="budgets" 
        backLabel="Back to Budgets" 
      />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Budget Requests
          </h1>
          <p className="text-gray-500 mt-1">Submit and track budget approvals.</p>
        </div>
        <Button onClick={() => { setEditingRequest(null); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active Requests</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Loading requests...
                    </TableCell>
                  </TableRow>
                ) : activeRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No active requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  activeRequests.map((req: any) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-mono text-sm">{req.requestNumber}</TableCell>
                      <TableCell className="font-medium">{req.requestType}</TableCell>
                      <TableCell>{req.project?.name || 'General'}</TableCell>
                      <TableCell>
                        <Badge variant={
                          req.status === 'APPROVED' ? 'default' : 
                          req.status === 'REJECTED' ? 'destructive' : 
                          req.status === 'SUBMITTED' ? 'secondary' : 'outline'
                        }>
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(req.requestedAmount)}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {req.status === 'DRAFT' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-blue-600 hover:text-blue-700"
                              onClick={() => { setEditingRequest(req); setIsModalOpen(true); }}
                              title="Edit Draft"
                            >
                              <Edit className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-emerald-600 hover:text-emerald-700"
                              onClick={() => handleSubmitDraft(req.id)}
                              disabled={submitMutation.isPending}
                              title="Submit for Approval"
                            >
                              <Send className="h-4 w-4 mr-1" /> Submit
                            </Button>
                          </>
                        )}
                        {(req.status === 'SUBMITTED' || req.status === 'UNDER_REVIEW') && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-amber-600 hover:text-amber-700"
                            onClick={() => handleRecall(req.id)}
                            disabled={recallMutation.isPending}
                            title="Recall to Draft"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" /> Recall
                          </Button>
                        )}
                        {['APPROVED', 'REJECTED', 'CLOSED'].includes(req.status) && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-500 hover:text-red-600"
                            onClick={() => handleArchive(req.id)}
                            disabled={archiveMutation.isPending}
                            title="Archive Request"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setViewingRequestId(req.id)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="archived">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Loading requests...
                    </TableCell>
                  </TableRow>
                ) : archivedRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No archived requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  archivedRequests.map((req: any) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-mono text-sm text-gray-500">{req.requestNumber}</TableCell>
                      <TableCell className="font-medium text-gray-500">{req.requestType}</TableCell>
                      <TableCell className="text-gray-500">{req.project?.name || 'General'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-gray-500">
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-gray-500">
                        {formatCurrency(req.requestedAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setViewingRequestId(req.id)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
      
      <BudgetRequestModal 
        isOpen={isModalOpen} 
        initialData={editingRequest}
        onClose={() => { setIsModalOpen(false); setEditingRequest(null); }} 
      />

      <BudgetRequestDetailsModal
        id={viewingRequestId}
        onClose={() => setViewingRequestId(null)}
      />
    </div>
  );
}
