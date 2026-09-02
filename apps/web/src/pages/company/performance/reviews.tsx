import { useState } from 'react';
import { useReviewCycles, useCreateReviewCycle, useStartReviewCycle } from '@/features/company/hooks/use-performance-queries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Play, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';

export function CompanyReviewsPage() {
  const { data: cycles, isLoading } = useReviewCycles();
  const createMutation = useCreateReviewCycle();
  const startMutation = useStartReviewCycle();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'ANNUAL',
    startDate: '',
    endDate: '',
    is360Degree: false,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Badge variant="secondary">Draft</Badge>;
      case 'ACTIVE': return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case 'COMPLETED': return <Badge variant="outline" className="text-primary border-primary">Completed</Badge>;
      case 'CLOSED': return <Badge variant="outline">Closed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const handleSubmit = () => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        setIsModalOpen(false);
        setFormData({ title: '', type: 'ANNUAL', startDate: '', endDate: '', is360Degree: false });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Review Cycles</h2>
          <p className="text-muted-foreground">Manage company-wide performance appraisal cycles.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Cycle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Review Cycles</CardTitle>
          <CardDescription>Track evaluation progress for all periods.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">Loading cycles...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Reviews</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cycles?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No review cycles found. Create one to get started.</TableCell>
                  </TableRow>
                ) : (
                  cycles?.map((cycle: any) => (
                    <TableRow key={cycle.id}>
                      <TableCell className="font-medium">
                        {cycle.title}
                        {cycle.is360Degree && <Badge variant="outline" className="ml-2 text-[10px]">360° Enabled</Badge>}
                      </TableCell>
                      <TableCell>{cycle.type}</TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="mr-1 h-3 w-3" />
                          {format(new Date(cycle.startDate), 'MMM d')} - {format(new Date(cycle.endDate), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>{cycle._count?.reviews || 0}</TableCell>
                      <TableCell>{getStatusBadge(cycle.status)}</TableCell>
                      <TableCell className="text-right">
                        {cycle.status === 'DRAFT' ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => startMutation.mutate(cycle.id)}
                            disabled={startMutation.isPending}
                          >
                            <Play className="mr-1 h-3 w-3" /> Start
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm">View Progress</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* CREATE CYCLE MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Review Cycle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cycle Title</Label>
              <Input 
                placeholder="e.g. 2026 Annual Performance Review" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Review Type</Label>
              <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANNUAL">Annual</SelectItem>
                  <SelectItem value="BIANNUAL">Biannual</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="PROBATION">Probation / Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">360° Feedback</Label>
                <p className="text-xs text-muted-foreground">Allow peers to provide anonymous feedback.</p>
              </div>
              <Switch 
                checked={formData.is360Degree}
                onCheckedChange={v => setFormData({...formData, is360Degree: v})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!formData.title || !formData.startDate || !formData.endDate || createMutation.isPending}>
              Create Cycle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
