import { useState, useEffect } from 'react';
import { useBudgetRequests, useArchiveBudgetRequest } from '@/features/budgets/budgets.service';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Archive } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BudgetRequestModal } from './components/budget-request-modal';
import { BudgetRequestDetailsModal } from './components/budget-request-details-modal';
import { toast } from 'sonner';
import { useCurrency } from '@/hooks/use-currency';

export function BudgetRequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: requests, isLoading } = useBudgetRequests();
  const archiveMutation = useArchiveBudgetRequest();
  const { formatCurrency } = useCurrency();
  
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [viewingRequestId, setViewingRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsNewModalOpen(true);
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

  const activeRequests = requests?.filter((req: any) => !req.isArchived) || [];
  const archivedRequests = requests?.filter((req: any) => req.isArchived) || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Budget Requests
          </h1>
          <p className="text-gray-500 mt-1">Submit and track budget approvals.</p>
        </div>
        <Button onClick={() => setIsNewModalOpen(true)}>
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
                      <TableCell className="text-right space-x-2">
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
        isOpen={isNewModalOpen} 
        onClose={() => setIsNewModalOpen(false)} 
      />

      <BudgetRequestDetailsModal
        id={viewingRequestId}
        onClose={() => setViewingRequestId(null)}
      />
    </div>
  );
}
