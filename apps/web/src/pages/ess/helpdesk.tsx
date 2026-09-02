import React, { useState } from 'react';
import { Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMyTickets, useCreateMyTicket, useEssHelpdeskCategories } from '@/features/company/hooks/use-helpdesk-queries';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export function EssHelpdeskPage() {
  const { data: tickets, isLoading } = useMyTickets();
  const { data: categories } = useEssHelpdeskCategories();
  const createMutation = useCreateMyTicket();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    categoryId: '',
    priority: 'MEDIUM',
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return <Badge variant="outline" className="text-blue-500">Open</Badge>;
      case 'IN_PROGRESS': return <Badge variant="outline" className="text-amber-500">In Progress</Badge>;
      case 'RESOLVED': return <Badge variant="outline" className="text-green-500">Resolved</Badge>;
      case 'CLOSED': return <Badge variant="outline" className="text-gray-500">Closed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'LOW': return <Badge variant="outline">Low</Badge>;
      case 'MEDIUM': return <Badge variant="outline" className="text-blue-500">Medium</Badge>;
      case 'HIGH': return <Badge variant="destructive">High</Badge>;
      case 'URGENT': return <Badge variant="destructive" className="animate-pulse">Urgent</Badge>;
      default: return <Badge>{p}</Badge>;
    }
  };

  const handleSubmit = () => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        setIsModalOpen(false);
        setFormData({ subject: '', description: '', categoryId: '', priority: 'MEDIUM' });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Helpdesk</h2>
          <p className="text-muted-foreground">Raise and track your support tickets.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Raise Ticket
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets?.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center">No tickets found.</TableCell></TableRow>
                ) : (
                  tickets?.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium text-xs text-muted-foreground">
                        #{t.id.slice(-6).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{t.subject}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MessageSquare className="h-3 w-3" /> {t._count?.comments} replies
                        </div>
                      </TableCell>
                      <TableCell>{t.category?.name}</TableCell>
                      <TableCell>{getStatusBadge(t.status)}</TableCell>
                      <TableCell>{getPriorityBadge(t.priority)}</TableCell>
                      <TableCell>{format(new Date(t.createdAt), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <Link to={t.id}>
                          <Button variant="ghost" size="sm">View Thread</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raise a New Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={formData.categoryId} 
                onValueChange={(val) => setFormData({ ...formData, categoryId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(val) => setFormData({ ...formData, priority: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Brief summary of the issue"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed explanation..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.subject || !formData.categoryId || !formData.description || createMutation.isPending}
            >
              Submit Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
