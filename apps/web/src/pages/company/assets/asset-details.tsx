import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAssetDetails, useUpdateAsset, useDeleteAsset, useAssignAsset, useReturnAsset } from '@/features/company/hooks/use-asset-queries';
import { useEmployees } from '@/features/company/hooks/use-employee-queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function AssetDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: asset, isLoading } = useAssetDetails(id!);
  const { data: employees } = useEmployees({});

  const assignAsset = useAssignAsset();
  const returnAsset = useReturnAsset();
  const deleteAsset = useDeleteAsset();
  const updateAsset = useUpdateAsset();

  const [assignOpen, setAssignOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [notes, setNotes] = useState('');
  const [returnCondition, setReturnCondition] = useState('GOOD');

  if (isLoading) return <div className="p-8 text-center">Loading asset details...</div>;
  if (!asset) return <div className="p-8 text-center text-red-500">Asset not found.</div>;

  const handleAssign = async () => {
    await assignAsset.mutateAsync({ id: asset.id, employeeId: selectedEmployee, notes });
    setAssignOpen(false);
    setSelectedEmployee('');
    setNotes('');
  };

  const handleReturn = async () => {
    await returnAsset.mutateAsync({ id: asset.id, returnCondition, notes });
    setReturnOpen(false);
    setNotes('');
  };

  const handleMarkMaintenance = async () => {
    await updateAsset.mutateAsync({ id: asset.id, data: { status: 'MAINTENANCE' } });
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this asset?')) {
      await deleteAsset.mutateAsync(asset.id);
      navigate('../');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('../')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{asset.name}</h1>
            <Badge variant="outline">{asset.status}</Badge>
          </div>
          <p className="text-muted-foreground">{asset.category?.name}</p>
        </div>
        <div className="flex gap-2">
          {asset.status === 'AVAILABLE' && (
            <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
              <DialogTrigger asChild>
                <Button>Assign Asset</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Asset</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Select Employee</Label>
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an employee..." />
                      </SelectTrigger>
                      <SelectContent>
                        {employees?.map((emp: any) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName} ({emp.employeeCode || emp.workEmail})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Assignment Notes (Optional)</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Condition, accessories included..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
                  <Button onClick={handleAssign} disabled={!selectedEmployee || assignAsset.isPending}>
                    {assignAsset.isPending ? 'Assigning...' : 'Assign'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {asset.status === 'ASSIGNED' && (
            <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Process Return</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Return Asset</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Return Condition</Label>
                    <Select value={returnCondition} onValueChange={setReturnCondition}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GOOD">Good / Working</SelectItem>
                        <SelectItem value="DAMAGED">Damaged</SelectItem>
                        <SelectItem value="LOST">Lost / Not Returned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe condition..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setReturnOpen(false)}>Cancel</Button>
                  <Button onClick={handleReturn} disabled={returnAsset.isPending}>
                    Confirm Return
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Asset Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Asset Tag</div>
              <div className="font-mono">{asset.assetTag || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Serial Number</div>
              <div className="font-mono">{asset.serialNumber || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Purchase Date</div>
              <div>{asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Warranty Expiry</div>
              <div>{asset.warrantyExpiryDate ? new Date(asset.warrantyExpiryDate).toLocaleDateString() : 'N/A'}</div>
            </div>
            
            <hr className="my-4 border-muted" />
            
            <div className="flex flex-col gap-2 pt-2">
              {asset.status === 'AVAILABLE' && (
                <Button variant="outline" size="sm" onClick={handleMarkMaintenance} disabled={updateAsset.isPending}>
                  Send to Maintenance
                </Button>
              )}
              {asset.status === 'MAINTENANCE' && (
                <Button variant="outline" size="sm" onClick={() => updateAsset.mutateAsync({ id: asset.id, data: { status: 'AVAILABLE' } })}>
                  Mark as Available
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={asset.status === 'ASSIGNED'}>
                Delete Asset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Assignment History</CardTitle>
            <CardDescription>Timeline of this asset's assignments.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {asset.assignments?.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No assignment history yet.
                </div>
              ) : (
                asset.assignments?.map((assignment: any) => (
                  <div key={assignment.id} className="relative pl-6 pb-6 border-l last:border-0 last:pb-0">
                    <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-primary" />
                    
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          Assigned to {assignment.employee.firstName} {assignment.employee.lastName}
                          <Badge variant="secondary" className="text-xs">
                            {assignment.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {new Date(assignment.assignedAt).toLocaleDateString()} by {assignment.assignedBy.firstName}
                        </div>
                      </div>
                    </div>

                    <div className="text-sm space-y-1 mt-3 p-3 bg-muted/50 rounded-md">
                      {assignment.acknowledgedAt && (
                        <div className="text-green-600 dark:text-green-400">
                          ✓ Acknowledged on {new Date(assignment.acknowledgedAt).toLocaleDateString()}
                        </div>
                      )}
                      {assignment.returnedAt && (
                        <div>
                          <strong>Returned:</strong> {new Date(assignment.returnedAt).toLocaleDateString()}
                          <span className="ml-2 px-1.5 py-0.5 bg-background border rounded text-xs">{assignment.returnCondition}</span>
                        </div>
                      )}
                      {assignment.notes && (
                        <div className="mt-2 text-muted-foreground whitespace-pre-wrap">
                          <strong>Notes:</strong> {assignment.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
