import { useState } from 'react';
import { useProjects, useBulkCreateProject } from '@/features/projects/projects.service';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, FolderGit2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { NewProjectModal } from './components/new-project-modal';
import { CsvImportButton } from '@/components/ui/csv-import-button';

export function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const bulkCreateMutation = useBulkCreateProject();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FolderGit2 className="h-6 w-6 text-primary" />
            Projects
          </h1>
          <p className="text-gray-500 mt-1">Manage company projects, milestones, and members.</p>
        </div>
        <div className="flex items-center gap-2">
          <CsvImportButton 
            title="Import Projects"
            label="Import CSV"
            sampleCsv={`name,code,description,status,priority,approvedBudget\nInternal Operations FY26,INT-FY26,Default operational bucket,ACTIVE,MEDIUM,100000\nMarketing Campaign Q4,MKT-Q4,Q4 ad spends,ACTIVE,HIGH,50000`}
            isLoading={bulkCreateMutation.isPending}
            onDataParsed={async (data) => {
              try {
                const mappedData = data.filter(d => d.name && d.code).map(d => ({
                  name: d.name,
                  code: d.code,
                  description: d.description,
                  status: d.status || 'ACTIVE',
                  priority: d.priority || 'MEDIUM',
                  approvedBudget: Number(d.approvedbudget || d.approvedBudget || 0),
                  currentBudget: Number(d.currentbudget || d.currentBudget || 0),
                  startDate: d.startdate || d.startDate || undefined,
                  plannedEndDate: d.plannedenddate || d.plannedEndDate || undefined,
                }));
                if (mappedData.length === 0) throw new Error('No valid rows found. Ensure CSV has "name" and "code" headers.');
                
                await bulkCreateMutation.mutateAsync(mappedData);
                toast.success(`Successfully imported ${mappedData.length} projects`);
              } catch (error: any) {
                toast.error(error.message || 'Failed to import CSV');
              }
            }} 
          />
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Project Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="text-right">Budget</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Loading projects...
                </TableCell>
              </TableRow>
            ) : projects?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No projects found.
                </TableCell>
              </TableRow>
            ) : (
              projects?.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-mono text-sm">{project.code}</TableCell>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>
                    <Badge variant={project.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={project.priority === 'HIGH' || project.priority === 'CRITICAL' ? 'destructive' : 'outline'}>
                      {project.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{Number(project.approvedBudget || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/company/projects/${project.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
      
      <NewProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
