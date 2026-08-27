import { Link } from 'react-router-dom';
import { useEmployees } from '@/features/company/hooks/use-employee-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Search, Plus, UserCircle } from 'lucide-react';
import { useState } from 'react';

export function DirectoryPage() {
  const { data: employees, isLoading } = useEmployees();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = employees?.filter((emp: any) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           emp.workEmail.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Employee Directory</h2>
          <p className="text-muted-foreground">Manage your organization's workforce.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link to="new">
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle>All Employees</CardTitle>
            <CardDescription>A complete list of active employees.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
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
    </div>
  );
}
