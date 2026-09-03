import { Link } from 'react-router-dom';
import { useEmployees, useBulkCreateEmployees } from '@/features/company/hooks/use-employee-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, List, Network, Upload } from 'lucide-react';
import { useState } from 'react';
import { OrgChartView } from './org-chart-view';
import { CsvImportModal } from '@/components/ui/csv-import-modal';
import { toast } from 'sonner';

export function DirectoryPage() {
  const { data: employees, isLoading } = useEmployees();
  const bulkCreateMutation = useBulkCreateEmployees();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  const filteredEmployees = employees?.filter((emp: any) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           emp.workEmail.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  const handleBulkImport = async (rows: Record<string, string>[]) => {
    const items = rows.map(r => ({
      firstName: r.firstName || r['First Name'] || r['firstname'] || '',
      lastName: r.lastName || r['Last Name'] || r['lastname'] || '',
      workEmail: r.workEmail || r['Work Email'] || r['workemail'] || r['email'] || '',
      employeeCode: r.employeeCode || r['Employee Code'] || r['employeecode'] || '',
      joiningDate: r.joiningDate || r['Joining Date (YYYY-MM-DD)'] || r['Joining Date'] || r['joiningdate'] || '',
      role: r.role || r['System Role (Employee|HR Manager|Manager)'] || r['System Role'] || r['Role'] || '',
      managerEmail: r.managerEmail || r['Manager Email or Code'] || r['Manager Email'] || r['Manager'] || r.manager || '',
    }));

    const res = await bulkCreateMutation.mutateAsync(items);
    toast.success(`Successfully imported ${res.count} employees`);
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Employee Directory</h2>
          <p className="text-muted-foreground">Manage your organization's workforce.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsCsvModalOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button asChild>
            <Link to="new">
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              List View
            </TabsTrigger>
            <TabsTrigger value="org-chart" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Org Chart
            </TabsTrigger>
          </TabsList>
          
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              className="pl-8 w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="list" className="space-y-4 m-0">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="space-y-1">
                <CardTitle>All Employees</CardTitle>
                <CardDescription>A complete list of active employees.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">Loading employees...</TableCell>
                    </TableRow>
                  ) : !filteredEmployees.length ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                        No employees found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((emp: any) => (
                      <TableRow key={emp.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {emp.avatarUrl ? (
                              <img src={emp.avatarUrl} alt={emp.firstName} className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                                {emp.firstName[0]}{emp.lastName[0]}
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{emp.firstName} {emp.lastName}</div>
                              <div className="text-xs text-muted-foreground">{emp.workEmail}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{emp.employeeCode || '-'}</TableCell>
                        <TableCell>{emp.department?.name || '-'}</TableCell>
                        <TableCell>{emp.designation?.name || '-'}</TableCell>
                        <TableCell>{emp.location?.name || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={emp.id}>
                              View Profile
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="org-chart" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle>Organization Chart</CardTitle>
              <CardDescription>Hierarchical view of reporting structures.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center p-8 h-64 flex items-center justify-center text-muted-foreground">
                  Loading org chart...
                </div>
              ) : (
                <OrgChartView employees={filteredEmployees} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CsvImportModal
        isOpen={isCsvModalOpen}
        onOpenChange={setIsCsvModalOpen}
        title="Import Employee Records"
        description="Upload a CSV file containing employee master data."
        sampleFilename="employees"
        headers={[
          { key: 'firstName', label: 'First Name', required: true },
          { key: 'lastName', label: 'Last Name', required: true },
          { key: 'workEmail', label: 'Work Email', required: true },
          { key: 'employeeCode', label: 'Employee Code', required: false },
          { key: 'joiningDate', label: 'Joining Date (YYYY-MM-DD)', required: false },
          { key: 'role', label: 'System Role (Employee|HR Manager|Manager)', required: false },
          { key: 'managerEmail', label: 'Manager Email or Code', required: false },
        ]}
        sampleRows={[
          ['Alice', 'Smith', 'alice.smith@acme.corp', 'EMP-1001', '2026-01-15', 'Manager', ''],
          ['Bob', 'Johnson', 'bob.johnson@acme.corp', 'EMP-1002', '2026-02-01', 'Employee', 'alice.smith@acme.corp'],
        ]}
        onImport={handleBulkImport}
        isLoading={bulkCreateMutation.isPending}
      />
    </div>
  );
}
