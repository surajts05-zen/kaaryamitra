import React, { useState } from 'react';
import { Plus, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMyTickets, useCreateMyTicket, useEssHelpdeskCategories } from '@/features/company/hooks/use-helpdesk-queries';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export function EssHelpdeskPage() {
  const { data: tickets, isLoading } = useMyTickets();
  const { data: categories, isLoading: categoriesLoading } = useEssHelpdeskCategories();
  const createMutation = useCreateMyTicket();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
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

  const handleOpenModal = () => {
    setSubmitError(null);
    setAttempted(false);
    setFormData({ subject: '', description: '', categoryId: '', priority: 'MEDIUM' });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    setAttempted(true);
    if (!isFormValid) return;
    setSubmitError(null);
    createMutation.mutate(formData, {
      onSuccess: () => {
        setIsModalOpen(false);
        setFormData({ subject: '', description: '', categoryId: '', priority: 'MEDIUM' });
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error?.message || 'Failed to submit ticket. Please try again.';
        setSubmitError(msg);
      }
    });
  };

  const isFormValid = !!(formData.subject.trim() && formData.categoryId && formData.description.trim());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Helpdesk</h2>
          <p className="text-muted-foreground">Raise and track your support tickets.</p>
        </div>
        <Button onClick={handleOpenModal}>
          <Plus className="mr-2 h-4 w-4" /> Raise Ticket
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Tickets</CardTitle>
          <CardDescription>All support requests raised by you.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
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
                {!tickets || tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No tickets found. Raise one using the button above.
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets.map((t: any) => (
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
            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Category <span className="text-destructive">*</span></Label>
              <Select
                value={formData.categoryId}
                onValueChange={(val) => setFormData({ ...formData, categoryId: val })}
                disabled={categoriesLoading}
              >
                <SelectTrigger className={attempted && !formData.categoryId ? 'border-destructive' : ''}>
                  <SelectValue placeholder={categoriesLoading ? 'Loading categories...' : 'Select a category'} />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {attempted && !formData.categoryId && (
                <p className="text-xs text-destructive">Please select a category.</p>
              )}
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
              <Label>Subject <span className="text-destructive">*</span></Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Brief summary of the issue"
                className={attempted && !formData.subject.trim() ? 'border-destructive' : ''}
              />
              {attempted && !formData.subject.trim() && (
                <p className="text-xs text-destructive">Subject is required.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Description <span className="text-destructive">*</span></Label>
              <Textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed explanation..."
                className={attempted && !formData.description.trim() ? 'border-destructive' : ''}
              />
              {attempted && !formData.description.trim() && (
                <p className="text-xs text-destructive">Description is required.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!isFormValid || createMutation.isPending}>
              {createMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
              ) : (
                'Submit Ticket'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
