import { useState } from 'react';
import { 
  useCostCenters, 
  useBudgetCategories, 
  useCreateCostCenter, 
  useCreateBudgetCategory,
  useBulkCreateCostCenter,
  useBulkCreateBudgetCategory
} from '@/features/budgets/budgets.service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { CsvImportButton } from '@/components/ui/csv-import-button';

function CostCentersTab() {
  const { data: costCenters, isLoading } = useCostCenters();
  const createMutation = useCreateCostCenter();
  const bulkCreateMutation = useBulkCreateCostCenter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({ name, code, isActive: true });
      toast.success('Cost center created successfully');
      setIsOpen(false);
      setName('');
      setCode('');
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || 'Failed to create cost center');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Cost Centers</h2>
        <div className="flex items-center gap-2">
          <CsvImportButton 
            title="Import Cost Centers"
            label="Import CSV"
            sampleCsv={`name,code,isActive\nEngineering & Technology,ENG-01,true\nSales & Marketing,SLS-01,true`}
            isLoading={bulkCreateMutation.isPending}
            onDataParsed={async (data) => {
              try {
                // Ensure data maps to name, code
                const mappedData = data.filter(d => d.name && d.code).map(d => ({
                  name: d.name,
                  code: d.code,
                  isActive: d.isactive !== 'false' && d.isActive !== 'false' && d.isactive !== '0' && d.isActive !== '0'
                }));
                if (mappedData.length === 0) throw new Error('No valid rows found. Ensure CSV has "name" and "code" headers.');
                
                await bulkCreateMutation.mutateAsync(mappedData);
                toast.success(`Successfully imported ${mappedData.length} cost centers`);
              } catch (error: any) {
                toast.error(error.message || 'Failed to import CSV');
              }
            }} 
          />
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Add Cost Center</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Cost Center</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Marketing" />
                </div>
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input required value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. MKT-001" />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending}>Save</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={3} className="text-center">Loading...</TableCell></TableRow>
          ) : costCenters?.length === 0 ? (
            <TableRow><TableCell colSpan={3} className="text-center text-gray-500">No cost centers defined.</TableCell></TableRow>
          ) : (
            costCenters?.map(cc => (
              <TableRow key={cc.id}>
                <TableCell className="font-medium">{cc.code}</TableCell>
                <TableCell>{cc.name}</TableCell>
                <TableCell>
                  <Badge variant={cc.isActive ? 'default' : 'secondary'}>{cc.isActive ? 'Active' : 'Inactive'}</Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function BudgetCategoriesTab() {
  const { data: categories, isLoading } = useBudgetCategories();
  const createMutation = useCreateBudgetCategory();
  const bulkCreateMutation = useBulkCreateBudgetCategory();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [capexOpex, setCapexOpex] = useState<'CAPEX' | 'OPEX'>('OPEX');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({ name, code, capexOpex, isActive: true });
      toast.success('Budget category created successfully');
      setIsOpen(false);
      setName('');
      setCode('');
      setCapexOpex('OPEX');
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || 'Failed to create budget category');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Budget Categories</h2>
        <div className="flex items-center gap-2">
          <CsvImportButton 
            title="Import Budget Categories"
            label="Import CSV"
            sampleCsv={`name,code,capexOpex,isActive\nSoftware Subscriptions,SW-OPEX,OPEX,true\nHardware & Equipment,HW-CAPEX,CAPEX,true`}
            isLoading={bulkCreateMutation.isPending}
            onDataParsed={async (data) => {
              try {
                const mappedData = data.filter(d => d.name && d.code).map(d => ({
                  name: d.name,
                  code: d.code,
                  capexOpex: (d.capexopex?.toUpperCase() === 'CAPEX' || d.capexOpex?.toUpperCase() === 'CAPEX' ? 'CAPEX' : 'OPEX'),
                  isActive: d.isactive !== 'false' && d.isActive !== 'false' && d.isactive !== '0' && d.isActive !== '0'
                }));
                if (mappedData.length === 0) throw new Error('No valid rows found. Ensure CSV has "name", "code", and "capexOpex" headers.');
                
                await bulkCreateMutation.mutateAsync(mappedData);
                toast.success(`Successfully imported ${mappedData.length} budget categories`);
              } catch (error: any) {
                toast.error(error.message || 'Failed to import CSV');
              }
            }} 
          />
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Add Category</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Budget Category</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Software Licenses" />
                </div>
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input required value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. SW-LIC" />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={capexOpex} onValueChange={(val: any) => setCapexOpex(val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEX">OPEX (Operational)</SelectItem>
                      <SelectItem value="CAPEX">CAPEX (Capital)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending}>Save</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
          ) : categories?.length === 0 ? (
            <TableRow><TableCell colSpan={4} className="text-center text-gray-500">No categories defined.</TableCell></TableRow>
          ) : (
            categories?.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.code}</TableCell>
                <TableCell>{c.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{c.capexOpex}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={c.isActive ? 'default' : 'secondary'}>{c.isActive ? 'Active' : 'Inactive'}</Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function FinanceSettingsPage() {
  return (
    <div className="p-6 w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Finance & Budget Settings</h1>
        <p className="text-gray-500 mt-1">Manage cost centers, budget categories, and financial configurations.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="cost-centers">
            <TabsList className="mb-6">
              <TabsTrigger value="cost-centers">Cost Centers</TabsTrigger>
              <TabsTrigger value="categories">Budget Categories</TabsTrigger>
            </TabsList>
            
            <TabsContent value="cost-centers">
              <CostCentersTab />
            </TabsContent>
            
            <TabsContent value="categories">
              <BudgetCategoriesTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
