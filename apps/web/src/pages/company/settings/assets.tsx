import { useState } from 'react';
import { useAssetCategories, useCreateAssetCategory, useAssets, useCreateAsset, useBulkCreateAssets } from '@/features/company/hooks/use-asset-queries';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { CsvImportModal } from '@/components/ui/csv-import-modal';

export function AssetSettings() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6 max-w-5xl">
      <Breadcrumb
        items={[
          { label: 'Settings', path: 'settings' },
          { label: 'Asset Management' },
        ]}
      />

      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Asset Management</h2>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory">
          <AssetInventoryTab />
        </TabsContent>
        
        <TabsContent value="categories">
          <AssetCategoriesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AssetCategoriesTab() {
  const { data: categories, isLoading } = useAssetCategories();
  const createMutation = useCreateAssetCategory();
  const [newCat, setNewCat] = useState('');

  const handleAdd = () => {
    if (!newCat.trim()) {
      toast.error('Please enter a category name first');
      return;
    }
    createMutation.mutate({ name: newCat }, {
      onSuccess: () => {
        setNewCat('');
        toast.success('Asset Category added');
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.error?.message || err.message || 'Failed to add asset category');
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Categories</CardTitle>
        <CardDescription>Define categories like Laptops, Monitors, Access Cards.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input 
            placeholder="e.g. Laptops" 
            value={newCat} 
            onChange={e => setNewCat(e.target.value)} 
          />
          <Button onClick={handleAdd} disabled={createMutation.isPending}>Add</Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category Name</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={2} className="text-center">Loading...</TableCell></TableRow>
            ) : categories?.length === 0 ? (
              <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No categories defined.</TableCell></TableRow>
            ) : (
              categories?.map((cat: any) => (
                <TableRow key={cat.id}>
                  <TableCell>{cat.name}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AssetInventoryTab() {
  const { data: assets, isLoading: isLoadingAssets } = useAssets();
  const { data: categories, isLoading: isLoadingCategories } = useAssetCategories();
  const createMutation = useCreateAsset();
  const bulkCreateMutation = useBulkCreateAssets();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [categoryId, setCategoryId] = useState('');
  
  const handleAdd = () => {
    if (!name.trim() || !categoryId) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    createMutation.mutate({
      name,
      serialNumber,
      categoryId
    }, {
      onSuccess: () => {
        toast.success('Asset added to inventory');
        setIsOpen(false);
        setName('');
        setSerialNumber('');
        setCategoryId('');
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.error?.message || err.message || 'Failed to add asset');
      }
    });
  };

  const handleBulkImport = async (rows: Record<string, string>[]) => {
    const items = rows.map(r => ({
      name: r.name,
      category: r.category,
      serialNumber: r.serialNumber,
      assetTag: r.assetTag,
      status: r.status,
    }));

    const res = await bulkCreateMutation.mutateAsync(items);
    toast.success(`Successfully imported ${res.count} assets`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Asset Inventory</CardTitle>
          <CardDescription>Manage individual assets and track their assignment status.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsCsvModalOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" /> Import CSV
          </Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>Add Asset</Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Asset</DialogTitle>
              <DialogDescription>Add a physical item to the company inventory.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Asset Name <span className="text-red-500">*</span></label>
                <Input placeholder="e.g. MacBook Pro M2" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category <span className="text-red-500">*</span></label>
                <select 
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={categoryId} 
                  onChange={e => setCategoryId(e.target.value)}
                >
                  <option value="">-- Select Category --</option>
                  {categories?.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Serial Number / Asset Tag</label>
                <Input placeholder="e.g. SN-12345" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={createMutation.isPending || !name.trim() || !categoryId}>
                {createMutation.isPending ? 'Saving...' : 'Save Asset'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Serial No</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingAssets || isLoadingCategories ? (
              <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
            ) : assets?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Inventory is empty. Add an asset to get started.</TableCell></TableRow>
            ) : (
              assets?.map((asset: any) => (
                <TableRow key={asset.id}>
                  <TableCell className="font-medium">{asset.name}</TableCell>
                  <TableCell>{asset.serialNumber || '-'}</TableCell>
                  <TableCell>{asset.category?.name}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      asset.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {asset.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {asset.assignedTo ? `${asset.assignedTo.firstName} ${asset.assignedTo.lastName}` : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onOpenChange={setIsCsvModalOpen}
        title="Import Asset Inventory"
        description="Upload a CSV file containing company physical assets and hardware."
        sampleFilename="assets"
        headers={[
          { key: 'name', label: 'Asset Name', required: true },
          { key: 'category', label: 'Category Name', required: false },
          { key: 'serialNumber', label: 'Serial Number', required: false },
          { key: 'assetTag', label: 'Asset Tag', required: false },
          { key: 'status', label: 'Status (AVAILABLE|ASSIGNED|REPAIR|RETIRED)', required: false },
        ]}
        sampleRows={[
          ['MacBook Pro M3', 'Laptops', 'SN-998877', 'TAG-001', 'AVAILABLE'],
          ['Dell UltraSharp 27"', 'Monitors', 'SN-443322', 'TAG-002', 'AVAILABLE'],
        ]}
        onImport={handleBulkImport}
        isLoading={bulkCreateMutation.isPending}
      />
    </Card>
  );
}
