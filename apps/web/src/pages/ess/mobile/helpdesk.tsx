import React, { useState } from 'react';
import { Plus, MessageSquare, Loader2, AlertCircle, HeadphonesIcon, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMyTickets, useCreateMyTicket, useEssHelpdeskCategories } from '@/features/company/hooks/use-helpdesk-queries';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function MobileEssHelpdesk() {
  const { data: tickets, isLoading } = useMyTickets();
  const { data: categories, isLoading: categoriesLoading } = useEssHelpdeskCategories();
  const createMutation = useCreateMyTicket();
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
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
      case 'OPEN': return <Badge variant="outline" className="text-blue-500 bg-blue-50/50 border-blue-200">Open</Badge>;
      case 'IN_PROGRESS': return <Badge variant="outline" className="text-amber-500 bg-amber-50/50 border-amber-200">In Progress</Badge>;
      case 'RESOLVED': return <Badge variant="outline" className="text-emerald-500 bg-emerald-50/50 border-emerald-200">Resolved</Badge>;
      case 'CLOSED': return <Badge variant="outline" className="text-gray-500 bg-gray-50/50 border-gray-200">Closed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'LOW': return <Badge variant="outline" className="text-[9px] h-4 text-muted-foreground border-muted">Low</Badge>;
      case 'MEDIUM': return <Badge variant="outline" className="text-[9px] h-4 text-blue-500 border-blue-200">Medium</Badge>;
      case 'HIGH': return <Badge variant="outline" className="text-[9px] h-4 text-rose-500 border-rose-200 bg-rose-50">High</Badge>;
      case 'URGENT': return <Badge variant="destructive" className="text-[9px] h-4 animate-pulse">Urgent</Badge>;
      default: return <Badge variant="outline" className="text-[9px] h-4">{p}</Badge>;
    }
  };

  const handleOpenSheet = () => {
    setSubmitError(null);
    setAttempted(false);
    setFormData({ subject: '', description: '', categoryId: '', priority: 'MEDIUM' });
    setIsSheetOpen(true);
  };

  const isFormValid = !!(formData.subject.trim() && formData.categoryId && formData.description.trim());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (!isFormValid) return;
    setSubmitError(null);
    createMutation.mutate(formData, {
      onSuccess: () => {
        setIsSheetOpen(false);
        setFormData({ subject: '', description: '', categoryId: '', priority: 'MEDIUM' });
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error?.message || 'Failed to submit ticket. Please try again.';
        setSubmitError(msg);
      }
    });
  };

  return (
    <div className="flex flex-col space-y-4 pb-24 relative">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <HeadphonesIcon className="w-5 h-5 text-primary" /> Helpdesk
        </h2>
        <Button size="sm" className="h-8 text-xs rounded-full px-4" onClick={handleOpenSheet}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Raise Ticket
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : !tickets || tickets.length === 0 ? (
          <Card className="border-dashed bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <div className="bg-muted p-3 rounded-full mb-3">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold mb-1">No Tickets Yet</h3>
              <p className="text-xs text-muted-foreground px-4 mb-4">
                You haven't raised any support requests.
              </p>
              <Button variant="outline" size="sm" onClick={handleOpenSheet}>Raise your first ticket</Button>
            </CardContent>
          </Card>
        ) : (
          tickets.map((t: any) => (
            <Link key={t.id} to={`/t/${t.tenantId || 'TODO'}/me/helpdesk/${t.id}`}>
              <Card className="border-muted/60 shadow-sm overflow-hidden active:scale-[0.98] transition-transform mb-3">
                <CardContent className="p-0">
                  <div className="p-3 border-b bg-muted/10 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        #{t.id.slice(-6).toUpperCase()}
                      </span>
                      {getPriorityBadge(t.priority)}
                    </div>
                    {getStatusBadge(t.status)}
                  </div>
                  
                  <div className="p-3.5 flex items-center">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="font-bold text-sm truncate mb-1">{t.subject}</h3>
                      <p className="text-xs text-muted-foreground truncate mb-2">{t.category?.name}</p>
                      
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> {t._count?.comments} replies
                        </span>
                        <span>{format(new Date(t.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* Full Screen Bottom Sheet for Raising Tickets */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSheetOpen(false)} />
          
          <div className="relative bg-background w-full rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b shrink-0">
              <div>
                <h3 className="font-bold">Raise a Ticket</h3>
                <p className="text-xs text-muted-foreground">Get help from internal teams</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsSheetOpen(false)} className="h-8 w-8 rounded-full bg-muted">
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
              {submitError && (
                <Alert variant="destructive" className="py-2 px-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{submitError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Category <span className="text-rose-500">*</span></Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(val) => setFormData({ ...formData, categoryId: val })}
                  disabled={categoriesLoading}
                >
                  <SelectTrigger className={cn("h-12 bg-muted/30", attempted && !formData.categoryId && 'border-destructive')}>
                    <SelectValue placeholder={categoriesLoading ? 'Loading...' : 'Select category'} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(val) => setFormData({ ...formData, priority: val })}
                >
                  <SelectTrigger className="h-12 bg-muted/30">
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

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Subject <span className="text-rose-500">*</span></Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief summary..."
                  className={cn("h-12 bg-muted/30", attempted && !formData.subject.trim() && 'border-destructive')}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Description <span className="text-rose-500">*</span></Label>
                <Textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed explanation..."
                  className={cn("bg-muted/30", attempted && !formData.description.trim() && 'border-destructive')}
                />
              </div>

              <div className="pt-4 pb-8">
                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl text-sm font-bold shadow-md"
                  disabled={!isFormValid || createMutation.isPending}
                >
                  {createMutation.isPending ? 'Submitting...' : 'Submit Ticket'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
