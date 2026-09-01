import { useState } from 'react';
import { useAssets, useEmployeeAssets, useAssignAsset } from '@/features/company/hooks/use-assets-queries';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

export function EmployeeAssetsTab({ employeeId }: { employeeId: string }) {
  const { data: allAssets, isLoading: isLoadingAll } = useAssets();
  const { data: employeeAssets, isLoading: isLoadingEmp } = useEmployeeAssets(employeeId);
  const assignMutation = useAssignAsset();
  
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState('');

  const availableAssets = allAssets?.filter((a: any) => !a.employeeId) || [];

  const handleAssign = () => {
    if (!selectedAssetId) return;
    assignMutation.mutate({ id: selectedAssetId, employeeId }, {
      onSuccess: () => {
        toast.success('Asset assigned successfully');
        setIsAssignOpen(false);
        setSelectedAssetId('');
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.error?.message || err.message || 'Failed to assign asset');
      }
    });
  };

  const handleReturn = (assetId: string) => {
    assignMutation.mutate({ id: assetId, employeeId: null }, {
      onSuccess: () => {
        toast.success('Asset marked as returned');
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.error?.message || err.message || 'Failed to return asset');
      }
    });
  };

  if (isLoadingEmp || isLoadingAll) {
    return <div className="p-8 text-center text-muted-foreground">Loading assets...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Assigned Assets</h3>
          <p className="text-sm text-muted-foreground">Manage hardware and items provided to this employee.</p>
        </div>
        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
          <DialogTrigger asChild>
            <Button>Assign Asset</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Asset</DialogTitle>
              <DialogDescription>
                Select an unassigned asset from the company inventory.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <select 
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={selectedAssetId}
                onChange={e => setSelectedAssetId(e.target.value)}
              >
                <option value="">-- Select Asset --</option>
                {availableAssets.map((asset: any) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} {asset.serialNumber ? `(${asset.serialNumber})` : ''} - {asset.category?.name}
                  </option>
                ))}
              </select>
              {availableAssets.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">No unassigned assets available. Please add more to the inventory first.</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
              <Button onClick={handleAssign} disabled={!selectedAssetId || assignMutation.isPending}>
                {assignMutation.isPending ? 'Assigning...' : 'Assign'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset Name</TableHead>
              <TableHead>Serial Number</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employeeAssets?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  No assets currently assigned to this employee.
                </TableCell>
              </TableRow>
            ) : (
              employeeAssets?.map((asset: any) => (
                <TableRow key={asset.id}>
                  <TableCell className="font-medium">{asset.name}</TableCell>
                  <TableCell>{asset.serialNumber || '-'}</TableCell>
                  <TableCell>{asset.category?.name || 'Unknown'}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleReturn(asset.id)}
                      disabled={assignMutation.isPending}
                    >
                      Return
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
