import { useState } from 'react';
import { useAssets, useBulkCreateAssets } from '@/features/company/hooks/use-asset-queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Link, useParams } from 'react-router-dom';
import { Laptop, Search, Plus, Monitor, Smartphone, Key, Upload } from 'lucide-react';
import { CsvImportModal } from '@/components/ui/csv-import-modal';
import { toast } from 'sonner';

export default function AssetDirectory() {
  const { slug } = useParams();
  const [search, setSearch] = useState('');
  const { data: assets, isLoading } = useAssets({ search });
  const bulkCreateMutation = useBulkCreateAssets();
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  const handleBulkImport = async (rows: Record<string, string>[]) => {
    const items = rows.map(r => ({
      name: r.name || r['Asset Name'] || r.assetName || '',
      category: r.category || r['Category Name'] || r.categoryName || '',
      serialNumber: r.serialNumber || r['Serial Number'] || r.serialnumber || '',
      assetTag: r.assetTag || r['Asset Tag'] || r.assettag || '',
      status: r.status || r['Status'] || 'AVAILABLE',
    }));

    const res = await bulkCreateMutation.mutateAsync(items);
    toast.success(`Successfully imported ${res.count} assets`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'MAINTENANCE': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'RETIRED': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      case 'LOST': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('laptop') || name.includes('computer')) return <Laptop className="h-4 w-4" />;
    if (name.includes('monitor') || name.includes('display')) return <Monitor className="h-4 w-4" />;
    if (name.includes('phone') || name.includes('mobile')) return <Smartphone className="h-4 w-4" />;
    if (name.includes('access') || name.includes('card') || name.includes('key')) return <Key className="h-4 w-4" />;
    return <Laptop className="h-4 w-4" />;
  };

  return (
    <div className="p-6 w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asset Directory</h1>
          <p className="text-muted-foreground mt-1">Manage company assets and track assignments.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setIsCsvModalOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" /> Import CSV
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/t/${slug}/settings/assets`}>Categories</Link>
          </Button>
          <Button asChild>
            <Link to={`/t/${slug}/settings/assets`}>
              <Plus className="mr-2 h-4 w-4" /> Add Asset
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>All Assets</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, serial, or tag..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Name</TableHead>
                <TableHead>Identifier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Loading assets...
                  </TableCell>
                </TableRow>
              ) : assets?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No assets found.
                  </TableCell>
                </TableRow>
              ) : (
                assets?.map((asset: any) => (
                  <TableRow key={asset.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link to={`/t/${slug}/assets/${asset.id}`} className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-primary/10 text-primary">
                          {getCategoryIcon(asset.category?.name || '')}
                        </div>
                        <div>
                          <div className="font-medium text-foreground hover:underline">{asset.name}</div>
                          <div className="text-xs text-muted-foreground">{asset.category?.name}</div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {asset.assetTag && <div className="font-mono text-xs">Tag: {asset.assetTag}</div>}
                        {asset.serialNumber && <div className="font-mono text-xs text-muted-foreground">SN: {asset.serialNumber}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(asset.status)}>
                        {asset.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {asset.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                            {asset.assignedTo.firstName[0]}
                          </div>
                          <span className="text-sm font-medium">
                            {asset.assignedTo.firstName} {asset.assignedTo.lastName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/t/${slug}/assets/${asset.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CsvImportModal
        isOpen={isCsvModalOpen}
        onOpenChange={setIsCsvModalOpen}
        title="Import Asset Inventory"
        description="Upload a CSV file containing company physical assets and hardware."
        sampleFilename="assets_sample"
        headers={[
          { key: 'name', label: 'Asset Name', required: true },
          { key: 'category', label: 'Category Name', required: false },
          { key: 'serialNumber', label: 'Serial Number', required: false },
          { key: 'assetTag', label: 'Asset Tag', required: false },
          { key: 'status', label: 'Status (AVAILABLE|ASSIGNED|MAINTENANCE|RETIRED|LOST)', required: false },
        ]}
        sampleRows={[
          ['MacBook Pro M3', 'Laptops', 'SN-998877', 'TAG-001', 'AVAILABLE'],
          ['Dell UltraSharp 27"', 'Monitors', 'SN-443322', 'TAG-002', 'AVAILABLE'],
          ['Logitech MX Master 3S', 'Peripherals', 'SN-112233', 'TAG-003', 'AVAILABLE'],
        ]}
        onImport={handleBulkImport}
        isLoading={bulkCreateMutation.isPending}
      />
    </div>
  );
}
